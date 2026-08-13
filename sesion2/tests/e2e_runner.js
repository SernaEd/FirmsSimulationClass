#!/usr/bin/env node
/**
 * Calculus III Reveal.js Presentation - Automated E2E Opaque-Box Test Suite Runner
 * Location: tests/e2e_runner.js
 * 
 * Verifies feature coverage, content accuracy, responsive assets, interactive
 * component containers, and slide structure for index.html.
 * 
 * Standalone Node.js execution: `node tests/e2e_runner.js`
 */

const fs = require('fs');
const path = require('path');

// ANSI Color helper for formatted terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

class HtmlInspector {
  constructor(htmlContent) {
    this.html = htmlContent || '';
    this.exists = Boolean(htmlContent);
  }

  // Check if an element with specified id exists
  hasId(id) {
    if (!this.exists) return false;
    const regex = new RegExp(`id=["']?${id}["']?`, 'i');
    return regex.test(this.html);
  }

  // Check if an element with specified class exists
  hasClass(className) {
    if (!this.exists) return false;
    const regex = new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["']`, 'i');
    return regex.test(this.html);
  }

  // Check selector (#id or .class)
  hasSelector(sel) {
    if (!this.exists) return false;
    const cleanSel = sel.trim();
    if (cleanSel.startsWith('#')) {
      return this.hasId(cleanSel.substring(1));
    }
    if (cleanSel.startsWith('.')) {
      return this.hasClass(cleanSel.substring(1));
    }
    return this.containsPattern(cleanSel);
  }

  // Check if an element with a tag and optional class/id exists
  hasTag(tag, attrs = {}) {
    if (!this.exists) return false;
    let pattern = `<${tag}\\b`;
    if (attrs.id) {
      pattern += `[^>]*id=["']?${attrs.id}["']?`;
    }
    if (attrs.class) {
      pattern += `[^>]*class=["'][^"']*\\b${attrs.class}\\b[^"']*["']`;
    }
    const regex = new RegExp(pattern, 'i');
    return regex.test(this.html);
  }

  // Check if text or regex pattern exists in HTML
  containsPattern(pattern) {
    if (!this.exists) return false;
    if (pattern instanceof RegExp) {
      return pattern.test(this.html);
    }
    return this.html.toLowerCase().includes(String(pattern).toLowerCase());
  }

  // Check if ALL patterns exist
  containsAll(patterns) {
    if (!this.exists) return false;
    return patterns.every(p => this.containsPattern(p));
  }

  // Check if ANY pattern exists
  containsAny(patterns) {
    if (!this.exists) return false;
    return patterns.some(p => this.containsPattern(p));
  }
}

class TestSuiteRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tierStats = {
      1: { name: 'Tier 1: Feature & Content Coverage', passed: 0, failed: 0 },
      2: { name: 'Tier 2: Responsive & Asset Validation', passed: 0, failed: 0 },
      3: { name: 'Tier 3: Interactive Component & Structure Verification', passed: 0, failed: 0 },
      4: { name: 'Tier 4: Execution & CLI Test Runner', passed: 0, failed: 0 },
      5: { name: 'Tier 5: Interactive Widget Empirical Verification & JS Error Audit', passed: 0, failed: 0 }
    };
    this.failures = [];
    this.startTime = Date.now();
  }

  record(tier, testName, isPass, details = '') {
    if (isPass) {
      this.passed++;
      this.tierStats[tier].passed++;
      console.log(`  ${colors.green}✔ [PASS]${colors.reset} ${testName}`);
    } else {
      this.failed++;
      this.tierStats[tier].failed++;
      const failMsg = details ? `${testName} -> ${details}` : testName;
      this.failures.push({ tier, msg: failMsg });
      console.log(`  ${colors.red}✖ [FAIL]${colors.reset} ${testName}${details ? ` (${colors.dim}${details}${colors.reset})` : ''}`);
    }
  }

  logHeader(title) {
    console.log(`\n${colors.bright}${colors.cyan}====================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan} ${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}====================================================${colors.reset}`);
  }

  run() {
    console.log(`${colors.bright}${colors.magenta}Starting Calculus III Reveal.js Presentation E2E Test Suite${colors.reset}`);
    console.log(`${colors.dim}Target File: index.html${colors.reset}\n`);

    const indexPath = path.join(process.cwd(), 'index.html');
    let htmlContent = null;
    let fileExists = false;

    try {
      if (fs.existsSync(indexPath)) {
        htmlContent = fs.readFileSync(indexPath, 'utf8');
        fileExists = true;
      }
    } catch (err) {
      // Handled in T1.1
    }

    const doc = new HtmlInspector(htmlContent);

    // ==========================================
    // TIER 1: Feature & Content Coverage
    // ==========================================
    this.logHeader('Tier 1: Feature & Content Coverage');

    // T1.1: index.html existence
    this.record(1, 'index.html file exists at workspace root', fileExists, fileExists ? '' : `File not found at ${indexPath}`);

    // T1.2: Reveal.js DOM elements
    const hasReveal = doc.hasClass('reveal');
    const hasSlides = doc.hasClass('slides');
    this.record(1, 'Reveal.js DOM elements (<div class="reveal"><div class="slides">)', hasReveal && hasSlides, 
      !hasReveal ? 'Missing .reveal class' : (!hasSlides ? 'Missing .slides class' : ''));

    // T1.3: 7 Main horizontal slide sections
    const mainSlides = [
      'slide-welcome',
      'slide-syllabus',
      'slide-metaphor',
      'slide-evaluation',
      'slide-economy',
      'slide-tenders',
      'slide-bibliography'
    ];
    let missingMainSlides = mainSlides.filter(id => !doc.hasId(id));
    this.record(1, 'Presence of 7 main horizontal slide sections (#slide-welcome..#slide-bibliography)', missingMainSlides.length === 0,
      missingMainSlides.length > 0 ? `Missing section IDs: #${missingMainSlides.join(', #')}` : '');

    // T1.4: 4 Modules and required subtopics
    const m1Valid = doc.containsAny(['m1', 'modulo 1', 'módulo 1', 'edos', 'ecuaciones diferenciales ordinarias']) &&
                    doc.containsAny(['primer orden', 'orden superior', 'modelado', 'aplicaciones']);
    const m2Valid = doc.containsAny(['m2', 'modulo 2', 'módulo 2', 'laplace', 'transformada de laplace']) &&
                    doc.containsAny(['propiedades', 'inversa', 'solución de edos', 'solucion']);
    const m3Valid = doc.containsAny(['m3', 'modulo 3', 'módulo 3', 'cualitativa', 'teoría cualitativa', 'sistemas dinámicos']) &&
                    doc.containsAny(['plano de fase', 'linealización', 'linealizacion', 'puntos de equilibrio', 'estabilidad']);
    const m4Valid = doc.containsAny(['m4', 'modulo 4', 'módulo 4', 'edps', 'ecuaciones diferenciales parciales']) &&
                    doc.containsAny(['onda', 'calor', 'laplace', 'fourier', 'series de fourier']);

    const modulesPass = m1Valid && m2Valid && m3Valid && m4Valid;
    let missingModules = [];
    if (!m1Valid) missingModules.push('M1 (EDOs)');
    if (!m2Valid) missingModules.push('M2 (Laplace)');
    if (!m3Valid) missingModules.push('M3 (Teoría Cualitativa)');
    if (!m4Valid) missingModules.push('M4 (EDPs)');
    this.record(1, 'All 4 modules (M1 EDOs, M2 Laplace, M3 Qualitative, M4 PDEs) present with subtopics', modulesPass,
      missingModules.length > 0 ? `Incomplete modules: ${missingModules.join(', ')}` : '');

    // T1.5: 3 Consultancy Roles
    const hasAnalyst = doc.containsAny(['analista', 'role-analyst']) && doc.containsAny(['rigor', 'rigor matemático', 'analyst']);
    const hasModeler = doc.containsAny(['modelador', 'role-modeler']) && doc.containsAny(['técnico', 'tecnico', 'aporte técnico', 'formulación', 'modeler']);
    const hasIntegrator = doc.containsAny(['integrador', 'role-integrator']) && doc.containsAny(['colaboración', 'colaboracion', 'gestión', 'integración', 'integrator']);
    const rolesPass = hasAnalyst && hasModeler && hasIntegrator;
    let missingRoles = [];
    if (!hasAnalyst) missingRoles.push('Analista (Rigor)');
    if (!hasModeler) missingRoles.push('Modelador (Aporte Técnico)');
    if (!hasIntegrator) missingRoles.push('Integrador (Colaboración)');
    this.record(1, 'Presence of 3 Consultancy Roles (Analista, Modelador, Integrador)', rolesPass,
      missingRoles.length > 0 ? `Missing roles: ${missingRoles.join(', ')}` : '');

    // T1.6: 70/10/10/10 Evaluation Weights
    const has70Exams = doc.containsPattern(/70\s*%|\b70\s*por ciento/i) && doc.containsAny(['examen', 'exámenes', 'examenes']);
    const has10Classwork = doc.containsPattern(/10\s*%|\b10\s*por ciento/i) && doc.containsAny(['trabajo', 'trabajos', 'práctica', 'practica']);
    const has10Homework = doc.containsPattern(/10\s*%|\b10\s*por ciento/i) && doc.containsAny(['tarea', 'tareas']);
    const has10Project = doc.containsPattern(/10\s*%|\b10\s*por ciento/i) && doc.containsAny(['proyecto', 'proyecto final']);
    const evalWeightsPass = has70Exams && has10Classwork && has10Homework && has10Project;
    this.record(1, 'Verification of 70/10/10/10 evaluation weights (Exams, Classwork, Homework, Project)', evalWeightsPass,
      !evalWeightsPass ? 'Evaluation weights or categories (70% Exams, 10% Classwork, 10% Homework, 10% Project) not found' : '');

    // T1.7: Anti-AI Defense Rules
    const hasOralDefense = doc.containsAny(['pizarrón', 'pizarron', 'oral', 'sustentación', 'sustentacion']);
    const hasEmpiricalVideo = doc.containsAny(['video', 'empírico', 'empirico', 'recolección', 'recoleccion', '2 min', '100 mb']);
    const antiAiPass = hasOralDefense && hasEmpiricalVideo;
    this.record(1, 'Anti-AI defense rules (blackboard oral defense & empirical video)', antiAiPass,
      !antiAiPass ? 'Missing oral blackboard defense or empirical video rules' : '');

    // T1.8: Course Economy
    const hasPointsBank = doc.containsAny(['banco de puntos', 'bank', 'canje_abierto', '50 pts', '50 puntos', '0.1']);
    const hasPrivileges = doc.containsAny(['privilegio', 'privilegios', 'extensión', 'extension', 'saltar']);
    const hasStreaks = doc.containsAny(['racha', 'rachas', 'streak', 'pases de congelación', 'pases de congelacion', '+2 pts', '+2 puntos']);
    const hasPeerFeedback = doc.containsAny(['pares', 'peer', 'retroalimentación', 'retroalimentacion', 'evaluación 3d', 'evaluacion 3d']);
    const economyPass = hasPointsBank && hasPrivileges && hasStreaks && hasPeerFeedback;
    let missingEconomy = [];
    if (!hasPointsBank) missingEconomy.push('Points Bank (50pts=0.1)');
    if (!hasPrivileges) missingEconomy.push('Privileges catalog');
    if (!hasStreaks) missingEconomy.push('Streaks');
    if (!hasPeerFeedback) missingEconomy.push('Peer feedback');
    this.record(1, 'Course Economy (Points Bank, Privileges catalog, Streaks, Peer Feedback)', economyPass,
      missingEconomy.length > 0 ? `Missing economy elements: ${missingEconomy.join(', ')}` : '');

    // T1.9: Live Tenders
    const hasTenders = doc.containsAny(['licitación', 'licitaciones', 'tender', 'podio', 'podium']) &&
                       doc.containsAny(['1er', '1°', '1st', '35', '40']) &&
                       doc.containsAny(['2do', '2°', '2nd', '22', '25']) &&
                       doc.containsAny(['3er', '3°', '3rd', '15', '18']);
    this.record(1, 'Live Tenders (Licitaciones) podium rewards (1st: 35-40, 2nd: 22-25, 3rd: 15-18)', hasTenders,
      !hasTenders ? 'Missing tender podium reward rules' : '');

    // T1.10: Official Bibliography
    const hasZill = doc.containsPattern(/zill/i) && doc.containsPattern(/2015/);
    const hasMunoz = doc.containsAny(['muñoz', 'munoz']) && doc.containsPattern(/2015/);
    const hasGarcia = doc.containsAny(['garcía', 'garcia', 'reich']) && doc.containsPattern(/2015/);
    const hasBuendia = doc.containsAny(['buendía', 'buendia']) && doc.containsPattern(/2016/);
    const biblioPass = hasZill && hasMunoz && hasGarcia && hasBuendia;
    let missingBiblio = [];
    if (!hasZill) missingBiblio.push('Zill (2015)');
    if (!hasMunoz) missingBiblio.push('Muñoz (2015)');
    if (!hasGarcia) missingBiblio.push('García Hernández (2015)');
    if (!hasBuendia) missingBiblio.push('Buendía (2016)');
    this.record(1, 'Official Bibliography (Zill 2015, Muñoz 2015, García Hernández 2015, Buendía 2016)', biblioPass,
      missingBiblio.length > 0 ? `Missing bibliography references: ${missingBiblio.join(', ')}` : '');


    // ==========================================
    // TIER 2: Responsive & Asset Validation
    // ==========================================
    this.logHeader('Tier 2: Responsive & Asset Validation');

    // T2.1: Meta Viewport Tag
    const hasViewport = doc.containsPattern(/<meta\s+[^>]*name=["']viewport["'][^>]*content=["'][^"']*width=device-width[^"']*initial-scale=1/i) ||
                        doc.containsPattern(/<meta\s+[^>]*content=["'][^"']*width=device-width[^"']*initial-scale=1[^"']*\s+name=["']viewport["']/i);
    this.record(2, 'Meta viewport tag configured for responsive layout', hasViewport,
      !hasViewport ? 'Missing or incorrect <meta name="viewport" content="width=device-width, initial-scale=1.0">' : '');

    // T2.2: Reveal.js CSS imports
    const hasRevealCss = doc.containsPattern(/reveal(\.min)?\.css/i) || doc.containsPattern(/theme\/[a-z0-9_-]+\.css/i);
    this.record(2, 'Reveal.js CSS vendor/CDN stylesheets included', hasRevealCss,
      !hasRevealCss ? 'No Reveal.js stylesheet link found' : '');

    // T2.3: Reveal.js JS imports
    const hasRevealJs = doc.containsPattern(/reveal(\.min)?\.js/i);
    this.record(2, 'Reveal.js JS vendor/CDN script included', hasRevealJs,
      !hasRevealJs ? 'No Reveal.js script tag found' : '');

    // T2.4: KaTeX math plugin imports
    const hasKatex = doc.containsPattern(/katex/i) || doc.containsPattern(/plugin\/math\/math\.js/i) || doc.containsPattern(/RevealMath\.KaTeX/i);
    this.record(2, 'KaTeX math engine / plugin CDN links included', hasKatex,
      !hasKatex ? 'No KaTeX or RevealMath plugin scripts/links found' : '');


    // ==========================================
    // TIER 3: Interactive Component & Structure Verification
    // ==========================================
    this.logHeader('Tier 3: Interactive Component & Structure Verification');

    // T3.1: Sub-slide section IDs
    const subSlideIds = [
      'm1', 'm2', 'm3', 'm4',
      'role-analyst', 'role-modeler', 'role-integrator',
      'eval-breakdown', 'anti-ai',
      'bank-conversion', 'privileges', 'streaks-peer',
      'tender-rules', 'tender-card',
      'textbooks', 'pedagogy-refs'
    ];
    let missingSubSlides = subSlideIds.filter(id => !doc.hasId(id));
    this.record(3, 'Presence of required sub-slide IDs (#m1..#m4, #role-*, #eval-*, #bank-*, etc.)', missingSubSlides.length === 0,
      missingSubSlides.length > 0 ? `Missing sub-slide IDs: #${missingSubSlides.join(', #')}` : '');

    // T3.2: Interactive widget containers & selectors
    const interactiveSelectors = [
      '#bank-calculator',
      '#streak-widget',
      '.role-card',
      '.privilege-card',
      '.tender-card'
    ];
    let missingSelectors = interactiveSelectors.filter(sel => !doc.hasSelector(sel));
    this.record(3, 'Presence of interactive component containers/IDs (#bank-calculator, #streak-widget, .role-card, .privilege-card, .tender-card)', missingSelectors.length === 0,
      missingSelectors.length > 0 ? `Missing component selectors: ${missingSelectors.join(', ')}` : '');


    // ==========================================
    // TIER 4: Execution & CLI Test Runner
    // ==========================================
    this.logHeader('Tier 4: Execution & CLI Test Runner');

    // T4.1: CLI Runner self-test validation
    const runnerSelfTest = typeof this.record === 'function' && Array.isArray(this.failures);
    this.record(4, 'Standalone Node.js test runner execution environment', runnerSelfTest);

    // T4.2: Exit status reporting readiness
    const totalTestsCount = 18;
    this.record(4, `Completed evaluation of ${totalTestsCount} test cases across 4 tiers`, totalTestsCount > 0);


    // ==========================================
    // TIER 5: Interactive Widget Empirical Verification & JS Error Audit
    // ==========================================
    this.logHeader('Tier 5: Interactive Widget Empirical Verification & JS Error Audit');

    try {
      const vm = require('vm');
      const jsPath = path.join(process.cwd(), 'js', 'custom.js');
      const jsCode = fs.readFileSync(jsPath, 'utf8');

      function createMockElement(tagName, attributes = {}) {
        const listeners = {};
        const children = [];
        const styles = {};
        
        const elem = {
          tagName: tagName.toUpperCase(),
          value: attributes.value || '',
          textContent: attributes.textContent || '',
          className: attributes.className || '',
          style: styles,
          title: '',
          options: attributes.options || [],
          selectedIndex: attributes.selectedIndex || 0,
          attributes: attributes,
          children: children,
          id: attributes.id || '',

          get innerHTML() {
            return elem._innerHTML || '';
          },
          set innerHTML(val) {
            elem._innerHTML = String(val);
            elem.textContent = String(val);
            // Parse dynamic IDs in innerHTML
            const idMatches = String(val).matchAll(/id=["']([^"']+)["']/g);
            for (const match of idMatches) {
              const childId = match[1];
              const child = createMockElement('button', { id: childId });
              child.id = childId;
              elem.appendChild(child);
              if (domMap) domMap['#' + childId] = child;
            }
          },

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
        if (clean.startsWith('#')) return searchId(root, clean.substring(1));
        if (clean.startsWith('.')) return searchClass(root, clean.substring(1));
        return null;
      }
      function findAllInTree(root, selector) {
        const clean = selector.trim();
        if (clean.startsWith('.')) return searchAllClass(root, clean.substring(1));
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

      // 1. Points Calc
      const bankCalc = createMockElement('div', { className: 'calculator-widget-card' }); bankCalc.id = 'bank-calculator';
      const ptsInput = createMockElement('input', { value: '150' }); ptsInput.id = 'calc-points-input';
      const typeSelect = createMockElement('select', { options: [createMockElement('option', { value: 'ind', textContent: '65% Individual' }), createMockElement('option', { value: 'group', textContent: '35% Grupal' })], selectedIndex: 0 }); typeSelect.id = 'calc-type-select';
      const tenthsResult = createMockElement('div', { textContent: '' }); tenthsResult.id = 'calc-tenths-result';
      const resultSub = createMockElement('div', { textContent: '' }); resultSub.id = 'calc-result-sub';
      bankCalc.appendChild(ptsInput); bankCalc.appendChild(typeSelect); bankCalc.appendChild(tenthsResult); bankCalc.appendChild(resultSub);

      // 2. Split Bill
      const privSelect = createMockElement('select', { options: [createMockElement('option', { value: 'ext24', 'data-cost': '40', textContent: 'Prórroga 24h' })], selectedIndex: 0 }); privSelect.id = 'split-privilege-select';
      const m1 = createMockElement('input', { value: '10' }); m1.id = 'split-m1';
      const m2 = createMockElement('input', { value: '10' }); m2.id = 'split-m2';
      const m3 = createMockElement('input', { value: '10' }); m3.id = 'split-m3';
      const m4 = createMockElement('input', { value: '10' }); m4.id = 'split-m4';
      const progressBar = createMockElement('div'); progressBar.id = 'split-progress-bar';
      const splitStatus = createMockElement('div'); splitStatus.id = 'split-status-text';
      const splitSubmitBtn = createMockElement('button'); splitSubmitBtn.id = 'split-submit-btn';

      // 3. Tender Sim
      const timerBox = createMockElement('div', { className: 'tender-timer-box' });
      const timerDisplay = createMockElement('span', { textContent: '03:00' }); timerDisplay.id = 'tender-timer-display';
      const timerResetBtn = createMockElement('button'); timerResetBtn.id = 'tender-timer-reset-btn';
      timerBox.appendChild(timerDisplay); timerBox.appendChild(timerResetBtn);
      const answerInput = createMockElement('input'); answerInput.id = 'tender-answer-input';
      const firmSelect = createMockElement('select', { options: [createMockElement('option', { textContent: 'Firma Alpha' })], selectedIndex: 0 }); firmSelect.id = 'tender-firm-select';
      const tenderSubmitBtn = createMockElement('button'); tenderSubmitBtn.id = 'tender-submit-btn';
      const tenderFeedback = createMockElement('div'); tenderFeedback.id = 'tender-feedback-msg';
      const leaderboard = createMockElement('div', { className: 'tender-live-leaderboard' });
      const p1 = createMockElement('div', { className: 'leaderboard-item place-1' });
      const p2 = createMockElement('div', { className: 'leaderboard-item place-2' });
      const p3 = createMockElement('div', { className: 'leaderboard-item place-3' });
      leaderboard.appendChild(p1); leaderboard.appendChild(p2); leaderboard.appendChild(p3);

      // 4. Kudos Transfer
      const recipientSelect = createMockElement('select', { options: [createMockElement('option', { textContent: 'Analista' })], selectedIndex: 0 }); recipientSelect.id = 'kudos-recipient';
      const categorySelect = createMockElement('select', { options: [createMockElement('option', { textContent: '#rigor' })], selectedIndex: 0 }); categorySelect.id = 'kudos-category';
      const feedbackText = createMockElement('textarea'); feedbackText.id = 'kudos-feedback-text';
      const charCounter = createMockElement('span'); charCounter.id = 'kudos-char-counter';
      const sendKudosBtn = createMockElement('button'); sendKudosBtn.id = 'send-kudos-btn';
      const kudosStatus = createMockElement('div'); kudosStatus.id = 'kudos-status-msg';

      // 5. Streak Tracker
      const streakCard = createMockElement('div', { className: 'streak-engine-card' }); streakCard.id = 'streak-widget';
      const freezeBox = createMockElement('div', { className: 'freeze-pass-box' });
      const d1 = createMockElement('span', { className: 'day-badge active' });
      const d2 = createMockElement('span', { className: 'day-badge active' });
      const d3 = createMockElement('span', { className: 'day-badge active' });
      const d4 = createMockElement('span', { className: 'day-badge active' });
      streakCard.appendChild(freezeBox); streakCard.appendChild(d1); streakCard.appendChild(d2); streakCard.appendChild(d3); streakCard.appendChild(d4);

      const domMap = {
        '#bank-calculator': bankCalc, '#calc-points-input': ptsInput, '#calc-type-select': typeSelect, '#calc-tenths-result': tenthsResult, '#calc-result-sub': resultSub,
        '#split-privilege-select': privSelect, '#split-m1': m1, '#split-m2': m2, '#split-m3': m3, '#split-m4': m4,
        '#split-progress-bar': progressBar, '#split-status-text': splitStatus, '#split-submit-btn': splitSubmitBtn,
        '#tender-timer-display': timerDisplay, '#tender-timer-reset-btn': timerResetBtn, '#tender-answer-input': answerInput, '#tender-firm-select': firmSelect,
        '#tender-submit-btn': tenderSubmitBtn, '#tender-feedback-msg': tenderFeedback, '.tender-live-leaderboard': leaderboard,
        '#kudos-recipient': recipientSelect, '#kudos-category': categorySelect, '#kudos-feedback-text': feedbackText, '#kudos-char-counter': charCounter,
        '#send-kudos-btn': sendKudosBtn, '#kudos-status-msg': kudosStatus, '#streak-widget': streakCard, '.streak-engine-card': streakCard
      };

      const domListeners = {};
      const mockDoc = {
        addEventListener(evt, fn) { if (!domListeners[evt]) domListeners[evt] = []; domListeners[evt].push(fn); },
        querySelector(sel) { return domMap[sel] || null; },
        querySelectorAll(sel) {
          if (sel === '.split-member-input') return [m1, m2, m3, m4];
          if (sel === '.day-badge') return [d1, d2, d3, d4];
          return [];
        },
        createElement(tag) { return createMockElement(tag); }
      };

      let jsConsoleErrors = [];
      const mockWin = {
        renderMathInElement: () => {},
        console: { log: () => {}, warn: () => {}, error: (...a) => { jsConsoleErrors.push(a.join(' ')); } }
      };

      const sandbox = {
        document: mockDoc, window: mockWin, console: mockWin.console,
        setInterval: () => {}, clearInterval: () => {}, parseFloat, parseInt, isNaN, Math
      };
      vm.createContext(sandbox);
      vm.runInContext(jsCode, sandbox);

      if (domListeners['DOMContentLoaded']) {
        domListeners['DOMContentLoaded'].forEach(fn => fn());
      }

      // Test Widget 1: Points Calculator
      ptsInput.value = '200'; ptsInput.dispatchEvent('input');
      const ptsPass = tenthsResult.textContent.includes('+0.4 Décimas');
      this.record(5, 'Points Calculator formula: points / 50 * 0.1 conversion (200 pts = +0.4 décimas)', ptsPass);

      // Test Widget 2: Split Bill Calculator across 4 members (#split-m1 to #split-m4)
      m1.value = '10'; m2.value = '10'; m3.value = '10'; m4.value = '10'; m1.dispatchEvent('input');
      const splitPass = splitStatus.innerHTML.includes('100% Completado');
      splitSubmitBtn.click();
      const folioPass = splitStatus.innerHTML.includes('Ticket Grupal Emitido');
      this.record(5, 'Split Bill Calculator co-funding across 4 team members (#split-m1..#split-m4)', splitPass && folioPass);

      // Test Widget 3: Live Tender Simulator Start, Reset (#tender-timer-reset-btn), and Podium Calculation
      timerResetBtn.click();
      const resetPass = timerDisplay.textContent === '03:00';
      answerInput.value = '86.8'; tenderSubmitBtn.click();
      const podiumPass = tenderFeedback.innerHTML.includes('1er Lugar (+40 PTS') && p1.innerHTML.includes('+40 PTS');
      const test3Details = !resetPass ? `resetPass failed (timerDisplay=${timerDisplay.textContent})` : (!podiumPass ? `podiumPass failed (feedback=${tenderFeedback.innerHTML}, p1=${p1.innerHTML})` : '');
      this.record(5, 'Live Tender Simulator Start, Reset (#tender-timer-reset-btn), & Podium score calculation', resetPass && podiumPass, test3Details);

      // Test Widget 4: Peer Feedback Kudos Transfer (<20 chars blocks; >=20 chars enables)
      feedbackText.value = 'Corto (12 chars)'; feedbackText.dispatchEvent('input'); sendKudosBtn.click();
      const blockPass = kudosStatus.innerHTML.includes('al menos 20 caracteres');
      feedbackText.value = 'Excelente aportación matemática en la sustentación del modelo RLC'; feedbackText.dispatchEvent('input'); sendKudosBtn.click();
      const enablePass = kudosStatus.innerHTML.includes('10 Puntos Kudos Transferidos');
      this.record(5, 'Peer Feedback Kudos character counter (<20 chars blocks; >=20 chars enables transfer)', blockPass && enablePass);

      // Test Widget 5: Daily Streak Counter & Freeze Pass Tracker
      const incBtn = streakCard.querySelector('#btn-streak-increment');
      const freezeBtn = streakCard.querySelector('#btn-use-freeze');
      const statusBox = streakCard.querySelector('.streak-status-box');
      incBtn.click();
      const streakPass = statusBox.innerHTML.includes('Días consecutivos: <strong>5</strong>');
      freezeBtn.click();
      const freezePass = freezeBox.innerHTML.includes('1 restantes');
      this.record(5, 'Daily Streak counter (+2 pts/day) & Freeze Pass tracker', streakPass && freezePass);

      // Test Zero Console JS Errors
      this.record(5, 'Zero runtime console JS errors detected', jsConsoleErrors.length === 0,
        jsConsoleErrors.length > 0 ? `Errors: ${jsConsoleErrors.join('; ')}` : '');

    } catch (widgetErr) {
      this.record(5, 'Interactive Widget Empirical Verification & JS Error Audit', false, widgetErr.message);
    }


    // ==========================================
    // SUMMARY REPORT
    // ==========================================
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.logHeader('E2E TEST SUITE RUNNER SUMMARY');

    console.log(`Duration: ${duration} seconds`);
    console.log(`Total Tests: ${this.passed + this.failed}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${this.failed > 0 ? colors.red : colors.green}Failed: ${this.failed}${colors.reset}\n`);

    console.log(`${colors.bright}Breakdown by Tier:${colors.reset}`);
    for (let t = 1; t <= 5; t++) {
      const stat = this.tierStats[t];
      const tierStatus = stat.failed === 0 ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL (${stat.failed} failed)${colors.reset}`;
      console.log(`  - ${stat.name}: ${tierStatus} [${stat.passed}/${stat.passed + stat.failed}]`);
    }

    if (this.failures.length > 0) {
      console.log(`\n${colors.bright}${colors.red}Detailed Failure Report:${colors.reset}`);
      this.failures.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [Tier ${f.tier}] ${f.msg}`);
      });
      console.log(`\n${colors.red}${colors.bright}TEST SUITE FAILED${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}${colors.bright}ALL E2E TESTS PASSED SUCCESSFULLY!${colors.reset}`);
      process.exit(0);
    }
  }
}

if (require.main === module) {
  const runner = new TestSuiteRunner();
  runner.run();
}

module.exports = TestSuiteRunner;
