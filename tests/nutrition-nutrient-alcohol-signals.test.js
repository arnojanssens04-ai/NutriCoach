/* ──────────────────────────────────────────────────────────────────────
   tests/nutrition-nutrient-alcohol-signals.test.js — Suite reproductible
   pour les signaux nutriment/alcool (nutrition-signal-engine.js) et les
   règles associées — Cap Santé

   Exécution : node tests/nutrition-nutrient-alcohol-signals.test.js
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
  'nutrition-rule-engine.js', 'nutrition-food-selector.js',
  'nutrition-advice-renderer.js', 'nutrition-audit.js', 'nutrition-simulator.js',
  'nutrition-simulator-fixtures.js'
];

function buildSandbox() {
  const sandbox = { console };
  vm.createContext(sandbox);
  FILES.forEach((f) => vm.runInContext(fs.readFileSync(REPO + '/' + f, 'utf8'), sandbox, { filename: f }));
  return sandbox;
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

function runFixture(sandbox, key) {
  const code = 'var fx = NUTRITION_SIMULATOR_FIXTURES[' + JSON.stringify(key) + ']; '
    + 'runNutritionSimulation({ ruleId: fx.ruleId, journalEntries: fx.journalEntries, referenceDate: fx.referenceDate, '
    + 'profile: fx.profile, mode: "simulation", now: fx.referenceDate + "T10:00:00Z" })';
  return vm.runInContext(code, sandbox);
}

check('1. Alcool présent régulièrement : conseil généré, sans affirmation de conséquence santé', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'alcohol_regular_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(res.advice && res.advice.body, 'aucun conseil généré');
  assert(!/provoque|cause|risque de maladie|danger/i.test(res.advice.body), 'le texte affirme une conséquence de santé');
  assert(/professionnel/i.test(res.advice.body), 'aucune orientation professionnelle proposée');
  assert.strictEqual(res.advice.visibility, 'admin_simulator_only');
});

check('2. Alcool ponctuel (sortie sociale isolée) : aucun conseil, en dessous du seuil de confiance', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'alcohol_occasional_social_event_not_a_trend');
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'confidence_below_threshold');
});

check('3. Sources de fer peu présentes : conseil généré, jamais d\'affirmation directe de carence', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'low_iron_source_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  // "carence" ne peut apparaître QUE dans la négation explicite, jamais
  // comme affirmation isolée (ex. "carence en fer détectée").
  assert(!/(?<!de conclure à une )carence/i.test(res.advice.body), 'le texte affirme une carence hors négation');
  assert(/ne permet pas de conclure/i.test(res.advice.body), 'la limite explicite est absente du texte');
});

check('3b. Sources de magnésium peu présentes : conseil généré, jamais d\'affirmation directe de carence', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'low_magnesium_source_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/(?<!de conclure à une )carence/i.test(res.advice.body), 'le texte affirme une carence hors négation');
});

check('3c. Sources de zinc peu présentes : conseil généré, jamais d\'affirmation directe de carence', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'low_zinc_source_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/(?<!de conclure à une )carence/i.test(res.advice.body), 'le texte affirme une carence hors négation');
});

check('3d. Sources de vitamine C/D/potassium/B12 peu présentes : conseil généré, jamais d\'affirmation directe de carence', () => {
  const sandbox = buildSandbox();
  ['low_vitamin_c_source_presence', 'low_vitamin_d_source_presence', 'low_potassium_source_presence', 'low_vitamin_b12_source_presence'].forEach((key) => {
    const res = runFixture(sandbox, key);
    assert.strictEqual(res.eligible, true, key + ': ' + res.blockReason);
    assert(!/(?<!de conclure à une )carence/i.test(res.advice.body), key + ': le texte affirme une carence hors négation');
  });
});

check('3e. Sucre ajouté présent régulièrement : conseil généré, sans affirmation de conséquence santé', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'added_sugar_regular_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/provoque|cause|risque de maladie|danger/i.test(res.advice.body), 'le texte affirme une conséquence de santé');
});

check('3f. Sucre ajouté ponctuel (anniversaire) : aucun conseil, en dessous du seuil de confiance', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'added_sugar_occasional_birthday_not_a_trend');
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'confidence_below_threshold');
});

check('4. Profil témoin avec sources nutritionnelles variées : aucun signal déclenché', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'adequate_nutrient_sources_control');
  assert.strictEqual(res.eligible, false);
  assert.strictEqual(res.blockReason, 'trigger_not_met');
});

check('5. computeNutrientSourceRarity : jour sans nutrient_sources classifié = insuffisant, jamais improvisé', () => {
  const sandbox = buildSandbox();
  const journal = [{ date: '2026-08-12', repas: 'lunch', aliment: 'x' }]; // pas de nutrient_sources
  const code = 'NUTRITION_SIGNAL_RESOLVERS.low_source_presence_iron(' + JSON.stringify(journal) + ', "2026-08-12")';
  const res = vm.runInContext(code, sandbox);
  assert.strictEqual(res.state, 'insufficient');
  assert.strictEqual(res.evaluatedDays, 0);
});

check('6. computeBooleanFlagSignal (alcool) : jour avec is_alcohol non booléen = insuffisant', () => {
  const sandbox = buildSandbox();
  const journal = [{ date: '2026-08-12', repas: 'dinner', aliment: 'x', is_alcohol: 'unknown' }];
  const code = 'NUTRITION_SIGNAL_RESOLVERS.repeated_alcohol_presence(' + JSON.stringify(journal) + ', "2026-08-12")';
  const res = vm.runInContext(code, sandbox);
  assert.strictEqual(res.state, 'insufficient');
});

check('7. Toutes les nouvelles règles restent en "shadow_active", jamais "active"', () => {
  const src = fs.readFileSync(REPO + '/nutrition-rule-definitions.js', 'utf8');
  ['increase_iron_sources_v1', 'increase_calcium_sources_v1', 'increase_fiber_sources_v1',
    'increase_omega3_sources_v1', 'increase_magnesium_sources_v1', 'increase_zinc_sources_v1',
    'increase_vitamin_c_sources_v1', 'increase_vitamin_d_sources_v1', 'increase_potassium_sources_v1',
    'increase_vitamin_b12_sources_v1', 'reduce_added_sugar_v1', 'reduce_alcohol_v1'].forEach((id) => {
    const block = src.slice(src.indexOf(id + ': {'), src.indexOf(id + ': {') + 400);
    assert(/status:\s*'shadow_active'/.test(block), id + ' n\'est pas en shadow_active');
  });
});

check('8. Aucun gabarit nutriment/alcool ne contient de formulation interdite (forbiddenMessages du registre existant)', () => {
  const src = fs.readFileSync(REPO + '/nutrition-template-definitions.js', 'utf8');
  const forbidden = ['Vous devez', 'Votre alimentation est mauvaise', 'augmente votre risque', 'Remplacez immédiatement', 'alimentation déséquilibrée'];
  forbidden.forEach((phrase) => {
    assert(!src.includes(phrase), 'formulation interdite trouvée: ' + phrase);
  });
});

check('9. Aucun eval/new Function/accès réseau/DOM dans nutrition-signal-engine.js', () => {
  const src = fs.readFileSync(REPO + '/nutrition-signal-engine.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/\beval\s*\(/.test(codeOnly));
  assert(!/new\s+Function\s*\(/.test(codeOnly));
  assert(!/\bsb\./.test(codeOnly));
  assert(!/supabase/i.test(codeOnly));
  assert(!/document\.|window\./.test(codeOnly));
});

check('10. trend-engine.js et trend-definitions.js restent inchangés', () => {
  ['trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

check('11. dashboard.html, conseils.html restent inchangés', () => {
  ['dashboard.html', 'conseils.html'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

check('12. Aucune migration Supabase créée pour le moteur nutrition-*.js (seules les migrations hors périmètre du moteur, déjà connues, sont autorisées)', () => {
  const ALLOWED_NON_ENGINE_MIGRATIONS = ['20260818000000_add_profile_diet.sql', '20260818000001_add_bilan_kcal_approval.sql', '20260818000002_add_bilan_kcal_champ.sql', '20260818000003_add_bilan_parler_traite.sql', '20260814000000_clinical_context_reference.sql', 'clinical_context_rls_test.sql', '20260819000000_add_profile_nutrition_advice_consent.sql', '20260819000001_add_profile_nutrition_advice_consent_purposes.sql'];
  const out = execSync('git status --short -- supabase/', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const unexpected = out.filter((l) => !ALLOWED_NON_ENGINE_MIGRATIONS.some((f) => l.indexOf(f) !== -1));
  assert.deepStrictEqual(unexpected, [], 'des fichiers supabase/ inattendus ont changé: ' + JSON.stringify(unexpected));
});

check('13. La maquette de carte (nutrition-simulator-admin.html) ne référence jamais dashboard.html (hors commentaire documentaire) et ne déclenche aucune action réelle', () => {
  const src = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const scriptOnly = src.split('<script>').slice(-1)[0];
  const codeOnly = scriptOnly.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/dashboard\.html/.test(codeOnly), 'référence exécutable à dashboard.html trouvée');
  assert(!/<script[^>]*src=["']dashboard\.html/.test(src), 'chargement de dashboard.html trouvé');
  assert(/Aperçu maquette — jamais affiché à un patient réel/.test(src), 'le libellé d\'avertissement de maquette est absent');
  // Les boutons visuels ne doivent porter aucun gestionnaire d'événement
  // (onclick, addEventListener) — purement décoratifs à ce stade.
  assert(!/popup-btn[\s\S]{0,80}onclick/.test(src), 'un bouton de la maquette porte un gestionnaire onclick');
  // Les boutons du panneau de revue (review-btn) sont interactifs
  // (setReviewDecision), mais uniquement pour un état visuel local —
  // aucun ne doit déclencher d'écriture Supabase (insert/update/delete).
  const setReviewDecisionBody = codeOnly.slice(codeOnly.indexOf('function setReviewDecision'), codeOnly.indexOf('function setReviewDecision') + 800);
  assert(!/sb\.from\([^)]*\)\.(insert|update|delete|upsert)/.test(setReviewDecisionBody), 'setReviewDecision() déclenche une écriture Supabase réelle');
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
