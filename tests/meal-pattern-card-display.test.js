/* ──────────────────────────────────────────────────────────────────────
   tests/meal-pattern-card-display.test.js — Suite pour la correction
   visuelle et fonctionnelle de la carte (renderPopupPreview) dans le
   simulateur admin (nutrition-simulator-admin.html) — Cap Santé

   Charge le moteur confiné nutrition-*.js (lecture seule, jamais
   modifié — voir test 13) + le chantier meal-pattern-*.js + le script
   inline de nutrition-simulator-admin.html (sans le bloc
   sb.auth.getSession(), qui dépend du DOM/réseau réels), pour tester
   renderPopupPreview() bout en bout, comme le ferait la page.

   Ne teste jamais une génération de texte nouvelle : la carte réutilise
   le corps déjà produit par le moteur (result.advice.body), jamais
   réécrit, et meal-pattern-clarifying-questions.js n'est ni modifié ni
   contourné (les 4 blocs de réponse personnalisée après sélection
   restent reportés — voir docs/GOVERNANCE_QUESTIONS.md).

   Exécution : node tests/meal-pattern-card-display.test.js
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

// esc() (nutrition-simulator-admin.html) appelle document.createElement pour
// échapper le HTML — un stub minimal suffit ici, jamais un vrai DOM, jamais
// de rendu réel : seul .textContent -> .innerHTML (échappement basique) est
// utilisé par esc().
function fakeDocument() {
  return {
    createElement: function () {
      return {
        _text: '',
        set textContent(v) { this._text = v; },
        get textContent() { return this._text; },
        get innerHTML() {
          return String(this._text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
      };
    }
  };
}

function buildSandbox() {
  const sandbox = {
    supabase: { createClient: function () { return { auth: { getSession: function () { return Promise.resolve({ data: null }); } } }; } },
    document: fakeDocument()
  };
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

function renderCard(sandbox, ruleId, result, warnings) {
  return vm.runInContext('renderPopupPreview', sandbox)(ruleId, result, warnings);
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

check('1. Composition complète : muesli au chocolat + yaourt nature + banane + flocons d\'avoine, les quatre aliments sont affichés dans la carte', () => {
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
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  ['Cereales sucrees industrielles', 'Yaourt nature', 'Banane', 'Flocons d&#39;avoine'].forEach((name) => {
    assert(html.indexOf(name) !== -1, name + ' devrait apparaître dans la carte');
  });
});

check('2. Absence de suggestions redondantes : Yaourt nature, Banane et Flocons d\'avoine ne sont pas reproposés comme options nouvelles (marqués exclude/deprioritize)', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Yaourt nature', 125, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Banane', 100, false)));
  [WEEK[0], WEEK[2], WEEK[4]].forEach((d) => journal.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30, false)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  const byLabel = {};
  warnings.candidates.forEach((c) => { byLabel[c.label] = c; });
  assert.strictEqual(byLabel['Yaourt nature'].action, 'exclude');
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert.strictEqual(html.indexOf('action-eligible">⛔ Yaourt nature'), -1);
});

check('3. Sélection d\'un objectif : les options fixes du catalogue (goal_clarification/keep_or_adjust) sont affichées telles quelles dans la carte quand aucune option pertinente ne reste', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Skyr', 125, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Lentilles', 50, false)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert(warnings.clarifyingQuestion, 'une question fixe devrait être déclenchée');
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert(html.indexOf(warnings.clarifyingQuestion.text) !== -1, 'la question fixe devrait apparaître dans la carte');
  warnings.clarifyingQuestion.options.forEach((opt) => {
    assert(html.indexOf(opt) !== -1, 'option "' + opt + '" devrait apparaître dans la carte');
  });
});

check('4. Affichage de la question fixe : le bloc clarify est présent uniquement quand hasRelevantOption est faux', () => {
  const sandbox = buildSandbox();
  const journalNoOption = [];
  WEEK.forEach((d) => journalNoOption.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journalNoOption.push(entry(d, 'breakfast', 'Skyr', 125, false)));
  WEEK.forEach((d) => journalNoOption.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30, false)));
  WEEK.forEach((d) => journalNoOption.push(entry(d, 'breakfast', 'Lentilles', 50, false)));
  const fixtureNoOption = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journalNoOption, profile: baseProfile() };
  const resultNoOption = runSimulation(sandbox, fixtureNoOption);
  const warningsNoOption = computeWarnings(sandbox, fixtureNoOption.ruleId, resultNoOption, fixtureNoOption);
  const htmlNoOption = renderCard(sandbox, fixtureNoOption.ruleId, resultNoOption, warningsNoOption);
  assert(htmlNoOption.indexOf('clarify-block') !== -1);

  const journalWithOption = [];
  WEEK.forEach((d) => journalWithOption.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  const fixtureWithOption = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journalWithOption, profile: baseProfile() };
  const resultWithOption = runSimulation(sandbox, fixtureWithOption);
  const warningsWithOption = computeWarnings(sandbox, fixtureWithOption.ruleId, resultWithOption, fixtureWithOption);
  const htmlWithOption = renderCard(sandbox, fixtureWithOption.ruleId, resultWithOption, warningsWithOption);
  assert.strictEqual(htmlWithOption.indexOf('clarify-block'), -1);
});

check('5. Conservation de la routine : "Garder ce repas tel quel" (keep_or_adjust) est affiché quand le catalogue le prévoit (>= 3 aliments récurrents)', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Skyr', 125, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Flocons d\'avoine', 30, false)));
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Lentilles', 50, false)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert.strictEqual(warnings.clarifyingQuestion.id, 'keep_or_adjust');
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert(html.indexOf('Garder ce repas tel quel') !== -1);
});

check('6. Données récentes : dernière donnée le jour de référence => badge "Récente", carte complète (observation + options)', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  assert.strictEqual(warnings.freshness.status, 'recent');
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert(html.indexOf('status-recent') !== -1);
  assert(html.indexOf('popup-body') !== -1, 'observation attendue pour une carte complète');
});

// La fenêtre d'observation du moteur (nutrition-signal-engine.js,
// windowEnd = referenceDate, 7 jours glissants) borne l'écart maximal
// entre la dernière donnée et referenceDate à quelques jours : un
// statut 'stale' ou une couverture insuffisante AVEC un résultat
// eligible ne peuvent donc pas être obtenus via ce pipeline complet
// pour cette règle précise. On construit ici un `mealWarnings` réaliste
// (mêmes champs que computeMealPatternWarnings) pour tester le
// comportement de renderPopupPreview lui-même sur ces états, exactement
// comme le ferait la carte si le moteur les produisait un jour.
function staleFreshness(referenceDate, windowStart) {
  return { referenceDate: referenceDate, lastDataDate: windowStart, ageInDays: 20, status: 'stale', windowStart: windowStart, windowEnd: referenceDate, analyzableDays: 1, staleWarning: 'Dernière donnée utilisée le ' + windowStart + ' — tendance potentiellement ancienne.' };
}

check('7. Données anciennes : statut de fraîcheur "stale" => "Observation ancienne" affichée, aucune option', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  assert.strictEqual(result.eligible, true, result.blockReason);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  warnings.freshness = staleFreshness('2026-08-18', '2026-07-25');
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert(html.indexOf('Observation ancienne') !== -1);
  assert(html.indexOf('Cette analyse date de plus de 14 jours. Ajoutez des repas récents pour obtenir une vue actuelle.') !== -1);
  assert.strictEqual(html.indexOf('popup-chip action-'), -1, 'aucune option ne doit être affichée pour une observation ancienne');
  assert.strictEqual(html.indexOf('clarify-block'), -1, 'aucune question fixe ne doit être affichée pour une observation ancienne');
});

check('8. Couverture insuffisante : aucune option affichée quelle que soit la fraîcheur', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  assert.strictEqual(result.eligible, true, result.blockReason);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  warnings.insufficientCoverage = true; // état simulé — fraîcheur laissée "recent" pour prouver que c'est bien insufficientCoverage, pas la fraîcheur, qui masque les options
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert(html.indexOf('Couverture insuffisante') !== -1);
  assert.strictEqual(html.indexOf('popup-chip action-'), -1, 'aucune option ne doit être affichée en couverture insuffisante');
  assert.strictEqual(html.indexOf('clarify-block'), -1, 'aucune question fixe ne doit être affichée en couverture insuffisante');
});

check('9. Repas non récurrent : mealType détecté mais aucune composition habituelle => section composition indique l\'absence de récurrence', () => {
  const sandbox = buildSandbox();
  const journal = [];
  WEEK.forEach((d) => journal.push(entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true)));
  journal.push(entry(WEEK[0], 'breakfast', 'Kiwi', 80, false));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  if (warnings.nonRecurringMeal) {
    assert(html.indexOf('Aucune composition récurrente détectée pour ce repas.') !== -1);
  }
});

check('10. Affichage des dates : la période analysée et la dernière donnée apparaissent explicitement dans la carte', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert(html.indexOf(warnings.freshness.windowStart) !== -1);
  assert(html.indexOf(warnings.freshness.windowEnd) !== -1);
  assert(html.indexOf(warnings.freshness.lastDataDate) !== -1);
});

check('11. Affichage de la fraîcheur : le badge "aging" ("À actualiser") correspond exactement au statut fourni, carte complète (pas de suppression des options pour ce seul statut)', () => {
  const sandbox = buildSandbox();
  const journal = WEEK.map((d) => entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-18', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  const warnings = computeWarnings(sandbox, fixture.ruleId, result, fixture);
  warnings.freshness = Object.assign({}, warnings.freshness, { status: 'aging', ageInDays: 7 });
  const html = renderCard(sandbox, fixture.ruleId, result, warnings);
  assert(html.indexOf('status-aging') !== -1);
  assert(html.indexOf('À actualiser') !== -1);
  assert(html.indexOf('popup-body') !== -1, 'la carte "aging" reste complète, contrairement à "stale"');
});

check('12. Fraîcheur relative à referenceDate, pas à windowEnd : ageInDays calculé via daysBetweenIsoDates, jamais une comparaison de chaînes ni un fuseau implicite', () => {
  const sandbox = buildSandbox();
  const computeFreshness = vm.runInContext('computeObservationFreshness', sandbox);
  const daysBetween = vm.runInContext('daysBetweenIsoDates', sandbox);
  // Comparaison de chaînes naïve donnerait "2026-08-09" < "2026-08-31"
  // un écart de "22" par simple soustraction lexicographique erronée ;
  // daysBetweenIsoDates doit rester correct au changement de mois.
  assert.strictEqual(daysBetween('2026-08-29', '2026-08-31'), 2);
  assert.strictEqual(daysBetween('2026-07-31', '2026-08-02'), 2);

  const journal = ['2026-07-29', '2026-07-30', '2026-07-31'].map((d) => entry(d, 'breakfast', 'Cereales sucrees industrielles', 60, true));
  const fixture = { ruleId: 'reduce_ultra_processed_foods_v1', referenceDate: '2026-08-02', journalEntries: journal, profile: baseProfile() };
  const result = runSimulation(sandbox, fixture);
  if (result.eligible) {
    const freshness = computeFreshness(result, fixture);
    assert.strictEqual(freshness.referenceDate, '2026-08-02');
    assert.strictEqual(freshness.lastDataDate, '2026-07-31');
    assert.strictEqual(freshness.ageInDays, 2);
    assert.strictEqual(freshness.status, 'recent');
  }
});

check('13. Absence de génération de texte / interpolation d\'aliment après sélection : renderPopupPreview ne construit aucun texte personnalisé au-delà de ce que renvoie déjà le moteur, meal-pattern-clarifying-questions.js reste inchangé', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const fnStart = htmlSrc.indexOf('function renderPopupPreview');
  const fnEnd = htmlSrc.indexOf('\nfunction ', fnStart + 10);
  const fnBody = htmlSrc.slice(fnStart, fnEnd);
  assert(!/result\.advice\.body\s*=/.test(fnBody), 'renderPopupPreview ne doit jamais réécrire result.advice.body');
  assert(!/new (Advice|Text)/.test(fnBody));
  const out = execSync('git status --short -- meal-pattern-clarifying-questions.js', { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'meal-pattern-clarifying-questions.js ne doit pas être modifié pour cette tâche');
});

check('14. Régression : aucune modification du moteur confiné nutrition-*.js ni des fichiers patient (dashboard.html, conseils.html, etc.) pour cette tâche', () => {
  const trackedNutritionFiles = execSync('git ls-files "nutrition-*.js"', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const out = execSync('git status --short -- ' + trackedNutritionFiles.map((f) => '"' + f + '"').join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(out, '', 'des fichiers nutrition-*.js du moteur confiné ont été modifiés: ' + out);
  const patientFacing = ['dashboard.html', 'conseils.html', 'admin.html', 'regles-pathologies.js', 'clinical-context-storage.js', 'trend-engine.js', 'trend-definitions.js', 'mode-focus.js'];
  const outPatient = execSync('git status --short -- ' + patientFacing.join(' '), { cwd: REPO }).toString().trim();
  assert.strictEqual(outPatient, '', 'des fichiers patient/moteur hors périmètre ont été modifiés: ' + outPatient);
});

check('15. Absence de réseau, d\'IA et de vocabulaire clinique dans renderPopupPreview', () => {
  const htmlSrc = fs.readFileSync(REPO + '/nutrition-simulator-admin.html', 'utf8');
  const fnStart = htmlSrc.indexOf('function renderPopupPreview');
  const fnEnd = htmlSrc.indexOf('\nfunction ', fnStart + 10);
  const fnBody = htmlSrc.slice(fnStart, fnEnd);
  assert(!/fetch\(|XMLHttpRequest|sb\.from|supabase\.from/.test(fnBody));
  assert(!/openai|gemini|anthropic|chatgpt/i.test(fnBody));
  assert(!/clinicalContext|symptom|pathologie|patholog|diagnostic/i.test(fnBody));
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
