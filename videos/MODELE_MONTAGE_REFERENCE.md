# Modèle de montage de référence : analyse et recettes

Source : vidéo de référence fournie par l'utilisateur (11/11/2026), **enregistrement d'écran d'une publicité Instagram** (compte `thuan.aime.academy`, « Apprends à monter tes vidéos avec Claude »), 74,7 s, 592×1280, 30 i/s, stéréo 44,1 kHz.
Fichier de travail : `videos/reference/` (vidéo dans `in/`, ignorée par git). Analyse faite par mesures (coupes, zoom, spectrogramme, transcription Whisper) et lecture d'images.

> **DÉCISION DE L'UTILISATEUR (11/11/2026) : l'idée du « tableau » est abandonnée.** On ne garde **ni** le décor de tableau/classe virtuel, **ni** le détourage (texte derrière la personne), **ni** le texte et les dessins « à la craie », **ni** la carte « tableau d'effets », **ni** le cadre « leçons/interro ». Les sections T1, T4, T5, T6 (version craie), T9 (tableau) et T13 ci-dessous sont **conservées pour mémoire seulement : ne pas les utiliser**. Ce qu'on garde : sous-titres éditoriaux (T3), titre 2 bandes (T2), coupes-zoom sèches (T7), transition (T8), carte chat (T9), tampon (T10), étiquette (T11), barre de progression (T12), rythme, sons optionnels. Le texte reste directement sur la vidéo, sous le menton, jamais sur le visage.

> **À lire d'abord**
> - **L'interface n'est pas du montage** : barre d'état de l'iPhone, icônes à droite, « En savoir plus », profil, barre « Ajouter un commentaire », et la fenêtre « Limite de temps » d'iOS de 16,4 s à 19,6 s (le son est coupé pendant ce passage). Tout le reste est le montage.
> - **On reprend des techniques, pas une marque** : ne pas copier le personnage (institutrice en costume), le décor exact, les textes ni le logo. Le but est un langage de montage réutilisable avec **notre** palette (vert, crème, terracotta) et **nos** contenus.
> - C'est une analyse d'après une copie d'écran de faible résolution : les polices et certaines valeurs sont des **estimations** (marquées « ~ »). Le projet d'origine n'est pas accessible. Les effets ressemblent à ce que produit un montage en code (type Remotion) : c'est une inférence, pas une certitude.

---

## 1. La formule en une page

| Élément | Ce que fait la référence | Ce qu'on en retient |
|---|---|---|
| **Concept** | Un « cours » : décor de salle de classe, 4 leçons numérotées, « interro surprise » à la fin | Un cadre répétable qui structure le récit (leçons, vrai/faux, étapes) et donne une raison de rester : « leçon suivante » |
| **Accroche (0-6 s)** | Titre en 2 bandes blanches + avant/après visuel (« TON RUSH » → « MONTÉ PAR CLAUDE ») + promesse dite à voix haute | Une promesse nette, écrite ET dite, dès la 1re image |
| **Structure** | Hook 6 s → problème 9 s (flemme, temps, coût) → leçons 1 à 4 (~11 s chacune) → cliffhanger « interro surprise » | Boucle ouverte annoncée (« 4 leçons ») ; une idée = un bloc = un titre à l'écran |
| **Rythme visuel** | ~60 événements visuels en 74 s (≈ un toutes les 1,2 s) ; jamais plus de 3 s sans rien de nouveau, **mais tout est calé sur la parole** et la composition reste stable | Beaucoup de petits événements **légers et ancrés sur les mots** ≠ beaucoup d'éléments qui encombrent |
| **Cadrage** | Plan large presque tout le temps, + **coupes-zoom** sèches ×1,5 à ×1,7 sur les mots forts (7 en 75 s, tenues 1 à 3,5 s) | Peu de zooms, **sur les moments qui font réagir**, en coupe franche |
| **Texte** | Sous-titres petits en italique à empattements + texte « écrit au tableau » lettre par lettre, derrière la personne | Le texte à l'écran est une **partie du décor**, pas un bandeau posé dessus |
| **Son** | Voix seule, très forte (−13,9 LUFS, pic −1 dBFS), pas de musique ; quelques sons d'interface (ding, impact) | Voix d'abord ; sons rares et précis (voir §6) |
| **Fin** | Question ouverte (« petite interro surprise ! ») + tableau effacé en balayage | Invite au commentaire / à la suite |

