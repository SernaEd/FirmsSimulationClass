/**
 * Empirical Verification Script for 5 Interactive Widgets and JS Error Monitoring
 * Author: challenger_3
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runEmpiricalVerification() {
  console.log('====================================================');
  console.log(' Empirical Verification & Stress Testing (Iteration 2)');
  console.log('====================================================\n');

  const htmlPath = path.join(__dirname, '..', 'index.html');
  const jsPath = path.join(__dirname, '..', 'js', 'custom.js');

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  let consoleErrors = [];
  let consoleWarnings = [];

  // Create Virtual DOM environment
  const dom = new JSDOM(htmlContent, {
    runScripts: 'dangerously',
    resources: 'usable',
    virtualConsole: (new (require('jsdom')).VirtualConsole())
  });

  const { window } = dom;
  const { document } = window;

  // Intercept Console Error and Warning
  window.console.error = function (...args) {
    consoleErrors.push(args.join(' '));
    console.error('[Browser Error]', ...args);
  };
  window.console.warn = function (...args) {
    consoleWarnings.push(args.join(' '));
  };

  // Attach JS code
  const scriptEl = document.createElement('script');
  scriptEl.textContent = jsContent;
  document.body.appendChild(scriptEl);

  // Fire DOMContentLoaded
  const event = new window.Event('DOMContentLoaded', {
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);

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

  const ptsInput = document.querySelector('#calc-points-input');
  const resultTenths = document.querySelector('#calc-tenths-result');
  const resultSub = document.querySelector('#calc-result-sub');

  assert(ptsInput !== null && resultTenths !== null, 'Points Calculator elements exist in DOM');

  // Test 1: Initial default 150 pts -> +0.3 Décimas
  assert(resultTenths.textContent.includes('+0.3 Décimas'), 'Default 150 pts calculates +0.3 Décimas');

  // Test 2: Input 50 pts -> +0.1 Décimas
  ptsInput.value = '50';
  ptsInput.dispatchEvent(new window.Event('input'));
  assert(resultTenths.textContent.includes('+0.1 Décimas'), '50 pts calculates +0.1 Décimas (50 / 50 * 0.1)');

  // Test 3: Input 250 pts -> +0.5 Décimas
  ptsInput.value = '250';
  ptsInput.dispatchEvent(new window.Event('input'));
  assert(resultTenths.textContent.includes('+0.5 Décimas'), '250 pts calculates +0.5 Décimas (250 / 50 * 0.1)');

  // Test 4: Input 0 pts -> +0.0 Décimas
  ptsInput.value = '0';
  ptsInput.dispatchEvent(new window.Event('input'));
  assert(resultTenths.textContent.includes('+0.0 Décimas'), '0 pts calculates +0.0 Décimas');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 2: Split Bill Calculator (4 Team Members)');
  console.log('----------------------------------------------------');

  const privSelect = document.querySelector('#split-privilege-select');
  const m1 = document.querySelector('#split-m1');
  const m2 = document.querySelector('#split-m2');
  const m3 = document.querySelector('#split-m3');
  const m4 = document.querySelector('#split-m4');
  const splitProgressBar = document.querySelector('#split-progress-bar');
  const splitStatusText = document.querySelector('#split-status-text');
  const splitSubmitBtn = document.querySelector('#split-submit-btn');

  assert(privSelect && m1 && m2 && m3 && m4 && splitSubmitBtn, 'Split Bill Calculator elements (#split-m1..#split-m4, submit btn) exist');

  // Test 1: 10 + 10 + 10 + 10 = 40 for Prórroga 24h (40 pts cost) -> 100%
  m1.value = '10'; m2.value = '10'; m3.value = '10'; m4.value = '10';
  m1.dispatchEvent(new window.Event('input'));
  assert(splitStatusText.textContent.includes('Recaudado: 40 / 40 pts (100% Completado)'), 'Co-funding across 4 members sums to 40 pts (100%)');
  assert(splitProgressBar.style.width === '100%', 'Progress bar set to 100%');

  // Click Submit when completed
  splitSubmitBtn.click();
  assert(splitStatusText.textContent.includes('Ticket Grupal Emitido'), 'Submit emits group ticket folio when 100% funded');

  // Test 2: Underfunded state (5 + 5 + 5 + 5 = 20 / 40 pts -> 50%)
  m1.value = '5'; m2.value = '5'; m3.value = '5'; m4.value = '5';
  m1.dispatchEvent(new window.Event('input'));
  assert(splitStatusText.textContent.includes('Recaudado: 20 / 40 pts (50%)'), 'Underfunded 20 / 40 pts shows 50%');

  splitSubmitBtn.click();
  assert(splitStatusText.textContent.includes('Saldo insuficiente'), 'Submit shows error message when underfunded');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 3: Live Tender Simulator');
  console.log('----------------------------------------------------');

  const timerDisplay = document.querySelector('#tender-timer-display');
  const timerResetBtn = document.querySelector('#tender-timer-reset-btn');
  const timerContainer = document.querySelector('.tender-timer-box');
  const answerInput = document.querySelector('#tender-answer-input');
  const tenderSubmitBtn = document.querySelector('#tender-submit-btn');
  const tenderFeedback = document.querySelector('#tender-feedback-msg');
  const leaderboard = document.querySelector('.tender-live-leaderboard');

  assert(timerDisplay && timerResetBtn && answerInput && tenderSubmitBtn && leaderboard, 'Live Tender Simulator elements exist');

  assert(timerDisplay.textContent === '03:00', 'Initial countdown timer displays 03:00');

  // Test Reset button resets timer
  timerResetBtn.click();
  assert(timerDisplay.textContent === '03:00', 'Reset button (#tender-timer-reset-btn) resets timer to 03:00');

  // Test Empty submission
  answerInput.value = '';
  tenderSubmitBtn.click();
  assert(tenderFeedback.textContent.includes('Por favor ingresa tu resultado'), 'Empty submission prompts for input');

  // Test 1st Place Podium Calculation: 86.8°C (exact diff <= 1.5) -> 40 PTS
  answerInput.value = '86.8';
  tenderSubmitBtn.click();
  assert(tenderFeedback.textContent.includes('1er Lugar (+40 PTS'), 'Answer 86.8°C calculates 1st Place (+40 PTS)');
  assert(leaderboard.querySelector('.place-1').textContent.includes('+40 PTS'), 'Dynamic Leaderboard updates 1st Place to +40 PTS');

  // Test 2nd Place Podium Calculation: 88.0°C (diff <= 5.0) -> 25 PTS
  answerInput.value = '88.0';
  tenderSubmitBtn.click();
  assert(tenderFeedback.textContent.includes('2do Lugar (+25 PTS'), 'Answer 88.0°C calculates 2nd Place (+25 PTS)');

  // Test 3rd Place Podium Calculation: 92.0°C (diff <= 10.0) -> 18 PTS
  answerInput.value = '92.0';
  tenderSubmitBtn.click();
  assert(tenderFeedback.textContent.includes('3er Lugar (+18 PTS'), 'Answer 92.0°C calculates 3rd Place (+18 PTS)');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 4: Peer Feedback Kudos Transfer');
  console.log('----------------------------------------------------');

  const feedbackText = document.querySelector('#kudos-feedback-text');
  const charCounter = document.querySelector('#kudos-char-counter');
  const sendKudosBtn = document.querySelector('#send-kudos-btn');
  const kudosStatus = document.querySelector('#kudos-status-msg');

  assert(feedbackText && charCounter && sendKudosBtn && kudosStatus, 'Kudos Transfer elements exist');

  // Test < 20 characters blocks transfer
  feedbackText.value = 'Corto (12 chars)';
  feedbackText.dispatchEvent(new window.Event('input'));
  assert(charCounter.textContent.includes('16 / 20 mín'), 'Char counter updates length (16 chars)');
  assert(charCounter.style.color === 'rgb(251, 113, 133)', 'Char counter styled red when < 20 chars');

  sendKudosBtn.click();
  assert(kudosStatus.textContent.includes('al menos 20 caracteres'), 'Sending < 20 chars blocks transfer with validation error');

  // Test >= 20 characters enables transfer
  feedbackText.value = 'Excelente aportación matemática en la sustentación del modelo RLC';
  feedbackText.dispatchEvent(new window.Event('input'));
  assert(charCounter.style.color === 'rgb(52, 211, 153)', 'Char counter styled green when >= 20 chars');

  sendKudosBtn.click();
  assert(kudosStatus.textContent.includes('10 Puntos Kudos Transferidos'), 'Sending >= 20 chars executes transfer successfully');
  assert(kudosStatus.textContent.includes('Saldo emisor: 90 pts'), 'Sender balance decremented by 10 pts (100 -> 90)');


  console.log('\n----------------------------------------------------');
  console.log(' WIDGET 5: Daily Streak Counter & Freeze Pass Tracker');
  console.log('----------------------------------------------------');

  const streakWidget = document.querySelector('#streak-widget');
  const incStreakBtn = document.querySelector('#btn-streak-increment');
  const freezeBtn = document.querySelector('#btn-use-freeze');
  const freezeBox = document.querySelector('.freeze-pass-box');
  const streakStatus = document.querySelector('.streak-status-box');

  assert(streakWidget && incStreakBtn && freezeBtn && freezeBox && streakStatus, 'Streak Counter and Freeze Pass elements exist');

  // Test streak increment
  incStreakBtn.click();
  assert(streakStatus.textContent.includes('Días consecutivos: 5'), 'Streak incremented from 4 to 5 days');
  assert(streakStatus.textContent.includes('+10 pts'), 'Accumulated points updated (+2 PTS added to 8 = 10 pts)');

  // Test freeze pass usage
  assert(freezeBox.textContent.includes('2 restantes'), 'Initial freeze passes count is 2');

  freezeBtn.click();
  assert(freezeBox.textContent.includes('1 restantes'), 'Clicking freeze pass decrements count from 2 to 1');
  assert(streakStatus.textContent.includes('Pase de Congelación Activado'), 'Status confirms freeze pass activation');

  freezeBtn.click();
  assert(freezeBox.textContent.includes('0 restantes'), 'Clicking freeze pass again decrements count to 0');

  freezeBtn.click();
  assert(streakStatus.textContent.includes('No tienes Pases de Congelación disponibles'), 'Attempting freeze pass with 0 balance displays warning');


  console.log('\n----------------------------------------------------');
  console.log(' RUNTIME CONSOLE ERROR AUDIT');
  console.log('----------------------------------------------------');

  assert(consoleErrors.length === 0, `Zero runtime console JS errors detected (Actual: ${consoleErrors.length})`);

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

runEmpiricalVerification().catch(err => {
  console.error('Error running empirical test suite:', err);
  process.exit(1);
});
