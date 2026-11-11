# Bibliothèque d'effets
`demo.html` montre chaque effet ; `fx.js`/`fx.css` les définissent (repère 1080×1920, `fx.render(t)`).
`node render_demo.js frames 3,8,20` → PNG dans `out/` ; `node render_demo.js events` → `out/events.json` (sons).
`matting/matte.py in.jpg mask.png` ou `--video in.mp4 dir/` : masque de personne (modèle téléchargé depuis Hugging Face).
Voir `../MODELE_MONTAGE_REFERENCE.md`.
