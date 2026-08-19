/* ──────────────────────────────────────────────────────────────────────
   tests/nutrition-simulator.test.js — Suite reproductible pour le moteur
   de conseils nutritionnels CONFINÉ (mode simulation/shadow admin
   uniquement) — Cap Santé

   Exécution : node tests/nutrition-simulator.test.js (aucune dépendance
   externe, aucun framework — cohérent avec le reste du projet).
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

function entry(date, isUltraProcessed) {
  return { date: date, repas: 'lunch', aliment: 'x', quantite: 100, kcal: 100, is_ultra_processed: isUltraProcessed };
}

// Journal "standard" : présent, confiance high, couverture 100%.
function journalPresentHighConfidence() {
  return ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
    .map((d) => entry(d, true));
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

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

function run(sandbox, profile, journal, mode) {
  const code = 'runNutritionSimulation({ ruleId: "reduce_ultra_processed_foods_v1", journalEntries: '
    + JSON.stringify(journal) + ', referenceDate: "2026-08-12", profile: '
    + JSON.stringify(profile) + ', mode: ' + JSON.stringify(mode || 'simulation') + ', now: "2026-08-12T10:00:00Z" })';
  return vm.runInContext(code, sandbox);
}

check('1. Profil standard : conseil généré, visibilité admin uniquement', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile(), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, true, 'devrait être éligible: ' + res.blockReason);
  assert(res.advice && res.advice.body, 'aucun conseil généré');
  assert.strictEqual(res.advice.visibility, 'admin_simulator_only');
  assert.strictEqual(res.audit.visibility, 'admin_simulator_only');
});

check('2. Profil végétarien : sélection filtrée, conseil généré sans aliment non végétarien', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile({ diet: 'vegetarian' }), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/blanc de poulet/i.test(res.advice.body), 'un aliment non végétarien apparaît');
});

check('3. Allergie confirmée aux noix : aliment concerné exclu, conseil quand même possible avec le reste', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile({ allergies: [{ code: 'nuts', status: 'confirmed' }] }), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/amandes/i.test(res.advice.body), 'amandes (allergène) apparaît malgré l\'allergie confirmée');
});

check('4. Intolérance confirmée au gluten : aliments contenant gluten exclus', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile({ intolerances: [{ code: 'gluten', status: 'confirmed' }] }), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/avoine/i.test(res.advice.body), 'flocons d\'avoine (gluten) apparaît malgré l\'intolérance');
});

check('5. Contexte clinique confirmé sans conflit cartographié : n\'empêche pas la génération', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile({ clinicalContext: [{ code: 'diabetes_type2', status: 'confirmed' }] }), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, true, res.blockReason);
});

check('6. Contexte clinique NON VÉRIFIÉ mais cartographié en conflit : bloque quand même', () => {
  const sandbox = buildSandbox();
  vm.runInContext('NUTRITION_RULE_REGISTRY.reduce_ultra_processed_foods_v1.conflictingClinicalCodes = ["test_code"];', sandbox);
  const res = run(sandbox, baseProfile({ clinicalContext: [{ code: 'test_code', status: 'to_verify' }] }), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'clinical_conflict');
});

check('7. Journal insuffisant (aucune donnée) : bloque avec observation_insufficient', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile(), []);
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'observation_insufficient');
});

check('8. Confiance insuffisante (peu de jours évalués) : bloque avec confidence_below_threshold', () => {
  const sandbox = buildSandbox();
  const journal = [entry('2026-08-12', true)];
  const res = run(sandbox, baseProfile(), journal);
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'confidence_below_threshold');
});

check('9. Allergies cumulées épuisant tous les aliments : bloque avec no_compatible_food', () => {
  const sandbox = buildSandbox();
  vm.runInContext(
    'NUTRITION_FOOD_LISTS.staple_whole_foods_v1.items = NUTRITION_FOOD_LISTS.staple_whole_foods_v1.items.filter(function(i){ return i.allergenTags.length > 0; });',
    sandbox
  );
  const profile = baseProfile({
    allergies: [{ code: 'gluten', status: 'confirmed' }, { code: 'nuts', status: 'confirmed' }, { code: 'milk', status: 'confirmed' }, { code: 'egg', status: 'confirmed' }]
  });
  const res = run(sandbox, profile, journalPresentHighConfidence());
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'no_compatible_food');
});

check('10. Règle en statut draft : bloque avec rule_not_active, jamais générée', () => {
  const sandbox = buildSandbox();
  vm.runInContext('NUTRITION_RULE_REGISTRY.reduce_ultra_processed_foods_v1.status = "draft";', sandbox);
  const res = run(sandbox, baseProfile(), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'rule_not_active');
});
check('10b. Règle en statut "active" (production) : refusée explicitement, jamais exécutée', () => {
  const sandbox = buildSandbox();
  vm.runInContext('NUTRITION_RULE_REGISTRY.reduce_ultra_processed_foods_v1.status = "active";', sandbox);
  const res = run(sandbox, baseProfile(), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'production_status_not_supported_at_this_stage');
});

check('11. Conflit de règles : évaluer deux règles séparément ne produit jamais une fusion automatique', () => {
  const sandbox = buildSandbox();
  vm.runInContext(
    'NUTRITION_RULE_REGISTRY.second_rule_v1 = Object.assign({}, NUTRITION_RULE_REGISTRY.reduce_ultra_processed_foods_v1, { id: "second_rule_v1" });',
    sandbox
  );
  const res1 = run(sandbox, baseProfile(), journalPresentHighConfidence());
  const code2 = 'runNutritionSimulation({ ruleId: "second_rule_v1", journalEntries: '
    + JSON.stringify(journalPresentHighConfidence()) + ', referenceDate: "2026-08-12", profile: '
    + JSON.stringify(baseProfile()) + ', mode: "simulation", now: "2026-08-12T10:00:00Z" })';
  const res2 = vm.runInContext(code2, sandbox);
  assert.strictEqual(res1.eligible, true);
  assert.strictEqual(res2.eligible, true);
  assert.notStrictEqual(res1.advice, res2.advice, 'les deux résultats ne doivent jamais être fusionnés automatiquement en un seul objet');
});

check('12. Échec technique (liste d\'aliments manquante) : bloque proprement, aucune exception levée', () => {
  const sandbox = buildSandbox();
  vm.runInContext('NUTRITION_RULE_REGISTRY.reduce_ultra_processed_foods_v1.eligibleFoodListId = "does_not_exist";', sandbox);
  const res = run(sandbox, baseProfile(), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'food_list_missing');
});
check('12b. Échec technique (profil null) : ne lève jamais d\'exception', () => {
  const sandbox = buildSandbox();
  const code = 'runNutritionSimulation({ ruleId: "reduce_ultra_processed_foods_v1", journalEntries: '
    + JSON.stringify(journalPresentHighConfidence()) + ', referenceDate: "2026-08-12", profile: null, mode: "simulation" })';
  const res = vm.runInContext(code, sandbox);
  assert.strictEqual(res.eligible, false);
});

check('13. Mode invalide (ni simulation ni shadow) : bloque toujours', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile(), journalPresentHighConfidence(), 'production');
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'invalid_mode');
});
check('14. Profil non whitelisté (eligibleForAutomatedAdvice: false) : bloque', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile({ eligibleForAutomatedAdvice: false }), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, false);
  assert(res.blockReason.indexOf('profile_out_of_scope') === 0);
});
check('15. Grossesse/allaitement : bloque même si whitelisté par ailleurs', () => {
  const sandbox = buildSandbox();
  const res = run(sandbox, baseProfile({ isPregnantOrBreastfeeding: true }), journalPresentHighConfidence());
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'profile_out_of_scope:pregnancy_or_breastfeeding');
});
check('16. Aucun eval/new Function EXÉCUTABLE dans tout le moteur (aucune règle exécutée dynamiquement)', () => {
  FILES.filter((f) => f.startsWith('nutrition-')).forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(!/\beval\s*\(/.test(codeOnly), f + ' contient eval() exécutable');
    assert(!/new\s+Function\s*\(/.test(codeOnly), f + ' contient new Function() exécutable');
  });
});
check('17. Aucun accès réseau/Supabase dans les 9 modules nutrition-*', () => {
  FILES.filter((f) => f.startsWith('nutrition-')).forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(!/\bsb\./.test(codeOnly), f + ' — variable sb utilisée');
    assert(!/supabase/i.test(codeOnly), f + ' — référence supabase');
    assert(!/fetch\(|XMLHttpRequest/.test(codeOnly), f + ' — appel réseau détecté');
  });
});
check('18. Aucun accès DOM dans les 9 modules nutrition-*', () => {
  FILES.filter((f) => f.startsWith('nutrition-')).forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(!/document\.|window\./.test(codeOnly), f + ' — référence DOM trouvée');
  });
});
check('19. dashboard.html non modifié', () => {
  const out = execSync('git diff --stat -- dashboard.html', { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'dashboard.html a été modifié: ' + out);
});
check('20. Aucune migration Supabase créée pour le moteur nutrition-*.js (seules les migrations hors périmètre du moteur, déjà connues, sont autorisées), trend-engine.js/trend-definitions.js inchangés', () => {
  const ALLOWED_NON_ENGINE_MIGRATIONS = ['20260818000000_add_profile_diet.sql', '20260818000001_add_bilan_kcal_approval.sql', '20260818000002_add_bilan_kcal_champ.sql', '20260818000003_add_bilan_parler_traite.sql', '20260814000000_clinical_context_reference.sql', 'clinical_context_rls_test.sql', '20260819000000_add_profile_nutrition_advice_consent.sql'];
  const migDir = execSync('git status --short -- supabase/', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const unexpected = migDir.filter((l) => !ALLOWED_NON_ENGINE_MIGRATIONS.some((f) => l.indexOf(f) !== -1));
  assert.deepStrictEqual(unexpected, [], 'des fichiers supabase/ inattendus ont changé: ' + JSON.stringify(unexpected));
  ['trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});
check('21. conseils.html non modifié', () => {
  ['conseils.html'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});
check('22. Aucune règle NUTRITION_RULE_REGISTRY au statut "active" dans le code source versionné', () => {
  const src = fs.readFileSync(REPO + '/nutrition-rule-definitions.js', 'utf8');
  assert(!/status:\s*'active'/.test(src), 'une règle porte le statut active dans le code source');
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
