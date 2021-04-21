/**
 * Author: FISH UP
 * https://array30.misterfishup.com/
 * Copyright © 2020-2021 FISH UP Dictionary of Array
 * Date: 2021 Jan. 30
 */

/* Structure: (use search)
  - initialisation
*/

// get some html elements
const lineCurElem = document.getElementById('line_cur');
const lineNextElem = document.getElementById('line_next');
const typingInputElem = document.getElementById('typing_input');
const alrLinesElem = document.getElementById('alr_lines');
const wrgChAlrLinesLinkElem = document.getElementById('wrg_ch_alr_lines-link');
const wrgChAlrLinesElem = document.getElementById('wrg_ch_alr_lines');
const wrgChCurLineElem = document.getElementById('wrg_ch_cur_line');

/* ===================
    GENERAL FUNCTIONS
   =================== */

// ok
const shuffleString = str => {
  let a = [...str];
  let n = a.length;
  for (let i = n - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a.join("");
}
const reverseString = str => [...str].reverse().join("");
const snakeToCamel = str => str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

/* ================
    INITIALISATION
  ================= */

// define settings and initialse their states
let settings = {
  // only 'state' values are likely to be changed
  // if type is checkbox, the state should be a boolean
  useEngKey: {
    type: 'checkbox',
    localStgKey: 'useEngKey',
    elemId: 'useEngKey',
    state: false,
  },
  showCurCh: {
    type: 'checkbox',
    localStgKey: 'typingShowCurCh',
    elemId: 'showCurCh',
    toggleDisplayJquery: '#container-cur_ch',
    state: true,
  },
  showDecompCurCh: {
    type: 'checkbox',
    localStgKey: 'typingShowDecompCurCh',
    elemId: 'showDecompCurCh',
    toggleDisplayJquery: '.itemDecomp',
    state: false,
  },
  showAlrLines: {
    type: 'checkbox',
    localStgKey: 'typingShowAlrLines',
    elemId: 'showAlrLines',
    toggleDisplayJquery: '#container-alr_lines',
    state: true,
  },
  showWrgChAlrLines: {
    type: 'checkbox',
    localStgKey: 'typingShowWrgChAlrLines',
    elemId: 'showWrgChAlrLines',
    toggleDisplayJquery: '#container-wrg_ch_alr_lines',
    state: true,
  },
  showWrgChCurLine: {
    type: 'checkbox',
    localStgKey: 'typingShowWrgChCurLine',
    elemId: 'showWrgChCurLine',
    toggleDisplayJquery: '#container-wrg_ch_cur_line',
    state: true,
  },
  showPerformance: {
    type: 'checkbox',
    localStgKey: 'typingShowPerformance',
    elemId: 'showPerformance',
    toggleDisplayJquery: '#container-performance',
    state: true,
  },
  maxChPerLine: {
    type: 'select',
    localStgKey: 'typingMaxChPerLine',
    elemId: 'maxChPerLine',
    state: "20",
  },
  chPermType: {
    type: 'select',
    localStgKey: 'typingChPermType',
    elemId: 'chPermType',
    state: 'normal',
  },
}

let exerString; // default is typingExerDflt[stringLocal]
let exerData; // will always be createExerData(exerString)

let idxCurLine = 0;
let nbCorChCurLine = 0;
let nbCorChAlrLines = 0;
let nbWrgChCurLine = 0;
let nbWrgChAlrLines = 0;

let isTimerActive = false;
let startTime;
let durInSec;

/* ======================
    CREATE EXERCISE DATA
   ====================== */

// ok
// create exercise data (obj) from a string according to selected options
// output: { lineList: array of strings, nbLines: int, nbCh: int }
function createExerData(str) {
  const n = settings.maxChPerLine.state; // string
  const permType = settings.chPermType.state;

  let permStr = str; // correspond to permType == 'normal'
  if (permType == 'reversed') {
    permStr = reverseString(str);
  } else if (permType == "random") {
    permStr = shuffleString(str);
  }

  // regex that breaks each line in input by n chars (u: compatibility for utf-16)
  const regex = new RegExp(".{1," + n + "}", "gu");
  const lineList = permStr.match(regex).map(x => x.trim()).filter(Boolean);

  return { lineList: lineList, nbLines: lineList.length, nbCh: [...str].length };
}

/* =================
    DISPLAY RESULTS
   ================= */

function displayStat() {
  const nbTotalCorCh = nbCorChCurLine + nbCorChAlrLines;
  const nbTotalWrgCh = nbWrgChCurLine + nbWrgChAlrLines;
  const acc = nbTotalCorCh
    ? ((100 * nbTotalCorCh) / (nbTotalCorCh + nbTotalWrgCh)).toFixed()
    : 0;
  $('#nb-cor_ch').text(nbTotalCorCh);
  $('#nb-wrg_ch').text(nbTotalWrgCh);
  $('#nb-rem_ch').text(exerData.nbCh - nbTotalCorCh - nbTotalWrgCh);
  $('#accuracy').text(acc);
}

// update timer & cpm if timer is active
function updateTimerCPM() {
  if (isTimerActive) {
    durInSec = Math.floor((Date.now() - startTime) / 1000);
    const min = Math.floor(durInSec / 60);
    const sec = durInSec - min * 60;
    const timer = sec < 10
      ? min + ':0' + sec
      : min + ':' + sec;
    $('#timer').text(timer);

    if (durInSec >= 2) {
      const nbTotalCorCh = nbCorChCurLine + nbCorChAlrLines;
      const nbTotalWrgCh = nbWrgChCurLine + nbWrgChAlrLines;
      $('#cpm-cor').text(((60 * nbTotalCorCh) / durInSec).toFixed());
      $('#cpm-typed').text(((60 * (nbTotalCorCh + nbTotalWrgCh) / durInSec)).toFixed());
    }
  }
}

// ----------------------------------------------
// prepare or reset exercise according to exerData
// ----------------------------------------------

// prepare the exercise (with respect to exerData)
function prepExer(str) {
  // update exerString & exerData (global variables), save the former to localStorage
  exerString = str;
  exerData = createExerData(str);
  localStorage.setItem('typingExerString', str);

  // initialise things
  idxCurLine = 0;
  nbCorChCurLine = 0;
  nbCorChAlrLines = 0;
  nbWrgChCurLine = 0;
  nbWrgChAlrLines = 0;
  isTimerActive = false;
  durInSec = 0;
  $('#timer').text('0:00');
  $('#cpm-cor').text('0');
  $('#cpm-typed').text('0');
  $('#nb-total_lines').text(exerData.nbLines);
  $('#nb-total_ch').text(exerData.nbCh);
  $('#cur_line_num').text(idxCurLine + 1);
  displayStat();

  // clear contents 
  typingInputElem.value = '';
  alrLinesElem.innerHTML = '';
  wrgChAlrLinesLinkElem.innerHTML = '';
  wrgChAlrLinesElem.innerHTML = '';

  // prep lines, hint, results (overwrite current, next lines)
  prepLinesCurChHint();

  // focus & scroll into view
  $('#typing_input').focus();
  document.getElementById("middle_column").scrollIntoView();
}

function createCustExer() {
  // clear custExer prompt
  $('#cust_exer-prompt').html('');

  // get input string (trimmed)
  const str = $('#cust_exer-input').val().trim();
  if ([...str].length > 3000) {
    displayPrompt('custExerLongInput');
  } else if (str) {
    prepExer(str);
  } else {
    displayPrompt('custExerEmptyInput');
  }
}

// ------------------------------------
// prepare sentences, hints and results
// ------------------------------------

function prepLinesCurChHint() {
  // prep cur line
  lineCurElem.innerHTML = '';
  for (char of exerData.lineList[idxCurLine]) {
    const chSpan = document.createElement('span');
    chSpan.innerHTML = (char == ' ') ? '&nbsp;' : char;
    lineCurElem.appendChild(chSpan);
  }

  // prepare next line
  lineNextElem.innerHTML = (idxCurLine + 1 < exerData.nbLines)
    ? exerData.lineList[idxCurLine + 1]
    : '&nbsp;';

  // create (overwrite) cur ch hint
  createCurChHint(exerData.lineList[idxCurLine][0]);

  // clear wrg ch in cur line
  wrgChCurLineElem.innerHTML = '';
  instantVerification();
}

// ok
function createCurChHint(ch) {
  const elem = document.getElementById('cur_ch-hint');
  elem.innerHTML = '';

  // add the character and comma to elem  
  let char = document.createElement('div');
  const i18nSpace = { tw: '空白', en: 'Space', fr: 'Espace' };
  char.textContent = (ch == ' ') ? i18nSpace[stringLocal] : ch;
  char.style = "font-size: 2em; text-align: center;"; // bigger font size
  char.textContent = ch;
  elem.appendChild(char);

  // add Array code list to block if the character is in DB
  const maxDecomp = (settings.showDecompCurCh.state) ? 1 : 0;
  if (ifInDb(ch)) createArrayCodeList(ch, 'cur_ch-hint-code_list', 'cur_ch-hint', settings.useEngKey.state, maxDecomp);
}

// ---------------------
// instant verification
// ---------------------

function instantVerification() {
  const chCurLine = lineCurElem.querySelectorAll('span');
  const inputChList = [...typingInputElem.value];

  // clear wrg chars in cur line, cur char hint
  $('#wrg_ch_cur_line').html('');
  $('#cur_ch-hint').html('');

  // reset nb of cor/wrg ch in cur line
  nbCorChCurLine = 0;
  nbWrgChCurLine = 0;

  // set initial idxLastCorCh
  let idxLastCorCh = -1;

  // loop through every ch in cur line
  chCurLine.forEach((chSpan, i) => {
    const inputChar = inputChList[i];
    const ch = chSpan.textContent;
    if (inputChar == null) {
      chSpan.className = 'untouched';
    } else if (inputChar === ch) {
      chSpan.className = 'correct';
      nbCorChCurLine += 1;
      idxLastCorCh = i;
    } else {
      chSpan.className = 'wrong';
      nbWrgChCurLine += 1;
      if (ifInDb(ch)) addWrgChCurLine(ch, i + 1);
    }
  })

  // cur ch: create hint for it, hightlight it
  if (chCurLine[idxLastCorCh + 1]) {
    createCurChHint(chCurLine[idxLastCorCh + 1].textContent);
    chCurLine[idxLastCorCh + 1].classList.add('current');
  }

  displayStat();
}

/* ===========================================
    ADD ARRAY CODE BLOCKS OF WRONG CHARACTERS
  ============================================ */
// ok
function addWrgChCurLine(ch, pos) {
  createArrayBlock(ch, 'line_' + String(idxCurLine + 1) + '_pos_' + String(pos), 'wrg_ch_cur_line');
}

// ok
function addWrgChAlrLines(ch, pos) {
  createArrayBlock(ch, 'line_' + String(idxCurLine + 1) + '_pos_' + String(pos), 'wrg_ch_alr_lines');
}

// ok
// append the Array code block (id = blockId) of the character = ch to some elem (id = id)
// no decomp included; ch supposed to be in DB
function createArrayBlock(ch, blockId, id) {
  const elem = document.getElementById(id);
  let block = document.createElement('div');
  block.id = blockId;
  block.className = 'wrong_char_code_block'; // #change
  elem.appendChild(block);

  // add the character and comma to block
  let char = document.createElement('span');
  char.textContent = ch + "：";
  char.style = "font-size: 1.2em;"; // bigger font size
  block.appendChild(char);

  // add Array code list to block
  createArrayCodeList(ch, blockId + '_list', blockId, settings.useEngKey.state, 0);
}

//////////////////////
//////////////////////

function changeLine() {
  typingInputElem.value = '';

  nbCorChCurLine = 0;
  nbWrgChCurLine = 0;
  wrgChAlrLinesElem.innerHTML += wrgChCurLineElem.innerHTML;
  lineCurElem.querySelectorAll('span').forEach((chSpan, index) => {
    chSpan.classList.remove('current');
    if (chSpan.classList.contains('correct')) {
      nbCorChAlrLines += 1;
    } else {
      nbWrgChAlrLines += 1;
      const ch = chSpan.textContent;
      if (chSpan.classList.contains('untouched')) {
        addWrgChAlrLines(ch, index + 1);
        chSpan.className = 'wrong';
      }
      if (ifInDb(ch)) {
        const linkElem = document.createElement('a');
        linkElem.textContent = ch;
        linkElem.className = "wrong-character-anchor";
        linkElem.href = '#line_' + String(idxCurLine + 1) + '_pos_' + String(index + 1);
        wrgChAlrLinesLinkElem.appendChild(linkElem);
        const aSpace = document.createTextNode(' ');
        wrgChAlrLinesLinkElem.appendChild(aSpace);
      }
    }
  })

  alrLinesElem.innerHTML += lineCurElem.innerHTML + '<br>';
  displayStat();


  idxCurLine += 1;

  if (idxCurLine == exerData.nbLines) {
    lineCurElem.innerHTML = '';
    wrgChCurLineElem.innerHTML = '';
    $('#cur_ch-hint').html('');
    $('#cur_line_num').text('-');
    displayPrompt('finishExer');

    // update timer & cpm before desactiving timer
    updateTimerCPM();
    isTimerActive = false;
  } else {
    $('#cur_line_num').text(idxCurLine + 1);
    prepLinesCurChHint();
  }
}

// ok
// situation = 'custExerEmptyInput' | 'custExerLongInput' | 'finishExer'
function displayPrompt(situation) {
  switch (situation) {
    case 'custExerEmptyInput': {
      const i18nEmptyInput = {
        tw: '您的輸入為空白！',
        en: 'Nothing is entered!',
        fr: "Rien n'est entré !"
      };
      $('#cust_exer-prompt').text(i18nEmptyInput[stringLocal]);
      break;
    }
    case 'custExerLongInput': {
      const i18nLongInput = {
        tw: '提醒：您的輸入超過了 3000 字元！',
        en: "You've entered more than 3000 characters!",
        fr: 'Vous avez saisi plus de 3000 caractères !'
      };
      $('#cust_exer-prompt').text(i18nLongInput[stringLocal]);
      break;
    }
    case 'finishExer': {
      const i18nFinish = {
        congratsSg: {
          tw: `恭喜打完以上 1 句！🥳`,
          en: `Congratulations! You've finished typing the line! 🥳`,
          fr: `Félicitations d'avoir fini la saisie de la ligne ! 🥳`,
        },
        congratsPl: {
          tw: `恭喜打完以上 ${exerData.nbLines} 句！🥳`,
          en: `Congratulations! You've finished typing the ${exerData.nbLines} lines! 🥳`,
          fr: `Félicitations d'avoir fini la saisie des ${exerData.nbLines} lignes ! 🥳`,
        },
        continueTyping: {
          tw: "您可以透過「題目選擇」繼續練習！",
          en: "Go to 'Exercises' to choose your next exercise!",
          fr: "Rendez-vous à « Exercices » pour choisir votre exercice suivant !"
        }
      };
      lineCurElem.innerHTML = (exerData.nbLines > 1)
        ? i18nFinish.congratsPl[stringLocal]
        : i18nFinish.congratsSg[stringLocal];
      lineNextElem.innerHTML = i18nFinish.continueTyping[stringLocal];
      break;
    }
  }
}

// ok
// convert Array keys alr existing on page into English ones or conversly
// keyType = 'eng' | 'array'
function convertKey(keyType) {
  const keys = document.getElementsByClassName("keycap-letter");
  if (keys.length) {
    const isEngNow = keys[0].textContent.length == 1;
    if ((keyType == 'eng' && !isEngNow) || (keyType == 'array' && isEngNow)) {
      for (let i = 0; i < keys.length; i++) {
        keys[i].textContent = isEngNow
          ? letterToArray30Dict[keys[i].textContent]
          : array30ToLetterDict[keys[i].textContent];
      }
    }
  }
}


// DISABLE SETTINGS

function settingForDecompCurCh(isShownCurCh) {
  $(`#${settings.showDecompCurCh.elemId}`).closest("tr").css('opacity', isShownCurCh ? 1 : 0.3);
  $(`#${settings.showDecompCurCh.elemId}`)
    .prop('disabled', !isShownCurCh)
    .closest('.toggle-container').css('cursor', isShownCurCh ? 'pointer' : 'not-allowed');
}

//=======================
// WHEN LOADING THE FILE
// ======================

// 1. Update states of settings by localStorage
for (const setting in settings) {
  const x = settings[setting];
  const v = localStorage.getItem(x.localStgKey);

  switch (x.type) {
    case 'checkbox':
      if (v === JSON.stringify(!x.state)) {
        settings[setting].state = !settings[setting].state;
      }
      $(`#${x.elemId}`).prop('checked', settings[setting].state);

      // update display
      if (x.hasOwnProperty('toggleDisplayJquery')) $(x.toggleDisplayJquery).toggle(x.state);
      break;
    case 'select':
      $(`#${x.elemId} option`).each(function () {
        if (v === $(this).val()) {
          settings[setting].state = v;
        }
      });
      $(`#${x.elemId}`).val(settings[setting].state);
      break;
  }
}
settingForDecompCurCh(settings.showCurCh.state);

// 2. Set exerString then prepare exercise
exerString = (localStorage.getItem('typingExerString'))
  ? localStorage.getItem('typingExerString')
  : typingExerDflt[stringLocal];

prepExer(exerString);

// 3. Update time & cpm every 200ms
setInterval(updateTimerCPM, 200);

/* ==============
    USER ACTIONS
  ============== */

// =====[ typing input related ]=====

typingInputElem.addEventListener('input', function () {
  if (idxCurLine < exerData.nbLines) {
    if (!isTimerActive) {
      isTimerActive = true;
      startTime = Date.now();
    }
    instantVerification();
  }
});

typingInputElem.addEventListener('keypress', (event) => {
  if (event.code == 'Enter') {
    if (idxCurLine <= exerData.nbLines - 1) {
      changeLine();
    } else {
      typingInputElem.value = '';
      lineCurElem.innerHTML = '';
      lineNextElem.innerHTML = '';
    }
  }
});

// =====[ exercise preparation related ]=====

$('#btn-reset_cur_exer').click(() => prepExer(exerString));
$('#btn-submit_cust_exer').click(createCustExer);
$("#built_in_exer button").click(function () {
  // if buttonId is 'example-category__example-exercise_name', then
  // category is 'exampleCategory'
  // exerciseName is 'exampleExerciseName'
  const buttonId = $(this).attr('id');
  const category = snakeToCamel(buttonId.substring(0, buttonId.indexOf('__')));
  const exerciseName = snakeToCamel(buttonId.substring(buttonId.indexOf('__') + 2));
  prepExer(typingExer[category][exerciseName]);
})

// =====[ settings related ]=====

// When changes take place:
// get state, update settings' state, update localstorage(, operation)
for (const setting in settings) {
  const x = settings[setting];
  switch (x.type) {
    case 'checkbox': {
      $(`#${x.elemId}`).click(function () {
        const state = $(this).prop('checked');
        x.state = state;
        localStorage.setItem(x.localStgKey, state);
      })

      //toggle display
      if (x.hasOwnProperty('toggleDisplayJquery')) {
        $(`#${x.elemId}`).click(function () {
          $(x.toggleDisplayJquery).toggle(x.state);
        })
      };
      break;
    }
    case 'select': {
      $(`#${x.elemId}`).change(function () {
        const value = $(this).val();
        x.state = value;
        localStorage.setItem(x.localStgKey, value);
      })
      break;
    }
  }
}
// other actions
// Eng Key
$(`#${settings.useEngKey.elemId}`).click(function () {
  convertKey($(this).prop('checked') ? 'eng' : 'array');
})
// disable or enable setting
$(`#${settings.showCurCh.elemId}`).click(function () {
  settingForDecompCurCh(settings.showCurCh.state);
})


// if (localStorage.getItem('typingGotItClosed') == "true") {
//   $('#got_it-block').remove();
// }

// $('#got_it-close_btn').click(function () {
//   $('#got_it-block').remove();
//   localStorage.setItem('typingGotItClosed', "true");
// })