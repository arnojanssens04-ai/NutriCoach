# NutriCoach : mémoire du projet

## Vidéos Instagram / TikTok du diététicien (dossier `videos/`)
À lire AVANT toute demande de script ou de montage vidéo :
- `videos/METHODE.md` : méthode complète (transcription Whisper, alignement mot à mot, visage, layout, export CRF 12, grille d'écriture, plan de test, prompts à copier).
- `videos/MODELE_HOOK_ET_CTA.md` : **hook (formules F1-F5), appel à l'action (C1-C5), boucle, bruitages** tirés d'une vidéo virale.
- `videos/MODELE_MONTAGE_REFERENCE.md` : effets de montage (titres, sous-titres éditoriaux, cartes, tampon, zooms secs).
- `videos/SUIVI.md` : journal des vidéos et de leurs résultats (une ligne par vidéo).
- Boîte à outils : `videos/effets/` (fx.js, fx.css), `videos/sfx/` (bruitages calés), dernier montage de référence : `videos/video3/`.

### Règles permanentes (validées par l'utilisateur)
1. **Le visage et les mains restent visibles** : rien sur le visage, jamais (`check_overlap.py`). Texte sous le menton, animations compactes sur le pull.
2. **Chaque vidéo contient un appel à l'action** (1 principal, dit à voix haute ET écrit à l'écran). Codes C1 mot-clé→ressource, C2 abonnement+prochaine vidéo, C3 enregistrer, C4 partager, C5 question. L'utilisateur confirme que la ressource promise existe.
3. **Chaque script propose un hook** de type F1 (éloge → mais → verdict), F2, F3 (promesse chiffrée), etc. Pas de salutation, verdict net, texte à l'écran dès 0 s. Une seule variable testée à la fois ; noter le type dans `SUIVI.md`.
4. **Bruitages : oui par défaut**, sobres, voix devant (6-16 dB sous la voix), un son par événement visuel, calés avec `videos/sfx/sfx_mix.py`. Toujours livrer aussi la version sans sons.
5. **Pas de tableau / décor de classe / texte à la craie** (abandonné le 11/11/2026). Pas de logo CapSanté. Peu de zooms (3-4, sur les moments qui surprennent).
6. **Santé** : aucun chiffre, source, date ou organisation inventés ; nuances gardées ; « parles-en à ton médecin » si pertinent ; liste « À vérifier » ; pas de peur gratuite.
7. Signature : « mange l'esprit tranquille ». Voix de l'utilisateur = référence (la transcription fait foi, validation du texte avant de construire).
8. Ne jamais commiter les vidéos ni les modèles (dossiers `in/`, `out/`, `*.onnx`, `kit/sounds/` ignorés par git). Rappeler à l'utilisateur de repasser le partage Drive en « Restreint ».
