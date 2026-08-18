/* ──────────────────────────────────────────────────────────────────────
   tests/bilan-kcal-forced-mode.test.js — Vérifie que la détection de
   stagnation/dérive de poids (bilan.html) continue de proposer un
   ajustement à valider par l'admin même quand les calories du patient
   sont FORCÉES (admin.html, "Forcer cet objectif kcal/j") — et que dans
   ce cas la proposition porte sur kcal_target, pas kcal_adjustment
   (ignoré par calcTargets() en mode forcé) — Cap Santé

   Exécution : node tests/bilan-kcal-forced-mode.test.js
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

check('1. bilan.html : détecte le mode "calories forcées" avec la même condition que calcTargets()', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  assert(/var isForced = !!\(PROF\.plan_fixe && PROF\.plan_fixe\._active !== false && PROF\.kcal_target\)/.test(src));
});

check('2. bilan.html : proposeNudge() cible kcal_target en mode forcé, kcal_adjustment sinon', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const fnBody = src.slice(src.indexOf('function proposeNudge'), src.indexOf('function cibleApres'));
  assert(/champ:'kcal_target'/.test(fnBody));
  assert(/champ:'kcal_adjustment'/.test(fnBody));
});

check('3. bilan.html : les 3 blocs de proposition (mauvaise direction/stagnation perte-prise, dérive maintien) utilisent proposeNudge(), plus jamais un calcul kcal_adjustment codé en dur', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function checkAndAdjustKcal'), src.indexOf('</script>', src.indexOf('async function checkAndAdjustKcal')));
  const total = (fnBody.match(/proposeNudge\(/g) || []).length;
  const calls = total - 1; // exclut la déclaration "function proposeNudge("
  assert.strictEqual(calls, 3, 'attendu 3 appels à proposeNudge(), trouvé ' + calls);
  assert(!/currentAdj \+ \(objectif===/.test(fnBody), 'un calcul kcal_adjustment codé en dur subsiste (ignore le mode forcé)');
});

check('4. bilan.html : logKcalDecision transmet toujours le champ concerné (kcal_adjustment/kcal_target) à bilans.kcal_ajustement_champ', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function logKcalDecision'), src.indexOf('async function checkAndAdjustKcal'));
  assert(/kcal_ajustement_champ:\s*champ/.test(fnBody));
});

check('5. bilan_recap.html : approveKcalAdjustment() écrit dans le champ transmis (kcal_target ou kcal_adjustment), jamais toujours kcal_adjustment', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function approveKcalAdjustment'), src.indexOf('async function rejectKcalAdjustment'));
  assert(/patch\[champ\]\s*=\s*valeurProposee/.test(fnBody), 'approveKcalAdjustment écrit encore toujours dans kcal_adjustment');
});

check('6. bilan_recap.html : le bouton "Valider" transmet bien kcal_ajustement_champ au clic', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const idx = src.indexOf("onclick=\"approveKcalAdjustment(");
  assert(idx !== -1, 'appel approveKcalAdjustment introuvable dans le bouton');
  const call = src.slice(idx, idx + 250);
  assert(call.includes('champProp'), 'le champ proposé (champProp) n\'est pas transmis au bouton de validation: ' + call);
});

check('7. Migration 20260818000002_add_bilan_kcal_champ.sql : colonne attendue, garde anti-réexécution, aucune donnée existante modifiée', () => {
  const migPath = REPO + '/supabase/migrations/20260818000002_add_bilan_kcal_champ.sql';
  assert(fs.existsSync(migPath), 'fichier de migration absent');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(/add column kcal_ajustement_champ text not null default 'kcal_adjustment'/i.test(sql));
  assert(/check \(kcal_ajustement_champ in \('kcal_adjustment', 'kcal_target'\)\)/i.test(sql));
  assert(/raise exception/i.test(sql), 'garde anti-réexécution absente');
});

check('8. Aucun fichier nutrition-*.js du moteur confiné n\'est touché par ce correctif', () => {
  const out = execSync('git diff --name-only', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const nutritionFilesTouched = out.filter((f) => /^nutrition-/.test(f));
  assert.deepStrictEqual(nutritionFilesTouched, [], 'fichiers nutrition-*.js touchés de façon inattendue: ' + JSON.stringify(nutritionFilesTouched));
});

check('9. dashboard.html, conseils.html, trend-engine.js, trend-definitions.js restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
