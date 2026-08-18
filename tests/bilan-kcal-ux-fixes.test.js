/* ──────────────────────────────────────────────────────────────────────
   tests/bilan-kcal-ux-fixes.test.js — Vérifie deux corrections UX :
   1) bilan_recap.html distingue un bilan antérieur au suivi kcal (normal)
      d'un vrai échec d'enregistrement (postérieur, à vérifier) via une
      date de lancement exacte plutôt qu'une estimation par ancienneté ;
   2) bilan.html ne redirige plus automatiquement vers le tableau de bord
      après seulement 3,5s quand un message d'ajustement (stagnation/
      dérive) est affiché — la personne doit avoir le temps de le lire.
   Cap Santé

   Exécution : node tests/bilan-kcal-ux-fixes.test.js
   ────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); console.log('OK   - ' + name); passed++; }
  catch (e) { console.log('FAIL - ' + name + ' :: ' + e.message); failed++; }
}

check('1. bilan_recap.html : compare à une date de lancement exacte, plus une estimation "joursDepuis <= 14"', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  assert(/KCAL_TRACKING_LAUNCH_DATE\s*=\s*'2026-08-18'/.test(src));
  assert(!/joursDepuis\s*<=\s*14/.test(src), 'l\'ancienne heuristique par ancienneté est encore présente');
});

check('2. bilan_recap.html : message distinct et non alarmiste pour un bilan antérieur au lancement de la fonctionnalité', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  assert(src.includes('introduction de cette fonctionnalit'), 'message "antérieur au lancement" absent');
  assert(src.includes('rien '), 'formulation rassurante absente');
});

check('3. bilan_recap.html : message distinct pour un bilan postérieur sans données (à vérifier)', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  assert(src.includes('introduction de la fonctionnalit'), 'message "postérieur, à vérifier" absent');
});

check('4. bilan.html : showThankYouScreen() ne redirige plus automatiquement quand le bandeau d\'ajustement est affiché', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const fnBody = src.slice(src.indexOf('function showThankYouScreen'), src.indexOf('function showThankYouScreen') + 2000);
  assert(/hasBannerMessage/.test(fnBody), 'détection du bandeau visible absente');
  assert(/if\(!hasBannerMessage\)\{/.test(fnBody), 'la redirection automatique doit être conditionnée à l\'absence de message');
});

check('5. bilan.html : le bouton "Retour au tableau de bord" reste disponible manuellement dans tous les cas', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const fnBody = src.slice(src.indexOf('function showThankYouScreen'), src.indexOf('function showThankYouScreen') + 2000);
  assert(/href="dashboard\.html" class="btn btn-gold"/.test(fnBody), 'bouton de retour manuel manquant');
});

check('6. Aucun fichier nutrition-*.js du moteur confiné n\'est touché par ces corrections', () => {
  const out = execSync('git diff --name-only', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const nutritionFilesTouched = out.filter((f) => /^nutrition-/.test(f));
  assert.deepStrictEqual(nutritionFilesTouched, [], 'fichiers nutrition-*.js touchés de façon inattendue: ' + JSON.stringify(nutritionFilesTouched));
});

check('7. dashboard.html, conseils.html, admin.html, trend-engine.js, trend-definitions.js restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'admin.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
