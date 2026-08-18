/* ──────────────────────────────────────────────────────────────────────
   tests/nutrition-variety-protein-hydration.test.js — Suite reproductible
   pour les signaux protéines, hydratation, variété alimentaire — Cap Santé

   Exécution : node tests/nutrition-variety-protein-hydration.test.js
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

function runFixture(sandbox, key) {
  const code = 'var fx = NUTRITION_SIMULATOR_FIXTURES[' + JSON.stringify(key) + ']; '
    + 'runNutritionSimulation({ ruleId: fx.ruleId, journalEntries: fx.journalEntries, referenceDate: fx.referenceDate, '
    + 'profile: fx.profile, mode: "simulation", now: fx.referenceDate + "T10:00:00Z" })';
  return vm.runInContext(code, sandbox);
}

check('1. Sources de protéines peu présentes : conseil généré, jamais d\'affirmation directe de carence', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'low_protein_source_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/(?<!de conclure à une )carence/i.test(res.advice.body));
});

check('2. Prises hydratantes peu présentes : conseil généré, jamais d\'affirmation de déshydratation confirmée', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'low_hydration_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/(?<!de conclure à un état de )déshydratation/i.test(res.advice.body));
});

check('3. Variété alimentaire faible (même aliment répété) : conseil généré, jamais d\'affirmation de déséquilibre confirmé', () => {
  const sandbox = buildSandbox();
  const res = runFixture(sandbox, 'low_food_variety_presence');
  assert.strictEqual(res.eligible, true, res.blockReason);
  assert(!/(?<!de conclure à un )déséquilibre/i.test(res.advice.body));
});

check('4. computeFoodVarietyRarity : variété suffisante => état absent, pas de signal', () => {
  const sandbox = buildSandbox();
  const journal = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
    .map((d, i) => ({ date: d, repas: 'lunch', aliment: 'Aliment ' + i, quantite: 100, kcal: 100 }));
  const code = 'NUTRITION_SIGNAL_RESOLVERS.low_food_variety(' + JSON.stringify(journal) + ', "2026-08-12")';
  const res = vm.runInContext(code, sandbox);
  assert.strictEqual(res.state, 'absent');
});

check('5. computeFoodVarietyRarity : jour avec aliment non renseigné = non exploitable (jamais improvisé)', () => {
  const sandbox = buildSandbox();
  const journal = [{ date: '2026-08-12', repas: 'lunch', aliment: '' }];
  const code = 'NUTRITION_SIGNAL_RESOLVERS.low_food_variety(' + JSON.stringify(journal) + ', "2026-08-12")';
  const res = vm.runInContext(code, sandbox);
  assert.strictEqual(res.evaluatedDays, 0);
});

check('6. Les 3 nouvelles règles restent en "shadow_active", jamais "active"', () => {
  const src = fs.readFileSync(REPO + '/nutrition-rule-definitions.js', 'utf8');
  ['increase_protein_sources_v1', 'increase_hydration_v1', 'increase_food_variety_v1'].forEach((id) => {
    const block = src.slice(src.indexOf(id + ': {'), src.indexOf(id + ': {') + 400);
    assert(/status:\s*'shadow_active'/.test(block), id + ' n\'est pas en shadow_active');
  });
});

check('7. Aucun eval/new Function/accès réseau/DOM dans nutrition-signal-engine.js', () => {
  const src = fs.readFileSync(REPO + '/nutrition-signal-engine.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/\beval\s*\(/.test(codeOnly));
  assert(!/new\s+Function\s*\(/.test(codeOnly));
  assert(!/\bsb\./.test(codeOnly));
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
