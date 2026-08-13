/**
 * Standalone Node.js Empirical Verification Script for 5 Interactive Widgets
 * Tests points calculator, split bill, tender simulator, kudos transfer, and streak counter
 * Monitors for any JS runtime console errors.
 * 
 * Author: challenger_3
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createMockElement(tagName, attributes = {}) {
  const listeners = {};
  const children = [];
  const styles = {};
  
  const elem = {
    tagName: tagName.toUpperCase(),
    value: attributes.value || '',
    textContent: attributes.textContent || '',
    innerHTML: attributes.innerHTML || '',
    className: attributes.className || '',
    style: styles,
    title: '',
    options: attributes.options || [],
    selectedIndex: attributes.selectedIndex || 0,
    attributes: attributes,

    getAttribute(name) {
      if (name === 'data-cost') return attributes['data-cost'] || null;
      return attributes[name] || null;
    },

    setAttribute(name, val) {
      attributes[name] = String(val);
      if (name === 'data-cost') attributes['data-cost'] = String(val);
    },

    addEventListener(eventType, callback) {
      if (!listeners[eventType]) listeners[eventType] = [];
      listeners[eventType].push(callback);
    },

    dispatchEvent(event) {
      const type = typeof event === 'string' ? event : event.type;
      if (listeners[type]) {
        listeners[type].forEach(cb => cb(event));
      }
    },

    click() {
      this.dispatchEvent({ type: 'click', target: this, stopPropagation: () => {} });
    },

    appendChild(child) {
      children.push(child);
      child.parentElement = elem;
      return child;
    },

    closest(selector) {
      if (selector === '.tender-timer-box' && elem.className.includes('tender-timer-box')) {
        return elem;
      }
      return elem.parentElement ? elem.parentElement.closest(selector) : null;
    },

    querySelector(selector) {
      return findInTree(elem, selector);
    },

    querySelectorAll(selector) {
      return findAllInTree(elem, selector);
    }
  };

  return elem;
}

function findInTree(root, selector) {
  const clean = selector.trim();
  if (clean.startsWith('#')) {
    const id = clean.substring(1);
    return searchId(root, id);
  }
  if (clean.startsWith('.')) {
    const cls = clean.substring(1);
    return searchClass(root, cls);
  }
  return null;
}

function findAllInTree(root, selector) {
  const clean = selector.trim();
  if (clean.startsWith('.')) {
    const cls = clean.substring(1);
    return searchAllClass(root, cls);
  }
  return [];
}

function searchId(node, id) {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = searchId(child, id);
      if (found) return found;
    }
  }
  return null;
}

function searchClass(node, cls) {
  if (node.className && node.className.split(' ').includes(cls)) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = searchClass(child, cls);
      if (found) return found;
    }
  }
  return null;
}

function searchAllClass(node, cls) {
  let results = [];
  if (node.className && node.className.split(' ').includes(cls)) results.push(node);
  if (node.children) {
    for (const child of node.children) {
      results = results.concat(searchAllClass(child, cls));
    }
  }
  return results;
}

function runEmpiricalSuite() {
  console.log('====================================================');
  console.log(' Standalone Empirical Widget & JS Error Audit');
  console.log('====================================================\n');

  // Build Mock DOM tree corresponding to index.html elements
  const elements = {};

  // 1. Points Calculator
  const bankCalc = createMockElement('div', { className: 'calculator-widget-card' });
  bankCalc.id = 'bank-calculator';
  const ptsInput = createMockElement('input', { value: '150' });
  ptsInput.id = 'calc-points-input';
  const typeSelect = createMockElement('select', {
    options: [
      { value: 'ind', textContent: '65% Individual' },
      { value: 'group', textContent: '35% Grupal' }
    ],
    selectedIndex: 0
  });
  typeSelect.id = 'calc-type-select';
  const tenthsResult = createMockElement('div', { textContent: '' });
  tenthsResult.id = 'calc-tenths-result';
  const resultSub = createMockElement('div', { textContent: '' });
  resultSub.id = 'calc-result-sub';

  bankCalc.appendChild(ptsInput);
  bankCalc.appendChild(typeSelect);
  bankCalc.appendChild(tenthsResult);
  bankCalc.appendChild(resultSub);

  // 2. Split Bill Calculator
  const privSelect = createMockElement('select', {
    options: [
      { value: 'ext24', textContent: 'Prórroga 24h', 'data-cost': '40' },
      { value: 'ext48', textContent: 'Prórroga 48h', 'data-cost': '80' }
    ],
    selectedIndex: 0
  });
  privSelect.id = 'split-privilege-select';

  const m1 = createMockElement('input', { className: 'split-member-input', value: '10' }); m1.id = 'split-m1';
  const m2 = createMockElement('input', { className: 'split-member-input', value: '10' }); m2.id = 'split-m2';
  const m3 = createMockElement('input', { className: 'split-member-input', value: '10' }); m3.id = 'split-m3';
  const m4 = createMockElement('input', { className: 'split-member-input', value: '10' }); m4.id = 'split-m4';

  const progressBar = createMockElement('div', { className: 'split-progress-bar' }); progressBar.id = 'split-progress-bar';
  const splitStatus = createMockElement('div', { className: 'split-status-text' }); splitStatus.id = 'split-status-text';
  const splitSubmitBtn = createMockElement('button', { id: 'split-submit-btn' }); splitSubmitBtn.id = 'split-submit-btn';

  // 3. Live Tender Simulator
  const timerBox = createMockElement('div', { className: 'tender-timer-box' });
  const timerDisplay = createMockElement('span', { textContent: '03:00' }); timerDisplay.id = 'tender-timer-display';
  const timerResetBtn = createMockElement('button', { id: 'tender-timer-reset-btn' }); timerResetBtn.id = 'tender-timer-reset-btn';
  const timerLabel = createMockElement('span', { className: 'timer-label', textContent: 'Tiempo Restante:' });
  timerBox.appendChild(timerLabel);
  timerBox.appendChild(timerDisplay);
  timerBox.appendChild(timerResetBtn);

  const answerInput = createMockElement('input', { id: 'tender-answer-input' }); answerInput.id = 'tender-answer-input';
  const firmSelect = createMockElement('select', {
    options: [{ value: 'alpha', textContent: 'Firma Alpha' }],
    selectedIndex: 0
  });
  firmSelect.id = 'tender-firm-select';
  const tenderSubmitBtn = createMockElement('button', { id: 'tender-submit-btn' }); tenderSubmitBtn.id = 'tender-submit-btn';
  const tenderFeedback = createMockElement('div', { className: 'tender-feedback-msg' }); tenderFeedback.id = 'tender-feedback-msg';

  const leaderboard = createMockElement('div', { className: 'tender-live-leaderboard' });
  const p1 = createMockElement('div', { className: 'leaderboard-item place-1' });
  const p2 = createMockElement('div', { className: 'leaderboard-item place-2' });
  const p3 = createMockElement('div', { className: 'leaderboard-item place-3' });
  leaderboard.appendChild(p1); leaderboard.appendChild(p2); leaderboard.appendChild(p3);

  // 4. Kudos Transfer
  const recipientSelect = createMockElement('select', {
    options: [{ value: 'analyst', textContent: 'Analista de Firma' }],
    selectedIndex: 0
  });
  recipientSelect.id = 'kudos-recipient';

  const categorySelect = createMockElement('select', {
    options: [{ value: 'rigor', textContent: '#rigor' }],
    selectedIndex: 0
  });
  categorySelect.id = 'kudos-category';

  const feedbackText = createMockElement('textarea', { id: 'kudos-feedback-text' }); feedbackText.id = 'kudos-feedback-text';
  const charCounter = createMockElement('span', { id: 'kudos-char-counter' }); charCounter.id = 'kudos-char-counter';
  const sendKudosBtn = createMockElement('button', { id: 'send-kudos-btn' }); sendKudosBtn.id = 'send-kudos-btn';
  const kudosStatus = createMockElement('div', { id: 'kudos-status-msg' }); kudosStatus.id = 'kudos-status-msg';

  // 5. Streak Tracker
  const streakCard = createMockElement('div', { className: 'streak-engine-card' }); streakCard.id = 'streak-widget';
  const freezeBox = createMockElement('div', { className: 'freeze-pass-box' });
  const d1 = createMockElement('span', { className: 'day-badge active' });
  const d2 = createMockElement('span', { className: 'day-badge active' });
  const d3 = createMockElement('span', { className: 'day-badge active' });
  const d4 = createMockElement('span', { className: 'day-badge active' });
  streakCard.appendChild(freezeBox);
  streakCard.appendChild(d1); streakCard.appendChild(d2); streakCard.appendChild(d3); streakCard.appendChild(d4);

  // Store element dictionary
  const domMap = {
    '#bank-calculator': bankCalc,
    '#calc-points-input': ptsInput,
    '#calc-type-select': typeSelect,
    '#calc-tenths-result': tenthsResult,
    '#calc-result-sub': resultSub,
    '#split-privilege-select': privSelect,
    '#split-m1': m1, '#split-m2': m2, '#split-m3': m3, '#split-m4': m4,
    '#split-progress-bar': progressBar,
    '#split-status-text': splitStatus,
    '#split-submit-btn': splitSubmitBtn,
    '#tender-timer-display': timerDisplay,
    '#tender-timer-reset-btn': timerResetBtn,
    '#tender-answer-input': answerInput,
    '#tender-firm-select': firmSelect,
    '#tender-submit-btn': tenderSubmitBtn,
    '#tender-feedback-msg': tenderFeedback,
    '.tender-live-leaderboard': leaderboard,
    '#kudos-recipient': recipientSelect,
    '#kudos-category': categorySelect,
    '#kudos-feedback-text': feedbackText,
    '#kudos-char-counter': charCounter,
    '#send-kudos-btn': sendKudosBtn,
    '#kudos-status-msg': kudosStatus,
    '#streak-widget': streakCard,
    '.streak-engine-card': streakCard
  };

  const allMemberList = [m1, m2, m3, m4];
  const domListeners = {};

  const mockDocument = {
    addEventListener(event, fn) {
      if (!domListeners[event]) domListeners[event] = [];
      domListeners[event].push(fn);
    },

    querySelector(selector) {
      if (domMap[selector]) return domMap[selector];
      return null;
    },

    querySelectorAll(selector) {
      if (selector === '.split-member-input') return allMemberList;
      if (selector === '.day-badge') return [d1, d2, d3, d4];
      return [];
    },

    createElement(tagName) {
      return createMockElement(tagName);
    }
  };

  let consoleErrors = [];
  let consoleWarnings = [];

  const mockWindow = {
    renderMathInElement: () => {},
    console: {
      log: (...args) => {},
      warn: (...args) => { consoleWarnings.push(args.join(' ')); },
      error: (...args) => { consoleErrors.push(args.join(' ')); }
    }
  };

  const jsPath = path.join(__dirname, '..', 'js', 'custom.js');
  const jsCode = fs.readFileSync(jsPath, 'utf8');

  // Run custom.js in VM sandbox with mock document and window
  const sandbox = {
    document: mockDocument,
    window: mockWindow,
    console: mockWindow.console,
    setInterval: (fn, ms) => {},
    clearInterval: (id) => {},
    parseFloat: parseFloat,
    parseInt: parseInt,
    isNaN: isNaN,
    Math: Math
  };

  vm.createContext(sandbox);
  vm.runInContext(jsCode, sandbox);

  // Trigger DOMContentLoaded
  if (domListeners['DOMContentLoaded']) {
    domListeners['DOMContentLoaded'].forEach(fn => fn());
  }

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, description) {
    totalTests++;
    if (condition) {
      console.log(`  ✔ [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`  ✖ [FAIL] ${description}`);
    }
  }

  console.log('----------------------------------------------------');
  console.log(' WIDGET 1: Points Calculator (Formula: points / 50 * 0.1)');
  console.log('----------------------------------------------------');

  // Initial calculation check: 150 pts -> +0.3 Décimas
  assert(tenthsResult.textContent.includes('+0.3 Décimas'), 'Default 150 pts calculates +0.3 Décimas (150 / 50 * 0.1)');

  // Input 50 pts -> +0.1 Décimas
  ptsInput.value = '50';
  ptsInput.dispatchEvent('input');
  assert(tenthsResult.textContent.includes('+0.1 Décimas'), '50 pts calculates +0.1 Décimas (50 / 50 * 0.1)');

  // Input 300 pts -> +0.6 Décimas
  ptsInput.value = '300';
  ptsInput.dispatchEvent('input');
  assert(tenthsResult.textContent.includes('+0.6 Décimas'), '300 pts calculates +0.6 Décimas (300 / 50 * 0.1)');

  // Input 0 pts -> +0.0 Décimas
  ptsInput.value = '0';
  ptsInput.dispatchEvent('input');
  assert(tenthsResult.textContent.includes('+0.0 Décimas'), '0 pts calculates +0.0 Décimas');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 2: Split Bill Calculator (4 Team Members #split-m1..#split-m4)');
  console.log('----------------------------------------------------');

  // Default values 10+10+10+10 = 40 pts vs cost 40 pts (100%)
  assert(splitStatus.innerHTML.includes('Recaudado: <strong>40 / 40 pts</strong> (100% Completado)'), 'Co-funding across 4 members (#split-m1 to #split-m4) sums to 40 pts (100%)');

  // Emit ticket
  splitSubmitBtn.click();
  assert(splitStatus.innerHTML.includes('Ticket Grupal Emitido!'), 'Submit emits group ticket folio when 100% funded');

  // Test Underfunding: 5+5+5+5 = 20 pts (50%)
  m1.value = '5'; m2.value = '5'; m3.value = '5'; m4.value = '5';
  m1.dispatchEvent('input');
  assert(splitStatus.innerHTML.includes('Recaudado: <strong>20 / 40 pts</strong> (50%)'), 'Underfunding 20/40 pts displays 50%');

  splitSubmitBtn.click();
  assert(splitStatus.innerHTML.includes('Saldo insuficiente'), 'Submit shows error message when underfunded');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 3: Live Tender Simulator (Timer, Reset, Podium calculation)');
  console.log('----------------------------------------------------');

  assert(timerDisplay.textContent === '03:00', 'Initial countdown timer displays 03:00');

  // Test Reset button (#tender-timer-reset-btn)
  timerResetBtn.click();
  assert(timerDisplay.textContent === '03:00', 'Reset button (#tender-timer-reset-btn) resets timer to 03:00');

  // Test Empty answer
  answerInput.value = '';
  tenderSubmitBtn.click();
  assert(tenderFeedback.innerHTML.includes('Por favor ingresa tu resultado'), 'Empty submission shows validation warning');

  // Test 1st Place Podium calculation: 86.8°C (exact) -> 40 PTS
  answerInput.value = '86.8';
  tenderSubmitBtn.click();
  assert(tenderFeedback.innerHTML.includes('1er Lugar (+40 PTS'), 'Answer 86.8°C calculates 1st Place (+40 PTS)');
  assert(p1.innerHTML.includes('+40 PTS'), 'Dynamic Leaderboard updates 1st Place item with +40 PTS');

  // Test 2nd Place Podium calculation: 88.0°C (diff <= 5) -> 25 PTS
  answerInput.value = '88.0';
  tenderSubmitBtn.click();
  assert(tenderFeedback.innerHTML.includes('2do Lugar (+25 PTS'), 'Answer 88.0°C calculates 2nd Place (+25 PTS)');
  assert(p2.innerHTML.includes('+25 PTS'), 'Dynamic Leaderboard updates 2nd Place item with +25 PTS');

  // Test 3rd Place Podium calculation: 92.0°C (diff <= 10) -> 18 PTS
  answerInput.value = '92.0';
  tenderSubmitBtn.click();
  assert(tenderFeedback.innerHTML.includes('3er Lugar (+18 PTS'), 'Answer 92.0°C calculates 3rd Place (+18 PTS)');
  assert(p3.innerHTML.includes('+18 PTS'), 'Dynamic Leaderboard updates 3rd Place item with +18 PTS');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 4: Peer Feedback Kudos Transfer (<20 chars blocks; >=20 chars enables)');
  console.log('----------------------------------------------------');

  // Test < 20 chars
  feedbackText.value = 'Corto (12 chars)';
  feedbackText.dispatchEvent('input');
  assert(charCounter.textContent === '16 / 20 mín', 'Char counter updates character count (16 / 20 mín)');
  assert(charCounter.style.color === '#fb7185', 'Char counter styled red (#fb7185) when < 20 chars');

  sendKudosBtn.click();
  assert(kudosStatus.innerHTML.includes('al menos 20 caracteres'), 'Transfer blocked with warning message when text < 20 chars');

  // Test >= 20 chars
  feedbackText.value = 'Excelente análisis riguroso de la EDO de enfriamiento de Newton';
  feedbackText.dispatchEvent('input');
  assert(charCounter.style.color === '#34d399', 'Char counter styled green (#34d399) when >= 20 chars');

  sendKudosBtn.click();
  assert(kudosStatus.innerHTML.includes('10 Puntos Kudos Transferidos!'), 'Transfer succeeds when text >= 20 chars');
  assert(kudosStatus.innerHTML.includes('Saldo emisor: 90 pts'), 'Sender balance decremented by 10 pts (100 -> 90 pts)');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 5: Daily Streak Counter & Freeze Pass Tracker');
  console.log('----------------------------------------------------');

  const incBtn = streakCard.querySelector('#btn-streak-increment');
  const freezeBtn = streakCard.querySelector('#btn-use-freeze');
  const statusBox = streakCard.querySelector('.streak-status-box');

  assert(incBtn !== null && freezeBtn !== null, 'Streak increment and Freeze buttons dynamically attached');

  // Test Streak increment (+2 pts/day)
  incBtn.click();
  assert(statusBox.innerHTML.includes('Días consecutivos: <strong>5</strong>'), 'Streak incremented from 4 to 5 days');
  assert(statusBox.innerHTML.includes('Total racha: +10 pts'), 'Accumulated points updated from 8 to 10 pts');

  // Test Freeze pass tracker
  assert(freezeBox.innerHTML.includes('2 restantes'), 'Initial freeze passes count is 2');

  freezeBtn.click();
  assert(freezeBox.innerHTML.includes('1 restantes'), 'First freeze pass use decrements count to 1');
  assert(statusBox.innerHTML.includes('Pase de Congelación Activado'), 'Status confirms freeze pass activation');

  freezeBtn.click();
  assert(freezeBox.innerHTML.includes('0 restantes'), 'Second freeze pass use decrements count to 0');

  freezeBtn.click();
  assert(statusBox.innerHTML.includes('No tienes Pases de Congelación disponibles'), 'Attempting to use freeze pass with 0 balance shows warning');


  console.log('\n----------------------------------------------------');
  console.log(' RUNTIME CONSOLE ERROR AUDIT');
  console.log('----------------------------------------------------');

  assert(consoleErrors.length === 0, `Zero runtime console JS errors detected (Actual errors: ${consoleErrors.length})`);

  console.log('\n====================================================');
  console.log(` SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests && consoleErrors.length === 0) {
    console.log('VERDICT: ALL WIDGET EMPIRICAL TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('VERDICT: EMPIRICAL VERIFICATION FAILED');
    process.exit(1);
  }
}

runEmpiricalSuite();
