/* ──────────────────────────────────────────────────────────────────────
   tests/bilan-parler-traite.test.js — Vérifie que l'admin peut marquer
   une demande "je souhaite en parler" comme traitée immédiatement,
   sans attendre le prochain bilan hebdomadaire (bilan_recap.html) —
   Cap Santé

   Exécution : node tests/bilan-parler-traite.test.js
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

check('1. renderParlerBanner() exclut les bilans déjà marqués parler_traite', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const fnBody = src.slice(src.indexOf('function renderParlerBanner'), src.indexOf('async function markParlerTraite'));
  assert(/bilans\[0\]\.souhaite_en_parler && !bilans\[0\]\.parler_traite/.test(fnBody), 'le filtre parler_traite est absent');
});

check('2. Le bouton "Marqué comme traité" appelle markParlerTraite avec l\'id du bilan', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const idx = src.indexOf('markParlerTraite(');
  assert(idx !== -1, 'aucun appel à markParlerTraite trouvé');
  const call = src.slice(idx, idx + 40);
  assert(call.includes('r.bilanId'), 'l\'id du bilan (r.bilanId) n\'est pas transmis: ' + call);
});

check('3. markParlerTraite() met à jour bilans.parler_traite=true puis re-render la bannière (sans recharger toute la page)', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function markParlerTraite'), src.indexOf('async function markParlerTraite') + 500);
  assert(/update\(\{parler_traite:true\}\)/.test(fnBody));
  assert(/renderParlerBanner\(\)/.test(fnBody), 'la bannière n\'est pas rafraîchie après la mise à jour');
});

check('4. markParlerTraite() gère un échec de mise à jour explicitement (jamais un échec silencieux)', () => {
  const src = fs.readFileSync(REPO + '/bilan_recap.html', 'utf8');
  const fnBody = src.slice(src.indexOf('async function markParlerTraite'), src.indexOf('async function markParlerTraite') + 500);
  assert(/if\(r\.error \|\| !r\.data \|\| !r\.data\.length\)/.test(fnBody));
});

check('5. Migration 20260818000003_add_bilan_parler_traite.sql : colonne booléenne, garde anti-réexécution, aucune donnée existante modifiée', () => {
  const migPath = REPO + '/supabase/migrations/20260818000003_add_bilan_parler_traite.sql';
  assert(fs.existsSync(migPath), 'fichier de migration absent');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(/add column parler_traite boolean not null default false/i.test(sql));
  assert(/raise exception/i.test(sql), 'garde anti-réexécution absente');
  assert(!/update\s+bilans\s+set/i.test(sql), 'la migration ne doit modifier aucune donnée existante');
});

check('6. Aucun fichier nutrition-*.js du moteur confiné n\'est touché par cette fonctionnalité', () => {
  const out = execSync('git diff --name-only', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const nutritionFilesTouched = out.filter((f) => /^nutrition-/.test(f));
  assert.deepStrictEqual(nutritionFilesTouched, [], 'fichiers nutrition-*.js touchés de façon inattendue: ' + JSON.stringify(nutritionFilesTouched));
});

check('7. dashboard.html, conseils.html, admin.html, bilan.html, trend-engine.js, trend-definitions.js restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'admin.html', 'bilan.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
