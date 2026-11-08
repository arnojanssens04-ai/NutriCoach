# Méthode : sous-titres + animations calés sur la voix (Reels / TikTok)

Méthode validée sur les vidéos « fatigue et nutriments » (`videos/fatigue/`) et « pomme » (`videos/video2/`, **version la plus récente : à copier de préférence**).

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


## Évolutions apportées par la vidéo « pomme » (`videos/video2/`)
- **Pas de script de départ** : `python3 transcribe.py in/<video>.mp4` transcrit la voix (Whisper medium, sans `initial_prompt`) → `out/transcription.json`. Après validation du texte, `python3 align.py in/<video>.mp4 medium --reuse` recale le texte validé sur ces horaires sans relancer Whisper.
- **Visage plus robuste** (`faces.py` v2) : plusieurs détecteurs, plusieurs inclinaisons de tête, profils, filtre de plausibilité (taille, forme, hauteur), vote entre détecteurs, cohérence d'une image à l'autre, comblement des trous < 0,75 s. Contrôle visuel obligatoire (boîtes dessinées sur des images). Le début de vidéo peut rester peu fiable (pomme devant la bouche, tête tournée, gros plan).
- **Début de vidéo prudent** : `INTRO_END` dans `index.html` (≈ 9 s ici) = sous-titres seuls, aucune carte, aucun zoom, menton supposé à ≥ 1260 px. À régler selon la vidéo.
- **Zooms rapides sur la vidéo** : petits coups de zoom (6 à 10 %, entrée 0,15 s, tenue 0,9 s, retour 0,4 s) au début de chaque idée, jamais pendant l'intro. Appliqués **uniquement à la vidéo** par `zoom_render.py` (OpenCV, interpolation cubique, couleurs BT.709) ; sous-titres et cartes restent fixes. La page recalcule la position du menton **avec le zoom** (`zoomAt`). Le planificateur ajoute un zoom quand plus de 3,8 s s'écoulent sans événement.
- **Rythme** : l'attention se perd après 3 à 4 s : `layout.json → rythme` donne le nombre d'événements (carte, zoom, emoji) et le plus long écart après l'intro (objectif ≤ 3,8 s).
- **Emojis dans les sous-titres** : syntaxe `*techniques*{🧼}` dans `SEGS`. À utiliser avec parcimonie (1 ou 2 par vidéo) : l'utilisateur veut garder l'attention sur le reste ; aucun emoji pendant l'intro.
- **Export final** : `node render.js pass subs` + `node render.js pass vis` (en parallèle), puis `python3 zoom_render.py out/sur_ta_video_haute_qualite.mp4` (zoom + calques + audio copié, CRF 12). Contrôles : `check_overlap.py` (tient compte du zoom), SSIM/PSNR sur une zone sans graphisme, MD5 de la piste audio (doit être identique à la source).
- **Cartes** : réduites (≈ 210 px de haut), sur la chemise sous le menton, une carte par idée forte (jauge « sous la limite », balance, fraction −1/3, etc.), **sans chiffre ajouté**. Une organisation citée (ex. EFSA) est confirmée par l'utilisateur avant affichage.

## Règles de mise en page (validées par l'utilisateur)
- **Rien sur le visage, jamais.** Tout est positionné à partir du bas du visage (menton + 60 px de cou), mesuré dans la vidéo.
- **Animations** : version compacte (≈ 210 px de haut, ≈ 860 px de large), sur le pull, juste sous le menton (≥ 1075 px). Les mains peuvent être recouvertes (accepté).
- **Texte** : sans bandeau (lettres blanches cerclées de noir), 3 à 6 mots, 2 lignes max, mot prononcé en jaune, mots clés en accent et majuscules. Il se place **sous** les animations (bas ≈ 1450 px) et **remonte** quand il n'y a pas d'animation.
- **Gros plan** (visage qui remplit l'écran) : plus d'animation, le texte descend sous le menton.
- Zones d'interface Instagram : garder ~250 px libres en haut, ~450 px en bas, ~120 px à droite ; texte et cartes entre x = 100 et 960.
- **Aucun effet sonore** : on garde l'audio d'origine tel quel (`-c:a copy`). Les calques transparents sont silencieux.
- **Animations sobres** : fondus, petit rebond, tampon ; pas de gros effets. Il n'est pas obligatoire de tout illustrer : le texte seul suffit parfois.
- **Rythme** : viser un événement (carte, zoom, emoji, nouveau texte) toutes les 3 à 4 s, sans surcharger : 1 ou 2 éléments à la fois.
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
- Garde mon attention : quelque chose toutes les 3-4 s (carte, petit zoom rapide sur la vidéo, emoji, texte), mais jamais trop d'éléments à la fois. Donne-moi l'écart le plus long entre deux événements.
- Petits zooms rapides (6 à 10 %) sur ma vidéo ; pas pendant l'intro. Les sous-titres et cartes restent fixes et suivent mon menton.
- Emojis dans les sous-titres : très peu, jamais pendant l'intro.
- Sous-titres agréables à lire : mots clés en couleur, changements doux.

RIGUEUR SANTÉ
- N'invente aucun chiffre, aucune source, aucune date. Garde mes nuances (« possible », « modeste »).
- Une consigne « parles-en à ton médecin » reste affichée au moins 3 s.
- Liste à la fin ce qui est « À vérifier » et ce que tu as ajouté de ton côté.

CONTRÔLE AVANT LIVRAISON
- Lance check_overlap.py : mon visage ne doit jamais être recouvert (donne-moi le résultat).
- Vérifie des images clés sur ma vidéo, le .srt (horaires valides), l'orthographe, la synchro mot par mot.
- Dis-moi honnêtement ce que tu n'as PAS pu vérifier (par exemple mes mains).

LIVRAISON
- sur_ta_video_haute_qualite.mp4 (export CRF 12 avec zooms, audio d'origine copié à l'identique), les calques transparents et fond vert, le .srt, le tableau et une planche de contrôle.
- Commite le code (pas les vidéos) sur la branche de la session, puis dis-moi de repasser mon partage Drive en « Restreint ».
```
