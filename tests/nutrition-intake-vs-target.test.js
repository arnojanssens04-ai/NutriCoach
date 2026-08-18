/* ──────────────────────────────────────────────────────────────────────
   tests/nutrition-intake-vs-target.test.js — Suite reproductible pour le
   mécanisme quantitatif "apport moyen vs référence journalière"
   (computeNutrientIntakeVsTarget, nutrition-signal-engine.js) — Cap Santé

   Exécution : node tests/nutrition-intake-vs-target.test.js
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

function callResolver(sandbox, patternId, journal, refDate) {
  const code = 'NUTRITION_SIGNAL_RESOLVERS[' + JSON.stringify(patternId) + '](' + JSON.stringify(journal) + ', ' + JSON.stringify(refDate) + ')';
  return vm.runInContext(code, sandbox);
}

function ironEntry(date, mg) {
  return { date: date, repas: 'lunch', aliment: 'x', quantite: 100, kcal: 100, iron_mg: mg };
}

check('1. Apport soutenu et net sous la référence (≈3mg/j vs 14mg/j) : signal déclenché', () => {
  const sandbox = buildSandbox();
  const journal = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
    .map((d) => ironEntry(d, 3));
  const res = callResolver(sandbox, 'low_source_presence_iron', journal, '2026-08-12');
  assert.strictEqual(res.state, 'present');
  assert(res.confidence === 'moderate' || res.confidence === 'high', 'confiance attendue moderate/high, obtenu: ' + res.confidence);
});

check('2. Apport moyen adéquat malgré UN jour bas isolé : pas de signal (un pic bas isolé ne suffit jamais)', () => {
  const sandbox = buildSandbox();
  // 6 jours à 14mg/j (référence) + 1 jour très bas (1mg) -> moyenne ≈ 12,1mg/j, largement au-dessus du seuil (60% de 14 = 8,4mg/j)
  const journal = [
    ironEntry('2026-08-06', 14), ironEntry('2026-08-07', 14), ironEntry('2026-08-08', 14),
    ironEntry('2026-08-09', 14), ironEntry('2026-08-10', 14), ironEntry('2026-08-11', 14),
    ironEntry('2026-08-12', 1)
  ];
  const res = callResolver(sandbox, 'low_source_presence_iron', journal, '2026-08-12');
  assert.strictEqual(res.state, 'absent', 'un seul jour bas isolé ne doit jamais déclencher le signal si la moyenne reste correcte');
});

check('3. Apport tout juste au seuil (exactement 60% de la référence) : pas de signal (le seuil est strict, pas inclusif du côté insuffisant)', () => {
  const sandbox = buildSandbox();
  const journal = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
    .map((d) => ironEntry(d, 8.4)); // exactement 60% de 14
  const res = callResolver(sandbox, 'low_source_presence_iron', journal, '2026-08-12');
  assert.strictEqual(res.state, 'absent');
});

check('4. Jour avec quantité de nutriment non renseignée (undefined) : jour non exploitable, jamais une valeur 0 improvisée', () => {
  const sandbox = buildSandbox();
  const journal = [
    ironEntry('2026-08-06', 3), ironEntry('2026-08-07', 3), ironEntry('2026-08-08', 3),
    { date: '2026-08-09', repas: 'lunch', aliment: 'x', quantite: 100, kcal: 100 } // pas de iron_mg
  ];
  const res = callResolver(sandbox, 'low_source_presence_iron', journal, '2026-08-12');
  assert.strictEqual(res.evaluatedDays, 3, 'le jour sans quantité renseignée ne doit jamais être compté comme évalué (ni comme 0g)');
});

check('5. Journal vide : état "insufficient", jamais une extrapolation', () => {
  const sandbox = buildSandbox();
  const res = callResolver(sandbox, 'low_source_presence_iron', [], '2026-08-12');
  assert.strictEqual(res.state, 'insufficient');
});

check('6. Les 8 nutriments migrés (fer, calcium, fibres, oméga-3, magnésium, zinc, potassium, protéines) exposent avgIntake/dailyTarget/unit', () => {
  const sandbox = buildSandbox();
  const journal = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09'].map((d) => ironEntry(d, 3));
  const res = callResolver(sandbox, 'low_source_presence_iron', journal, '2026-08-12');
  assert.strictEqual(typeof res.avgIntake, 'number');
  assert.strictEqual(res.dailyTarget, 14);
  assert.strictEqual(res.unit, 'mg');
});

check('7. NUTRIENT_DAILY_TARGETS_REFERENCE : les valeurs reprennent exactement celles de calcTargets() (dashboard.html, branche plan_fixe)', () => {
  const src = fs.readFileSync(REPO + '/nutrition-signal-engine.js', 'utf8');
  assert(/iron_mg:\s*14/.test(src));
  assert(/calcium_mg:\s*900/.test(src));
  assert(/potassium_mg:\s*3500/.test(src));
  assert(/magnesium_mg:\s*300/.test(src));
  assert(/zinc_mg:\s*10/.test(src));
  assert(/fiber_g:\s*27/.test(src));
  assert(/omega3_g:\s*2\.0/.test(src));
});

check('8. Vitamine C/D/B12 et hydratation restent sur le mécanisme de rareté (aucune cible chiffrée non sourcée inventée)', () => {
  const src = fs.readFileSync(REPO + '/nutrition-signal-engine.js', 'utf8');
  const resolversBlock = src.slice(src.indexOf('var NUTRITION_SIGNAL_RESOLVERS'));
  ['low_source_presence_vitamin_c', 'low_source_presence_vitamin_d', 'low_source_presence_vitamin_b12', 'low_hydration_presence'].forEach((id) => {
    const idx = resolversBlock.indexOf(id + ':');
    const block = resolversBlock.slice(idx, idx + 300);
    assert(/computeNutrientSourceRarity/.test(block), id + ' devrait toujours utiliser computeNutrientSourceRarity');
  });
});

check('9. Aucun gabarit des 8 nutriments migrés ne contient de formulation interdite ni le mot "carence" hors négation', () => {
  const src = fs.readFileSync(REPO + '/nutrition-template-definitions.js', 'utf8');
  ['increase_iron_sources_v1', 'increase_calcium_sources_v1', 'increase_fiber_sources_v1', 'increase_omega3_sources_v1',
    'increase_magnesium_sources_v1', 'increase_zinc_sources_v1', 'increase_potassium_sources_v1', 'increase_protein_sources_v1']
    .forEach((id) => {
      const idx = src.indexOf(id + ': {');
      const block = src.slice(idx, idx + 500);
      assert(/nettement inférieur à une référence journalière générique/.test(block), id + ' ne reflète pas la nouvelle formulation quantitative');
      assert(!/(?<!de conclure à une )carence/i.test(block), id + ' affirme une carence hors négation');
    });
});

check('10. Aucun eval/new Function/accès réseau/DOM dans nutrition-signal-engine.js', () => {
  const src = fs.readFileSync(REPO + '/nutrition-signal-engine.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/\beval\s*\(/.test(codeOnly));
  assert(!/new\s+Function\s*\(/.test(codeOnly));
  assert(!/\bsb\./.test(codeOnly));
  assert(!/document\.|window\./.test(codeOnly));
});

check('11. dashboard.html, conseils.html, admin.html, trend-engine.js, trend-definitions.js restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'admin.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
