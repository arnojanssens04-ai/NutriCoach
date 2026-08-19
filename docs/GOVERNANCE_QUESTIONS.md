# Questions de gouvernance — moteur de conseils nutritionnels (nutrition-*.js)

Ce document reconstitue les questions bloquantes identifiées avant toute
connexion du moteur `nutrition-*.js` (actuellement confiné à
`nutrition-simulator-admin.html`, profils fictifs uniquement) à un vrai
patient. Il n'a pas de valeur juridique — c'est une base de travail pour
trancher les décisions produit, à valider si besoin par un professionnel
qualifié (DPO / avocat spécialisé santé numérique) sur les points RGPD/MDR.

Statut : **Phase 0 — bloquante**. Rien de ce moteur n'est montré à un
patient réel tant que ces points ne sont pas explicitement tranchés.

---

## 1. Qualification "dispositif médical" (Règlement UE 2017/745, MDR)

**La question** : un logiciel qui analyse un journal alimentaire et
génère un conseil personnalisé ("mangez moins de X, plus de Y") peut, selon
la manière dont il est présenté, entrer dans la définition d'un dispositif
médical logiciel (SaMD) s'il vise un but médical (diagnostic, prévention,
surveillance d'une pathologie).

**Ce qui penche pour "hors MDR"** : le moteur actuel ne diagnostique rien,
ne traite aucune pathologie, formule des observations statistiques
descriptives ("apport en calcium inférieur à une référence générique") et
renvoie systématiquement vers "en discuter avec un professionnel" plutôt
que de prescrire.

**Ce qui penche vers "possible SaMD"** : le moteur croise déjà le contexte
clinique du profil (`hasConflictingClinicalContext`) et pourrait, si son
usage évolue, être perçu comme visant une "prévention ou surveillance"
d'une maladie plutôt qu'un simple bien-être général.

**Décision à prendre** : le produit reste-t-il positionné comme "coaching
nutritionnel bien-être", strictement hors du champ pathologie/diagnostic ?
Si oui, quelles garde-fous produits (texte affiché, périmètre des règles
actives) le garantissent concrètement ?

> **DÉCISION (2026-08-19)** : le moteur pourra un jour adapter ses
> conseils selon les pathologies déclarées (diabète, cholestérol, etc.),
> pas seulement rester un coaching bien-être générique. **Conséquence
> directe** : le risque de qualification en dispositif médical logiciel
> (SaMD) devient réel, pas seulement théorique. Ce point ne peut PAS être
> tranché uniquement par une analyse technique — un avis juridique formel
> sur la qualification MDR est nécessaire **avant toute connexion réelle
> à un patient** (le travail de préparation dans le simulateur confiné
> peut continuer, mais la mise en production reste bloquée par ce point).

## 2. Article 22 RGPD — décision individuelle automatisée

**La question** : l'article 22 encadre les décisions "fondées
exclusivement sur un traitement automatisé" produisant des "effets
juridiques" ou l'affectant "de manière significative". Un conseil
alimentaire seul n'est probablement pas une "décision" au sens strict,
mais le seuil est flou dès qu'il influence des choix de santé.

**Ce qui existe déjà côté garde-fou** : le moteur ne produit jamais un
résultat qu'un patient verrait sans validation humaine intermédiaire (à ce
stade, aucun patient ne le voit du tout) ; chaque carte renvoie vers "en
discuter avec un professionnel" plutôt que d'agir seule.

**Décision à prendre** : si/quand une carte est un jour montrée à un
patient, un humain (l'équipe Cap Santé) doit-il systématiquement valider
chaque carte avant affichage (comme on l'a fait pour l'ajustement kcal en
mode admin), ou seulement en assurer la supervision a posteriori (audit,
possibilité de retrait) ? Le mécanisme d'approbation admin construit pour
les calories (bilan_recap.html) est un précédent direct réutilisable ici.

> **DÉCISION (2026-08-19)** : génération et affichage 100% automatiques,
> propres à chaque patient (le moteur prend déjà `journalEntries` +
> `profile` d'un seul patient en entrée — jamais un conseil partagé entre
> patients). Aucune validation admin avant affichage. L'admin
> n'intervient que si le patient demande explicitement à en discuter
> davantage. **Conséquence** : c'est le scénario qui se rapproche le plus
> de l'art. 22 RGPD (décision automatisée sans validation humaine
> préalable). Deux garanties deviennent alors nécessaires : (1) un droit
> clair et accessible pour le patient de contester ou demander une
> intervention humaine — déjà prévu via "en discuter avec l'admin" ; (2)
> documenter cette logique explicitement dans les CGU avant mise en
> production réelle.