Palette relevée (~) : vert tableau `#304836` · craie crème `#EDE8C8` / titres `#D9D58C` · cartes `#FBFAF7` · doré `#B8923A` · noir chaud `#201C1A` · blanc cassé `#EDEFED` · orange (astérisque) `#D9694F` · tampon vert `#2F7D4F`.
Correspondance avec notre palette : vert `#2D5A43` ≈ tableau ; crème `#FBF9F5` ≈ cartes ; terracotta `#E07A5F` ≈ orange. **Aucun changement de charte nécessaire.**

---

## 2. Les techniques (une recette par effet)

Chaque effet existe sous forme de fonction dans `videos/effets/fx.js` (+ `fx.css`) et déclare ses événements sonores (rôles de `videos/sfx/roles.json`). Démo : `videos/effets/demo.html`.

### T1. ~~Décor virtuel + détourage~~ (ABANDONNÉ)
- **Observé** : la présentatrice est découpée (contour de cheveux visible à 25,3 s) et placée devant un décor de tableau vert en perspective (texture de craie légèrement animée). Le texte du tableau passe **derrière** sa tête et son bras ; la règle (accessoire) passe devant.
- **Pourquoi c'est fort** : le texte fait partie de la scène, la personne reste toujours visible, rien ne la recouvre.
- **Reproduire** : `videos/effets/matting/matte.py` (MODNet, Apache-2.0, `onnxruntime`) → masque alpha par image ; composition : `image = personne × masque + décor × (1 − masque)`, avec le texte dessiné **dans le décor**. Essai sur ta vidéo « pomme » : masque propre, 0,7 s par image sur le processeur → **≈ 17 min** pour 48 s (à lancer en tâche de fond ; possible à 384 px pour aller ~2× plus vite).
- **Contraintes** : le décor doit être assez sobre pour ne pas distraire ; garder le lissage temporel du masque (0,6/0,4) pour éviter le scintillement ; vérifier mains/objets tenus (la pomme).

### T2. Titre en deux bandes blanches
- Deux bandes pleine largeur empilées (hauteur ≈ 76 px en 1080×1920), fond `#EDEFED`, texte noir `#201C1A`, **majuscules très grasses** (~Archivo Black / police grotesque extra-grasse, ≈ 52 px), la 2ᵉ bande déborde de l'écran. Présent dès t = 0, **sans animation d'entrée**, se déplace avec le plan pendant la transition, **fondu de sortie ~0,3 s** (ici 5,9-6,3 s). Fonction `fx.titleBars`.
- Pour Instagram organique : placer les bandes sous 250 px du haut.

### T3. Sous-titres éditoriaux
- **Petits, italique à empattements** (~Playfair Display Italic 400), blancs, **ombre douce** (`0 2 10 rgba(0,0,0,.5)`), centrés, vers **62 % de la hauteur** (≈ y 1190 sur 1920), ~34-38 px (très petits comparés à nos 56 px).
- **Groupes de 2 à 4 mots** (« Alors aujourd'hui, » / « on se retrouve pour »), ~0,9-1,1 s chacun, **changement sec** (pas d'animation, pas de mot-à-mot, pas de couleur d'accent).
- Calage : le groupe apparaît ~0,15-0,2 s avant son premier mot et laisse sa place au suivant ~0,15 s après le premier mot du groupe suivant. Fonction `fx.subtitles`.

### T4. ~~Texte « écrit au tableau »~~ (ABANDONNÉ)
- Lettre par lettre, **vitesse ≈ 15-25 caractères/s**, démarre juste avant le mot prononcé et se termine à la fin de la phrase. Police ~Cormorant Garamond Italic 500 (corps ≈ 44-46 px), craie crème `#EDE8C8`, léger bruit/flou (effet craie : filtre `feTurbulence` + `feDisplacementMap`, flou 0,35).
- **Titres de leçon** (« LEÇON N°1 ») : majuscules grasses couleur `#D9D58C`, tapés en ~0,9 s. Date en petit en haut à gauche du tableau (« Jeudi 29 octobre »).
- Listes : puces « – », une ligne par idée, tapée au moment où l'idée est dite. Fonction `fx.typed`.

### T5. ~~Annotations à la craie~~ (ABANDONNÉ)
- **Cercle/ovale** tracé autour d'un mot-clé (0,5 s, dépasse un peu son point de départ, s'estompe ~0,5 s après) ; **coche** (✓) et **croix** (✗) dessinées en 0,22 s ; **dessins** (horloge, voiture « Lambo », palmier « Bali », courbe qui descend) tracés trait par trait. Technique : tracé SVG à longueur normalisée (`pathLength=100`, `stroke-dashoffset` de 100 → 0, easing in-out) + même filtre craie. Fonctions `fx.ellipse`, `fx.mark`.

