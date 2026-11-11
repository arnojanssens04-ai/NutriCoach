# Hook, appel à l'action (CTA), boucle et bruitages : analyse d'une vidéo virale

Source : Reel de référence n° 2 fourni par l'utilisateur (11/11/2026) : enregistrement d'écran, 44,5 s, sujet « apprendre à une IA à ajouter des bruitages ». **Le sujet n'a aucun rapport avec la nutrition : on reprend la mécanique (accroche, structure, CTA, boucle, rythme, sons), jamais le contenu, le personnage (créateur masqué en sorcier), ni la marque.**
Compteurs visibles à l'écran lors de l'enregistrement : ♡ 2 090 · 💬 1 835 · ↻ 52 · ➤ 840. Les commentaires valent ≈ 88 % des j'aime : c'est la signature d'un CTA « commente le mot » (voir §4). Ce sont des chiffres lus à l'écran à un instant donné, pas une mesure vérifiée.
Fichiers de travail : `videos/reference2/` (vidéo dans `in/`, ignorée par git ; transcription et mesures dans `out/`).

> Honnêteté sur la certitude : ce qui est **mesuré** (transcription, coupes d'image, niveaux audio, écrans) est sûr à ±0,3 s. Ce qui est **interprété** (pourquoi ça marche, effet sur les vues) est une hypothèse de plus à tester avec `SUIVI.md`, pas une preuve.

---

## 1. Le hook, mot à mot (0 → 14 s)

| s | Voix (Whisper) | Image |
|---|---|---|
| 0,0-0,7 | « …vidéos et faire du motion. » (fin d'une phrase) | logo-mot **✳ Claude** en haut + écran de montage vidéo en gros plan |
| 1,0-1,75 | silence numérique (−∞ dB) | — |
| 1,75-4,9 | « **Claude devient de plus en plus bon à éditer des vidéos et faire du motion design,** » | même logo, plan large du créateur masqué, mouvement de main |
| 4,9-7,4 | « **mais quand tu lui demandes d'ajouter des effets sonores,** » | coupe → fond sombre quadrillé : étoile orange qui « émet des ondes sonores » ((✳)) puis un point |
| 7,5-8,1 | « **là il est nul.** » | l'étoile **devient grise et s'affaisse, une larme**, mini-texte « il est nul » |
| 8,2-11,9 | « Ajouter des sons d'effet dans ses vidéos, c'est ce qui va **augmenter la qualité de tes vidéos**. » | retour au créateur, gros titre « LA QUALITÉ » en haut |
| 11,9-14,2 | « **Alors voici trois choses à installer pour régler tout ça.** » | titre « 3 CHOSES À INSTALLER » |

**Mécanique en 4 temps (formule « Éloge → mais → verdict → promesse chiffrée »)**
1. **Éloge** (0-5 s) : une chose connue de la cible progresse (« devient de plus en plus bon »). La cible dit « oui, je sais ».
2. **« mais »** (5-7 s) : un angle mort précis (« quand tu lui demandes d'ajouter des effets sonores »). Écart entre ce qu'on croit et la réalité = **curiosité**.
3. **Verdict court et net** (7,5 s) : « là il est nul » + **gag visuel émotionnel** (l'étoile s'affaisse, une larme) en 0,6 s.
4. **Promesse chiffrée** (12 s) : « trois choses à installer pour régler tout ça » : un nombre précis + « régler » = solution proche, boucle ouverte qui tient jusqu'à la fin (3 sous-parties de ~8 s).
Intermédiaire utile : une phrase de **bénéfice** (« ça va augmenter la qualité de tes vidéos ») juste avant la promesse, pour dire pourquoi la suite compte.

**Choix techniques du hook**
- **Pas de salutation, pas de présentation** : la 1re parole est déjà le sujet.
- **Logo reconnaissable en 1re image** (repère immédiat du thème) + gros plan d'un écran de montage : on comprend « ça parle de montage vidéo » sans le son.
- **Changement d'image toutes les ~2 s** pendant le hook (coupes à 1,9 · 3,2 · 4,9 · 8,2 · 11,9 s).
- **Une seule idée par phrase**, phrases courtes (7 à 13 mots).

---

## 2. Structure complète et rythme (44,5 s)

| s | Bloc | Contenu | Écran |
|---|---|---|---|
| 0-12 | **Hook** | éloge → mais → « nul » → bénéfice | logo, étoile, titre « LA QUALITÉ » |
| 12-14 | **Promesse** | « trois choses à installer » | titre « 3 CHOSES À INSTALLER » |
| 14-21 | **Point 1** | « Openverse API » : accès à « 5 millions de sons » | titre « OPENVERSE API » (15,1 s) puis « PLUS DE 5 MILLIONS » (17,7 s) + capture d'écran de l'outil en haut (16,3 s et 19,8 s) |
| 21-29,5 | **Point 2** | « Real SFX » : lit la timeline, trouve chaque moment, place un son « à la frame exacte » | titre « REAL SFX » (22,2 s) ; **scène illustrée plein écran** sombre quadrillée (22,9-26,2 s) : écran → timeline → haut-parleurs qui apparaissent un à un ; titre « À LA FRAME EXACTE » (26,8 s) ; capture de spectrogramme (27,8-29,5 s) |
| 29,5-38,5 | **Point 3** | « si ça ne suffit pas : installe Earshot » | titres « L'EFFET SONORE PARFAIT » (32 s), « EARSHOT » (33,8 s) ; captures GitHub (34,3 s) |
| 38,6-43,5 | **CTA** | « si tu veux un prompt pour installer les trois repos d'un coup, **abonne-toi, commente « SON »** et je te les envoie par message » | **dossier bleu + mot « SON » en jaune** au centre (≈ 41,5-43,5 s) |
| 43,5-44,5 | **Boucle** | « Claude devient de plus en plus… » (début coupé net) | retour du logo ✳ |

- **Cadence** : 19 changements de plan en 44 s, soit un toutes les ≈ 2,3 s. **Chaque coupe tombe sur un début de phrase** (« Ajouter… » 8,2 s · « Alors voici… » 11,9 s · « Le premier… » 14,3 s · « Ça donnera… » 16,3 s · « Le deuxième… » 21,2 s · « C'est littéralement… » 27,8 s · « Et enfin… » 29,6 s · « Alors si tu veux… » 38,6 s). Le montage suit le texte.
- **Gros titre à chaque idée** (6 à 8 titres), 2 à 4 mots en capitales serif, en haut, **derrière la tête** (le chapeau cache une partie des lettres : « QU…LITÉ »). Pas de listes à puces.
- **Visuels « preuve »** (captures d'écran des outils) 2 à 3 s en haut, **jamais sur le visage**.
- **Sous-titres** : serif blanc, minuscules, 2 à 4 mots, changement sec, sans accent de couleur, centrés, ≈ 69 % de la hauteur.

---

## 3. Boucle (« loop ») : l'astuce de la fin

- La vidéo se termine au milieu d'une phrase : « **Claude devient de plus en plus…** ». Le début de la vidéo reprend avec « **…vidéos et faire du motion.** » (0-0,7 s). Les deux moitiés forment **une phrase complète** : « Claude devient de plus en plus bon à éditer des vidéos et faire du motion » → quand le Reel recommence tout seul, personne ne voit la jonction.
- Effet attendu (hypothèse) : relectures = temps de visionnage > 100 % de la durée, signal positif pour la diffusion.
- Un silence numérique de ~1 s suit la fin de la 1re phrase (1,0-1,75 s) : à ne pas copier tel quel (il ralentit l'accroche).

**Applicable à nos vidéos de diététicien** : écrire la **dernière phrase pour qu'elle se prolonge dans la 1re** (ex. fin : « …et c'est pour ça que mon assiette type, c'est… » / début : « …moitié légumes, un quart féculents, un quart protéines. »). Contrainte : la phrase doit rester vraie et claire si on la lit seule (version sans boucle sur les autres réseaux).

---

## 4. Appel à l'action (CTA) : la mécanique de la vidéo

> **Règle de l'utilisateur (11/11/2026) : chaque vidéo doit contenir un appel à l'action.**

Dans la référence :
- **Où** : dans les 6 dernières secondes, après la valeur donnée.
- **Quoi** : « abonne-toi + commente le mot **SON** et je t'envoie le prompt par message » = **un mot-clé** + **une ressource gratuite concrète** (« le prompt pour installer les trois repos d'un coup ») + **livraison en message privé**.
- **Pourquoi c'est malin** (hypothèse) : l'action est **facile** (un seul mot), la **récompense est précise**, et le mot s'affiche en gros (dossier + « SON » jaune) en même temps qu'il est dit : l'oreille et l'œil reçoivent la même consigne. 1 835 commentaires pour 2 090 j'aime suggèrent que ça fonctionne.
- Note : la ressource est présentée comme **la suite logique** du contenu (« si tu veux le prompt pour les trois d'un coup »), pas comme une pub.

### Les 5 CTA du diététicien (choisir 1 principal par vidéo, 1 secondaire possible)

| Code | CTA | Exemple de phrase parlée | Visuel | Condition |
|---|---|---|---|---|
| **C1** | **Mot-clé → ressource** | « Commente **MAGNÉSIUM** et je t'envoie en message la liste des aliments riches en magnésium. » | dossier + mot en jaune, 3 s | la ressource **existe vraiment**, gratuite, éducative (liste, mini-guide, check-list), pas de conseil personnalisé |
| **C2** | **Abonnement + promesse de la prochaine vidéo** | « Si tu veux la suite sur le sommeil, abonne-toi : c'est la prochaine vidéo. » | bouton/étiquette « SUITE ▶ » | la prochaine vidéo est bien prévue |
| **C3** | **Enregistrer** | « Enregistre cette vidéo pour ta prochaine liste de courses. » | marque-page animé | utile à relire |
| **C4** | **Partager** | « Envoie-la à quelqu'un qui [situation]. » | flèche d'envoi | public Facebook 50-69 : très pertinent |
| **C5** | **Question facile en commentaire** | « Et toi, tu fais A ou B ? Dis-le en commentaire. » | « A ? B ? » | réponse en 1 mot |

- **Toujours dits à voix haute ET écrits à l'écran** (comme la référence). Un CTA seulement affiché, sans la voix, est plus faible : c'est le cas du montage test magnésium (la voix enregistrée n'en contient pas) → **pour les prochaines vidéos, l'écrire dans le script**.
- Un seul CTA principal ; ne pas en empiler trois en 5 s.
- **Rigueur santé** : la ressource offerte ne contient aucune promesse de guérison ni consigne individuelle ; mentions « parles-en à ton médecin » si besoin ; **l'utilisateur confirme qu'il a la ressource avant qu'on l'affiche**.
- **Livraison par message** : demande un outil d'auto-réponse aux commentaires (celui d'Instagram ou un service tiers) ; **à choisir et vérifier par l'utilisateur** (non testé ici, ni les règles actuelles d'Instagram à ce sujet).
- Suivi : noter dans `SUIVI.md` le code du CTA (C1 à C5) et mesurer commentaires, partages, enregistrements, abonnés gagnés.

---

## 5. Formules de hook pour la nutrition (à tester, une seule variable à la fois)

Toutes suivent « **un repère connu → mais → un verdict net → une promesse** ». Chaque script propose 3 accroches de types différents (A à E de `METHODE.md`), plus ce type **F : éloge → mais**.

| Code | Formule | Exemple (diététicien) |
|---|---|---|
| **F1** | **Éloge → mais → verdict** | « Tout le monde fait de plus en plus attention à ce qu'il mange, **mais** il y a une chose que presque personne ne regarde. » |
| **F2** | **Objet/aliment familier + verdict** | image de l'aliment (étoile → pomme, flocons, gélule) + « Ça, on t'en dit du bien… **mais** voilà le piège. » |
| **F3** | **Promesse chiffrée** | « Voici **trois** réflexes pour [problème], à installer ce soir. » (3 parties de ~8 s) |
| **F4** | **Bénéfice avant la méthode** | « Ça va [bénéfice concret, prudent] : voici comment. » |
| **F5** | **Réaction visuelle** (gag 0,6 s) | petit dessin qui « tombe/s'affaisse » sur le verdict (équivalent de l'étoile triste) |

- Hook ≤ 12 s ; **mot ou titre à l'écran dès 0 s** ; **aucune salutation** ; verdict en **moins de 8 mots** ; une promesse chiffrée avant 15 s si la vidéo est une liste.
- **Santé** : « nul/dangereux/poison » interdit sauf si c'est exact et sourcé ; le « mais » doit annoncer une nuance vraie (ex. : « le magnésium n'est pas un antistress, mais… »), jamais une peur gratuite.
- Test : comparer F1/F2/F3 sur le % d'abandon à 3-4 s dans `SUIVI.md` (rappel : 72 % d'abandon sur la vidéo « fatigue »).

### Exemple appliqué à la vidéo « magnésium » (version test)
- Voix existante : « Le magnésium n'est pas un antistress, **mais** il peut t'aider à une condition. » = **déjà un F1** (verdict puis « mais »). On a ajouté le **titre d'écran « MAGNÉSIUM / pas un antistress »** dès 0,15 s.
- **CTA retiré de la version finale** (décision de l'utilisateur, 11/11/2026) : la voix n'en contient pas, on n'en affiche pas. Le composant « dossier + mot-clé » reste décrit au §4 pour une vidéo dont le script prévoit un CTA parlé.

---

## 6. Éléments de montage à reprendre (et à écarter)

| Élément de la référence | Verdict pour nos vidéos |
|---|---|
| **Gros titre en haut** (1 à 3 mots, un par idée) | **Oui, en Jost (sans-serif élégante) capitales espacées, dégradé émeraude + reflet + filet doré** (le serif a été jugé « pas beau » par l'utilisateur) : implémenté (`.tt` dans `videos/video3/index.html`) ; **jamais pendant un zoom** (la tête monte) et vérifier les cheveux avec `check_overlap.py` |
| Sous-titres petits, groupes de 2-4 mots | **Oui, en Jost 600** (pas de serif) ; lisibilité sur pull clair : contour foncé obligatoire |
| Coupe à chaque début de phrase | **Oui** (cadence ~2-3 s) : coupe-zoom sèche OU nouveau visuel ; max 3-4 zooms, validé par l'utilisateur |
| Capture d'écran / « preuve » en haut | **Oui, adapté** : photo d'étiquette, emballage, schéma, jamais sur le visage ; sources réelles uniquement |
| **Scène illustrée plein écran** (fond sombre, icônes qui apparaissent une à une) | **Non par défaut** : cache le visage (règle « on doit toujours voir mon visage »). Variante autorisée : **petit dessin SVG sous le menton**, même logique (éléments qui apparaissent un à un) |
| Gag visuel d'émotion (étoile qui s'affaisse) | **Oui, sobrement**, 1 par vidéo maximum |
| Texte derrière la tête (matting) | **Optionnel**, non utilisé (calcul long ; `videos/effets/matting/matte.py` existe) |
| Personnage masqué (sorcier) | **Non** : c'est la marque de l'autre créateur |
| Boucle | **Oui, à tester** (§3) |
| CTA mot-clé | **Oui, obligatoire** (§4) |

---

## 7. Bruitages (la vidéo en parle : décision de l'utilisateur)

**Ce que dit la vidéo** : « ajouter des sons d'effet augmente la qualité de tes vidéos », et présente trois outils : **Openverse API** (accès à « plus de 5 millions de sons » que l'agent cherche et télécharge seul), **« Real SFX »** (lit la timeline, trouve chaque moment qui a besoin d'un son, l'ajoute « à la frame exacte »), **« Earshot »** (dépôt GitHub pour générer un son par du code). **Je n'ai pas vérifié l'existence ni la licence de ces trois outils** (leurs noms viennent de la voix ; l'accès réseau est limité).

**Notre équivalent déjà installé** (`videos/sfx/`) :
| Idée de la vidéo | Chez nous |
|---|---|
| beaucoup de sons à chercher | **SFX Kit** : 320 sons CC0 (24 téléchargés selon `roles.json`) ; `fetch_sfx.py` en télécharge d'autres |
| « à la frame exacte » | `sfx_mix.py` : chaque son porte un **point de synchro** ; **début = moment visé − sync.at** ; précision mesurée ±5 ms |
| « lit ta timeline » | les effets de la page exportent leurs instants (`window.FX_SFX` → `node render.js events` → `events.json`) |
| générer un son par code | possible en numpy si un son manque (non fait) |
| Openverse (licences variées, parfois attribution) | **non utilisé par défaut** : seules des licences CC0 évitent toute mention obligatoire |

**Ce qui est mesuré dans la référence** (voix à −16,7 dB RMS, pics à 0 dBFS) : des **salves de graves** (+18 à +28 dB sur 0,25 s) à certains changements de plan (≈ 3,2 · 11,9 · 22,9 s) = impacts/whoosh probables, et des **clics aigus** à 8,2 · 33,8-34,3 s. **Difficile de séparer ces sons d'un début de phrase** : à prendre comme indices, pas comme preuves.

**Règles de bruitage adoptées (11/11/2026, remplace « aucun effet sonore »)**
1. **Oui par défaut sur toutes les vidéos**, sobres : la **voix reste devant** (les sons sont **6 à 16 dB sous la voix** autour de chaque événement).
2. **Un son = un événement visuel** (titre, carte qui apparaît, étiquette, pop d'emoji, zoom, ✗/tampon, CTA) ; **jamais de son sur les sous-titres** ; pas de son sur 2 événements à moins de 0,3 s.
3. **Cadence** : environ un son toutes les 2 à 3 s au plus.
4. **Calage** : toujours via `sfx_mix.py` (début du son = instant visuel − sync.at). Vérifier en écoutant/mesurant : les sons qui précèdent l'image de plus de ~80 ms ou la suivent de plus de ~50 ms sont perceptibles.
5. **Mixage** : `python3 videos/sfx/sfx_mix.py events.json --out out/sfx --voice voix.wav --speech words.json --sfx-db 5` puis `AUDIO=out/sfx_mix.wav python3 zoom_render.py out/final_avec_sons.mp4` (audio AAC 256 kbit/s). **Toujours livrer aussi la version sans sons** (audio d'origine copié à l'identique).
6. **Correspondance** (`videos/sfx/roles.json`) : titre = `stamp` (impact doux) ou `sticker_in` ; carte/étiquette = `sticker_in` ; petits éléments (emoji, nombre) = `pop_in` ; jauge/barre = `progress` (durée ajustée) ; ✗ ou tampon = `stamp` ; coupe-zoom = `zoom_cut` ; CTA = `sticker_in` + `ding`.
7. Réglage de niveau de la vidéo test (magnésium) : gains par événement (stamp −9/−10, zoom −8, sticker −1, pop +2, progress −3/−4, ding −5) et `--sfx-db 5`. Résultat mesuré : −6 à −16 dB sous la voix.
