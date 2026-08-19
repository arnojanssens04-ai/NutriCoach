# Note technique — qualification MDR du moteur de conseils nutritionnels

**Objet** : ce document résume, en langage clair, ce que fait le logiciel
concerné et pourquoi la question de sa qualification comme dispositif
médical (Règlement UE 2017/745, MDR) se pose. Il est écrit pour être
transmis à un juriste/avocat spécialisé, afin qu'il détermine la
qualification réelle. **Ce n'est pas un avis juridique** — c'est une
description factuelle du fonctionnement technique, préparée pour
faciliter cette analyse.

Statut actuel : le module décrit ici n'est connecté à aucun patient réel.
Il tourne uniquement dans une page d'administration confinée
(`nutrition-simulator-admin.html`), sur des profils entièrement fictifs,
sans persistance de données. Aucune décision de mise en production n'a
été prise — c'est précisément la question soumise ici.

---

## 1. Ce que fait le logiciel, en langage clair

Cap Santé est une application de suivi alimentaire (journal des repas,
objectifs caloriques, bilans hebdomadaires). Le module en question est
un moteur qui, à partir du journal alimentaire d'une personne :

1. **observe** des tendances statistiques sur une période (ex. "des
   aliments ultra-transformés sont revenus plusieurs fois cette
   semaine", "l'apport moyen en calcium est nettement inférieur à une
   référence journalière générique") ;
2. **sélectionne** des aliments alternatifs dans une liste pré-établie
   (jamais générés librement) ;
3. **génère un texte de conseil** à partir d'un gabarit fixe (ex. "vous
   avez consommé plusieurs fois X, Y pourrait être proposé en échange, à
   discuter avec un professionnel avant toute mise en œuvre") ;
4. **filtre par sécurité** : bloque toute suggestion incompatible avec
   une allergie/intolérance déclarée (confirmée ou seulement suspectée),
   et peut bloquer si un contexte clinique déclaré entre en conflit avec
   la règle.

Aucune intelligence artificielle générative n'est utilisée à ce stade —
c'est un système de règles déterministes (seuils numériques, tables de
correspondance mot-clé → aliment). Aucun texte n'est produit hors des
gabarits pré-écrits et validés.

## 2. Pourquoi la question MDR se pose

Le règlement MDR (art. 2, point 1) qualifie de dispositif médical tout
logiciel destiné par son fabricant à être utilisé, notamment, à des fins
de **diagnostic**, **prévention**, **contrôle**, **prédiction**,
**pronostic**, **traitement** ou **atténuation** d'une maladie.

