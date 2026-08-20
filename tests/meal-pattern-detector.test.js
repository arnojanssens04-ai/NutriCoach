/* ──────────────────────────────────────────────────────────────────────
   tests/meal-pattern-detector.test.js — Suite pour la détection de
   repas récurrents et l'exclusion des aliments déjà présents
   (meal-pattern-detector.js, meal-food-roles.js,
   meal-pattern-exclusion.js) — Cap Santé

   Chantier séparé du moteur confiné nutrition-*.js — cette suite vérifie
   explicitement qu'aucun des fichiers nutrition-*.js n'est chargé ni
   référencé par les fichiers testés ici.

   Exécution : node tests/meal-pattern-detector.test.js
   ────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const FILES = ['meal-food-roles.js', 'meal-pattern-detector.js', 'meal-pattern-exclusion.js'];

function buildSandbox() {
  const sandbox = { console };
  vm.createContext(sandbox);
  FILES.forEach((f) => vm.runInContext(fs.readFileSync(REPO + '/' + f, 'utf8'), sandbox, { filename: f }));
  return sandbox;
}

function entry(date, repas, aliment, quantite) {
  return { date: date, repas: repas, aliment: aliment, quantite: quantite === undefined ? null : quantite };
}

function detect(sandbox, journal, referenceDate, opts) {
  const code = 'detectMealPatterns(' + JSON.stringify(Object.assign({ journalEntries: journal, referenceDate: referenceDate, observationWindowDays: 7 }, opts || {})) + ')';
  return vm.runInContext(code, sandbox);
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

const WEEK = ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18'];

function breakfastJournal() {
  var journal = [];
  WEEK.forEach(function (d) { journal.push(entry(d, 'breakfast', 'Muesli au chocolat', 60)); });
  [WEEK[0], WEEK[1], WEEK[3], WEEK[4]].forEach(function (d) { journal.push(entry(d, 'breakfast', 'Yaourt nature', 125)); });
  WEEK.forEach(function (d) { journal.push(entry(d, 'breakfast', 'Banane', null)); });
  [WEEK[0], WEEK[2], WEEK[4]].forEach(function (d) { journal.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30)); });
  return journal;
}

check('1. Petit-déjeuner muesli + yaourt + banane + flocons d\'avoine : les 4 aliments récurrents sont détectés avec leur rôle', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  assert.strictEqual(patterns.length, 1);
  const p = patterns[0];
  assert.strictEqual(p.mealType, 'breakfast');
  const names = Array.from(p.foods).map((f) => f.name).sort();
  assert.deepStrictEqual(names, ['Banane', 'Flocons d\'avoine', 'Muesli au chocolat', 'Yaourt nature'].sort());
  const roleByName = {};
  p.foods.forEach((f) => { roleByName[f.name] = f.role; });
  assert.strictEqual(roleByName['Muesli au chocolat'], 'cereal_base');
  assert.strictEqual(roleByName['Yaourt nature'], 'dairy');
  assert.strictEqual(roleByName['Banane'], 'fruit');
  assert.strictEqual(roleByName['Flocons d\'avoine'], 'cereal');
});

check('2. Associations récurrentes : occurrenceCount reflète l\'aliment le plus fréquent, confidence cohérente', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  const p = patterns[0];
  assert.strictEqual(p.occurrenceCount, 7); // muesli + banane présents les 7 jours
  assert.strictEqual(p.analyzableDays, 7);
  assert.strictEqual(p.confidence, 'high');
});

check('3. Aliments déjà présents non reproposés : evaluateFoodPresenceInMealPatterns exclut banane/yaourt/muesli/avoine pour breakfast', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  ['Banane', 'Yaourt nature', 'Muesli au chocolat', 'Flocons d\'avoine'].forEach((food) => {
    const res = vm.runInContext('evaluateFoodPresenceInMealPatterns(' + JSON.stringify(food) + ', "breakfast", ' + JSON.stringify(patterns) + ')', sandbox);
    assert.strictEqual(res.excluded, true, food + ' devrait être exclu');
    assert.strictEqual(res.reason, 'already_present_in_same_meal');
  });
});

check('4. Comparaison normalisée : accents/casse différents reconnus comme le même aliment', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  const res = vm.runInContext('evaluateFoodPresenceInMealPatterns("BANANE", "breakfast", ' + JSON.stringify(patterns) + ')', sandbox);
  assert.strictEqual(res.excluded, true);
});

check('5. Quantités conservées : averageQuantity calculée pour les aliments avec quantité connue, null si jamais renseignée', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  const foodByName = {};
  patterns[0].foods.forEach((f) => { foodByName[f.name] = f; });
  assert.strictEqual(foodByName['Muesli au chocolat'].averageQuantity, 60);
  assert.strictEqual(foodByName['Yaourt nature'].averageQuantity, 125);
  assert.strictEqual(foodByName['Banane'].averageQuantity, null, 'banane sans quantité connue doit rester null, jamais 0 improvisé');
});

check('6. Plusieurs créneaux : un pattern distinct par mealType (petit-déj + dîner), aucun mélange', () => {
  const sandbox = buildSandbox();
  const journal = breakfastJournal();
  WEEK.forEach((d) => journal.push(entry(d, 'dinner', 'Poulet riz', 300)));
  [WEEK[0], WEEK[2], WEEK[4], WEEK[6]].forEach((d) => journal.push(entry(d, 'dinner', 'Salade verte', 100)));
  const patterns = detect(sandbox, journal, '2026-08-18');
  const mealTypes = Array.from(patterns).map((p) => p.mealType).sort();
  assert.deepStrictEqual(mealTypes, ['breakfast', 'dinner']);
  const dinner = patterns.filter((p) => p.mealType === 'dinner')[0];
  assert(dinner.foods.some((f) => f.name === 'Poulet riz'));
  const breakfast = patterns.filter((p) => p.mealType === 'breakfast')[0];
  assert(!breakfast.foods.some((f) => f.name === 'Poulet riz'), 'un aliment du dîner ne doit jamais apparaître dans le pattern petit-déjeuner');
  // Un aliment présent à un autre créneau n'est pas exclu pour breakfast.
  const res = vm.runInContext('evaluateFoodPresenceInMealPatterns("Poulet riz", "breakfast", ' + JSON.stringify(patterns) + ')', sandbox);
  assert.strictEqual(res.excluded, false);
  assert.strictEqual(res.presence, 'other_meal');
});

check('7. Fenêtre temporelle : une entrée hors fenêtre (>7 jours avant referenceDate) n\'est jamais comptée', () => {
  const sandbox = buildSandbox();
  const journal = breakfastJournal();
  journal.push(entry('2026-07-01', 'breakfast', 'Croissant industriel', 60));
  const patterns = detect(sandbox, journal, '2026-08-18');
  const breakfast = patterns.filter((p) => p.mealType === 'breakfast')[0];
  assert(!breakfast.foods.some((f) => f.name === 'Croissant industriel'), 'une entrée hors fenêtre ne doit jamais influencer le pattern');
});

check('8. Données insuffisantes : aucun aliment n\'atteint minFoodFrequency => aucun pattern émis pour ce créneau', () => {
  const sandbox = buildSandbox();
  const journal = [entry('2026-08-18', 'lunch', 'Salade unique', 200)];
  const patterns = detect(sandbox, journal, '2026-08-18');
  assert.strictEqual(patterns.length, 0, 'un aliment vu une seule fois ne doit jamais former un pattern par défaut (minFoodFrequency=3)');
});

check('9. Valeurs null : entrées sans aliment ou sans repas ignorées, jamais une exception ni un pattern halluciné', () => {
  const sandbox = buildSandbox();
  const journal = [
    { date: '2026-08-18', repas: 'breakfast', aliment: null, quantite: 60 },
    { date: '2026-08-18', repas: null, aliment: 'Muesli', quantite: 60 },
    null
  ];
  const patterns = detect(sandbox, journal, '2026-08-18');
  assert.strictEqual(patterns.length, 0);
  const badResult = vm.runInContext('evaluateFoodPresenceInMealPatterns(null, "breakfast", [])', sandbox);
  assert.strictEqual(badResult.excluded, false);
  assert.strictEqual(badResult.presence, 'absent');
});

check('10. Aucun accès réseau/DOM/eval dans les 3 fichiers de ce chantier', () => {
  FILES.forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(!/\beval\s*\(/.test(codeOnly), f + ' contient eval()');
    assert(!/new\s+Function\s*\(/.test(codeOnly), f + ' contient new Function()');
    assert(!/\bsb\.|supabase/i.test(codeOnly), f + ' référence Supabase');
    assert(!/fetch\(|XMLHttpRequest/.test(codeOnly), f + ' contient un appel réseau');
    assert(!/document\.|window\./.test(codeOnly), f + ' référence le DOM');
  });
});

check('11. Aucune conclusion nutritionnelle : ni "suffisant"/"insuffisant"/"carence" dans les 3 fichiers, aucun des 17 fichiers nutrition-*.js/html n\'est chargé ni référencé de façon exécutable (hors commentaire documentaire)', () => {
  FILES.forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const stringLiterals = (codeOnly.match(/'[^']*'|"[^"]*"/g) || []).join(' ');
    assert(!/\bsuffisant\b|\binsuffisant\b|\bcarence\b/i.test(stringLiterals), f + ' contient une conclusion nutritionnelle interdite dans un texte généré');
    assert(!/nutrition-[a-z-]+\.(js|html)/.test(codeOnly), f + ' référence de façon exécutable un fichier du moteur confiné nutrition-*.js');
  });
  // nutrition-simulator-admin.html est le point d'intégration désigné
  // (branchement demandé explicitement, post-traitement uniquement,
  // aucun fichier du moteur lui-même n'est modifié) — exclu de cette
  // garde ; tous les autres fichiers nutrition-*.js/html doivent rester
  // intacts.
  const trackedNutritionFiles = execSync('git ls-files "nutrition-*.js" "nutrition-*.html"', { cwd: REPO }).toString().trim().split('\n').filter(Boolean)
    .filter((f) => f !== 'nutrition-simulator-admin.html');
  const out = execSync('git status --short -- ' + trackedNutritionFiles.map((f) => '"' + f + '"').join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'des fichiers du moteur nutrition-*.js/html ont été modifiés par ce chantier: ' + out);
});

check('12. Intégration (nutrition-simulator-admin.html) : computeMealPatternWarnings signale les alternatives déjà présentes dans le même repas, sans jamais modifier le texte généré', () => {
  const src = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const scriptOnly = src.split('<script>').slice(-1)[0];
  const codeOnly = scriptOnly.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(/function computeMealPatternWarnings/.test(codeOnly), 'computeMealPatternWarnings() est absente de nutrition-simulator-admin.html');
  // Ne doit jamais réécrire result.advice.body (le texte reste celui
  // généré par nutrition-advice-renderer.js, jamais modifié ici).
  assert(!/result\.advice\.body\s*=/.test(codeOnly), 'le texte du conseil est réécrit — devrait rester une alerte, jamais une correction automatique');
  assert(/already_present_in_same_meal|w\.presence/.test(codeOnly), 'le panneau de revue ne semble pas exploiter la raison already_present_in_same_meal');
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
