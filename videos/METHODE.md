# Méthode : sous-titres + animations calés sur la voix (Reels / TikTok)

Méthode validée sur la vidéo « fatigue et nutriments » (code de référence : `videos/fatigue/`).

## Pré-requis (une seule fois)
- Environnement cloud `nutricoach` : il autorise déjà Hugging Face (modèle Whisper) et Google Drive (téléchargement de la vidéo).
  Dans un autre environnement, il faut demander l'accès réseau à ces hôtes (l'utilisateur approuve).
- Python : `faster-whisper`, `opencv-python-headless==4.10.0.84`, `numpy<2.3`. Node : `playwright` (déjà installé). `ffmpeg` présent.
- Le modèle `medium` de Whisper se télécharge tout seul.

## Étapes
1. **Récupérer la vidéo.** L'outil Drive est limité à 10 Mo et à du texte base64 : impossible pour une vidéo.
   Procédure : l'utilisateur passe le fichier en « Toute personne disposant du lien » → `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`
   vers `videos/<nom>/in/` (dossier ignoré par git) → dire à l'utilisateur de repasser le partage sur « Restreint ». Je ne peux pas révoquer un partage moi-même.
2. **Transcrire la voix** : `python3 align.py in/<video>.mp4 medium`. **Sans `initial_prompt`** (un long texte indice fait dérailler Whisper).
3. **Comparer avec le script.** Si la voix ne suit pas le script (cas fréquent), la voix fait foi : présenter la transcription, proposer un texte corrigé
   (en gras ce qui a été mal compris), et **attendre la validation de l'utilisateur** avant de construire quoi que ce soit.
4. **Mettre le texte validé dans `SEGS`** de `index.html` (blocs séparés par `|`, mots clés entre `*…*`), relancer `node render.js prep`, puis `align.py` : chaque mot du script reçoit ses horaires réels (`out/words.json`).
5. **Repérer le visage** : `python3 faces.py in/<video>.mp4` → `out/zones.json` (boîte du visage toutes les 0,25 s + gros plans où le visage disparaît).
6. **Construire les animations** (petites, sur le pull), **rendre** : `node render.js pass subs` et `node render.js pass vis` (en parallèle), puis export final haute qualité (commande ci-dessous).
7. **Contrôler** (`python3 check_overlap.py`) : le visage ne doit jamais être recouvert ; images de contrôle `node render.js stills t1,t2,…` ; `.srt` valide.

