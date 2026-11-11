# Vidéo « pomme » : légende et stories

Contenu de la vidéo (voix) : « Mange pas cette pomme, elle est cancérogène ! » → « Pas exactement » → résidus de pesticides **encadrés par des limites** → l'**EFSA** juge le risque pour le consommateur **très faible** → il y a plus d'aspects positifs que négatifs → **rincer le fruit sous l'eau réduit déjà d'un tiers** les résidus supplémentaires, **selon une revue** → fin : « abonne-toi et mange l'esprit tranquille » (CTA de type C2, abonnement).
Tout ce qui suit **ne reprend que ce qui est dit dans la vidéo** : aucun chiffre, aucune source, aucune date ajoutés.

## À vérifier avant de publier
- **« Selon une revue »** : la voix ne nomme pas la revue. Le nom, l'année et le chiffre « un tiers » (réduction des résidus en rinçant) sont à retrouver dans ta source et à citer dans le commentaire épinglé si tu veux.
- **EFSA** : la formulation exacte de la conclusion (« risque très faible pour le consommateur ») est à contrôler dans la source ; j'ai gardé tes mots.
- **« Chaque semaine, je vérifie… »** (phrase de série, ci-dessous) : à garder seulement si tu comptes vraiment tenir ce rythme.
- Le mot « cancérogène » est dans le hook : la légende le place **entre guillemets avec le démenti** pour ne pas relayer la peur seule.

## Texte de couverture (3 à 6 mots)
**« Pomme et pesticides : danger ? »** (variante : « Ta pomme est-elle cancérogène ? »)

## Légende Instagram (copier-coller)
```text
« Mange pas cette pomme, elle est cancérogène ! » 🍎 Pas exactement.

Oui, il peut y avoir des résidus de pesticides sur une pomme. Mais ils sont encadrés par des limites, et l'EFSA juge le risque pour le consommateur très faible. Une pomme apporte bien plus d'aspects positifs pour ta santé que d'aspects négatifs.

Un geste simple : rincer le fruit sous l'eau réduit déjà d'un tiers les résidus supplémentaires, selon une revue.

👉 Abonne-toi : chaque semaine, je vérifie une idée reçue sur ce que tu manges. Mange l'esprit tranquille.

Information générale, pas un avis personnalisé.

#nutrition #dieteticien #pomme #pesticides #alimentation
```
Notes : 5 mots-clés suffisent (plus n'aide pas, hypothèse). Le premier paragraphe se lit sans « Voir plus ». Retire la ligne « Information générale… » si tu préfères une légende plus courte ; garde-la si tu parles de santé.

## Légende Facebook (public 50-69 ans : ton plus posé, appel au partage)
```text
Faut-il avoir peur des pesticides sur une pomme ? Pas exactement.

Il peut y avoir des résidus de pesticides sur une pomme, mais ils sont encadrés par des limites et l'EFSA juge le risque pour le consommateur très faible. Rincer le fruit sous l'eau réduit déjà d'un tiers les résidus supplémentaires, selon une revue.

Envoie cette vidéo à quelqu'un qui hésite à manger des fruits. Et mange l'esprit tranquille.

Information générale, pas un avis personnalisé.
```

## Commentaire à épingler (type C5 : réponse en un mot)
```text
Et toi, tu laves tes pommes ou tu les manges directement ? 🍎
```
(Option : ajouter en réponse la référence exacte de la revue une fois retrouvée.)

## Stories (5 visuels prêts : `videos/video2/stories/story-1.png` à `story-5.png`, 1080×1920)
Les visuels sont **sans les stickers** : ils se posent dans l'application (zones libres indiquées). Marges respectées : ≈ 250 px libres en haut, ≈ 340 px en bas. Style : Jost, vert profond, crème et champagne (celui des montages).

| # | Quand | Visuel | Sticker à ajouter dans Instagram | But |
|---|---|---|---|---|
| **1** | **Avant** la publication (matin ou la veille) | « Une pomme pas lavée, tu la manges ? » | **Sondage** « Oui / Non », vers le milieu bas (y ≈ 1130-1360) | chauffer l'audience, annoncer sans spoiler |
| **2** | **Au moment** de la publication | « Ta pomme est-elle vraiment cancérogène ? / Nouvelle vidéo / regarde jusqu'au bout » | **Partage du Reel** (« Ajouter à ta story » sur le Reel), placé sous le titre | envoyer les abonnés vers la vidéo |
| **3** | **+ 3 à 4 heures** | « Rincer une pomme sous l'eau, ça sert à… ? » | **Quiz** à 3 réponses (zone y ≈ 1090-1390) : ✔ « À réduire une partie des résidus » · ✘ « À rien du tout » · ✘ « À les enlever à 100 % » | rappeler la vidéo, faire participer ; **aucun chiffre inventé dans les réponses** |
| **4** | **Le lendemain** | « Fruits & légumes : bio, lavage, épluchage… Qu'est-ce que tu veux que je vérifie ? » | **« Pose-moi une question »** (y ≈ 1260-1490) | trouver les sujets des prochaines vidéos = contenu demandé par l'audience |
| **5** | **Le lendemain soir** | « À retenir » : 1 résidus encadrés par des limites · 2 EFSA : risque très faible pour le consommateur · 3 rincer = déjà un tiers de résidus en moins (selon une revue) | aucun (ou **Lien** vers le Reel) | résumé enregistrable, rappel de la valeur |

Conseils : mettre les stories 1 à 3 en **à la une** « Idées reçues » (hypothèse : sert de vitrine aux nouveaux visiteurs) ; répondre aux réponses du sondage/quiz avec un message court (renforce la relation, sans contrainte de format) ; une story par moment, **pas plus de 5** pour ne pas lasser.
Suivi : noter dans `videos/SUIVI.md` le nombre de votes du sondage, de réponses au quiz et de questions reçues (hypothèse à tester : les stories aident à faire revenir les abonnés, pas à attirer des inconnus).

## Régénérer les visuels
```bash
cd videos/video2 && node stories/render_stories.js
```
Les textes sont dans `stories/stories.html`.
