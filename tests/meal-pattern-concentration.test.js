/* ──────────────────────────────────────────────────────────────────────
   tests/meal-pattern-concentration.test.js — Suite pour
   computeCategoryConcentration() et computeOverallVolumeSignal()
   (nutrition-simulator-admin.html) — Cap Santé

   Règles validées le 2026-08-21 :

   - computeCategoryConcentration : une catégorie n'autorise une
     suggestion (recurrent_pattern) que si elle apparaît au moins 3 fois
     sur au moins 3 jours distincts, avec une couverture globale
     suffisante (fraîcheur non "stale", au moins 3 jours renseignés au
     total). Sinon 'concentrated_event' (jamais qualifié de "repas
     social", jamais de substitution) ou 'insufficient_data'.

   - computeOverallVolumeSignal : signale un volume global élevé
     (>= 7 occurrences ET >= 7 jours distincts), même si les aliments
     sont tous différents — coexiste toujours avec la synthèse par
     catégorie, ne la remplace jamais.

   Teste les deux fonctions en isolation (pures), mêmes conventions que
   tests/meal-pattern-dominance.test.js.

   Exécution : node tests/meal-pattern-concentration.test.js
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

function entry(date, repas, aliment) {
  return { date: date, repas: repas, aliment: aliment };
}

function freshOk(analyzableDays) {
  return { status: 'recent', analyzableDays: typeof analyzableDays === 'number' ? analyzableDays : 7 };
}

function freshStale(analyzableDays) {
  return { status: 'stale', analyzableDays: typeof analyzableDays === 'number' ? analyzableDays : 7 };
}

function grouping(sandbox, flaggedFoodNames, journalEntries) {
  return vm.runInContext('groupFlaggedFoodsByCategory', sandbox)(flaggedFoodNames, journalEntries);
}

function concentration(sandbox, categoryBreakdown, journalEntries, freshness) {
  return vm.runInContext('computeCategoryConcentration', sandbox)(categoryBreakdown, journalEntries, freshness);
}

function volumeSignal(sandbox, flaggedFoodNames, journalEntries, freshness) {
  return vm.runInContext('computeOverallVolumeSignal', sandbox)(flaggedFoodNames, journalEntries, freshness);
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

// ── computeCategoryConcentration ───────────────────────────────────────

check('1. Burger/frites/soda regroupés sur une seule soirée => concentrated_event, aucune option', () => {
  const sandbox = buildSandbox();
  const names = ['Pain burger brioché', 'Frites cuites au four', 'Boisson gazeuse orange (Fanta)'];
  const journal = [
    entry('2026-08-18', 'dinner', names[0]),
    entry('2026-08-18', 'dinner', names[1]),
    entry('2026-08-18', 'dinner', names[2])
  ];
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshOk(7));
  result.forEach((c) => {
    assert.strictEqual(c.status, 'concentrated_event', c.categoryCode + ' devrait être concentré (1 seul jour)');
    assert.strictEqual(c.suggestionsAllowed, false);
    assert.strictEqual(c.reason, 'insufficient_recurrence');
  });
});

check('2. Catégorie présente 2 fois sur 2 jours => concentrated_event (sous le seuil des 3 jours)', () => {
  const sandbox = buildSandbox();
  const names = ['Frites cuites au four'];
  const journal = [entry('2026-08-17', 'dinner', names[0]), entry('2026-08-18', 'dinner', names[0])];
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshOk(7));
  assert.strictEqual(result[0].status, 'concentrated_event');
  assert.strictEqual(result[0].distinctDays, 2);
});

check('3. Catégorie présente 3 fois sur 3 jours => recurrent_pattern', () => {
  const sandbox = buildSandbox();
  const names = ['Frites cuites au four'];
  const journal = ['2026-08-16', '2026-08-17', '2026-08-18'].map((d) => entry(d, 'dinner', names[0]));
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshOk(7));
  assert.strictEqual(result[0].status, 'recurrent_pattern');
  assert.strictEqual(result[0].suggestionsAllowed, true);
  assert(result[0].sensoryProfile, 'un profil sensoriel devrait être exposé pour repas_rapides (recurrent)');
});

check('4. Catégorie présente 4 fois sur 4 jours => recurrent_pattern', () => {
  const sandbox = buildSandbox();
  const names = ['Frites cuites au four'];
  const journal = ['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18'].map((d) => entry(d, 'dinner', names[0]));
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshOk(7));
  assert.strictEqual(result[0].status, 'recurrent_pattern');
  assert.strictEqual(result[0].occurrenceCount, 4);
  assert.strictEqual(result[0].distinctDays, 4);
});

check('5. Occurrences sur plusieurs repas (même catégorie) => comptées ensemble pour distinctDays/mealTypes', () => {
  const sandbox = buildSandbox();
  const names = ['Frites cuites au four'];
  const journal = [
    entry('2026-08-16', 'lunch', names[0]),
    entry('2026-08-17', 'dinner', names[0]),
    entry('2026-08-18', 'dinner', names[0])
  ];
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshOk(7));
  assert.strictEqual(result[0].status, 'recurrent_pattern');
  assert.strictEqual(result[0].distinctDays, 3);
  assert.deepStrictEqual(Array.from(result[0].mealTypes).sort(), ['dinner', 'lunch']);
});

check('6. Couverture insuffisante : peu de jours renseignés au total => insufficient_data avant toute évaluation de concentration', () => {
  const sandbox = buildSandbox();
  const names = ['Frites cuites au four'];
  const journal = ['2026-08-16', '2026-08-17', '2026-08-18'].map((d) => entry(d, 'dinner', names[0]));
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshOk(2));
  assert.strictEqual(result[0].status, 'insufficient_data');
  assert.strictEqual(result[0].reason, 'coverage_below_threshold');
  assert.strictEqual(result[0].suggestionsAllowed, false);
});

check('7. Données anciennes (fraîcheur stale) => insufficient_data même avec 4 jours distincts', () => {
  const sandbox = buildSandbox();
  const names = ['Frites cuites au four'];
  const journal = ['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18'].map((d) => entry(d, 'dinner', names[0]));
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshStale(7));
  assert.strictEqual(result[0].status, 'insufficient_data');
});

check('8. Catégories différentes dans le même repas => chacune évaluée indépendamment, jamais fusionnées', () => {
  const sandbox = buildSandbox();
  const names = ['Frites cuites au four', 'Boisson gazeuse orange (Fanta)'];
  const journal = ['2026-08-16', '2026-08-17', '2026-08-18'].map((d) => entry(d, 'dinner', names[0]))
    .concat([entry('2026-08-18', 'dinner', names[1])]);
  const breakdown = grouping(sandbox, names, journal);
  const result = concentration(sandbox, breakdown, journal, freshOk(7));
  const byCode = {};
  result.forEach((c) => { byCode[c.categoryCode] = c; });
  assert.strictEqual(byCode.repas_rapides.status, 'recurrent_pattern');
  assert.strictEqual(byCode.boissons.status, 'concentrated_event');
});

check('9. Alternative déjà présente dans le repas => exclue par filterCoherentAlternatives', () => {
  const sandbox = buildSandbox();
  const mealPatterns = vm.runInContext('detectMealPatterns', sandbox)({
    journalEntries: ['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18'].map((d) => entry(d, 'dinner', 'Burger maison')),
    referenceDate: '2026-08-18'
  });
  const alts = vm.runInContext('filterCoherentAlternatives', sandbox)('repas_rapides', 'dinner', mealPatterns);
  assert.strictEqual(alts.indexOf('Burger maison'), -1, 'Burger maison est déjà présent, ne devrait jamais être reproposé');
});

check('10. Alternative incohérente jamais proposée : coherentAlternatives ne contient aucune exclusion déclarée', () => {
  const sandbox = buildSandbox();
  const alts = vm.runInContext('filterCoherentAlternatives', sandbox)('repas_rapides', 'dinner', []);
  assert(alts.indexOf('Yaourt nature') === -1);
  assert(alts.indexOf('Salade seule') === -1);
  assert(alts.indexOf('Wrap froid au thon') === -1);
});

check('11. Alternative de même texture/fonction retenue quand rien ne l\'exclut', () => {
  const sandbox = buildSandbox();
  const alts = vm.runInContext('filterCoherentAlternatives', sandbox)('repas_rapides', 'dinner', []);
  assert(alts.indexOf('Pommes de terre au four aux herbes') !== -1);
});

// ── computeOverallVolumeSignal ─────────────────────────────────────────

check('12. 7 occurrences sur 7 jours (aliments tous différents) => volume élevé déclenché', () => {
  const sandbox = buildSandbox();
  const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const journal = names.map((n, i) => entry('2026-08-1' + (2 + i), 'dinner', n));
  const result = volumeSignal(sandbox, names, journal, freshOk(7));
  assert.strictEqual(result.triggered, true);
  assert.strictEqual(result.totalOccurrences, 7);
  assert.strictEqual(result.distinctDays, 7);
  assert.strictEqual(result.offerProfessionalDiscussion, true);
  assert.strictEqual(result.suggestionsAllowed, false);
});

check('13. 6 occurrences sur 7 jours => sous le seuil, non déclenché', () => {
  const sandbox = buildSandbox();
  const names = ['A', 'B', 'C', 'D', 'E', 'F'];
  const journal = names.map((n, i) => entry('2026-08-1' + (2 + i), 'dinner', n));
  const result = volumeSignal(sandbox, names, journal, freshOk(7));
  assert.strictEqual(result.triggered, false);
});

check('14. 7 occurrences concentrées sur 2 jours seulement => non déclenché (exige aussi >= 7 jours distincts)', () => {
  const sandbox = buildSandbox();
  const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const journal = names.map((n) => entry('2026-08-17', 'dinner', n)).slice(0, 4)
    .concat(names.slice(4).map((n) => entry('2026-08-18', 'dinner', n)));
  const result = volumeSignal(sandbox, names, journal, freshOk(7));
  assert.strictEqual(result.totalOccurrences, 7);
  assert(result.distinctDays < 7);
  assert.strictEqual(result.triggered, false);
});

check('15. Valeurs nulles : flaggedFoodNames/journalEntries/freshness tous null => aucune exception, non déclenché', () => {
  const sandbox = buildSandbox();
  const result = volumeSignal(sandbox, null, null, null);
  assert.strictEqual(result.triggered, false);
  assert.strictEqual(result.totalOccurrences, 0);
  assert.strictEqual(result.distinctDays, 0);
});

check('16. Champs exposés : triggered, totalOccurrences, distinctDays, threshold, flaggedFoodNames, suggestionsAllowed, offerProfessionalDiscussion', () => {
  const sandbox = buildSandbox();
  const result = volumeSignal(sandbox, ['A'], [entry('2026-08-18', 'dinner', 'A')], freshOk(7));
  ['triggered', 'totalOccurrences', 'distinctDays', 'threshold', 'flaggedFoodNames', 'suggestionsAllowed', 'offerProfessionalDiscussion'].forEach((k) => {
    assert(Object.prototype.hasOwnProperty.call(result, k), 'champ manquant : ' + k);
  });
  assert.strictEqual(result.threshold, 7);
});

check('17. Absence de vocabulaire culpabilisant/diagnostic : ni "problème" ni "diagnostic" ni "carence" dans les fonctions', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  ['function computeCategoryConcentration', 'function computeOverallVolumeSignal', 'function renderVolumeAlertHtml'].forEach((marker) => {
    const start = htmlSrc.indexOf(marker);
    assert(start !== -1, marker + ' introuvable');
    const fnBody = htmlSrc.slice(start, start + 3500);
    assert(!/probl[eè]me|diagnostic|carence|repas social|culpabilis/i.test(fnBody), marker + ' contient un vocabulaire évaluatif/diagnostique');
  });
});

check('18. Absence d\'IA / réseau / données cliniques dans les nouvelles fonctions', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  ['function computeCategoryConcentration', 'function filterCoherentAlternatives', 'function computeOverallVolumeSignal'].forEach((marker) => {
    const start = htmlSrc.indexOf(marker);
    const fnBody = htmlSrc.slice(start, start + 3500);
    assert(!/fetch\(|XMLHttpRequest|openai|gemini|anthropic|clinicalContext|symptom|patholog/i.test(fnBody), marker + ' viole une contrainte (réseau/IA/clinique)');
  });
});

check('19. Régression : le moteur confiné nutrition-*.js et les fichiers patient restent inchangés', () => {
  const trackedNutritionFiles = execSync('git ls-files "nutrition-*.js"', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const out = execSync('git status --short -- ' + trackedNutritionFiles.map((f) => '"' + f + '"').join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'des fichiers nutrition-*.js du moteur confiné ont été modifiés: ' + out);
  const patientFacing = ['dashboard.html', 'conseils.html', 'admin.html', 'regles-pathologies.js', 'clinical-context-storage.js', 'trend-engine.js', 'trend-definitions.js'];
  const outPatient = execSync('git status --short -- ' + patientFacing.join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(outPatient, '', 'des fichiers patient/moteur hors périmètre ont été modifiés: ' + outPatient);
});

check('20. meal-pattern-clarifying-questions.js reste inchangé (jamais modifié ni contourné)', () => {
  const out = execSync('git status --short -- meal-pattern-clarifying-questions.js', { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'meal-pattern-clarifying-questions.js a été modifié: ' + out);
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
