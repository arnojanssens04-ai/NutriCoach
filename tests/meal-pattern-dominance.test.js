/* ──────────────────────────────────────────────────────────────────────
   tests/meal-pattern-dominance.test.js — Suite pour computeMealDominance()
   (nutrition-simulator-admin.html) — Cap Santé

   Règle validée le 2026-08-20 : un mealType est dominant si son ratio
   d'occurrences est >= 0.60, avec au moins 3 occurrences, réparties sur
   au moins 2 jours distincts, ET une couverture globale suffisante
   (fraîcheur non "stale", au moins 2 jours renseignés au total). Sinon,
   jamais de choix automatique : 'multiple_meals' ou 'insufficient_data'.

   Teste computeMealDominance() en isolation (fonction pure), sans passer
   par runNutritionSimulation() — mêmes conventions de chargement que
   tests/meal-pattern-role-integration.test.js.

   Exécution : node tests/meal-pattern-dominance.test.js
   ────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const MEAL_PATTERN_FILES = ['meal-food-roles.js', 'meal-pattern-detector.js', 'meal-pattern-role-matching.js', 'meal-pattern-clarifying-questions.js'];

function buildSandbox() {
  const sandbox = { supabase: { createClient: function () { return { auth: { getSession: function () { return Promise.resolve({ data: null }); } } }; } } };
  vm.createContext(sandbox);
  MEAL_PATTERN_FILES.forEach((f) => vm.runInContext(fs.readFileSync(REPO + '/' + f, 'utf8'), sandbox, { filename: f }));

  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const scriptBody = htmlSrc.split('<script>').slice(-1)[0].replace(/sb\.auth\.getSession[\s\S]*$/, '');
  vm.runInContext(scriptBody, sandbox, { filename: 'nutrition-simulator-admin.html (inline script)' });

  return sandbox;
}

function dominance(sandbox, flaggedFoodNames, journalEntries, freshness) {
  return vm.runInContext('computeMealDominance', sandbox)(flaggedFoodNames, journalEntries, freshness);
}

function entry(date, repas, aliment) {
  return { date: date, repas: repas, aliment: aliment };
}

function freshOk(analyzableDays) {
  return { status: 'recent', analyzableDays: typeof analyzableDays === 'number' ? analyzableDays : 7 };
}

function freshStale(analyzableDays) {
  return { status: 'stale', analyzableDays: typeof analyzableDays === 'number' ? analyzableDays : 7 };
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

const NAMES = ['Cereales sucrees industrielles'];

check('1. Ratio exactement égal à 0.60 : 6 occurrences sur 10 réparties sur >= 2 jours => dominant', () => {
  const sandbox = buildSandbox();
  const journal = [];
  ['2026-08-12', '2026-08-13', '2026-08-14'].forEach((d) => { journal.push(entry(d, 'breakfast', NAMES[0])); journal.push(entry(d, 'breakfast', NAMES[0] + '_dup_' + d)); });
  // 6 occurrences breakfast (comptées via NAMES[0] uniquement) + 4 autres repas
  const journalBreakfast = [];
  ['2026-08-12', '2026-08-13', '2026-08-14'].forEach((d) => journalBreakfast.push(entry(d, 'breakfast', NAMES[0])));
  journalBreakfast.push(entry('2026-08-15', 'breakfast', NAMES[0]));
  journalBreakfast.push(entry('2026-08-16', 'breakfast', NAMES[0]));
  journalBreakfast.push(entry('2026-08-17', 'breakfast', NAMES[0]));
  ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15'].forEach((d) => journalBreakfast.push(entry(d, 'dinner', NAMES[0])));
  assert.strictEqual(journalBreakfast.filter((e) => e.repas === 'breakfast').length, 6);
  assert.strictEqual(journalBreakfast.length, 10);
  const result = dominance(sandbox, NAMES, journalBreakfast, freshOk(7));
  assert.strictEqual(result.totalOccurrences, 10);
  assert.strictEqual(result.dominantRatio, 0.6);
  assert.strictEqual(result.status, 'dominant');
  assert.strictEqual(result.dominantMealType, 'breakfast');
});

check('2. Ratio inférieur à 0.60 : 11 occurrences sur 19 => multiple_meals', () => {
  const sandbox = buildSandbox();
  const journal = [];
  for (let i = 0; i < 11; i++) journal.push(entry('2026-08-1' + (i % 8), 'breakfast', NAMES[0]));
  for (let i = 0; i < 8; i++) journal.push(entry('2026-08-1' + (i % 8), 'dinner', NAMES[0]));
  assert.strictEqual(journal.length, 19);
  const result = dominance(sandbox, NAMES, journal, freshOk(7));
  assert.strictEqual(result.totalOccurrences, 19);
  assert(result.dominantRatio < 0.60);
  assert.strictEqual(result.status, 'multiple_meals');
  assert.strictEqual(result.dominantMealType, null);
});

check('3. Repas dominant avec trop peu d\'occurrences : ratio élevé mais count < 3 => insufficient_data', () => {
  const sandbox = buildSandbox();
  const journal = [entry('2026-08-12', 'breakfast', NAMES[0]), entry('2026-08-13', 'breakfast', NAMES[0])];
  const result = dominance(sandbox, NAMES, journal, freshOk(7));
  assert.strictEqual(result.totalOccurrences, 2);
  assert.strictEqual(result.status, 'insufficient_data');
  assert.strictEqual(result.dominantMealType, null);
});

check('4. Repas dominant sur un seul jour : ratio et count suffisants mais distinctDays < 2 => jamais "dominant"', () => {
  const sandbox = buildSandbox();
  const journal = [entry('2026-08-12', 'breakfast', NAMES[0]), entry('2026-08-12', 'breakfast', NAMES[0]), entry('2026-08-12', 'breakfast', NAMES[0])];
  const result = dominance(sandbox, NAMES, journal, freshOk(7));
  assert.strictEqual(result.totalOccurrences, 3);
  assert.strictEqual(result.distinctDays, 1);
  assert.notStrictEqual(result.status, 'dominant');
  assert.strictEqual(result.dominantMealType, null);
});

check('5. Deux repas proches (5/9 et 4/9) : aucun n\'atteint 0.60 => multiple_meals, jamais un choix arbitraire', () => {
  const sandbox = buildSandbox();
  const journal = [];
  ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16'].forEach((d) => journal.push(entry(d, 'breakfast', NAMES[0])));
  ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15'].forEach((d) => journal.push(entry(d, 'dinner', NAMES[0])));
  const result = dominance(sandbox, NAMES, journal, freshOk(7));
  assert.strictEqual(result.totalOccurrences, 9);
  assert.strictEqual(result.status, 'multiple_meals');
  assert.strictEqual(result.dominantMealType, null);
});

check('6. Plusieurs repas répartis sans dominant (3 repas à ~1/3 chacun) => multiple_meals', () => {
  const sandbox = buildSandbox();
  const journal = [];
  ['2026-08-12', '2026-08-13', '2026-08-14'].forEach((d) => journal.push(entry(d, 'breakfast', NAMES[0])));
  ['2026-08-12', '2026-08-13', '2026-08-14'].forEach((d) => journal.push(entry(d, 'lunch', NAMES[0])));
  ['2026-08-12', '2026-08-13', '2026-08-14'].forEach((d) => journal.push(entry(d, 'dinner', NAMES[0])));
  const result = dominance(sandbox, NAMES, journal, freshOk(7));
  assert.strictEqual(result.totalOccurrences, 9);
  assert.strictEqual(result.status, 'multiple_meals');
  assert.strictEqual(result.mealBreakdown.length, 3);
});

check('7. Couverture insuffisante : peu de jours renseignés au total => insufficient_data même avec un ratio par ailleurs dominant', () => {
  const sandbox = buildSandbox();
  const journal = [entry('2026-08-17', 'breakfast', NAMES[0]), entry('2026-08-18', 'breakfast', NAMES[0]), entry('2026-08-18', 'breakfast', NAMES[0])];
  const result = dominance(sandbox, NAMES, journal, freshOk(1));
  assert.strictEqual(result.status, 'insufficient_data');
  assert.strictEqual(result.dominantMealType, null);
});

check('8. Valeurs nulles : flaggedFoodNames/journalEntries/freshness tous null => aucune exception, insufficient_data, tableaux vides', () => {
  const sandbox = buildSandbox();
  const result = dominance(sandbox, null, null, null);
  assert.strictEqual(result.status, 'insufficient_data');
  assert.strictEqual(result.totalOccurrences, 0);
  assert.deepStrictEqual(Array.from(result.mealBreakdown), []);
  assert.strictEqual(result.dominantMealType, null);
  assert.strictEqual(result.dominantRatio, null);
});

check('9. Occurrences nulles : journal vide (tableau) => insufficient_data, distinctDays à 0', () => {
  const sandbox = buildSandbox();
  const result = dominance(sandbox, NAMES, [], freshOk(7));
  assert.strictEqual(result.status, 'insufficient_data');
  assert.strictEqual(result.totalOccurrences, 0);
  assert.strictEqual(result.distinctDays, 0);
});

check('10. Période ancienne : fraîcheur "stale" => insufficient_data même avec un mealType par ailleurs largement dominant', () => {
  const sandbox = buildSandbox();
  const journal = [];
  ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'].forEach((d) => journal.push(entry(d, 'breakfast', NAMES[0])));
  const result = dominance(sandbox, NAMES, journal, freshStale(7));
  assert.strictEqual(result.totalOccurrences, 5);
  assert.strictEqual(result.dominantRatio, 1);
  assert.strictEqual(result.status, 'insufficient_data');
  assert.strictEqual(result.dominantMealType, null);
});

check('11. Champs exposés : status, dominantMealType, dominantRatio, totalOccurrences, mealBreakdown, distinctDays, threshold, minimumOccurrences, minimumDistinctDays', () => {
  const sandbox = buildSandbox();
  const journal = ['2026-08-12', '2026-08-13', '2026-08-14'].map((d) => entry(d, 'breakfast', NAMES[0]));
  const result = dominance(sandbox, NAMES, journal, freshOk(7));
  ['status', 'dominantMealType', 'dominantRatio', 'totalOccurrences', 'mealBreakdown', 'distinctDays', 'threshold', 'minimumOccurrences', 'minimumDistinctDays'].forEach((k) => {
    assert(Object.prototype.hasOwnProperty.call(result, k), 'champ manquant : ' + k);
  });
  assert.strictEqual(result.threshold, 0.60);
  assert.strictEqual(result.minimumOccurrences, 3);
  assert.strictEqual(result.minimumDistinctDays, 2);
});

check('12. 12/19 dominant : cas explicitement validé', () => {
  const sandbox = buildSandbox();
  const journal = [];
  for (let i = 0; i < 12; i++) journal.push(entry('2026-08-1' + (i % 8), 'breakfast', NAMES[0]));
  for (let i = 0; i < 7; i++) journal.push(entry('2026-08-1' + (i % 8), 'dinner', NAMES[0]));
  assert.strictEqual(journal.length, 19);
  const result = dominance(sandbox, NAMES, journal, freshOk(8));
  assert.strictEqual(result.totalOccurrences, 19);
  assert.strictEqual(result.status, 'dominant');
  assert.strictEqual(result.dominantMealType, 'breakfast');
});

check('13. Absence de réseau, IA, DOM dans computeMealDominance', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const start = htmlSrc.indexOf('function computeMealDominance');
  const fnBody = htmlSrc.slice(start, start + 3000);
  assert(!/fetch\(|XMLHttpRequest|document\.|window\.|openai|gemini|anthropic/i.test(fnBody));
});

check('14. Régression : le moteur confiné nutrition-*.js et les fichiers patient restent inchangés', () => {
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
