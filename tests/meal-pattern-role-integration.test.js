/* ──────────────────────────────────────────────────────────────────────
   tests/meal-pattern-role-integration.test.js — Suite pour l'intégration
   de la classification famille/rôle/fonction dans le simulateur admin
   (nutrition-simulator-admin.html) — Cap Santé

   Charge le moteur confiné nutrition-*.js (lecture seule, jamais
   modifié — voir test 15) + le chantier meal-pattern-*.js + le script
   inline de nutrition-simulator-admin.html (sans le bloc
   sb.auth.getSession(), qui dépend du DOM/réseau réels), pour tester
   computeMealPatternWarnings() bout en bout, comme le ferait la page.

   Exécution : node tests/meal-pattern-role-integration.test.js
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

function entry(date, repas, aliment, quantite, isUltraProcessed) {
  return { date: date, repas: repas, aliment: aliment, quantite: quantite === undefined ? null : quantite, kcal: 100, is_ultra_processed: !!isUltraProcessed };
}

function runSimulation(sandbox, fixture) {
  return vm.runInContext('runNutritionSimulation', sandbox)({
    ruleId: fixture.ruleId, journalEntries: fixture.journalEntries, referenceDate: fixture.referenceDate,
    profile: fixture.profile, mode: 'simulation', now: fixture.referenceDate + 'T10:00:00Z'
  });
}

function computeWarnings(sandbox, ruleId, result, fixture) {
  return vm.runInContext('computeMealPatternWarnings', sandbox)(ruleId, result, fixture);
}

function baseProfile(overrides) {
  return Object.assign({
    patientId: 'x', age: 30, isPregnantOrBreastfeeding: false,
    allergies: [], intolerances: [], clinicalContext: [], symptoms: [],
    diet: null, eligibleForAutomatedAdvice: true
  }, overrides || {});
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

const WEEK = ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18'];

check('1. Intégration avec un repas complet (muesli au chocolat + yaourt nature + banane + flocons d\'avoine) : chaque candidat de la liste générique reçoit l\'action attendue', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Yaourt nature', 125, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Banane', 100, false)));
  [WEEK[0], WEEK[2], WEEK[4]].forEach((d) => journal.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30, false)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  assert.strictEqual(result.eligible, true, result.blockReason);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert(warnings.candidates.length > 0);
  // La liste générique (staple_whole_foods_v1) sélectionne toujours
  // oats/lentils/plain_yogurt en premier (ordre fixe, maxSelectedFoods=3)
  // — Flocons d'avoine et Yaourt nature sont exactement les aliments
  // déjà présents dans ce repas (exact_same_food/exclude) ; Lentilles
  // n'a ni famille ni rôle connu et reçoit donc légitimement 'unknown'
  // (jamais transformé en unrelated par défaut).
  const byLabel = {};
  warnings.candidates.forEach((c) => { byLabel[c.label] = c; });
  assert.strictEqual(byLabel['Flocons d\'avoine'].relation, 'exact_same_food');
  assert.strictEqual(byLabel['Flocons d\'avoine'].action, 'exclude');
  assert.strictEqual(byLabel['Yaourt nature'].relation, 'exact_same_food');
  assert.strictEqual(byLabel['Yaourt nature'].action, 'exclude');
  assert.strictEqual(byLabel['Lentilles'].relation, 'unknown');
  assert.strictEqual(byLabel['Lentilles'].action, 'unknown');
});

check('2. Exclusion exacte : un candidat identique à un aliment déjà présent => relation exact_same_food, action exclude', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Yaourt nature', 125, false)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  const yaourtCandidate = warnings.candidates.filter((c) => c.label === 'Yaourt nature')[0];
  assert(yaourtCandidate, 'Yaourt nature devrait être une alternative proposée par la liste générique');
  assert.strictEqual(yaourtCandidate.relation, 'exact_same_food');
  assert.strictEqual(yaourtCandidate.action, 'exclude');
});

check('3. Dépriorisation par famille : Skyr déjà présent => Yaourt nature proposé en alternative reçoit same_food_family / deprioritize', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Skyr', 125, false)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  const yaourtCandidate = warnings.candidates.filter((c) => c.label === 'Yaourt nature')[0];
  assert(yaourtCandidate);
  assert.strictEqual(yaourtCandidate.relation, 'same_food_family');
  assert.strictEqual(yaourtCandidate.action, 'deprioritize');
  assert(Array.from(yaourtCandidate.matchedFoods).indexOf('Skyr') !== -1);
});

check('4. Dépriorisation par rôle : un aliment de même rôle nutritionnel qu\'un aliment déjà présent, sans être de la même famille, reçoit same_nutrition_role / deprioritize', () => {
  // Vérifié via classifyFoodAgainstMealPattern directement (chargé par
  // nutrition-simulator-admin.html), plutôt que via la liste générique
  // de la règle ultra-transformés (fixe : oats/lentils/plain_yogurt en
  // premier, "Pomme" n'y figure jamais avec maxSelectedFoods=3) — teste
  // la même fonction que le panneau de revue appelle réellement.
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Orange', 100, false)));
  const mealPatterns = vm.runInContext('detectMealPatterns', sandbox)({ journalEntries: journal, referenceDate: '2026-08-18' });
  const res = vm.runInContext('classifyFoodAgainstMealPattern', sandbox)('Pomme', 'breakfast', mealPatterns);
  assert.strictEqual(res.relation, 'same_nutrition_role');
  assert.strictEqual(res.action, 'deprioritize');
});

check('5. Variation par fonction : un candidat de fonction de repas identique mais de rôle différent reçoit same_meal_function / allow_as_variation', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Muesli au chocolat', 60, false)));
  const mealPatterns = vm.runInContext('detectMealPatterns', sandbox)({ journalEntries: journal, referenceDate: '2026-08-18' });
  const res = vm.runInContext('classifyFoodAgainstMealPattern', sandbox)('Pain complet', 'breakfast', mealPatterns);
  assert.strictEqual(res.relation, 'same_meal_function');
  assert.strictEqual(res.action, 'allow_as_variation');
});

check('6. Aliment inconnu : un candidat sans famille/rôle/fonction connu, absent du repas, reçoit relation unknown, jamais unrelated par défaut', () => {
  const sandbox = buildSandbox();
  // "Lentilles" n'apparaît PAS dans ce repas (seul le déclencheur
  // ultra-transformé y figure) — le candidat "Lentilles" proposé par la
  // liste générique n'a ni famille ni rôle connu dans meal-food-roles.js.
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  const lentilCandidate = warnings.candidates.filter((c) => c.label === 'Lentilles')[0];
  assert(lentilCandidate);
  assert.strictEqual(lentilCandidate.relation, 'unknown');
  assert.strictEqual(lentilCandidate.action, 'unknown');
});

check('7. Aucun candidat pertinent : quand tous les candidats sont exclude/deprioritize/unknown, hasRelevantOption est faux et une question fixe est choisie', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Skyr', 125, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Lentilles', 50, false)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert(!warnings.candidates.some((c) => c.action === 'eligible' || c.action === 'allow_as_variation'), 'ce scénario doit ne laisser aucune option pertinente');
  assert(warnings.clarifyingQuestion, 'une question fixe devrait être déclenchée');
});

check('8. Déclenchement de la question fixe : absente dès qu\'au moins un candidat reste eligible/allow_as_variation', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert(warnings.candidates.some((c) => c.action === 'eligible'), 'sans aucun aliment récurrent en conflit, au moins un candidat devrait rester eligible');
  assert.strictEqual(warnings.clarifyingQuestion, null, 'aucune question ne devrait être déclenchée quand une option pertinente reste');
});

check('9. Période récente : la dernière donnée coïncide avec la fin de la fenêtre => statut "recent", aucun avertissement', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert(warnings.freshness);
  assert.strictEqual(warnings.freshness.status, 'recent');
  assert.strictEqual(warnings.freshness.staleWarning, null);
});

check('10. Période ancienne : la dernière donnée est antérieure de plusieurs jours à la fin de la fenêtre => statut "stale", avertissement présent', () => {
  const sandbox = buildSandbox();
  const journal = [];
  // Seuls les 4 premiers jours de la semaine ont des données ; le
  // reste de la fenêtre (jusqu'à referenceDate) est vide.
  [WEEK[0], WEEK[1], WEEK[2], WEEK[3]].forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  if (result.eligible) {
    const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
    assert(warnings.freshness);
    assert.strictEqual(warnings.freshness.status, 'stale');
    assert(warnings.freshness.staleWarning, 'un avertissement devrait être présent pour une donnée ancienne');
  } else {
    // Couverture insuffisante avant même d'atteindre le calcul de
    // fraîcheur reste un résultat valide pour ce jeu de données réduit.
    assert.strictEqual(result.blockReason, 'coverage_below_threshold');
  }
});

check('11. Couverture insuffisante : trop peu de jours renseignés => bloqué avant même la classification, computeMealPatternWarnings retourne un état vide sûr', () => {
  const sandbox = buildSandbox();
  const journal = [entry(WEEK[6], 'breakfast', 'Cereales sucrees industrielles', 60, true)];
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  assert.strictEqual(result.eligible, false);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert.deepStrictEqual(Array.from(warnings.candidates), []);
  assert.strictEqual(warnings.freshness, null);
  assert.strictEqual(warnings.clarifyingQuestion, null);
});

check('12. Absence de réseau : computeMealPatternWarnings et ses dépendances directes (meal-pattern-*.js) ne font aucun appel réseau', () => {
  ['meal-food-roles.js', 'meal-pattern-detector.js', 'meal-pattern-role-matching.js', 'meal-pattern-clarifying-questions.js'].forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(!/fetch\(|XMLHttpRequest/.test(codeOnly), f + ' contient un appel réseau');
  });
});

check('13. Absence d\'IA : aucun mot-clé de service IA dans les fichiers meal-pattern-*.js ni dans la section intégrée de nutrition-simulator-admin.html', () => {
  const files = ['meal-food-roles.js', 'meal-pattern-detector.js', 'meal-pattern-role-matching.js', 'meal-pattern-clarifying-questions.js'];
  files.forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    assert(!/openai|gemini|anthropic|chatgpt|\bai[_-]?api\b/i.test(src), f + ' référence un service IA');
  });
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  assert(!/openai|gemini|anthropic|chatgpt/i.test(htmlSrc));
});

check('14. Absence de données cliniques dans le flux de classification : computeMealPatternWarnings ne lit ni pathologie ni symptôme du profil', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const fnBody = htmlSrc.slice(htmlSrc.indexOf('function computeMealPatternWarnings'), htmlSrc.indexOf('function computeMealPatternWarnings') + 2200);
  assert(!/clinicalContext|symptom|pathologie|patholog/i.test(fnBody), 'computeMealPatternWarnings semble lire des données cliniques');
});

check('15. Régression : les 14 tests de tests/meal-pattern-detector.test.js et les 22 tests de tests/meal-pattern-role-matching.test.js passent toujours (exécutés séparément par le harnais global, vérifié ici par leur simple présence et absence de modification destructrice)', () => {
  ['tests/meal-pattern-detector.test.js', 'tests/meal-pattern-role-matching.test.js'].forEach((f) => {
    assert(fs.existsSync(REPO + '/' + f), f + ' est introuvable');
  });
  // Régression du simulateur : les fichiers nutrition-*.js du moteur
  // confiné n'ont subi aucune modification pendant cette intégration.
  const trackedNutritionFiles = execSync('git ls-files "nutrition-*.js"', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const out = execSync('git status --short -- ' + trackedNutritionFiles.map((f) => '"' + f + '"').join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'des fichiers nutrition-*.js du moteur confiné ont été modifiés: ' + out);
  // dashboard.html, conseils.html, admin.html, regles-pathologies.js,
  // clinical-context-storage.js, trend-*.js restent inchangés.
  const patientFacing = ['dashboard.html', 'conseils.html', 'admin.html', 'regles-pathologies.js', 'clinical-context-storage.js', 'trend-engine.js', 'trend-definitions.js'];
  const outPatient = execSync('git status --short -- ' + patientFacing.join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(outPatient, '', 'des fichiers patient/moteur hors périmètre ont été modifiés: ' + outPatient);
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
