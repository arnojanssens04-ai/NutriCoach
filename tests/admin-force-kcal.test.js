/* ──────────────────────────────────────────────────────────────────────
   tests/admin-force-kcal.test.js — Vérifications sur la possibilité, pour
   un admin, de forcer l'objectif calorique d'un patient depuis sa fiche
   (admin.html) — Cap Santé

   Exécution : node tests/admin-force-kcal.test.js
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

check('1. admin.html : case "forcer" présente dans le formulaire d\'édition', () => {
  const src = fs.readFileSync(REPO + '/admin.html', 'utf8');
  assert(/id="e-force-kcal"/.test(src));
});

check('2. openEdit() initialise la case selon exactement la même condition que calcTargets() (plan_fixe actif ET kcal_target défini)', () => {
  const src = fs.readFileSync(REPO + '/admin.html', 'utf8');
  const fnBody = src.slice(src.indexOf('function openEdit'), src.indexOf('function toggleEditPatho'));
  assert(/e-force-kcal['"]\)\.checked\s*=\s*!!\(u\.plan_fixe && u\.plan_fixe\._active !== false && u\.kcal_target\)/.test(fnBody));
});

check('3. saveUser() refuse de forcer un objectif kcal sans valeur renseignée', () => {
  const src = fs.readFileSync(REPO + '/admin.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function saveUser'), src.indexOf('async function saveUser') + 1500);
  assert(/if\(forceKcal && !kcalTarget\)/.test(fnBody), 'garde-fou absent');
});

check('4. saveUser() ne modifie jamais les repas déjà choisis par le patient (plan_fixe), seulement _active', () => {
  const src = fs.readFileSync(REPO + '/admin.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function saveUser'), src.indexOf('async function saveUser') + 2000);
  assert(/Object\.assign\(\{\}, u\.plan_fixe\|\|\{\}, \{_active:true\}\)/.test(fnBody), 'activation ne préserve pas plan_fixe existant');
  assert(/Object\.assign\(\{\}, u\.plan_fixe, \{_active:false\}\)/.test(fnBody), 'désactivation ne préserve pas plan_fixe existant');
});

check('5. saveUser() ne crée jamais un plan_fixe pour un patient qui n\'en avait pas quand la case n\'est pas cochée', () => {
  const src = fs.readFileSync(REPO + '/admin.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function saveUser'), src.indexOf('async function saveUser') + 2000);
  assert(/\}\s*else if\(u\.plan_fixe\)\{/.test(fnBody), 'le cas "pas de plan_fixe existant, case décochée" doit rester un no-op sur ce champ');
});

check('6. dashboard.html, conseils.html, trend-engine.js, trend-definitions.js restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

check('7. Aucun fichier nutrition-*.js du moteur confiné n\'est touché par ce changement', () => {
  const out = execSync('git diff --name-only', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const nutritionFilesTouched = out.filter((f) => /^nutrition-/.test(f));
  assert.deepStrictEqual(nutritionFilesTouched, [], 'fichiers nutrition-*.js touchés de façon inattendue: ' + JSON.stringify(nutritionFilesTouched));
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
