/* ──────────────────────────────────────────────────────────────────────
   tests/nutrition-ultra-processed-substitution.test.js — Suite pour la
   correspondance aliment ultra-transformé repéré → alternative ciblée
   (nutrition-ultra-processed-substitutions.js) — Cap Santé

   Exécution : node tests/nutrition-ultra-processed-substitution.test.js
   ────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const FILES = [
  'trend-definitions.js', 'trend-engine.js',
  'nutrition-food-definitions.js', 'nutrition-template-definitions.js',
  'nutrition-rule-definitions.js', 'nutrition-signal-engine.js', 'nutrition-safety.js',
  'nutrition-rule-engine.js', 'nutrition-ultra-processed-substitutions.js', 'nutrition-food-selector.js',
  'nutrition-advice-renderer.js', 'nutrition-audit.js', 'nutrition-simulator.js'
];

function buildSandbox() {
  const sandbox = { console };
  vm.createContext(sandbox);
  FILES.forEach((f) => vm.runInContext(fs.readFileSync(REPO + '/' + f, 'utf8'), sandbox, { filename: f }));
  return sandbox;
}

function entry(date, repas, aliment, isUltraProcessed) {
  return { date: date, repas: repas, aliment: aliment, quantite: 100, kcal: 150, is_ultra_processed: isUltraProcessed };
}

function baseProfile(overrides) {
  return Object.assign({
    patientId: 'patient-1',
    age: 30,
    isPregnantOrBreastfeeding: false,
    allergies: [],
    intolerances: [],
    clinicalContext: [],
    symptoms: [],
    diet: null,
    eligibleForAutomatedAdvice: true
  }, overrides || {});
}

const WEEK = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12'];

function run(sandbox, profile, journal) {
  const code = 'runNutritionSimulation({ ruleId: "reduce_ultra_processed_foods_v1", journalEntries: '
    + JSON.stringify(journal) + ', referenceDate: "2026-08-12", profile: '
    + JSON.stringify(profile) + ', mode: "simulation", now: "2026-08-12T10:00:00Z" })';
  return vm.runInContext(code, sandbox);
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

check('1. Les aliments repérés dans le journal sont cités nommément dans le texte généré', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'dinner', 'Frites', true));
  const res = run(sandbox, baseProfile(), journal);
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(res.advice.body.indexOf('Frites') !== -1, 'le nom de l\'aliment repéré n\'apparaît pas dans le conseil');
});

check('2. Correspondance par mot-clé : "Frites" déclenche des alternatives ciblées (pommes de terre/patates douces au four), pas la liste générique', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'dinner', 'Frites', true));
  const res = run(sandbox, baseProfile(), journal);
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(res.audit.matchedByKeyword === true, 'la correspondance par mot-clé n\'a pas été utilisée');
  assert(/four/i.test(res.advice.body), 'aucune alternative "au four" proposée pour des frites');
  assert(!/flocons d.avoine/i.test(res.advice.body), 'la liste générique (avoine) apparaît alors qu\'une correspondance ciblée existe');
});

check('3. "Mousse au chocolat" ne matche jamais la catégorie boisson sucrée ("cola" ne doit pas matcher à l\'intérieur de "chocolat")', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'breakfast', 'Mousse au chocolat', true));
  const res = run(sandbox, baseProfile(), journal);
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/eau plate/i.test(res.advice.body), 'une alternative "boisson" a été proposée pour un dessert sucré (faux positif cola/chocolat)');
  assert(/fruit frais|chocolat noir/i.test(res.advice.body), 'aucune alternative dessert sucré proposée');
});

check('4. Aucune correspondance par mot-clé (aliment non catégorisé) : repli sur la liste générique, jamais un blocage', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'lunch', 'Plat industriel non catégorisé xyz', true));
  const res = run(sandbox, baseProfile(), journal);
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert.strictEqual(res.audit.matchedByKeyword, false, 'ne devrait pas prétendre à une correspondance par mot-clé');
  assert(res.advice.body.indexOf('Plat industriel non catégorisé xyz') !== -1, 'le nom réel devrait quand même être cité');
});

check('5. Les alternatives ciblées respectent toujours les allergies confirmées (noix exclues)', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'lunch', 'Chips', true));
  const res = run(sandbox, baseProfile({ allergies: [{ code: 'nuts', status: 'confirmed' }] }), journal);
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/amandes|noix/i.test(res.advice.body), 'une alternative à base de noix apparaît malgré l\'allergie confirmée');
});

check('6. extractFlaggedFoodNames() ne relève que les aliments du flag/de la fenêtre demandés, dédoublonnés, sans invention', () => {
  const sandbox = buildSandbox();
  const journal = [
    entry('2026-08-06', 'dinner', 'Frites', true),
    entry('2026-08-06', 'lunch', 'Salade', false),
    entry('2026-08-07', 'dinner', 'Frites', true),
    entry('2026-01-01', 'dinner', 'Ancien plat hors fenêtre', true)
  ];
  const names = vm.runInContext('extractFlaggedFoodNames({ journalEntries: ' + JSON.stringify(journal)
    + ', referenceDate: "2026-08-12", flagField: "is_ultra_processed", observationWindowDays: 7 })', sandbox);
  assert.deepStrictEqual(Array.from(names), ['Frites']);
});

check('7. Aucun aliment repéré dans la fenêtre malgré un état "present" : bloque explicitement (flagged_foods_unavailable), jamais un texte inventé', () => {
  const sandbox = buildSandbox();
  // Journal recevable par trend-engine.js (présent, confiance suffisante)
  // mais sans champ `aliment` exploitable — cas dégénéré volontaire.
  const journal = WEEK.map((d) => ({ date: d, repas: 'lunch', quantite: 100, kcal: 150, is_ultra_processed: true }));
  const res = run(sandbox, baseProfile(), journal);
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'flagged_foods_unavailable');
});

check('8. matchUltraProcessedCategory() : mot-clé à un seul mot exige un token entier, jamais une sous-chaîne ("cola" dans "chocolat" ne matche pas)', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(vm.runInContext('matchUltraProcessedCategory("Mousse au chocolat")', sandbox), 'sugary_dessert');
  assert.strictEqual(vm.runInContext('matchUltraProcessedCategory("Soda")', sandbox), 'sugary_drink');
  assert.strictEqual(vm.runInContext('matchUltraProcessedCategory("Pomme")', sandbox), null);
});

check('9. Autres règles (non useKeywordSubstitution) : comportement inchangé, aucun placeholder flagged_foods requis', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => ({ date: d, repas: 'dinner', aliment: 'Verre de vin', quantite: 1, kcal: 120, is_alcohol: true }));
  const res = vm.runInContext('runNutritionSimulation({ ruleId: "reduce_alcohol_v1", journalEntries: '
    + JSON.stringify(journal) + ', referenceDate: "2026-08-12", profile: ' + JSON.stringify(baseProfile())
    + ', mode: "simulation", now: "2026-08-12T10:00:00Z" })', sandbox);
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert.strictEqual(res.audit.matchedByKeyword, false);
});

check('10. Aucun eval/new Function/accès réseau/DOM dans nutrition-ultra-processed-substitutions.js', () => {
  const src = fs.readFileSync(REPO + '/nutrition-ultra-processed-substitutions.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/\beval\s*\(/.test(codeOnly));
  assert(!/new\s+Function\s*\(/.test(codeOnly));
  assert(!/\bsb\.|supabase/i.test(codeOnly));
  assert(!/fetch\(|XMLHttpRequest/.test(codeOnly));
  assert(!/document\.|window\./.test(codeOnly));
});

check('11. trend-engine.js, trend-definitions.js, dashboard.html, conseils.html, admin.html restent inchangés', () => {
  ['trend-engine.js', 'trend-definitions.js', 'dashboard.html', 'conseils.html', 'admin.html'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

check('12. Aucune migration Supabase créée pour cette fonctionnalité', () => {
  const ALLOWED_NON_ENGINE_MIGRATIONS = ['20260818000000_add_profile_diet.sql', '20260818000001_add_bilan_kcal_approval.sql', '20260818000002_add_bilan_kcal_champ.sql', '20260818000003_add_bilan_parler_traite.sql', '20260814000000_clinical_context_reference.sql', 'clinical_context_rls_test.sql'];
  const out = execSync('git status --short -- supabase/', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const unexpected = out.filter((l) => !ALLOWED_NON_ENGINE_MIGRATIONS.some((f) => l.indexOf(f) !== -1));
  assert.deepStrictEqual(unexpected, []);
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