Le guide européen MDCG 2019-11 (qualification et classification des
logiciels selon MDR/IVDR) précise que la qualification dépend de la
**destination revendiquée par le fabricant** (l'"intended purpose"), pas
seulement de la technique employée.

**Deux éléments factuels du projet sont directement pertinents pour
cette analyse :**

- **Décision produit prise le 2026-08-19** : le moteur pourra à l'avenir
  adapter ses conseils en fonction des pathologies déclarées par la
  personne (ex. diabète, cholestérol) — pas seulement rester un
  coaching "bien-être" générique et indépendant de toute pathologie.
  C'est ce choix précis qui fait basculer le risque de qualification
  MDR d'hypothétique à réel : dès qu'un logiciel personnalise son
  comportement en fonction d'une pathologie déclarée, la finalité
  "prévention/contrôle d'une maladie" devient plausible au sens du
  MDCG 2019-11.
- **Fonctionnement actuel sans pathologie** : à ce jour, la seule règle
  implémentée avec cette logique (aliments ultra-transformés) ne
  croise aucune donnée de pathologie — elle observe une habitude
  alimentaire générale et propose une alternative alimentaire courante.
  Le module contient déjà une structure technique (`conflictingClinicalCodes`,
  `hasConflictingClinicalContext`) prête à recevoir cette logique, mais
  aucune règle ne l'utilise encore aujourd'hui.

## 3. Éléments techniques utiles pour l'analyse de qualification

- **Utilisateur visé à terme** : le patient lui-même, sur son tableau de
  bord (pas un professionnel de santé qui interpréterait le résultat).
- **Automatisation prévue** : génération et affichage sans validation
  humaine préalable systématique (décision produit du 2026-08-19) — un
  humain (l'équipe Cap Santé) n'intervient qu'à la demande du patient
  pour "en discuter davantage".
- **Formulation du conseil** : toujours au conditionnel, jamais un ordre
  ni une affirmation de fait clinique (ex. jamais "vous avez une
  carence", toujours une négation prudente du type "ne permet pas de
  conclure à...").
- **Rien n'est presenté comme un diagnostic** : le moteur ne nomme
  jamais une pathologie, ne conclut jamais à un état de santé — il
  observe un comportement alimentaire déclaratif (le journal que la
  personne remplit elle-même) et propose une alternative alimentaire.
- **Garde-fous de sécurité déjà en place** (indépendamment de la
  question MDR) : blocage systématique sur allergie/intolérance
  déclarée (confirmée ou seulement suspectée), blocage sur seuil de
  confiance statistique insuffisant, blocage sur couverture de données
  insuffisante, traçabilité complète de chaque décision (quelle règle,
  quelle observation, quel résultat, jamais de persistance au-delà de
  la simulation actuelle).
- **Ce qui reste bloquant tant que non tranché** : aucune règle du
  moteur n'a le statut de production ("active") — le code refuse
  structurellement ce statut à ce stade (`rule.status === 'active'` est
  explicitement rejeté par `nutrition-rule-engine.js`). Rien n'est donc
  actuellement déployable sans une modification de code délibérée, quel
  que soit le résultat de l'analyse juridique.

## 4. Point de comparaison utile

Le règlement MDR classe généralement en classe I (risque le plus faible,
règle 11 de l'annexe VIII) les logiciels qui informent sans influencer
directement une décision de traitement, et en classe supérieure (IIa ou
plus) ceux dont les informations sont susceptibles d'entraîner une
décision ayant un impact direct sur la santé du patient (ex. modifier un
traitement, orienter un diagnostic). La classification précise, si
qualification il y a, dépendrait de la manière exacte dont le produit
sera positionné et commercialisé — question également à trancher avec
le juriste.

## 5. Questions posées au juriste

1. Dans l'état actuel (moteur confiné, aucune connexion patient), y a-t-il
   une obligation réglementaire qui s'applique déjà, ou le seuil MDR ne
   se déclenche-t-il qu'au moment de la mise en production réelle ?
2. Si le moteur reste limité aux règles non liées à une pathologie (ex.
   "aliments ultra-transformés répétés"), cela suffit-il à écarter la
   qualification MDR, ou le simple fait que l'architecture soit *prête*
   à croiser des pathologies (même non activée) pose-t-il déjà un
   problème ?
3. Si le moteur adapte un jour ses conseils selon une pathologie
   déclarée, quelle classe de risque MDR serait probablement applicable,
   et quelles obligations concrètes en découleraient (marquage CE,
   évaluation clinique, système de gestion de la qualité, etc.) ?
4. Le fait que le conseil ne soit jamais prescriptif et renvoie
   systématiquement vers "en discuter avec un professionnel" a-t-il un
   poids réel dans la qualification, ou est-ce insuffisant en pratique ?
5. Existe-t-il une voie de conception (ex. rester en coaching bien-être
   pur, ou au contraire n'activer les règles liées aux pathologies que
   sous supervision d'un professionnel de santé identifié) qui
   permettrait d'éviter ou de limiter la qualification MDR, tout en
   gardant la fonctionnalité utile ?

---

Ce document complète `docs/GOVERNANCE_QUESTIONS.md`, qui couvre
l'ensemble des points de gouvernance (RGPD, responsabilité, rétention,
consentement) au-delà de la seule question MDR traitée ici.
