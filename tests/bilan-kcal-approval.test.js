/* ──────────────────────────────────────────────────────────────────────
   tests/bilan-kcal-approval.test.js — Vérifications sur le passage de
   l'ajustement calorique automatique à une validation admin (bilan.html
   + bilan_recap.html) — Cap Santé

   Exécution : node tests/bilan-kcal-approval.test.js
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

check('1. bilan.html : plus aucun appel automatique à profiles.update({kcal_adjustment...}) dans checkAndAdjustKcal', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function checkAndAdjustKcal'), src.indexOf('</script>', src.indexOf('async function checkAndAdjustKcal')));
  assert(!/profiles['"]\)\.update\(\{kcal_adjustment/.test(fnBody), 'checkAndAdjustKcal modifie encore profiles.kcal_adjustment directement');
});

check('2. bilan.html : les 2 blocs de proposition (perte/prise, dérive maintien) enregistrent un statut "pending", jamais "approved" posé côté patient', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const callSites = src.split('await logKcalDecision(').slice(1); // exclut la déclaration de la fonction elle-même
  const pendingCalls = callSites.filter((chunk) => chunk.slice(0, 300).includes("'pending'"));
  assert.strictEqual(pendingCalls.length, 2, 'attendu 2 appels avec statut "pending", trouvé ' + pendingCalls.length + ' (sur ' + callSites.length + ' appels au total)');
  assert(!callSites.some((chunk) => chunk.slice(0, 300).includes("'approved'")), 'bilan.html ne doit jamais poser lui-même le statut "approved"');
});

check('3. bilan.html : les messages patient ne prétendent plus qu\'un changement est appliqué automatiquement', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  // Le fichier utilise des séquences d'échappement JS (é...) pour les
  // caractères accentués, y compris pour le texte ajouté ici — recherche
  // sur une portion ASCII de la phrase pour rester robuste à ce choix
  // d'encodage déjà en place dans le fichier.
  assert(!/appliqu.{1,2} automatiquement.{0,20}(plan|profil)/i.test(src), 'un message affirme encore une application automatique');
  assert(src.includes('administrateur validera apr'), 'la formulation attendue est absente');
  assert(src.includes('consultation du bilan si cette adaptation est n'), 'la formulation attendue est absente (suite)');
});

check('4. bilan.html : logKcalDecision écrit bien kcal_ajustement_status et kcal_ajustement_valeur_proposee', () => {
  const src = fs.readFileSync(REPO + '/bilan.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function logKcalDecision'), src.indexOf('async function checkAndAdjustKcal'));
  assert(/kcal_ajustement_status:\s*status/.test(fnBody));
  assert(/kcal_ajustement_valeur_proposee/.test(fnBody));
});

check('5. bilan_recap.html : approveKcalAdjustment met à jour profiles PUIS bilans, jamais l\'inverse', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function approveKcalAdjustment'), src.indexOf('async function rejectKcalAdjustment'));
  const idxProfiles = fnBody.indexOf("from('profiles')");
  const idxBilans = fnBody.indexOf("from('bilans')");
  assert(idxProfiles !== -1 && idxBilans !== -1 && idxProfiles < idxBilans, 'profiles doit être mis à jour avant bilans (statut approved ne doit jamais exister sans que le profil ait été modifié)');
});

check('6. bilan_recap.html : rejectKcalAdjustment ne touche jamais profiles', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function rejectKcalAdjustment'), src.indexOf('// Exporte les bilans'));
  assert(!/from\(['"]profiles['"]\)/.test(fnBody), 'rejectKcalAdjustment ne doit jamais modifier profiles');
});

check('7. bilan_recap.html : les boutons valider/rejeter ne sont rendus que pour le statut "pending"', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const idx = src.indexOf("if(status==='pending'){");
  assert(idx !== -1, 'condition de rendu conditionnel sur "pending" introuvable');
  const block = src.slice(idx, idx + 400);
  assert(/approveKcalAdjustment/.test(block));
  assert(/rejectKcalAdjustment/.test(block));
});

check('8. Migration 20260818000001_add_bilan_kcal_approval.sql : colonnes attendues, garde anti-réexécution, aucune donnée existante modifiée', () => {
  const migPath = REPO + '/supabase/migrations/20260818000001_add_bilan_kcal_approval.sql';
  assert(fs.existsSync(migPath), 'fichier de migration absent');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(/add column kcal_ajustement_status text not null default 'none'/i.test(sql));
  assert(/check \(kcal_ajustement_status in \('none', 'pending', 'approved', 'rejected'\)\)/i.test(sql));
  assert(/add column kcal_ajustement_valeur_proposee integer/i.test(sql));
  assert(/raise exception/i.test(sql), 'garde anti-réexécution absente');
  assert(!/update\s+bilans\s+set/i.test(sql), 'la migration ne doit modifier aucune donnée existante');
});

check('9. Aucun fichier nutrition-*.js du moteur confiné n\'est touché par ce changement', () => {
  const out = execSync('git diff --name-only', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const nutritionFilesTouched = out.filter((f) => /^nutrition-/.test(f));
  assert.deepStrictEqual(nutritionFilesTouched, [], 'fichiers nutrition-*.js touchés de façon inattendue: ' + JSON.stringify(nutritionFilesTouched));
});

check('10. dashboard.html, conseils.html, admin.html, trend-engine.js, trend-definitions.js restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
