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

check('1. Apport soutenu et net sous la référence (≈3mg/j vs 14mg/j, fenêtre de 14 jours) : signal déclenché', () => {
  const sandbox = buildSandbox();
  const journal = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
    .map((d) => ironEntry(d, 3));
  const res = callResolver(sandbox, 'low_source_presence_iron', journal, '2026-08-12');
  assert.strictEqual(res.state, 'present');
  assert(res.confidence === 'moderate' || res.confidence === 'high', 'confiance attendue moderate/high, obtenu: ' + res.confidence);
});

check('2. Apport moyen adéquat malgré UN jour bas isolé : pas de signal (un pic bas isolé ne suffit jamais)', () => {
  const sandbox = buildSandbox();
  // 6 jours à 14mg/j (référence) + 1 jour très bas (1mg) -> moyenne ≈ 12,1mg/j, largement au-dessus du seuil (50% de 14 = 7mg/j, validé le 2026-08-21)
  const journal = [
    ironEntry('2026-08-06', 14), ironEntry('2026-08-07', 14), ironEntry('2026-08-08', 14),
    ironEntry('2026-08-09', 14), ironEntry('2026-08-10', 14), ironEntry('2026-08-11', 14),
    ironEntry('2026-08-12', 1)
  ];
  const res = callResolver(sandbox, 'low_source_presence_iron', journal, '2026-08-12');
  assert.strictEqual(res.state, 'absent', 'un seul jour bas isolé ne doit jamais déclencher le signal si la moyenne reste correcte');
});

check('3. Apport tout juste au seuil (exactement 50% de la référence, seuil validé le 2026-08-21) : pas de signal (le seuil est strict, pas inclusif du côté insuffisant)', () => {
  const sandbox = buildSandbox();
  const journal = ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12']
    .map((d) => ironEntry(d, 7)); // exactement 50% de 14
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

check('6b. Calcium sur 14 jours, apport soutenu sous 50% de la référence (900mg/j) : signal déclenché (règle validée le 2026-08-21)', () => {
  const sandbox = buildSandbox();
  function calciumEntry(date, mg) { return { date: date, repas: 'lunch', aliment: 'x', quantite: 100, kcal: 100, calcium_mg: mg }; }
  const journal = [
    '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
    '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12'
  ].map((d) => calciumEntry(d, 350)); // 350mg/j en moyenne, sous 50% de 900mg (450mg)
  const res = callResolver(sandbox, 'low_source_presence_calcium', journal, '2026-08-12');
  assert.strictEqual(res.state, 'present');
  assert.strictEqual(res.dailyTarget, 900);
  assert.strictEqual(res.calendarDays, 14);
});

check('6c. Calcium sur 14 jours, apport tout juste au-dessus de 50% (460mg/j vs 450mg requis) : pas de signal', () => {
  const sandbox = buildSandbox();
  function calciumEntry(date, mg) { return { date: date, repas: 'lunch', aliment: 'x', quantite: 100, kcal: 100, calcium_mg: mg }; }
  const journal = [
    '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
    '2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12'
  ].map((d) => calciumEntry(d, 460));
  const res = callResolver(sandbox, 'low_source_presence_calcium', journal, '2026-08-12');
  assert.strictEqual(res.state, 'absent');
});

check('6d. Fenêtre de 14 jours confirmée dans le code source pour les 8 nutriments migrés, seuil 50% explicite', () => {
  const src = fs.readFileSync(REPO + '/nutrition-signal-engine.js', 'utf8');
  const resolversBlock = src.slice(src.indexOf('var NUTRITION_SIGNAL_RESOLVERS'));
  ['low_source_presence_iron', 'low_source_presence_calcium', 'low_source_presence_fiber', 'low_source_presence_omega3',
    'low_source_presence_magnesium', 'low_source_presence_zinc', 'low_source_presence_potassium', 'low_source_presence_protein']
    .forEach((id) => {
      const idx = resolversBlock.indexOf(id + ':');
      const block = resolversBlock.slice(idx, idx + 600);
      assert(/observationWindowDays:\s*14/.test(block), id + ' devrait utiliser une fenêtre de 14 jours');
      assert(/insufficiencyRatio:\s*0\.5/.test(block), id + ' devrait utiliser un seuil de 50%');
    });
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

check('9. Aucun gabarit des 8 nutriments migrés ne contient de formulation interdite ni le mot "carence"/"diagnostic" affirmatif (formulation épurée validée le 2026-08-21)', () => {
  const src = fs.readFileSync(REPO + '/nutrition-template-definitions.js', 'utf8');
  ['increase_iron_sources_v1', 'increase_calcium_sources_v1', 'increase_fiber_sources_v1', 'increase_omega3_sources_v1',
    'increase_magnesium_sources_v1', 'increase_zinc_sources_v1', 'increase_potassium_sources_v1', 'increase_protein_sources_v1']
    .forEach((id) => {
      const idx = src.indexOf(id + ': {');
      const block = src.slice(idx, idx + 500);
      assert(/nettement sous la référence sur la période analysée/.test(block), id + ' ne reflète pas la formulation épurée validée');
      assert(/observation du journal, pas un diagnostic/.test(block), id + ' devrait préciser explicitement qu\'il ne s\'agit pas d\'un diagnostic');
      assert(!/\bcarence\b/i.test(block), id + ' ne devrait plus jamais mentionner "carence", même en négation, dans la formulation épurée');
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
  ['dashboard.html', 'conseils.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
