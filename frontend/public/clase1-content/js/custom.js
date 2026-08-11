/**
 * Calculus III - Differential Equations Presentation Application Scripts
 * Interactive Widgets, Points Bank Calculator, Split Bill Simulator,
 * Live Tender Simulator, Kudos Feedback Transfer, and Streak Counter.
 * 
 * Author: worker_remediation_it2
 * Target: e:\Teaching\js\custom.js
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Helper safe DOM queries
  function safeQuery(selector, context) {
    try {
      return (context || document).querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function safeQueryAll(selector, context) {
    try {
      return (context || document).querySelectorAll(selector);
    } catch (e) {
      return [];
    }
  }

  /* ==========================================================================
     FEATURE 1: INTERACTIVE POINTS BANK CONVERSION CALCULATOR
     Formula: 50 Tks = 0.1 grade tenth gain (points / 50 * 0.1)
     Target: #bank-calculator
     ========================================================================== */
  function initPointsCalculator() {
    var bankCalcContainer = safeQuery('#bank-calculator');
    var pointsInput = safeQuery('#calc-points-input', bankCalcContainer) || safeQuery('#calc-points-input');
    var typeSelect = safeQuery('#calc-type-select', bankCalcContainer) || safeQuery('#calc-type-select');
    var resultTenths = safeQuery('#calc-tenths-result', bankCalcContainer) || safeQuery('#calc-tenths-result');
    var resultSub = safeQuery('#calc-result-sub', bankCalcContainer) || safeQuery('#calc-result-sub');

    if (!pointsInput || !resultTenths) return;

    function calculateTenths() {
      var Tks = parseFloat(pointsInput.value);
      if (isNaN(Tks) || Tks < 0) Tks = 0;

      // Official conversion formula: 50 Tks = 0.1 tenths
      var tenths = (Tks / 50.0) * 0.1;
      var typeVal = typeSelect ? typeSelect.value : 'ind';
      var originText = typeVal === 'group' ? '35% Grupal' : '65% Individual';

      resultTenths.textContent = '+' + tenths.toFixed(1) + ' Décimas';
      if (resultSub) {
        resultSub.textContent = Tks + ' Tks depositados (Origen: ' + originText + ') ➔ Equivale a +' + tenths.toFixed(2) + ' décimas en calificación final';
      }
    }

    pointsInput.addEventListener('input', calculateTenths);
    pointsInput.addEventListener('change', calculateTenths);
    if (typeSelect) {
      typeSelect.addEventListener('change', calculateTenths);
    }

    // Initial calculation
    calculateTenths();
  }

  /* ==========================================================================
     FEATURE 2: INTERACTIVE PRIVILEGE SPLIT BILL CALCULATOR
     Co-funding privilege cards among team members (supports 4 members)
     ========================================================================== */
  function initSplitBillCalculator() {
    var privSelect = safeQuery('#split-privilege-select');
    var memberInputs = safeQueryAll('.split-member-input');
    var progressBar = safeQuery('#split-progress-bar');
    var statusText = safeQuery('#split-status-text');
    var submitBtn = safeQuery('#split-submit-btn');

    if (!privSelect || memberInputs.length === 0) return;

    function updateSplitBill() {
      var selectedOpt = privSelect.options[privSelect.selectedIndex];
      var cost = 40; // Default
      if (selectedOpt) {
        var dataCost = selectedOpt.getAttribute('data-cost');
        if (dataCost) {
          cost = parseInt(dataCost, 10);
        } else {
          var val = parseInt(selectedOpt.value, 10);
          if (!isNaN(val)) cost = val;
        }
      }

      var totalCollected = 0;
      for (var i = 0; i < memberInputs.length; i++) {
        var val = parseFloat(memberInputs[i].value);
        if (!isNaN(val) && val > 0) {
          totalCollected += val;
        }
      }

      var pct = Math.min(100, Math.round((totalCollected / cost) * 100));

      if (progressBar) {
        progressBar.style.width = pct + '%';
        if (pct >= 100) {
          progressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        } else {
          progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #06b6d4)';
        }
      }

      if (statusText) {
        if (pct >= 100) {
          statusText.innerHTML = 'Recaudado: <strong>' + totalCollected + ' / ' + cost + ' Tks</strong> (100% Completado) — <span style="color: #34d399;">¡Financiado con éxito entre los ' + memberInputs.length + ' integrantes!</span>';
        } else {
          var remaining = cost - totalCollected;
          statusText.innerHTML = 'Recaudado: <strong>' + totalCollected + ' / ' + cost + ' Tks</strong> (' + pct + '%) — Faltan <strong>' + remaining + ' Tks</strong>';
        }
      }

      return { totalCollected: totalCollected, cost: cost, isComplete: pct >= 100 };
    }

    privSelect.addEventListener('change', updateSplitBill);
    for (var i = 0; i < memberInputs.length; i++) {
      memberInputs[i].addEventListener('input', updateSplitBill);
      memberInputs[i].addEventListener('change', updateSplitBill);
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var state = updateSplitBill();
        if (state.isComplete) {
          var folio = 'FOLIO #SPLIT-2026-' + Math.floor(1000 + Math.random() * 9000);
          if (statusText) {
            statusText.innerHTML = '🎟️ <strong>¡Ticket Grupal Emitido!</strong> ' + folio + '<br><span style="color: #34d399; font-size: 0.85rem;">Privilegio canjeado exitosamente. Aportaciones de ' + memberInputs.length + ' integrantes registradas.</span>';
          }
        } else {
          if (statusText) {
            var diff = state.cost - state.totalCollected;
            statusText.innerHTML = '<span style="color: #fb7185;">⚠️ Saldo insuficiente: se requieren ' + state.cost + ' Tks. Faltan ' + diff + ' Tks por aportar.</span>';
          }
        }
      });
    }

    // Initial update
    updateSplitBill();
  }

  /* ==========================================================================
     FEATURE 3: INTERACTIVE LIVE TENDER CHALLENGE SIMULATOR
     Live timer countdown, reset handler, & bidding podium points estimator
     Podium Rules:
       - 1st Place: 35–40 Tks (exact/close answer)
       - 2nd Place: 22–25 Tks
       - 3rd Place: 15–18 Tks
       - Correct Answer: 10 Tks
       - Participation: 5 Tks
     ========================================================================== */
  function initTenderSimulator() {
    var timerDisplay = safeQuery('#tender-timer-display');
    var resetBtn = safeQuery('#tender-timer-reset-btn');
    var answerInput = safeQuery('#tender-answer-input');
    var firmSelect = safeQuery('#tender-firm-select');
    var submitBtn = safeQuery('#tender-submit-btn');
    var feedbackMsg = safeQuery('#tender-feedback-msg');
    var leaderboard = safeQuery('.tender-live-leaderboard');

    // Timer logic (03:00 = 180 seconds)
    var remainingSeconds = 180;
    var timerRunning = true;
    var timerInterval = null;

    function formatTime(seconds) {
      var mins = Math.floor(seconds / 60);
      var secs = seconds % 60;
      return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function updateTimerUI() {
      if (timerDisplay) {
        timerDisplay.textContent = formatTime(remainingSeconds);
      }
    }

    function startTimer() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(function () {
        if (timerRunning && remainingSeconds > 0) {
          remainingSeconds--;
          updateTimerUI();
        }
      }, 1000);
    }

    if (timerDisplay) {
      var timerContainer = timerDisplay.closest('.tender-timer-box');
      if (timerContainer) {
        timerContainer.title = 'Haz clic para pausar/reanudar el cronómetro';
        timerContainer.addEventListener('click', function (e) {
          // Avoid triggering when clicking the reset button inside container
          if (e.target === resetBtn || (resetBtn && resetBtn.contains(e.target))) return;
          timerRunning = !timerRunning;
          var label = timerContainer.querySelector('.timer-label');
          if (label) {
            label.textContent = timerRunning ? 'Tiempo Restante:' : 'Tiempo [PAUSADO]:';
          }
        });
      }
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        remainingSeconds = 180;
        timerRunning = true;
        updateTimerUI();
        if (feedbackMsg) {
          feedbackMsg.className = 'tender-feedback-msg';
          feedbackMsg.innerHTML = '';
        }
      });
    }

    startTimer();
    updateTimerUI();

    // Answer Submission & Podium Estimator
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var ans = answerInput ? answerInput.value.trim() : '';
        if (!ans) {
          if (feedbackMsg) {
            feedbackMsg.className = 'tender-feedback-msg active';
            feedbackMsg.style.borderColor = '#f43f5e';
            feedbackMsg.style.color = '#fb7185';
            feedbackMsg.style.background = 'rgba(244, 63, 94, 0.15)';
            feedbackMsg.innerHTML = '⚠️ Por favor ingresa tu resultado de T(30) en °C para emitir la propuesta.';
          }
          return;
        }

        var firmName = 'Firma Alpha';
        if (firmSelect) {
          var selectedOpt = firmSelect.options[firmSelect.selectedIndex];
          if (selectedOpt) firmName = selectedOpt.textContent;
        }

        // Exact analytical solution: T(30) = 60 + 120 * e^(-1.5) ≈ 86.8°C
        var numAns = parseFloat(ans.replace(',', '.'));
        var pointsAwarded = 5;
        var placeText = '📝 Participación Registrada (+5 Tks al saldo de firma)';

        if (!isNaN(numAns)) {
          var diff = Math.abs(numAns - 86.8);
          if (diff <= 1.5) {
            pointsAwarded = 40;
            placeText = '🥇 1er Lugar (+40 Tks al saldo de firma)';
          } else if (diff <= 5.0) {
            pointsAwarded = 25;
            placeText = '🥈 2do Lugar (+25 Tks al saldo de firma)';
          } else if (diff <= 10.0) {
            pointsAwarded = 18;
            placeText = '🥉 3er Lugar (+18 Tks al saldo de firma)';
          } else if (diff <= 20.0) {
            pointsAwarded = 10;
            placeText = '✅ Respuesta Correcta (+10 Tks al saldo de firma)';
          }
        }

        if (feedbackMsg) {
          var isSuccess = pointsAwarded >= 10;
          feedbackMsg.className = 'tender-feedback-msg active';
          feedbackMsg.style.borderColor = isSuccess ? '#10b981' : '#f59e0b';
          feedbackMsg.style.color = isSuccess ? '#34d399' : '#fbbf24';
          feedbackMsg.style.background = isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
          feedbackMsg.innerHTML = '✅ <strong>¡Propuesta Enviada por ' + firmName + '!</strong><br>' +
            'Resultado $T(30) = ' + ans + '^\circ\\text{C}$. Estado: Solución auditada.<br>' +
            '<strong>Podio Estimado:</strong> ' + placeText;

          // Re-render math if KaTeX is available
          if (window.renderMathInElement) {
            try { window.renderMathInElement(feedbackMsg); } catch (e) {}
          }
        }

        // Dynamic Leaderboard Update
        if (leaderboard) {
          if (pointsAwarded >= 35) {
            var firstPlaceItem = leaderboard.querySelector('.place-1');
            if (firstPlaceItem) {
              firstPlaceItem.innerHTML = '<span>1° ' + firmName + '</span><span class="score">+' + pointsAwarded + ' Tks</span>';
            }
          } else if (pointsAwarded >= 22) {
            var secondPlaceItem = leaderboard.querySelector('.place-2');
            if (secondPlaceItem) {
              secondPlaceItem.innerHTML = '<span>2° ' + firmName + '</span><span class="score">+' + pointsAwarded + ' Tks</span>';
            }
          } else if (pointsAwarded >= 15) {
            var thirdPlaceItem = leaderboard.querySelector('.place-3');
            if (thirdPlaceItem) {
              thirdPlaceItem.innerHTML = '<span>3° ' + firmName + '</span><span class="score">+' + pointsAwarded + ' Tks</span>';
            }
          }
        }
      });
    }
  }

  /* ==========================================================================
     FEATURE 4: PEER FEEDBACK KUDOS TRANSFER SIMULATOR
     Send 10 Kudos points to a teammate with 3D feedback criteria & mandatory 20+ char feedback
     ========================================================================== */
  function initKudosTransfer() {
    var recipientSelect = safeQuery('#kudos-recipient');
    var categorySelect = safeQuery('#kudos-category');
    var feedbackText = safeQuery('#kudos-feedback-text');
    var charCounter = safeQuery('#kudos-char-counter');
    var sendBtn = safeQuery('#send-kudos-btn');
    var statusMsg = safeQuery('#kudos-status-msg');

    if (!sendBtn) return;

    var senderBalance = 100;

    function updateCharCounter() {
      var textVal = feedbackText ? feedbackText.value.trim() : '';
      var len = textVal.length;
      if (charCounter) {
        charCounter.textContent = len + ' / 20 mín';
        if (len >= 20) {
          charCounter.style.color = '#34d399';
          charCounter.style.borderColor = '#10b981';
        } else {
          charCounter.style.color = '#fb7185';
          charCounter.style.borderColor = '#f43f5e';
        }
      }
    }

    if (feedbackText) {
      feedbackText.addEventListener('input', updateCharCounter);
      feedbackText.addEventListener('keyup', updateCharCounter);
      updateCharCounter();
    }

    sendBtn.addEventListener('click', function () {
      var textVal = feedbackText ? feedbackText.value.trim() : '';

      // Mandatory 20-character peer feedback validation
      if (textVal.length < 20) {
        if (statusMsg) {
          statusMsg.className = 'kudos-status-msg active';
          statusMsg.style.borderColor = '#f43f5e';
          statusMsg.style.color = '#fb7185';
          statusMsg.style.background = 'rgba(244, 63, 94, 0.15)';
          statusMsg.innerHTML = '⚠️ La retroalimentación detallada debe contener al menos 20 caracteres (actual: ' + textVal.length + ').';
        }
        return;
      }

      if (senderBalance < 10) {
        if (statusMsg) {
          statusMsg.className = 'kudos-status-msg active';
          statusMsg.style.borderColor = '#f43f5e';
          statusMsg.style.color = '#fb7185';
          statusMsg.style.background = 'rgba(244, 63, 94, 0.15)';
          statusMsg.textContent = '⚠️ Saldo insuficiente en el Banco de Tokens para transferir Kudos (se requieren 10 Tks).';
        }
        return;
      }

      var recipientText = 'Compañero';
      if (recipientSelect && recipientSelect.options[recipientSelect.selectedIndex]) {
        recipientText = recipientSelect.options[recipientSelect.selectedIndex].textContent;
      }

      var categoryText = '#rigor';
      if (categorySelect && categorySelect.options[categorySelect.selectedIndex]) {
        categoryText = categorySelect.options[categorySelect.selectedIndex].textContent;
      }

      senderBalance -= 10;

      if (statusMsg) {
        statusMsg.className = 'kudos-status-msg active';
        statusMsg.style.borderColor = '#10b981';
        statusMsg.style.color = '#34d399';
        statusMsg.style.background = 'rgba(16, 185, 129, 0.15)';
        statusMsg.innerHTML = '⭐ <strong>¡10 Tokens Kudos Transferidos!</strong><br>' +
          'Destinatario: <strong>' + recipientText + '</strong><br>' +
          'Criterio 3D: <em>' + categoryText + '</em><br>' +
          'Retroalimentación: <em>"' + textVal + '"</em><br>' +
          'Saldo emisor: ' + senderBalance + ' Tks (-10 Tks) | Receptor: +10 Tks netos.';
      }
    });
  }

  /* ==========================================================================
     FEATURE 5: STREAK TRACKER COUNTER & FREEZE PASS INDICATOR
     Interactive streak counter (+2 Tks/day) with freeze pass indicator
     ========================================================================== */
  function initStreakTracker() {
    var streakCard = safeQuery('#streak-widget') || safeQuery('.streak-engine-card');
    if (!streakCard) return;

    var streakDays = 4;
    var freezePasses = 2;
    var accumulatedPts = 8; // 4 days * 2 Tks/day

    // Build interactive control UI if not already present
    var interactiveBox = safeQuery('.streak-interactive-bar', streakCard);
    if (!interactiveBox) {
      interactiveBox = document.createElement('div');
      interactiveBox.className = 'streak-interactive-bar';
      interactiveBox.innerHTML =
        '<button type="button" class="btn-primary streak-btn" id="btn-streak-increment">🔥 +1 Día de Racha (+2 Tks)</button>' +
        '<button type="button" class="btn-success streak-btn" id="btn-use-freeze">🛡️ Usar Pase de Congelación</button>';
      streakCard.appendChild(interactiveBox);
    }

    var statusBox = safeQuery('.streak-status-box', streakCard);
    if (!statusBox) {
      statusBox = document.createElement('div');
      statusBox.className = 'streak-status-box';
      statusBox.style.marginTop = '0.75rem';
      statusBox.style.fontSize = '0.82rem';
      statusBox.style.color = '#fbbf24';
      statusBox.style.fontWeight = '600';
      streakCard.appendChild(statusBox);
    }

    function updateStreakUI(msg) {
      var freezeBox = safeQuery('.freeze-pass-box', streakCard);
      if (freezeBox) {
        freezeBox.innerHTML = '🛡️ Pases de Congelación: <strong>' + freezePasses + ' restantes</strong> (+30 Tks por adicional en tienda).';
      }

      var dayBadges = safeQueryAll('.day-badge', streakCard);
      if (dayBadges.length >= 4) {
        for (var i = 0; i < 4; i++) {
          if (i < streakDays) {
            dayBadges[i].className = 'day-badge active';
          }
        }
      }

      if (statusBox && msg) {
        statusBox.innerHTML = msg;
      }
    }

    var incBtn = safeQuery('#btn-streak-increment', streakCard);
    if (incBtn) {
      incBtn.addEventListener('click', function () {
        streakDays++;
        accumulatedPts += 2;

        var bonusText = '';
        if (streakDays === 4) bonusText = ' 🏆 ¡Bono de Hito Alcanzado (+10 Tks)!';
        if (streakDays === 12) bonusText = ' 🏆 ¡Bono de Hito Alcanzado (+30 Tks)!';
        if (streakDays === 24) bonusText = ' 🏆 ¡Bono de Hito Alcanzado (+70 Tks)!';

        updateStreakUI('🔥 <strong>¡Racha Incrementada!</strong> Días consecutivos: <strong>' + streakDays + '</strong> (+2 Tks depositados. Total racha: +' + accumulatedPts + ' Tks).' + bonusText);
      });
    }

    var freezeBtn = safeQuery('#btn-use-freeze', streakCard);
    if (freezeBtn) {
      freezeBtn.addEventListener('click', function () {
        if (freezePasses > 0) {
          freezePasses--;
          updateStreakUI('🛡️ <strong>¡Pase de Congelación Activado!</strong> Tu racha está protegida hoy. Pases restantes: ' + freezePasses + '.');
        } else {
          updateStreakUI('<span style="color: #fb7185;">⚠️ No tienes Pases de Congelación disponibles. Puedes adquirir uno adicional por 30 Tks en la tienda.</span>');
        }
      });
    }

    // Initial state setup
    updateStreakUI('🔥 Racha Activa: <strong>4 Días</strong> (+8 Tks acumulados). Pases de congelación listos.');
  }

  // Initialize all 5 interactive features safely
  try {
    initPointsCalculator();
    initSplitBillCalculator();
    initTenderSimulator();
    initKudosTransfer();
    initStreakTracker();
  } catch (err) {
    console.warn('Custom presentation scripts initialized with non-critical notice:', err);
  }
});