## Règles de mise en page (validées par l'utilisateur)
- **Rien sur le visage, jamais.** Tout est positionné à partir du bas du visage (menton + 60 px de cou), mesuré dans la vidéo.
- **Animations** : version compacte (≈ 210 px de haut, ≈ 860 px de large), sur le pull, juste sous le menton (≥ 1075 px). Les mains peuvent être recouvertes (accepté).
- **Texte** : sans bandeau (lettres blanches cerclées de noir), 3 à 6 mots, 2 lignes max, mot prononcé en jaune, mots clés en accent et majuscules. Il se place **sous** les animations (bas ≈ 1450 px) et **remonte** quand il n'y a pas d'animation.
- **Gros plan** (visage qui remplit l'écran) : plus d'animation, le texte descend sous le menton.
- Zones d'interface Instagram : garder ~250 px libres en haut, ~450 px en bas, ~120 px à droite ; texte et cartes entre x = 100 et 960.
- **Aucun effet sonore** : on garde l'audio d'origine tel quel (`-c:a copy`). Les calques transparents sont silencieux.
- **Animations sobres** : fondus, petit rebond, tampon ; pas de gros effets. Il n'est pas obligatoire de tout illustrer : le texte seul suffit parfois.
- **Santé** : aucun chiffre, aucune source, aucune date inventés ; garder les nuances (« possible », « modeste ») ; consigne « parles-en à ton médecin » affichée ≥ 3 s ; lister ce qui est à vérifier.

## Export final (qualité maximale, audio d'origine)
```bash
ffmpeg -i in/<video>.mp4 -i out/visuels_transparent.mov -i out/sous-titres_transparent.mov \
  -filter_complex "[0:v][1:v]overlay=shortest=1[a];[a][2:v]overlay=shortest=1,format=yuv420p[v]" \
  -map "[v]" -map 0:a -c:v libx264 -preset slow -crf 12 -profile:v high \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a copy -movflags +faststart \
  out/sur_ta_video_haute_qualite.mp4
```
Livrables : cette vidéo, `sous-titres_transparent.mov` + `visuels_transparent.mov` (ProRes 4444) et leurs versions `_fond-vert.mp4`, `sous-titres.srt`, `tableau.md`, une planche de contrôle.

## Limites connues
- Les mains ne sont pas détectables de façon fiable (leur couleur ressemble à celle d'un pull beige) : elles ne sont pas protégées, seulement le visage.
- La détection du visage (Haar) échoue parfois quand la main passe devant ou en gros plan ; le gros plan est traité par une zone « visage introuvable ».
- Les chiffres de zones de sécurité viennent de blogs tiers et varient : toujours vérifier l'aperçu sur téléphone.
- Whisper entend parfois mal (« ayant » → « quand une ») : l'alignement interpole ces mots, le texte affiché reste celui validé.

## Prompt à copier pour une nouvelle vidéo

```text
Reprends la méthode du dépôt : lis d'abord videos/METHODE.md et réutilise le code de videos/fatigue/ (copie-le dans videos/<nom-de-la-video>/).

CE QUE JE TE DONNE
- Le lien Google Drive de ma vidéo : [LIEN]. Il est partagé en « Toute personne disposant du lien » ; je le repasse en « Restreint » quand tu me le dis.
- Mon script (facultatif) : [SCRIPT]. Si je dis autre chose que le script, c'est ma voix qui fait foi.

CE QUE JE VEUX
Des sous-titres animés et de petites animations calés sur ma voix, posés sur ma vidéo. Mon visage doit TOUJOURS rester visible : rien dessus, jamais.

ÉTAPES
1. Télécharge ma vidéo (lien partagé), transcris ma voix avec les horaires de chaque mot (Whisper, sans initial_prompt).
2. Montre-moi ce que j'ai réellement dit et propose un texte corrigé (en gras ce qui a pu être mal compris). ATTENDS MA VALIDATION avant de construire.
3. Propose-moi le tableau « temps / phrase / animation prévue », en indiquant ce qui reste en texte seul. Pas besoin d'illustrer tout : le texte suffit parfois. Si je ne réponds pas, avance avec ta proposition.
4. Repère mon visage (faces.py) et construis tout à partir de la position de mon menton.

RÈGLES DE MISE EN PAGE
- Animations compactes sur le pull, juste sous mon menton ; les mains peuvent être recouvertes.
- Texte sans bandeau (lettres cerclées), 3 à 6 mots, 2 lignes max, mot prononcé en couleur, sous les animations ; il remonte quand il n'y a pas d'animation.
- Pendant un gros plan : pas d'animation, le texte passe sous le menton.
- Garde ~250 px libres en haut, ~450 px en bas, ~120 px à droite (interface Instagram).
- AUCUN effet sonore : garde mon audio d'origine tel quel.
- Animations sobres (fondu, petit rebond, tampon), pas d'effets criards.

RIGUEUR SANTÉ
- N'invente aucun chiffre, aucune source, aucune date. Garde mes nuances (« possible », « modeste »).
- Une consigne « parles-en à ton médecin » reste affichée au moins 3 s.
- Liste à la fin ce qui est « À vérifier » et ce que tu as ajouté de ton côté.

CONTRÔLE AVANT LIVRAISON
- Lance check_overlap.py : mon visage ne doit jamais être recouvert (donne-moi le résultat).
- Vérifie des images clés sur ma vidéo, le .srt (horaires valides), l'orthographe, la synchro mot par mot.
- Dis-moi honnêtement ce que tu n'as PAS pu vérifier (par exemple mes mains).

LIVRAISON
- sur_ta_video_haute_qualite.mp4 (export CRF 12, audio d'origine copié), les calques transparents et fond vert, le .srt, le tableau et une planche de contrôle.
- Commite le code (pas les vidéos) sur la branche de la session, puis dis-moi de repasser mon partage Drive en « Restreint ».
```