## 3. Chaîne de responsabilité professionnelle

**La question** : en cas de conseil inadapté (ex. suggestion incompatible
avec une pathologie non déclarée, ou déclarée mais mal cartographiée), qui
porte la responsabilité — l'éditeur du logiciel, l'équipe Cap Santé qui
valide, ou le patient qui applique le conseil sans consulter un
professionnel ?

**Ce qui existe déjà côté garde-fou** : filtrage sécurité prioritaire et
bloquant (`nutrition-safety.js`) sur allergies/intolérances confirmées OU
non vérifiées, blocage sur conflit clinique cartographié, formulation
systématiquement au conditionnel avec renvoi vers un professionnel,
traçabilité complète (`nutrition-audit.js`) de chaque décision.

**Décision à prendre** : ces garde-fous suffisent-ils pour limiter la
responsabilité à "outil d'aide à la décision, jamais prescriptif", ou
faut-il un texte contractuel explicite (CGU) le formalisant avant toute
mise en production, même en shadow mode réel ?

## 4. Politique de rétention des données d'audit

**La question** : aujourd'hui, `nutrition-audit.js` ne persiste rien
(mémoire du processus de simulation uniquement — aucune table Supabase
pour ce moteur). Le jour où une décision (proposée ou approuvée) doit
être tracée pour un vrai patient, combien de temps ces traces
doivent-elles être conservées, et sous quelle base légale ?

**Décision à prendre** : durée de rétention des enregistrements d'audit
(ex. alignée sur la durée de conservation du dossier patient existant ?),
et qui y a accès (admin uniquement, comme le reste du moteur ?).

---

## Points complémentaires soulevés lors de cette session

## 5. Consentement spécifique pour les données alimentaires "sensibles"

Le consentement santé existant (`toggleHealthConsent()` dans
dashboard.html) couvre déjà les pathologies déclarées. La question posée
aujourd'hui : faut-il un **consentement distinct et spécifique** pour que
le journal alimentaire soit exploité par ce moteur de conseils (au-delà
de son usage actuel purement descriptif dans le dashboard) ?

**Recommandation technique** (à valider) : oui, distinct — parce que la
finalité change (observation passive du journal vs. génération d'un
conseil personnalisé exploitant potentiellement des inférences sur des
habitudes ou une pathologie). Un consentement générique "je consens à
l'usage de mes données de santé" ne couvre pas clairement cette finalité
précise (principe de finalité déterminée, RGPD art. 5).

> **DÉCISION (2026-08-19)** : case de consentement distincte, séparée du
> consentement santé existant (`toggleHealthConsent()`). D'autant plus
> nécessaire que la génération est désormais automatique et sans
> validation admin préalable (voir point 2) — le patient doit savoir
> explicitement à quoi il consent avant que le moteur n'exploite son
> journal à cette fin précise.

## 6. Portée de l'engagement pris par l'équipe si une carte est validée

Si un admin "valide" une carte avant affichage (mécanisme proposé au
point 2), cela crée-t-il une obligation de suivi (ex. si le patient suit
le conseil et que son état se dégrade) ? Comparer avec le mécanisme
d'approbation kcal déjà en place, où l'admin valide un ajustement après
consultation du bilan.

## 7. Traitement des mineurs et grossesse/allaitement

Déjà bloqué techniquement (`isProfileEligibleForAutomatedAdvice` refuse
mineurs et grossesse/allaitement). Question ouverte : ce blocage
technique suffit-il, ou faut-il documenter explicitement cette exclusion
dans les CGU comme périmètre du service ?

## 8. Droit à l'explication / accès à la logique

Si un patient demande "pourquoi ce conseil m'a été montré", l'audit
actuel (`nutrition-audit.js`) contient déjà tout le nécessaire
(observationSnapshot, blockReason, selectedFoodCodes, flaggedFoodNames).
Question : ce niveau de détail doit-il être exposable au patient
lui-même, ou seulement à l'équipe Cap Santé sur demande ?
