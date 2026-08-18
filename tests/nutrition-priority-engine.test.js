/* ──────────────────────────────────────────────────────────────────────
   tests/nutrition-priority-engine.test.js — Suite reproductible pour la
   priorité d'affichage entre signaux simultanés (nutrition-priority-
   engine.js) — Cap Santé

   Exécution : node tests/nutrition-priority-engine.test.js
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
  'nutrition-rule-definitions.js', 'nutrition-signal-engine.js', 'nutrition-priority-engine.js',
  'nutrition-safety.js', 'nutrition-rule-engine.js', 'nutrition-food-selector.js',
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

function runAllRulesForFixture(sandbox, key) {
  const code = 'var fx = NUTRITION_SIMULATOR_FIXTURES[' + JSON.stringify(key) + ']; '
    + 'runNutritionSimulationForAllRules({ journalEntries: fx.journalEntries, referenceDate: fx.referenceDate, '
    + 'profile: fx.profile, mode: "simulation", now: fx.referenceDate + "T10:00:00Z" })';
  return vm.runInContext(code, sandbox);
}

check('1. Profil végétalien avec plusieurs signaux : les nutriments pertinents pour ce régime passent en premier', () => {
  const sandbox = buildSandbox();
  const sorted = runAllRulesForFixture(sandbox, 'multi_signal_vegan_priority_demo');
  assert(sorted.length >= 5, 'moins de signaux déclenchés que prévu: ' + sorted.length);

  const ruleIds = sorted.map((e) => e.ruleId);
  const relevantForVegan = ['increase_iron_sources_v1', 'increase_calcium_sources_v1', 'increase_omega3_sources_v1', 'increase_zinc_sources_v1', 'increase_vitamin_b12_sources_v1'];
  const notRelevant = ['increase_fiber_sources_v1', 'increase_magnesium_sources_v1', 'increase_potassium_sources_v1', 'increase_vitamin_c_sources_v1'];

  const lastRelevantIndex = Math.max.apply(null, relevantForVegan.filter((id) => ruleIds.includes(id)).map((id) => ruleIds.indexOf(id)));
  const firstNotRelevantIndex = Math.min.apply(null, notRelevant.filter((id) => ruleIds.includes(id)).map((id) => ruleIds.indexOf(id)));

  assert(lastRelevantIndex < firstNotRelevantIndex, 'un nutriment non pertinent pour le régime végétalien passe avant un nutriment pertinent');
});

check('2. computeRulePriority : un régime non concerné par le nutriment reste en priorité de base', () => {
  const sandbox = buildSandbox();
  const code = 'computeRulePriority("increase_calcium_sources_v1", { diet: null })';
  const priority = vm.runInContext(code, sandbox);
  assert.strictEqual(priority, 1);
});

check('3. computeRulePriority : régime concerné => priorité renforcée', () => {
  const sandbox = buildSandbox();
  const code = 'computeRulePriority("increase_calcium_sources_v1", { diet: "vegan" })';
  const priority = vm.runInContext(code, sandbox);
  assert.strictEqual(priority, 2);
});

check('4. computeRulePriority : règle sans nutriment associé (alcool, ultra-transformés, sucre) reste en priorité de base quel que soit le régime', () => {
  const sandbox = buildSandbox();
  ['reduce_alcohol_v1', 'reduce_ultra_processed_foods_v1', 'reduce_added_sugar_v1'].forEach((ruleId) => {
    const code = 'computeRulePriority(' + JSON.stringify(ruleId) + ', { diet: "vegan" })';
    const priority = vm.runInContext(code, sandbox);
    assert.strictEqual(priority, 1, ruleId + ' ne devrait pas être boosté');
  });
});

check('5. sortEligibleResultsByPriority : tri stable et déterministe (ordre alphabétique en cas d\'égalité de priorité)', () => {
  const sandbox = buildSandbox();
  const code = 'sortEligibleResultsByPriority(['
    + '{ ruleId: "increase_potassium_sources_v1" }, { ruleId: "increase_fiber_sources_v1" }, { ruleId: "increase_magnesium_sources_v1" }'
    + '], { diet: null }).map(function(e){return e.ruleId;})';
  const order = Array.from(vm.runInContext(code, sandbox));
  assert.deepStrictEqual(order, ['increase_fiber_sources_v1', 'increase_magnesium_sources_v1', 'increase_potassium_sources_v1']);
});

check('6. runNutritionSimulationForAllRules n\'évalue jamais deux fois la même règle et ne fusionne jamais deux résultats', () => {
  const sandbox = buildSandbox();
  const sorted = runAllRulesForFixture(sandbox, 'multi_signal_vegan_priority_demo');
  const ruleIds = sorted.map((e) => e.ruleId);
  assert.strictEqual(new Set(ruleIds).size, ruleIds.length, 'une règle apparaît plusieurs fois');
  sorted.forEach((e) => assert(e.result && e.result.eligible === true, e.ruleId + ' ne devrait apparaître que si eligible'));
});

check('7. Aucun eval/new Function/accès réseau/DOM dans nutrition-priority-engine.js', () => {
  const src = fs.readFileSync(REPO + '/nutrition-priority-engine.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/\beval\s*\(/.test(codeOnly));
  assert(!/new\s+Function\s*\(/.test(codeOnly));
  assert(!/\bsb\./.test(codeOnly));
  assert(!/supabase/i.test(codeOnly));
  assert(!/document\.|window\./.test(codeOnly));
});

check('8. trend-engine.js, trend-definitions.js, dashboard.html, conseils.html, admin.html restent inchangés', () => {
  ['trend-engine.js', 'trend-definitions.js', 'dashboard.html', 'conseils.html', 'admin.html'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