### T6. Compteur qui monte
- Un chiffre (« erreur n° 3 968 » → « 15 000 ») monte pendant ~0,8 s (easing sortant) puis se « pose » avec un léger rebond d'échelle (+12 %) et un **cercle** est tracé autour. Espaces en séparateur de milliers. Fonction `fx.countup` (sons : compteur + « chiffre qui se pose »).

### T7. Coupes-zoom (punch-in)
- **Coupes sèches, sans transition** (1 à 2 images) vers un cadrage ~×1,5 à ×1,7 (visage mesuré), tenu 1 à 3,5 s, puis retour sec au plan large. Instants relevés (coupe-arrière → coupe-avant) : **25,3 → 28,7 s**, **34,9 → 36,1 s**, **42,5 → 44,3 s**, **45,0 → 45,7 s**, **46,8 → 50,2 s** (3,4 s, le plus long), **58,4** (zoom léger), **71,6 → 73,4 s**.
- Motivation : toujours un mot fort (« **Ce n'est pas** sur le téléphone », « **Notez bien** », « **Tout sera comme vous l'aimez** », « **vous revenez et c'est prêt** »).
- **Chez nous** : `zoom_render.py` fait déjà des zooms ; pour reproduire la coupe sèche, mettre `in: 0` et `out: 0` (instantané) et un facteur de 1,5 à 1,7 (au lieu de 1,07 à 1,10). Les sous-titres, cartes et texte du décor ne zooment pas avec le plan **sauf** le texte « derrière la personne », qui fait partie du plan (voir T1).
- **Attention à nos règles** : le visage ne doit jamais être recouvert ; un zoom ×1,6 agrandit surtout le visage : OK, mais les éléments placés sous le menton doivent suivre sa position (déjà géré par `fbAt`).

### T8. Transition verticale « avant / après » (0,7-1,8 s)
- 0,7 s : coupe vers un cadrage divisé : en haut un écran noir « TON RUSH », en bas le mur de vignettes « MONTÉ PAR CLAUDE » ; 1,6-1,8 s : **glissement vertical** rapide (~0,2 s) qui ramène le plan large, bandes de titre entraînées avec l'image.
- Sert à montrer le résultat promis (avant/après) pendant l'accroche. Reproduction : deux plans empilés + translation verticale (easing sortant, 0,2 s). Son : `scene_slide`.

### T9. Cartes d'interface (chat, tableau) qui glissent du bas
- Carte `#FBFAF7`, coins ~30 px, ombre douce, largeur ≈ 810 px, **entrée en glissant du bas** (~0,3 s, easing sortant), sortie en fondu ~0,3 s.
- **Chat** (37,2-39,3 s) : en-tête « ✳ Claude » + étiquette dorée « ASSISTANT IA » ; bulle utilisateur beige `#EAE3D2` à droite, texte **tapé** (« Enlève toutes mes reprises », ~0,9 s) ; puis trois points gris ~0,5 s ; puis réponse « C'est fait ✓ » avec **ding**. Fonction `fx.chat`.
- **Tableau** (60,0-63,0 s) : en-tête « ✳ TABLEAU D'EFFETS … à valider », lignes horodatées (`0:00` en doré, police monospace) qui apparaissent en cascade. Fonction `fx.table`.

### T10. Tampon « VALIDÉ ✓ »
- Contour double vert `#2F7D4F`, texte vert en majuscules, incliné (~−8°), fond crème semi-transparent ; **entre en grossissant (×2,4 → ×1) en 0,2 s** sur la carte, avec **impact sonore** (61,5 s). Fonction `fx.stamp`.

### T11. Étiquette « À RETENIR »
- Rectangle crème `#EFEDE4`, **double filet doré** `#B8923A`, texte doré en majuscules espacées, inclinée (~−4°), ombre ; apparition en rebond (×0,55 → ×1) ; visible ~1,5 s (42,6-44,1 s) en haut à gauche, **au moment d'une coupe-zoom** et d'une consigne (« Notez bien »). Fonction `fx.sticker`.

### T12. Barre de progression « EN COURS… → TERMINÉ ✓ »
- Rectangle noir `#1C1A17` aux coins arrondis, liseré doré, texte blanc en majuscules espacées ; remplissage doré sur ~1,2 s (71,9-73,0 s) ; puis le texte devient « MONTAGE TERMINÉ ✓ » avec **ding aigu** (73,05 s). Fonction `fx.progress`.

### T13. ~~Clôture~~ (ABANDONNÉ : tableau effacé)
- 73,4 s : coupe-arrière + **tableau effacé en balayage vertical** ; nouveau titre « INTERRO SURPRISE » (craie orangée) tapé ; phrase finale « Maintenant, petite interro surprise ! » : la vidéo s'arrête sur la question (boucle ouverte).

---

## 3. Chronologie seconde par seconde

Légende : **Plan** L = large, Z = coupe-zoom (×1,5-1,7). **Voix** = ce qui est dit (transcription Whisper). Les durées « typé » sont celles de l'apparition à l'écran. « (artefact) » = interface de l'iPhone, pas du montage.

| s | Voix | Plan | Tableau / dessin | Overlay / autre | Son (mesuré) |
|---|---|---|---|---|---|
| 0 | (silence ; sous-titre-teaser « vous donner un cours ») | L, mur de vignettes derrière | — | **Titre 2 bandes** déjà là | — |
| 1 | « Ok mes p'tits entrepreneurs » | **0,7 s : plan divisé** « TON RUSH » / « MONTÉ PAR CLAUDE » | — | titre déplacé ; **1,6-1,8 s glissement vertical** → plan A | impact léger ~1,34 s (non confirmé) |
| 2 | « alors aujourd'hui » | L | — | sous-titre « Alors aujourd'hui, » (1,9-2,85) | — |
| 3 | « on se retrouve pour » | L | — | sous-titre « on se retrouve pour » | — |
| 4 | « vous donner un cours » | L → **4,5 s coupe** vers le décor tableau | « COUR… » **tapé** (4,55→) | titre en haut | — |
| 5 | « sur le montage avec » | L | « COURS DE MONTAGE » + **soulignement tracé** (~5,7) ; « avec Claude ✳ » tapé 5,7-6,3 | — | — |
| 6 | « Claude. Parce que oui » | L | date « Jeudi 29 octobre » en haut à gauche | **titre : fondu de sortie 5,9-6,3** | — |
| 7 | « je vous vois, vous avez la flemme… » | L | « Je vous vois… » tapé (6,9-7,5) | — | — |
| 8 | « …de poster » | L | « – la flemme de poster » tapé (7,6-8,4) ; **cercle** 8,5-9,0 (s'estompe 9,1) | règle (accessoire) devant le tableau | — |
| 9 | « vous savez pas faire vos montages » | L | « – pas savoir monter » tapé (9,1-10) + cercle | — | — |
| 10 | « ça prend trop de temps » | L | « – trop de temps » tapé (10,3-11) | — | — |
| 11 | « vous n'avez pas non plus envie de payer » | L | « un monteur = une fortune » tapé (11,3-12,5) + cercle | — | — |
| 12 | « un monteur et une fortune » | L | (suite) | — | — |
| 13 | « donc vous ne postez pas » | L | **nouveau cadrage du tableau** : « … POST » ; axes d'un graphique | — | — |
| 14 | « et votre chiffre d'affaires » | L | « chiffre d'affaires » ; **courbe descendante tracée** (~13,5-15,3) | — | — |
| 15 | « le subit. » | L | (courbe finie) | — | — |
| 16-19 | — | — | — | **(artefact) fenêtre « Limite de temps » iOS** : image + son coupés 16,4-19,6 s | silence |
| 20 | « Leçon numéro une » | L | **« LEÇON N°1 »** tapé (20,2-21) | — | — |
| 21 | « on ouvre Claude Code » | L | (titre en place) | — | — |
| 22 | « sur son ordinateur » | L | « ✳ Claude Code » tapé + **cercle** (~22,6) | — | — |
| 23 | « et non pas sur le téléphone » | L | « ☐ sur l'ordi » tapé (~23,4) | — | — |
| 24 | « je vois des mains qui se lèvent » | L | « ✓ » dessinée (~24,4) | — | — |
| 25 | « Ce n'est pas » | **Z 25,3 s ×1,6** | « ☐ téléphone » + **croix ✗ dessinée** (~25,6) | — | — |
| 26 | « sur le téléphone » | Z | (tableau en partie hors champ) | — | — |
| 27 | « c'est sur l'ordinateur » | Z (re-coupe 27,3) | — | — | — |
| 28 | « abonnement minimum à 20 euros » | **28,7 s retour L** | — | sous-titre « Abonnement minimum à vingt… » | — |
| 29 | (suite) | L | — | — | — |
| 30 | « Leçon numéro 2 » | L | — | — | — |
| 31 | (suite) | L | **« LEÇON N°2 »** tapé | — | — |
| 32 | « quand on se trompe, on ne coupe pas » | L | « ✂ on ne coupe pas » tapé (~32,3) | — | — |
| 33 | « pas comme avant » | L | « (pas comme avant) » tapé (~33,7) + **cercle** | — | — |
| 34 | « aujourd'hui, tu peux te foirer » | **Z 34,9 s** | — | — | — |
| 35 | « quinze mille fois » | Z | « erreur n° 3 968 » apparaît (~35,5) | — | — |
| 36 | « ce n'est pas un problème » | **36,1 s retour L** | **compteur 3 968 → 15 000** (36,2-37,0) + cercle (~36,6) | — | compteur + « chiffre qui se pose » (non mesuré) |
| 37 | « c'est Claude qui va faire » | L | — | **chat** glisse du bas (~37,2) ; « Enlève toutes mes reprises » **tapé** 37,4-38,2 | frappe clavier (non mesurée sous la voix) |
| 38 | « tout le travail » | L | — | 3 points de saisie (~38,3-38,8) | **ding 2 640 Hz à 38,92 s** |
| 39 | « Leçon numéro 3 » | L | — | réponse « C'est fait ✓ » (39,0) ; carte sort | — |
| 40 | (suite) | L | **« LEÇON N°3 »** tapé | — | — |
| 41 | « on crée son style signature » | L | « le style signature » tapé (40,6-41,8) | — | — |
| 42 | « Notez bien » | **Z 42,5 s ×1,5** | + **cercle** (~42,1) | **étiquette « À RETENIR »** 42,6-44,1 | pop/impact (non mesuré) |
| 43 | « parce que je ne vais pas répéter » | Z | — | étiquette | — |
| 44 | « donc vous allez mettre » | **44,3 s retour L** | « • tes couleurs ●●● » tapé (44,5) | — | — |
| 45 | « vos couleurs, votre police » | **Z 45,0-45,7 s** | « • ta police Aa » (~46) | — | — |
| 46 | « votre DA » | L → **Z 46,8 s ×1,7** | « • ta DA ✓ » (~47,5) | — | — |
| 47 | « tout sera comme vous l'aimez » | Z | — | sous-titre « Tout sera comme vous l'aimez » | — |
| 48 | (suite) | Z | — | — | — |
| 49 | « comme vous le faites à la main » | Z (3,4 s) | — | — | — |
| 50 | « Leçon numéro 4 » | **50,2 s retour L** | **« LEÇON N°4 »** tapé (~51) | — | — |
| 51 | (suite) | L | — | — | — |
| 52 | « on colle ses vidéos » | L | « 1. les vidéos » tapé (51,7-52,5) + cercle | — | — |
| 53 | « on colle son style signature » | L | « 2. ton style » (53,4) | — | — |
| 54 | (suite) | L | « 3. le skill » (54,7) | — | — |
| 55 | « le skills que je vais vous envoyer » | L | — | — | — |
| 56 | « et on laisse Claude faire le travail » | L | « → Claude travaille » tapé (~56-57,5) | — | — |
| 57 | (suite) | L | (suite) | — | — |
| 58 | « il va d'abord vous envoyer un tableau » | **58,4 s zoom léger** | — | — | — |
| 59 | « que vous devez absolument valider » | L | — | — | — |
| 60 | (suite) | L | — | **carte « TABLEAU D'EFFETS »** glisse du bas (60,0-60,3) ; lignes `0:00`… en cascade | whoosh de carte (non mesuré) |
| 61 | « avant qu'il fasse tout le montage » | L | — | **tampon « VALIDÉ ✓ »** (61,5-62) | **impact grave à 61,53 s** |
| 62 | (suite) | L | — | carte + tampon | — |
| 63 | « c'est super important comme étape » | L | **« IMPORTANT ! »** tapé (~63,3) | carte sort (~63) | — |
| 64 | (suite) | L | — | — | — |
| 65 | « ensuite vous allez attendre 20-30 minutes » | L | **horloge tracée** (64,6-66) | — | tic-tac (non mesuré) |
| 66 | (suite) | L | aiguilles | — | — |
| 67 | « donc vous pouvez aller faire de la lambeau » | L | « 20, 30 min » tapé (~67,3) | — | — |
| 68 | « vous baigner dans votre piscine » | L | **cercle** (~68,3) ; **voiture « Lambo »** tracée (68,8-70) | — | — |
| 69 | (suite) | L | (suite) | — | — |
| 70 | « à Bali, peu importe » | L | **palmier + « Bali »** tracés (70,3-71,5) | — | — |
| 71 | « et ensuite vous revenez » | L → **Z 71,6 s ×1,7** | soleil/vagues (~71,8-72,5) | **barre « MONTAGE EN COURS… »** glisse (71,8) | progression |
| 72 | « et c'est prêt » | Z | — | remplissage doré 71,9-73,0 | — |
| 73 | « Maintenant, » | **73,4 s retour L** | **tableau effacé en balayage** (~73,4-73,6) | « MONTAGE TERMINÉ ✓ » (73,3) | **ding 2 640 Hz à 73,05 s** |
| 74 | « petite interro surprise ! » | L | **« INTERRO SURPRISE »** tapé (73,7-74,4) | — | — |

Remarques de lecture : (1) les instants de coupe (colonne Plan) viennent de la détection de changements d'image ; (2) les débuts de lignes de tableau sont relevés sur des images espacées de 0,3 à 1 s (±0,3 s) ; (3) les mots de la colonne Voix sont ceux de Whisper (peu de risques d'erreur sur le fond, mais pas relus mot à mot avec l'audio).

---

## 4. Ce qu'on a déjà et ce qu'il manque dans notre pipeline

| Effet de la référence | Chez nous aujourd'hui | À faire |
|---|---|---|
| Sous-titres italiques petits, par groupes | Sous-titres gras cerclés, mot à mot | **Nouveau style** (`fx.subtitles`) : à tester sur la prochaine vidéo |
| Texte tapé / craie / cercles / coches / compteur | — | `fx.typed`, `fx.ellipse`, `fx.mark`, `fx.countup` (fait, à valider sur une vraie vidéo) |
| Cartes chat / tableau, tampon, étiquette, barre de progression | Cartes et pictos SVG (version « pomme ») | `fx.chat`, `fx.table`, `fx.stamp`, `fx.sticker`, `fx.progress` (fait) |
| Titre en 2 bandes | — | `fx.titleBars` (fait) |
| Coupes-zoom sèches ×1,5-1,7 | Zooms doux 6-10 % | `zoom_render.py` avec `in: 0`, `out: 0`, facteur 1,5-1,7 |
| Décor virtuel + détourage | — | `videos/effets/matting/matte.py` (testé sur une image ; vidéo ≈ 17 min / 48 s) |
| Bruitages calés | Aucun (par choix) | `videos/sfx/` (kit CC0 + moteur de placement ; validé à ±5 ms sur la référence) |

---

## 5. Appliquer le modèle à une nouvelle vidéo (marche à suivre)

1. **Récupérer, transcrire, valider le texte** (étapes habituelles de `METHODE.md`).
2. **Concevoir le plan d'effets** : écrire d'abord la liste « temps / phrase / effet » (comme le « tableau d'effets » de la référence), en choisissant un **cadre** (leçons, vrai ou faux, étapes) et **un événement visuel léger toutes les 1 à 3 s, toujours ancré sur un mot**. L'utilisateur valide.
3. **Choisir le niveau** : (a) *léger* (sans détourage) = sous-titres éditoriaux + cartes/tampon/étiquette/barre sur la chemise sous le menton + coupes-zoom ; (b) ~~complet = décor + détourage~~ : abandonné.
4. **Construire** avec `fx.js` ; exporter la chronologie sonore `window.FX_SFX`.
5. **Sons (si l'utilisateur les veut)** : `python3 videos/sfx/sfx_mix.py events.json --voice voix.wav --speech words.json --out out/sfx` ; mixer avec la voix (−13,9 LUFS visés, pic ≤ −1 dBFS).
6. **Contrôles** : visage jamais recouvert (`check_overlap.py`), audio original intact, images clés, rythme (plus long écart sans événement ≤ 3 s).

Prompt prêt à copier (à ajouter au prompt habituel) :

```text
STYLE : applique le modèle de montage de référence (videos/MODELE_MONTAGE_REFERENCE.md), niveau [léger / complet].
Cadre narratif : [leçons / vrai ou faux / étapes / autre].
Sons : [oui, sobres (voix d'abord, quelques sons précis) / non].
Donne-moi d'abord la liste « temps / phrase / effet » (un événement léger toutes les 1 à 3 s, toujours ancré sur un mot) et attends ma validation.
Règles inchangées : visage jamais recouvert, audio d'origine, aucune donnée de santé inventée, pas de logo.
```

---

## 6. Son : ce qu'on a mesuré et comment le reproduire

- **Mesures** : intégré −13,9 LUFS, pic −1,0 dBFS, LRA 1,6 LU ; **pas de musique** (aucune composante tonale continue) ; la voix domine (écart voix / fond ≈ 2 dB, donc le fond n'est que du bruit de pièce).
- **Événements sonores confirmés** : **ding pur à 2 640 Hz** à 38,92 s (réponse du chat) et 73,05 s (montage terminé) ; **impact grave** à 61,53 s (tampon). **Non confirmés / non détectables sous la voix** : sons de frappe, de craie, de whoosh, de compteur (ils existent peut-être, noyés dans la voix).
- **Outil retenu** : **SFX Kit de Wyzowl** (320 sons CC0, WAV 48 kHz, GitHub `wyzowl/sfx-kit`, miroir Hugging Face) : chaque son porte un **point de synchronisation** (`sync.at`), des cas d'usage, un niveau et une baisse « sous voix » (`under_voiceover_db`).
- **Règle de calage** : `début du son = moment visé − sync.at` (÷ vitesse si le son est ralenti/accéléré). Implémentée dans `videos/sfx/sfx_mix.py`. **Validation sur la référence** : ding posé à +1 ms de l'instant visé, impact à −5 ms, hauteur du ding 2 640 Hz pour 2 638 Hz mesuré (rôle `ding` = `tone-ding-high` joué une octave plus haut).
- **Correspondance effet → son** : `videos/sfx/roles.json` (rôles : `chalk_write`, `chalk_draw`, `chalk_tick`, `typing_*`, `ding`, `chat_reply`, `stamp`, `stamp_big`, `sticker_in`, `pop_in`, `card_slide`, `scene_slide`, `zoom_cut`, `countup`, `number_land`, `progress`, `clock`, `sparkle`, `erase`).
- **Mixage** : le moteur baisse chaque son de `under_voiceover_db` (−1 à −8 dB) là où il recouvre la voix ; sortie voix + sons à −14 LUFS, pic ≤ −1 dBFS (testé sur la voix de la référence : −14,0 LUFS).
- **Mise à jour 11/11/2026** : l'utilisateur veut désormais des **bruitages dans tous les montages** (vidéo « magnésium » et suivantes). Règles et réglages : **`MODELE_HOOK_ET_CTA.md` §7**. La vidéo « pomme » reste sans son ajouté.
- **Référence n° 2** (analyse du hook, du CTA, de la boucle et des gros titres) : **`MODELE_HOOK_ET_CTA.md`**.

---

## 7. Limites et vérifications honnêtes

- La référence est une **copie d'écran** (592×1280, compression forte) : les polices (~Playfair / Cormorant / Archivo Black / DM Mono) sont des **équivalents estimés**, pas identifiés avec certitude ; à comparer visuellement.
- Les instants relevés à l'image près sont ceux des **coupes** et des **événements sonores détectés** ; les autres (début de chaque ligne tapée, cercles) sont à ±0,3 s.
- Le détourage est testé sur **une image** de la vidéo « pomme » (résultat propre, mains partiellement) : pas encore sur une vidéo entière ; le temps de calcul est élevé.
- Aucune donnée d'audience de la référence n'est connue : on s'inspire du **montage**, on ne présume pas de ses performances.
