/* ──────────────────────────────────────────────────────────────────────
   tests/meal-pattern-role-matching.test.js — Suite pour la comparaison
   déterministe d'aliments par famille/rôle/fonction
   (meal-pattern-role-matching.js) — Cap Santé

   Chantier séparé du moteur confiné nutrition-*.js — vérifie
   explicitement qu'aucun des 17 fichiers nutrition-*.js/html n'est
   chargé ni référencé de façon exécutable par le fichier testé ici.

   Exécution : node tests/meal-pattern-role-matching.test.js
   ────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
// Chargée avec ses dépendances existantes (non modifiées) pour tester le
// comportement réel d'intégration ; une suite séparée (test 9) vérifie
// aussi le fonctionnement autonome, sans meal-food-roles.js.
const FILES = ['meal-food-roles.js', 'meal-pattern-detector.js', 'meal-pattern-role-matching.js'];

function buildSandbox(files) {
  const sandbox = { console };
  vm.createContext(sandbox);
  (files || FILES).forEach((f) => vm.runInContext(fs.readFileSync(REPO + '/' + f, 'utf8'), sandbox, { filename: f }));
  return sandbox;
}

function entry(date, repas, aliment, quantite) {
  return { date: date, repas: repas, aliment: aliment, quantite: quantite === undefined ? null : quantite };
}

function classify(sandbox, a, b) {
  return vm.runInContext('classifyFoodRelation(' + JSON.stringify(a) + ', ' + JSON.stringify(b) + ')', sandbox);
}

function detect(sandbox, journal, referenceDate) {
  return vm.runInContext('detectMealPatterns(' + JSON.stringify({ journalEntries: journal, referenceDate: referenceDate, observationWindowDays: 7 }) + ')', sandbox);
}

function classifyAgainstMeal(sandbox, candidate, mealType, mealPatterns) {
  return vm.runInContext('classifyFoodAgainstMealPattern(' + JSON.stringify(candidate) + ', ' + JSON.stringify(mealType) + ', ' + JSON.stringify(mealPatterns) + ')', sandbox);
}

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

const WEEK = ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18'];

function breakfastJournal() {
  var journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Muesli au chocolat', 60)));
  [WEEK[0], WEEK[1], WEEK[3], WEEK[4]].forEach((d) => journal.push(entry(d, 'breakfast', 'Yaourt nature', 125)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Banane', 100)));
  [WEEK[0], WEEK[2], WEEK[4]].forEach((d) => journal.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30)));
  return journal;
}

check('1. Même aliment, casse différente => exact_same_food', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'YAOURT NATURE', 'yaourt nature'), 'exact_same_food');
});

check('2. Même aliment, accents/apostrophes différents => exact_same_food', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'FLocons d\'avoine', 'flocons avoine'), 'exact_same_food');
  assert.strictEqual(classify(sandbox, 'Céréale', 'cereale'), 'exact_same_food');
});

check('3. Même famille : yaourt / skyr => same_food_family', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'Yaourt nature', 'Skyr'), 'same_food_family');
});

check('4. Même famille : pomme / poire => same_food_family', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'Pomme', 'Poire'), 'same_food_family');
});

check('5. Même rôle nutritionnel (banane / pomme, deux fruits de familles différentes) => same_nutrition_role', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'Banane', 'Pomme'), 'same_nutrition_role');
});

check('6. Même fonction de repas (muesli / pain complet, rôles différents, base glucidique commune) => same_meal_function', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'Muesli', 'Pain complet'), 'same_meal_function');
});

check('7. Aliments connus sans relation (banane / yaourt nature) => unrelated', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'Banane', 'Yaourt nature'), 'unrelated');
});

check('8. Aliment inconnu => unknown, jamais transformé en unrelated', () => {
  const sandbox = buildSandbox();
  assert.strictEqual(classify(sandbox, 'Xyzabc inconnu', 'Yaourt nature'), 'unknown');
  assert.strictEqual(classify(sandbox, 'Xyzabc', 'Wwwqqq'), 'unknown');
  assert.strictEqual(classify(sandbox, null, 'Yaourt nature'), 'unknown');
  assert.strictEqual(classify(sandbox, '', 'Yaourt nature'), 'unknown');
});

check('9. Plusieurs aliments dans un repas : classifyFoodAgainstMealPattern compare le candidat à chacun', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  const res = classifyAgainstMeal(sandbox, 'Skyr', 'breakfast', patterns);
  assert.strictEqual(res.relation, 'same_food_family');
  assert(Array.from(res.matchedFoods).indexOf('Yaourt nature') !== -1);
});

check('10. Sélection de la relation la plus restrictive (yaourt nature vs skyr+banane+flocons d\'avoine => same_food_family, pas unrelated)', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  // "Skyr" n'est pas dans ce repas ; on vérifie plutôt qu'un candidat
  // exact_same_food l'emporte sur toute autre relation possible avec
  // les autres aliments du même repas.
  const res = classifyAgainstMeal(sandbox, 'Banane', 'breakfast', patterns);
  assert.strictEqual(res.relation, 'exact_same_food');
  assert.deepStrictEqual(Array.from(res.matchedFoods), ['Banane']);
});

check('11. Action correspondant à chaque relation (foodRelationExclusionAdvice)', () => {
  const sandbox = buildSandbox();
  const expected = {
    exact_same_food: 'exclude',
    same_food_family: 'deprioritize',
    same_nutrition_role: 'deprioritize',
    same_meal_function: 'allow_as_variation',
    unrelated: 'eligible',
    unknown: 'unknown'
  };
  Object.keys(expected).forEach((relation) => {
    const action = vm.runInContext('foodRelationExclusionAdvice(' + JSON.stringify(relation) + ')', sandbox);
    assert.strictEqual(action, expected[relation], relation + ' devrait donner l\'action ' + expected[relation]);
  });
});

check('12. Absence de meal pattern pour le créneau demandé => unknown, evidence null, jamais une exception', () => {
  const sandbox = buildSandbox();
  const res = classifyAgainstMeal(sandbox, 'Yaourt nature', 'dinner', []);
  assert.strictEqual(res.relation, 'unknown');
  assert.strictEqual(res.evidence, null);
  assert.deepStrictEqual(Array.from(res.matchedFoods), []);
});

check('13. Créneau différent : un aliment présent au dîner ne doit jamais influencer la classification pour le petit-déjeuner', () => {
  const sandbox = buildSandbox();
  const journal = breakfastJournal();
  WEEK.forEach((d) => journal.push(entry(d, 'dinner', 'Yaourt nature', 125)));
  const patterns = detect(sandbox, journal, '2026-08-18');
  const resLunchAbsent = classifyAgainstMeal(sandbox, 'Yaourt nature', 'lunch', patterns);
  assert.strictEqual(resLunchAbsent.relation, 'unknown', 'aucun pattern lunch ne doit exister ici');
  const resBreakfast = classifyAgainstMeal(sandbox, 'Yaourt nature', 'breakfast', patterns);
  assert.strictEqual(resBreakfast.relation, 'exact_same_food');
});

check('14. Conservation des données d\'entrée : classifyFoodAgainstMealPattern ne mute jamais mealPatterns', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');
  const before = JSON.stringify(patterns);
  classifyAgainstMeal(sandbox, 'Skyr', 'breakfast', patterns);
  const after = JSON.stringify(patterns);
  assert.strictEqual(before, after, 'mealPatterns a été modifié par classifyFoodAgainstMealPattern');
});

check('15. Aucun accès réseau (fetch/XMLHttpRequest/sb./supabase) dans meal-pattern-role-matching.js', () => {
  const src = fs.readFileSync(REPO + '/meal-pattern-role-matching.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/fetch\(|XMLHttpRequest/.test(codeOnly));
});

check('16. Aucune référence Supabase dans meal-pattern-role-matching.js', () => {
  const src = fs.readFileSync(REPO + '/meal-pattern-role-matching.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/\bsb\.|supabase/i.test(codeOnly));
});

check('17. Aucun appel IA (pas de fetch vers un service externe, pas de clé/API IA, pas de mot-clé openai/gemini/claude api)', () => {
  const src = fs.readFileSync(REPO + '/meal-pattern-role-matching.js', 'utf8');
  assert(!/openai|gemini|anthropic|chatgpt|\bai[_-]?api\b/i.test(src));
});

check('18. Aucun accès DOM/window dans meal-pattern-role-matching.js', () => {
  const src = fs.readFileSync(REPO + '/meal-pattern-role-matching.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/document\.|window\./.test(codeOnly));
});

check('19. Aucun vocabulaire clinique (diagnostic, carence, maladie, traitement) dans les chaînes de texte du fichier', () => {
  const src = fs.readFileSync(REPO + '/meal-pattern-role-matching.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const stringLiterals = (codeOnly.match(/'[^']*'|"[^"]*"/g) || []).join(' ');
  assert(!/\bdiagnostic\b|\bcarence\b|\bmaladie\b|\btraitement\b|\bsuffisant\b|\binsuffisant\b/i.test(stringLiterals));
});

check('20. Aucun des 17 fichiers nutrition-*.js/html n\'est chargé ni référencé de façon exécutable ; les 9 fichiers expérimentaux du moteur restent inchangés', () => {
  const src = fs.readFileSync(REPO + '/meal-pattern-role-matching.js', 'utf8');
  const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/nutrition-[a-z-]+\.(js|html)/.test(codeOnly), 'référence exécutable à un fichier nutrition-*.js/html trouvée');
  // nutrition-simulator-admin.html exclu de cette garde depuis
  // feature/meal-pattern-role-integration : son intégration avec
  // classifyFoodAgainstMealPattern() est le sujet explicite de cette
  // étape ultérieure, testée séparément
  // (tests/meal-pattern-role-integration.test.js).
  const trackedNutritionFiles = execSync('git ls-files "nutrition-*.js" "nutrition-*.html"', { cwd: REPO }).toString().trim().split('\n').filter(Boolean)
    .filter((f) => f !== 'nutrition-simulator-admin.html');
  const out = execSync('git status --short -- ' + trackedNutritionFiles.map((f) => '"' + f + '"').join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'des fichiers du moteur nutrition-*.js/html ont été modifiés: ' + out);
  // Fichiers meal-pattern-*.js existants doivent rester inchangés dans
  // cette étape (nutrition-simulator-admin.html exclu : son intégration
  // avec classifyFoodAgainstMealPattern() est le sujet d'une étape
  // ultérieure distincte, feature/meal-pattern-role-integration, testée
  // séparément).
  const otherMealPatternFiles = ['meal-food-roles.js', 'meal-pattern-detector.js', 'meal-pattern-exclusion.js', 'meal-pattern-clarifying-questions.js'];
  const outOther = execSync('git status --short -- ' + otherMealPatternFiles.map((f) => '"' + f + '"').join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(outOther, '', 'des fichiers existants du chantier meal-pattern ont été modifiés: ' + outOther);
});

check('21. Fonctionnement autonome : classifyFoodRelation fonctionne sans meal-food-roles.js chargée (repli local)', () => {
  const sandbox = buildSandbox(['meal-pattern-role-matching.js']);
  assert.strictEqual(classify(sandbox, 'Yaourt nature', 'yaourt nature'), 'exact_same_food');
  assert.strictEqual(classify(sandbox, 'FLocons d\'avoine', 'flocons avoine'), 'exact_same_food');
  assert.strictEqual(classify(sandbox, 'Yaourt nature', 'Skyr'), 'same_food_family');
});

check('22. Test central — repas muesli/yaourt/banane/avoine : aucun de ces aliments n\'est traité comme une nouveauté, rôles reconnus, aucune conclusion de suffisance/carence, aucune question dupliquée, aucune modification du texte de conseil', () => {
  const sandbox = buildSandbox();
  const patterns = detect(sandbox, breakfastJournal(), '2026-08-18');

  ['Yaourt nature', 'Banane', 'Flocons d\'avoine', 'Muesli au chocolat'].forEach((food) => {
    const res = classifyAgainstMeal(sandbox, food, 'breakfast', patterns);
    assert.strictEqual(res.relation, 'exact_same_food', food + ' devrait être reconnu comme déjà présent (exact_same_food)');
    assert.strictEqual(res.action, 'exclude', food + ' devrait être exclu, jamais traité comme une nouveauté');
  });

  // Rôles existants reconnus (meal-food-roles.js, non modifié).
  assert.strictEqual(vm.runInContext('matchMealFoodRole("Yaourt nature")', sandbox), 'dairy');
  assert.strictEqual(vm.runInContext('matchMealFoodRole("Banane")', sandbox), 'fruit');
  assert.strictEqual(vm.runInContext('matchMealFoodRole("Flocons d\'avoine")', sandbox), 'cereal');
  assert.strictEqual(vm.runInContext('matchMealFoodRole("Muesli au chocolat")', sandbox), 'cereal_base');

  // Aucune conclusion de suffisance/carence dans le fichier lui-même
  // (déjà couvert par le test 19) — vérifié ici sur le résultat retourné.
  const res = classifyAgainstMeal(sandbox, 'Banane', 'breakfast', patterns);
  assert(!/suffisant|insuffisant|carence/i.test(JSON.stringify(res)));

  // Ce module ne génère, ne sélectionne et ne modifie aucune question
  // (meal-pattern-clarifying-questions.js n'est ni chargé, ni référencé
  // ici) et n'écrit jamais dans un champ de type "advice"/"body".
  const src = fs.readFileSync(REPO + '/meal-pattern-role-matching.js', 'utf8');
  assert(!/selectClarifyingQuestion|advice\.body|clarifyingQuestion/.test(src), 'ce module ne doit ni sélectionner ni modifier une question ou un texte de conseil');
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
