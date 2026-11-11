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
- **Zooms rapides sur la vidéo** : **très peu (3 à 4 par vidéo), uniquement sur les vrais moments qui font réagir** (accroche, bonne nouvelle, réponse qui surprend, chiffre). Retour de l'utilisateur : 12 zooms = « on a juste envie de swiper ». Coup de zoom de 7 à 10 % (entrée 0,15 s, tenue 0,9 s, retour 0,4 s). Appliqués **uniquement à la vidéo** par `zoom_render.py` (OpenCV, interpolation cubique, couleurs BT.709) ; sous-titres et cartes restent fixes. La page recalcule la position du menton **avec le zoom** (`zoomAt`). Le planificateur ajoute un zoom quand plus de 3,8 s s'écoulent sans événement.
- **Animations = petits dessins animés (SVG), sans carte blanche et presque sans texte** : jauge, bouclier qui se coche, camembert qui se remplit, robinet, balance, cloche… Les cartes blanches pleines étaient jugées lourdes (« trop de trucs à l'écran »). Contour blanc + ombre pour rester lisible sur le vêtement. C'est l'animation, pas le zoom, qui entretient l'attention.
- **Style des sous-titres** : blanc, contour fin, un seul accent de couleur sur le mot prononcé (défaut : menthe `#7DF2B8`), mots clés en majuscules sans couleur. Trois variantes via `?style=1|2|3` (karaoké jaune, accent jaune, accent menthe) ; montrer la comparaison à l'utilisateur. L'ancien mélange ambre + saumon a été jugé peu beau.
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
- **Pas de logo** CapSanté ni de marque ajoutée sur les vidéos (retiré à la demande de l'utilisateur ; ne pas le remettre sans demande).
- **Son** : version sans sons = audio d'origine tel quel (`-c:a copy`) ; version avec bruitages sobres (voix devant, via `videos/sfx/sfx_mix.py`, audio AAC 256 kbit/s) : voir `MODELE_HOOK_ET_CTA.md` §7. Les calques transparents sont silencieux.
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

## Écriture des scripts : grille et tests (croissance : vues + abonnés)

### Constat de départ (vidéo « fatigue », version avec animations)
- Instagram : **200 vues, dont 159 de non-abonnés (≈ 80 %)**, **72 % d'abandon** avant 3 s (« skip rate »), **24 % encore là à 4 s**, **8 % à 36 s** (la fin). Facebook : 205 vues.
- Lecture : sur les gens qui passent l'accroche, environ **un sur trois va jusqu'à la fin** → la fuite est presque entièrement **dans les 4 premières secondes**. J'aime, enregistrements et relectures légèrement au-dessus de la moyenne : ceux qui restent apprécient.
- 80 % de non-abonnés = la vidéo est montrée à des inconnus : **l'accroche doit convaincre seule**.
- Audience Instagram : surtout 25-40 ans. Audience Facebook : surtout 50-69 ans.
- Limites : une seule vidéo, 400 vues, aucun repère officiel de « bon » taux (Meta n'en publie pas ; comparer à ses propres vidéos). Les conseils ci-dessous viennent de blogs marketing, pas d'une source officielle d'Instagram : ce sont des **hypothèses à tester**, pas des règles prouvées.

### Grille d'écriture (à appliquer avant chaque script)
1. **Accroche (0-3 s)** : voir aussi `MODELE_HOOK_ET_CTA.md` (§1 et §5 : formule **éloge → mais → verdict → promesse chiffrée**, types F1 à F5). Une phrase qui tient seule, qui surprend, contredit ou donne un enjeu. Pas de « Alors », pas de présentation. Texte à l'écran de 3 à 6 mots dès 0,5 s (beaucoup regardent sans le son). Première image en mouvement.
2. **Une seule promesse.** La réponse se garde pour la fin (boucle ouverte). Pas de liste longue sans tension (au-delà de 6-7 s, les gens décrochent).
3. **Durée : 25 à 40 s.** Couper tout ce qui ne sert pas la promesse.
4. **Fin : un appel à l'action OBLIGATOIRE** (un principal, dit à voix haute ET écrit à l'écran ; codes C1 à C5 de `MODELE_HOOK_ET_CTA.md`, §4 ; le plus puissant observé : **C1 = « commente <MOT> et je t'envoie <ressource> en message »**), une **raison précise**, et une **phrase de série** (ex. « Chaque semaine, je vérifie une idée reçue sur ce que tu manges »). Garder la signature « mange l'esprit tranquille ».
5. **Public** (hypothèses) : Instagram 25-40 → énergie/fatigue, sommeil, stress, protéines, mythes alimentaires, compléments « vrai ou faux », repas rapides. Facebook 50-69 → cholestérol, tension, os et articulations, mémoire, sommeil ; rythme plus posé, texte plus grand, thème « envoie à quelqu'un qui… ». Ne pas publier la même vidéo partout sans adapter l'accroche et le ton.
6. **Rigueur santé** : aucun chiffre, source, date ou nom d'organisation inventé ; chaque affirmation de santé a une source à vérifier ; garder les nuances ; « parles-en à ton médecin » sur tout ce qui touche médicaments, maladies, symptômes persistants. Liste « À vérifier » à la fin.
7. **Emballage** : première image/couverture lisible, légende courte avec le mot-clé du sujet, une question épinglée en commentaire.

### Plan de test (à partir du prochain script)
- **Types d'accroche à alterner** : A contradiction · B avertissement (« Stop », « Avant de… ») · C chiffre intrigant · D question à enjeu · E mini-scène / gag · **F éloge → mais → verdict (F1), objet familier (F2), promesse chiffrée (F3), bénéfice d'abord (F4), gag visuel (F5)**. Noter aussi le **code du CTA (C1-C5)** et si la **boucle** (fin qui se prolonge dans le début) était utilisée. Noter le type de chaque vidéo dans `SUIVI.md`.
- **Une seule variable à la fois** quand c'est possible : même format visuel, même durée, même fin ; ne changer que l'accroche (puis, plus tard, que la fin).
- **Juger sur 5 à 6 vidéos**, jamais sur une seule. Comparer à **ses propres** vidéos (médiane), pas à des repères trouvés en ligne.
- **Indicateurs** : taux d'abandon, % à 4 s, % à la fin, temps de visionnage moyen, partages, enregistrements, abonnés gagnés, part de non-abonnés. Instagram et Facebook **séparés**.
- **Décision** : garder un type d'accroche si son taux d'abandon est plus bas ET que partages/abonnés ne baissent pas ; l'abandonner s'il est moins bon sur 2 vidéos ; retester ensuite.
- À chaque nouvelle vidéo publiée : remplir une ligne de `SUIVI.md` (24 h puis 7 jours après).

### Prompt à copier pour écrire un script

```text
Écris le script de ma prochaine vidéo en suivant la grille d'écriture de videos/METHODE.md (section « Écriture des scripts ») et le journal videos/SUIVI.md.

SUJET : [SUJET]
PUBLIC VISÉ : [Instagram 25-40 / Facebook 50-69 / les deux]
TYPE D'ACCROCHE À TESTER : [A contradiction / B avertissement / C chiffre / D question à enjeu / E mini-scène, ou « choisis d'après SUIVI.md »]

CE QUE TU ME LIVRES
1. Trois accroches de types différents (ma voix, 2 phrases maximum, plus un texte d'écran de 3 à 6 mots). Tu recommandes celle à tester et tu expliques pourquoi.
2. Le script complet (25 à 40 s) : une seule promesse, la réponse gardée pour la fin, une seule action finale avec la phrase de série, et ma signature « mange l'esprit tranquille ».
3. Pour chaque affirmation de santé : la source à vérifier. N'invente aucun chiffre, aucune date, aucun nom d'organisation. Garde les nuances. Ajoute « parles-en à ton médecin » quand c'est pertinent. Termine par « À vérifier ».
4. L'appel à l'action (code C1 à C5, phrase parlée exacte + texte d'écran) et, si possible, une **dernière phrase qui se prolonge dans la première** (boucle). Si c'est C1 : le nom de la ressource offerte à créer/confirmer.
5. L'emballage : texte de couverture, légende courte, question à épingler en commentaire.
6. Les lignes à ajouter dans SUIVI.md (type d'accroche, code du CTA, boucle oui/non, durée, public).

Ensuite, on enchaîne avec le prompt de montage (ci-dessous) quand j'aurai enregistré la vidéo.
```

## Modèle de montage de référence (effets, sons) : sans tableau ni décor virtuel

Analyse seconde par seconde d'une vidéo de référence + recettes : **`videos/MODELE_MONTAGE_REFERENCE.md`** (à lire avant toute nouvelle vidéo « niveau pro »).
Boîte à outils :
- `videos/effets/` : `fx.js` + `fx.css` (titre 2 bandes, sous-titres éditoriaux, cartes chat, tampon, étiquette, barre de progression ; les effets « craie/tableau » existent mais sont abandonnés) ; démo `demo.html` ; `render_demo.js` pour les images .
- `videos/sfx/` : `fetch_sfx.py` (télécharge le SFX Kit CC0), `roles.json` (effet → son), `sfx_mix.py` (place chaque son à l'instant visé, `début = moment − sync.at`, baisse sous la voix, mix −14 LUFS). Les effets de `fx.js` exportent `window.FX_SFX` → `events.json` → `sfx_mix.py`.
- **Bruitages : OUI par défaut depuis le 11/11/2026** (demande de l'utilisateur après la vidéo de référence n° 2), sobres et **voix devant** : règles, niveaux mesurés, correspondance effet→son et commandes dans `MODELE_HOOK_ET_CTA.md` §7. Toujours livrer aussi la version sans sons.
- **Gros titres en haut** (serif capitales, 2-4 mots, un par idée) + **CTA animé de fin** (dossier + mot en jaune) : implémentés dans `videos/video3/index.html` (`TITLES`, carte `cG`) ; **jamais pendant un zoom** ni sur le visage (`check_overlap.py`).

Voir aussi : `videos/MODELE_HOOK_ET_CTA.md` (hook, CTA, boucle, bruitages) et `CLAUDE.md` à la racine.

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
- BRUITAGES sobres, voix devant (règles de videos/MODELE_HOOK_ET_CTA.md §7), calés avec videos/sfx/sfx_mix.py ; livre aussi la version sans sons (audio d'origine copié à l'identique).
- APPEL À L'ACTION : prévois-le (code C1 à C5, voir videos/MODELE_HOOK_ET_CTA.md §4), affiché et, si ma voix le dit, calé sur la phrase ; gros titres en haut (2-4 mots) sur les idées fortes, jamais pendant un zoom.
- Animations sobres (fondu, petit rebond, tampon), pas d'effets criards.
- Garde mon attention : quelque chose toutes les 3-4 s (carte, petit zoom rapide sur la vidéo, emoji, texte), mais jamais trop d'éléments à la fois. Donne-moi l'écart le plus long entre deux événements.
- Très peu de zooms (3 à 4 maximum) et seulement sur les moments qui font réagir ; pas pendant l'intro. Beaucoup d'animations visuelles (petits dessins animés), sans cartes blanches, avec très peu de texte. Les sous-titres et cartes restent fixes et suivent mon menton.
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
