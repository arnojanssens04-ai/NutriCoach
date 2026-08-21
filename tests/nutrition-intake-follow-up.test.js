/* ──────────────────────────────────────────────────────────────────────
   tests/nutrition-intake-follow-up.test.js — Suite pour
   computeIntakeFollowUp() (nutrition-simulator-admin.html) — Cap Santé

   Règle validée le 2026-08-21 : compare l'apport moyen observé à deux
   dates de référence pour la même règle nutriment (celle qui a
   déclenché la suggestion, et une date de suivi ultérieure,
   configurable — jamais fixée en dur). Seuil de +/-15% pour distinguer
   'improved'/'declined' de 'stable'. Jamais une conclusion médicale,
   uniquement un constat chiffré et descriptif. Uniquement pour les
   nutriments quantitatifs (avgIntake exposé par
   computeNutrientIntakeVsTarget) — vitamines C/D/B12 (mécanisme de
   rareté de sources) restent hors périmètre.

   Exécution : node tests/nutrition-intake-follow-up.test.js
   ────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const ENGINE_FILES = [
  'trend-definitions.js', 'trend-engine.js',
  'nutrition-food-definitions.js', 'nutrition-template-definitions.js',
  'nutrition-rule-definitions.js', 'nutrition-signal-engine.js', 'nutrition-priority-engine.js',
  'nutrition-safety.js', 'nutrition-rule-engine.js', 'nutrition-ultra-processed-substitutions.js',
  'nutrition-food-selector.js', 'nutrition-advice-renderer.js', 'nutrition-audit.js', 'nutrition-simulator.js'
];
const MEAL_PATTERN_FILES = ['meal-food-roles.js', 'meal-pattern-detector.js', 'meal-pattern-role-matching.js', 'meal-pattern-clarifying-questions.js'];

function buildSandbox() {
  const sandbox = { supabase: { createClient: function () { return { auth: { getSession: function () { return Promise.resolve({ data: null }); } } }; } } };
  vm.createContext(sandbox);
  ENGINE_FILES.concat(MEAL_PATTERN_FILES).forEach((f) => vm.runInContext(fs.readFileSync(REPO + '/' + f, 'utf8'), sandbox, { filename: f }));
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const scriptBody = htmlSrc.split('<script>').slice(-1)[0].replace(/sb\.auth\.getSession[\s\S]*$/, '');
  vm.runInContext(scriptBody, sandbox, { filename: 'nutrition-simulator-admin.html (inline script)' });
  return sandbox;
}

function followUp(sandbox, resolverId, journal, firstDate, followUpDate) {
  return vm.runInContext('computeIntakeFollowUp', sandbox)(resolverId, journal, firstDate, followUpDate);
}

function calciumEntry(date, mg) {
  return { date: date, repas: 'lunch', aliment: 'x', quantite: 100, kcal: 100, calcium_mg: mg };
}

// Deux fenêtres de 14 jours NON chevauchantes (la deuxième référence
// est prise 14 jours après la première, jamais 7, pour que les deux
// fenêtres glissantes de 14 jours ne se recouvrent pas et que chaque
// bloc de test reflète exactement la valeur attendue).
const WEEK1 = ['2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12'];
const WEEK2 = ['2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'];

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

check('1. Amélioration nette (+37%) : status "improved"', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => calciumEntry(d, 350)).concat(WEEK2.map((d) => calciumEntry(d, 480)));
  const res = followUp(sandbox, 'low_source_presence_calcium', journal, '2026-08-12', '2026-08-26');
  assert.strictEqual(res.status, 'improved');
  assert(res.changeRatio > 0.15);
  assert.strictEqual(Math.round(res.firstAvgIntake), 350);
  assert.strictEqual(Math.round(res.followUpAvgIntake), 480);
});

check('2. Baisse nette (-20%) : status "declined"', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => calciumEntry(d, 500)).concat(WEEK2.map((d) => calciumEntry(d, 400)));
  const res = followUp(sandbox, 'low_source_presence_calcium', journal, '2026-08-12', '2026-08-26');
  assert.strictEqual(res.status, 'declined');
  assert(res.changeRatio < -0.15);
});

check('3. Variation faible (+5%) : status "stable"', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => calciumEntry(d, 400)).concat(WEEK2.map((d) => calciumEntry(d, 420)));
  const res = followUp(sandbox, 'low_source_presence_calcium', journal, '2026-08-12', '2026-08-26');
  assert.strictEqual(res.status, 'stable');
});

check('4. Variation exactement au seuil (+15%) : "improved" (seuil inclusif du côté amélioration)', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => calciumEntry(d, 400)).concat(WEEK2.map((d) => calciumEntry(d, 460)));
  const res = followUp(sandbox, 'low_source_presence_calcium', journal, '2026-08-12', '2026-08-26');
  assert.strictEqual(res.changeRatio, 0.15);
  assert.strictEqual(res.status, 'improved');
});

check('5. Date de suivi sans données (fenêtre vide) : insufficient_data, jamais une exception', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => calciumEntry(d, 350));
  const res = followUp(sandbox, 'low_source_presence_calcium', journal, '2026-08-12', '2026-08-26');
  assert.strictEqual(res.status, 'insufficient_data');
  assert.strictEqual(res.changeRatio, null);
});

check('6. Vitamine C/D/B12 (mécanisme de rareté, pas de quantité) : hors périmètre, insufficient_data plutôt qu\'une exception', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => ({ date: d, repas: 'lunch', aliment: 'x', nutrient_sources: [] }));
  const res = followUp(sandbox, 'low_source_presence_vitamin_c', journal, '2026-08-12', '2026-08-19');
  assert.strictEqual(res.status, 'insufficient_data');
});

check('7. Délai configurable : fonctionne avec un écart différent de 7 jours (14 jours ici)', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => calciumEntry(d, 350)).concat(
    ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'].map((d) => calciumEntry(d, 500))
  );
  const res = followUp(sandbox, 'low_source_presence_calcium', journal, '2026-08-12', '2026-08-26');
  assert.strictEqual(res.status, 'improved');
  assert.strictEqual(res.followUpWindow.end, '2026-08-26');
});

check('8. Champs exposés : status, firstAvgIntake, firstWindow, followUpAvgIntake, followUpWindow, changeRatio, dailyTarget, unit, changeThreshold', () => {
  const sandbox = buildSandbox();
  const journal = WEEK1.map((d) => calciumEntry(d, 350)).concat(WEEK2.map((d) => calciumEntry(d, 480)));
  const res = followUp(sandbox, 'low_source_presence_calcium', journal, '2026-08-12', '2026-08-26');
  ['status', 'firstAvgIntake', 'firstWindow', 'followUpAvgIntake', 'followUpWindow', 'changeRatio', 'dailyTarget', 'unit', 'changeThreshold'].forEach((k) => {
    assert(Object.prototype.hasOwnProperty.call(res, k), 'champ manquant : ' + k);
  });
  assert.strictEqual(res.changeThreshold, 0.15);
  assert.strictEqual(res.dailyTarget, 900);
  assert.strictEqual(res.unit, 'mg');
});

check('9. Aucune formulation évaluative ("bravo", "félicitations", "réussi") dans computeIntakeFollowUp ni son rendu', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const fnStart = htmlSrc.indexOf('function computeIntakeFollowUp');
  const fnBody = htmlSrc.slice(fnStart, fnStart + 3000);
  assert(!/bravo|f[ée]licitations|r[ée]ussi|excellent/i.test(fnBody));
  const panelStart = htmlSrc.indexOf('Suivi depuis la dernière observation');
  const panelBody = htmlSrc.slice(panelStart, panelStart + 2000);
  assert(!/bravo|f[ée]licitations|r[ée]ussi|excellent/i.test(panelBody));
});

check('10. Absence de réseau, IA, DOM dans computeIntakeFollowUp', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const start = htmlSrc.indexOf('function computeIntakeFollowUp');
  const fnBody = htmlSrc.slice(start, start + 3000);
  assert(!/fetch\(|XMLHttpRequest|document\.|window\.|openai|gemini|anthropic|sb\./i.test(fnBody));
});

check('11. Régression : le moteur confiné nutrition-*.js et les fichiers patient restent inchangés', () => {
  const trackedNutritionFiles = execSync('git ls-files "nutrition-*.js"', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const out = execSync('git status --short -- ' + trackedNutritionFiles.map((f) => '"' + f + '"').join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'des fichiers nutrition-*.js du moteur confiné ont été modifiés: ' + out);
  const patientFacing = ['dashboard.html', 'conseils.html', 'admin.html', 'regles-pathologies.js', 'clinical-context-storage.js', 'trend-engine.js', 'trend-definitions.js'];
  const outPatient = execSync('git status --short -- ' + patientFacing.join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(outPatient, '', 'des fichiers patient/moteur hors périmètre ont été modifiés: ' + outPatient);
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
