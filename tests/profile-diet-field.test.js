/* ──────────────────────────────────────────────────────────────────────
   tests/profile-diet-field.test.js — Vérifications sur l'ajout du champ
   régime déclaratif à l'inscription (index.html) et sa migration associée
   — Cap Santé

   Exécution : node tests/profile-diet-field.test.js
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

check('1. index.html : le formulaire d\'inscription contient un champ régime facultatif (vegetarian/vegan uniquement)', () => {
  const src = fs.readFileSync(REPO + '/index.html', 'utf8');
  assert(/id="s-diet"/.test(src), 'champ #s-diet absent');
  assert(/value="vegetarian"/.test(src));
  assert(/value="vegan"/.test(src));
  assert(/<option value="">/.test(src), 'aucune option vide ("aucune restriction") trouvée');
});

check('2. index.html : signup() lit #s-diet, convertit la chaîne vide en null, et l\'inclut dans l\'upsert profiles', () => {
  const src = fs.readFileSync(REPO + '/index.html', 'utf8');
  assert(/getElementById\('s-diet'\)\.value \|\| null/.test(src), 'lecture/normalisation de #s-diet introuvable');
  const upsertBlock = src.slice(src.indexOf("sb.from('profiles').upsert"), src.indexOf("sb.from('profiles').upsert") + 300);
  assert(/diet:\s*diet/.test(upsertBlock), 'le champ diet n\'est pas transmis à profiles.upsert');
});

check('3. index.html : le champ régime reste facultatif (ne bloque pas la validation du formulaire)', () => {
  const src = fs.readFileSync(REPO + '/index.html', 'utf8');
  const validation = src.slice(src.indexOf('async function signup()'), src.indexOf('async function signup()') + 700);
  assert(!/!diet/.test(validation), 'le champ diet est traité comme obligatoire dans la validation');
});

check('4. Migration 20260818000000_add_profile_diet.sql : colonne nullable, valeurs limitées à vegetarian/vegan, garde anti-réexécution', () => {
  const migPath = REPO + '/supabase/migrations/20260818000000_add_profile_diet.sql';
  assert(fs.existsSync(migPath), 'fichier de migration absent');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert(/add column diet text/i.test(sql));
  assert(/check \(diet is null or diet in \('vegetarian', 'vegan'\)\)/i.test(sql), 'contrainte CHECK absente ou incorrecte');
  assert(/raise exception/i.test(sql), 'garde anti-réexécution absente');
  assert(!/not null/i.test(sql.split('add column diet text')[1] || ''), 'la colonne ne doit pas être NOT NULL (facultative)');
});

check('5. dashboard.html, conseils.html, admin.html, trend-engine.js, trend-definitions.js restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'admin.html', 'trend-engine.js', 'trend-definitions.js'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
