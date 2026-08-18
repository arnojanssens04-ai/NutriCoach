/* ──────────────────────────────────────────────────────────────────────
   tests/chat-whatsapp-redesign.test.js — Vérifications sur le
   renommage "Discussion" et la refonte visuelle WhatsApp de
   chat.html / chat-admin.html — Cap Santé

   Exécution : node tests/chat-whatsapp-redesign.test.js
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

check('1. admin.html : le lien vers chat-admin.html est libellé "Discussion", plus "Messages"', () => {
  const src = fs.readFileSync(REPO + '/admin.html', 'utf8');
  const idx = src.indexOf('href="chat-admin.html"');
  const tag = src.slice(idx, idx + 120);
  assert(tag.includes('Discussion'), 'libellé "Discussion" absent');
  assert(!/>\s*.{0,10}Messages\s*<\/a>/.test(tag), 'ancien libellé "Messages" encore présent');
});

check('2. chat.html et chat-admin.html : plus aucune référence "Messages" dans le titre/en-tête', () => {
  ['chat.html', 'chat-admin.html'].forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const title = src.match(/<title>([\s\S]*?)<\/title>/)[1];
    assert(!/Messages/i.test(title), f + ' : le titre contient encore "Messages"');
  });
});

check('3. chat.html : palette WhatsApp présente (en-tête vert-teal, bulle envoyée verte, bulle reçue blanche)', () => {
  const src = fs.readFileSync(REPO + '/chat.html', 'utf8');
  assert(/--wa-header:\s*#075e54/.test(src));
  assert(/--wa-sent:\s*#dcf8c6/.test(src));
  assert(/--wa-received:\s*#ffffff/.test(src));
});

check('4. chat-admin.html : même palette WhatsApp que chat.html (cohérence patient/admin)', () => {
  const src = fs.readFileSync(REPO + '/chat-admin.html', 'utf8');
  assert(/--wa-header:\s*#075e54/.test(src));
  assert(/--wa-sent:\s*#dcf8c6/.test(src));
  assert(/--wa-received:\s*#ffffff/.test(src));
});

check('5. chat.html et chat-admin.html : toutes les fonctions JS existantes sont préservées (aucune régression fonctionnelle par la refonte visuelle)', () => {
  const expectedChatFns = ['loadMessages', 'sendMessage', 'deleteMessage', 'startEditMessage', 'saveEditMessage', 'subscribeRealtime', 'checkProactiveMessages', 'onFileSelected'];
  const chatSrc = fs.readFileSync(REPO + '/chat.html', 'utf8');
  expectedChatFns.forEach((fn) => assert(new RegExp('function ' + fn + '\\(').test(chatSrc), 'chat.html : fonction ' + fn + ' manquante'));

  const expectedAdminFns = ['loadAllMessages', 'renderConvList', 'openConv', 'sendReply', 'toggleUserFocusMode', 'deleteMessage', 'startEditMessage'];
  const adminSrc = fs.readFileSync(REPO + '/chat-admin.html', 'utf8');
  expectedAdminFns.forEach((fn) => assert(new RegExp('function ' + fn + '\\(').test(adminSrc), 'chat-admin.html : fonction ' + fn + ' manquante'));
});

check('6. chat.html : les deux scripts inline restent syntaxiquement valides', () => {
  ['chat.html', 'chat-admin.html'].forEach((f) => {
    const src = fs.readFileSync(REPO + '/' + f, 'utf8');
    const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert(scripts.length > 0, f + ' : aucun bloc <script> inline trouvé');
    scripts.forEach((m) => new Function(m[1])); // lève si erreur de syntaxe
  });
});

check('7. Aucun fichier nutrition-*.js du moteur confiné n\'est touché par cette refonte', () => {
  const out = execSync('git diff --name-only', { cwd: REPO }).toString().trim().split('\n').filter(Boolean);
  const nutritionFilesTouched = out.filter((f) => /^nutrition-/.test(f));
  assert.deepStrictEqual(nutritionFilesTouched, [], 'fichiers nutrition-*.js touchés de façon inattendue: ' + JSON.stringify(nutritionFilesTouched));
});

check('8. dashboard.html, conseils.html, trend-engine.js, trend-definitions.js, bilan.html, bilan_recap.html restent inchangés', () => {
  ['dashboard.html', 'conseils.html', 'trend-engine.js', 'trend-definitions.js', 'bilan.html', 'bilan_recap.html'].forEach((f) => {
    const out = execSync('git diff --stat -- ' + f, { cwd: REPO }).toString().trim();
    assert.strictEqual(out, '', f + ' a été modifié: ' + out);
  });
});

console.log('\n--- RÉSUMÉ ---');
console.log('Réussis: ' + passed + ' / ' + (passed + failed));
if (failed > 0) { console.log('ÉCHECS: ' + failed); process.exitCode = 1; }
else { console.log('Tous les tests sont passés.'); }
