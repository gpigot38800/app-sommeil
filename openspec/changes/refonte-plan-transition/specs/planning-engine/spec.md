## MODIFIED Requirements

### Requirement: Generate transition plan from shifts and profile

Le systeme SHALL generer un `TransitionPlan` complet a partir d'un shift de depart, d'un shift d'arrivee et du profil sommeil de l'utilisateur. Le nombre de jours de transition est calcule automatiquement a partir de l'ecart entre la date de fin du shift de depart et la date de debut du shift d'arrivee.

#### Scenario: Generation d'un plan de transition jour vers nuit

- **WHEN** l'utilisateur a un profil avec `habitualSleepTime` = "22:00" et `habitualWakeTime` = "06:00"
- **WHEN** le shift de depart est de type "jour" (07:00-15:00) finissant le 10 fevrier et le shift d'arrivee est de type "nuit" (21:00-07:00) commencant le 13 fevrier
- **THEN** le moteur MUST calculer 3 jours de transition (ecart entre le 10 et le 13 fevrier)
- **THEN** le moteur MUST utiliser "22:00" (heure habituelle de coucher du profil) comme point de depart et non une heure de reference fixe
- **THEN** le moteur MUST retourner un tableau de 3 `PlanDay` avec des horaires decales progressivement

#### Scenario: Generation d'un plan de transition nuit vers jour

- **WHEN** le shift de depart est de type "nuit" finissant le 5 mars et le shift d'arrivee est de type "jour" commencant le 9 mars
- **THEN** le moteur MUST calculer 4 jours de transition et retourner un tableau de 4 `PlanDay` avec des horaires decales progressivement vers un coucher en soiree

#### Scenario: Generation d'un plan de transition impliquant un shift soir

- **WHEN** le shift de depart est de type "soir" (15:00-23:00) finissant le 1er avril et le shift d'arrivee est de type "nuit" commencant le 4 avril
- **THEN** le moteur MUST calculer 3 jours de transition et retourner un tableau de `PlanDay` avec des horaires decales progressivement

#### Scenario: Nombre de jours minimum

- **WHEN** l'ecart entre la fin du shift de depart et le debut du shift d'arrivee est inferieur a 2 jours
- **THEN** le moteur MUST generer un minimum de 2 jours de transition

#### Scenario: Nombre de jours maximum

- **WHEN** l'ecart entre la fin du shift de depart et le debut du shift d'arrivee est superieur a 6 jours
- **THEN** le moteur MUST limiter le plan a 6 jours

#### Scenario: Point de depart = heure habituelle de coucher

- **WHEN** l'utilisateur a `habitualSleepTime` = "21:30"
- **WHEN** le shift de depart est de type "jour"
- **THEN** le `startSleepMinutes` MUST etre 21:30 (1290 minutes) et non 23:00 (heure de reference fixe)

#### Scenario: Heure cible calculee depuis le shift d'arrivee

- **WHEN** le shift d'arrivee commence a 21:00 et la duree de sommeil habituelle est 8h
- **THEN** le `targetSleepTime` du dernier jour MUST etre 13:00 (21:00 - 8h) pour garantir que l'utilisateur dorme suffisamment avant le debut du shift

### Requirement: Progressive sleep time shifting

Le systeme SHALL decaler les horaires de sommeil de maximum ±1.5 heures par jour pour une transition progressive. Si l'ecart total ne peut pas etre couvert dans le nombre de jours disponibles (calcule a partir des dates des shifts, a raison de 1.5h/jour max), le moteur MUST utiliser le maximum de jours disponibles et accepter un decalage plus important par jour si necessaire.

#### Scenario: Decalage respecte la limite de 1.5h par jour avec extension

- **WHEN** l'ecart total entre l'heure de coucher actuelle et l'heure de coucher cible est de 6 heures
- **WHEN** le nombre de jours calcule est 3
- **THEN** chaque jour MUST decaler l'heure de coucher de 2h (6h / 3j) car seulement 3 jours sont disponibles

#### Scenario: Extension limitee a 6 jours maximum

- **WHEN** l'ecart total est de 10 heures et le nombre de jours calcule est 8
- **THEN** le plan MUST etre limite a 6 jours maximum
- **THEN** le dernier jour MUST couvrir l'ecart restant meme si le decalage depasse 1.5h pour ce jour

#### Scenario: Decalage inferieur a la limite quand suffisamment de jours

- **WHEN** l'ecart total est de 4 heures et le nombre de jours calcule est 5
- **THEN** chaque jour MUST decaler l'heure de coucher d'environ 0.8h (4h / 5j)

#### Scenario: Wrap-around minuit

- **WHEN** l'heure de coucher actuelle est 23:00 et l'heure de coucher cible est 03:00
- **THEN** le moteur MUST gerer correctement le passage de minuit et calculer un ecart de 4 heures (et non 20 heures)

### Requirement: Calculate caffeine cutoff time

Le systeme SHALL calculer l'heure limite de consommation de cafeine en fonction du type de shift du jour concerne : 8 heures avant l'heure de coucher cible pour un shift de jour, 6 heures avant pour un shift de soir ou de nuit.

#### Scenario: Cutoff cafeine pour shift de jour

- **WHEN** le jour concerne est un shift de jour et l'heure de coucher cible est "23:00"
- **THEN** le `caffeineCutoff` MUST etre "15:00" (23:00 - 8h)

#### Scenario: Cutoff cafeine pour shift de soir

- **WHEN** le jour concerne est un shift de soir et l'heure de coucher cible est "02:00"
- **THEN** le `caffeineCutoff` MUST etre "20:00" (02:00 - 6h)

#### Scenario: Cutoff cafeine pour shift de nuit

- **WHEN** le jour concerne est un shift de nuit et l'heure de coucher cible est "08:00"
- **THEN** le `caffeineCutoff` MUST etre "02:00" (08:00 - 6h)

#### Scenario: Cutoff cafeine avec wrap-around

- **WHEN** le jour est un shift de jour et l'heure de coucher cible est "00:30"
- **THEN** le `caffeineCutoff` MUST etre "16:30" (00:30 - 8h)

### Requirement: Calculate light exposure window

Le systeme SHALL calculer une fenetre de lumiere tamisee de 2 heures avant l'heure de coucher cible pour les shifts de jour et de soir, afin de preparer l'utilisateur au sommeil. Pour les shifts de nuit (coucher en journee), le moteur SHALL ne PAS generer de fenetre lumiere car l'obscurite doit etre recherchee activement et ne necessite pas de rappel de tamisage.

#### Scenario: Fenetre lumiere tamisee pour shift de jour

- **WHEN** le jour concerne est un shift de jour avec coucher cible a "23:00"
- **THEN** la fenetre lumiere MUST etre de 2 heures avant le coucher : `lightStart` = "21:00", `lightEnd` = "23:00"
- **THEN** la fenetre represente le moment ou l'utilisateur doit tamiser la lumiere pour se mettre en ambiance de sommeil

#### Scenario: Fenetre lumiere tamisee pour shift de soir

- **WHEN** le jour concerne est un shift de soir avec coucher cible a "02:00"
- **THEN** la fenetre lumiere MUST etre de 2 heures avant le coucher : `lightStart` = "00:00", `lightEnd` = "02:00"

#### Scenario: Pas de fenetre lumiere pour shift de nuit

- **WHEN** le jour concerne est un shift de nuit (coucher en journee, ex: "08:00")
- **THEN** le moteur MUST retourner `lightStart` = null et `lightEnd` = null
- **THEN** aucune information de lumiere ne sera affichee pour ce jour

#### Scenario: Jour de repos (pas de shift)

- **WHEN** le jour du plan est un jour de repos (shiftType = null)
- **THEN** la fenetre lumiere MUST etre calculee comme pour un shift de jour (2h avant coucher) car l'utilisateur est dans un contexte de vie normale

### Requirement: Generate day-specific notes

Le systeme SHALL generer des notes textuelles pour chaque jour du plan avec des conseils contextuels. La note d'introduction de transition ("Decalez progressivement votre heure de coucher") SHALL s'afficher uniquement lorsque la transition est de nuit vers jour ou de nuit vers soir ET qu'un deficit de sommeil est prevu pour ce jour.

#### Scenario: Note d'introduction pour transition nuit vers jour avec deficit

- **WHEN** le moteur genere le jour 1 du plan
- **WHEN** le shift de depart est de type "nuit" et le shift d'arrivee est de type "jour"
- **WHEN** le deficit de sommeil du jour est superieur a 0
- **THEN** les notes MUST contenir le conseil d'introduction a la transition

#### Scenario: Pas de note d'introduction pour transition jour vers nuit

- **WHEN** le moteur genere le jour 1 du plan
- **WHEN** le shift de depart est de type "jour" et le shift d'arrivee est de type "nuit"
- **THEN** les notes MUST ne PAS contenir le conseil d'introduction a la transition

#### Scenario: Pas de note d'introduction pour transition soir vers nuit

- **WHEN** le moteur genere le jour 1 du plan
- **WHEN** le shift de depart est de type "soir" et le shift d'arrivee est de type "nuit"
- **THEN** les notes MUST ne PAS contenir le conseil d'introduction a la transition

#### Scenario: Pas de note d'introduction si aucun deficit

- **WHEN** le moteur genere le jour 1 du plan
- **WHEN** le shift de depart est de type "nuit" et le shift d'arrivee est de type "jour"
- **WHEN** le deficit de sommeil du jour est 0
- **THEN** les notes MUST ne PAS contenir le conseil d'introduction a la transition

#### Scenario: Notes du dernier jour

- **WHEN** le moteur genere le dernier jour du plan
- **THEN** les notes MUST contenir un rappel que l'utilisateur devrait etre adapte au nouveau rythme

#### Scenario: Notes en cas de deficit de sommeil important

- **WHEN** un jour du plan a un deficit de sommeil superieur a 1h
- **THEN** les notes MUST contenir un avertissement et un conseil pour compenser (sieste courte de 20 min recommandee)

## ADDED Requirements

### Requirement: Associate shift context to each plan day

Le systeme SHALL associer a chaque jour du plan de transition le type de shift et les horaires de travail correspondants, en se basant sur les dates calendaires des shifts de depart et d'arrivee.

#### Scenario: Jour correspondant au shift de depart

- **WHEN** la date calendaire du jour 1 du plan tombe dans la plage de dates du shift de depart (type "jour", 07:00-15:00)
- **THEN** le `PlanDay` MUST contenir `shiftType` = "jour" et `workHours` = "07:00 - 15:00"

#### Scenario: Jour correspondant au shift d'arrivee

- **WHEN** la date calendaire du jour 3 du plan tombe le jour de debut du shift d'arrivee (type "nuit", 21:00-07:00)
- **THEN** le `PlanDay` MUST contenir `shiftType` = "nuit" et `workHours` = "21:00 - 07:00"

#### Scenario: Jour de repos entre les deux shifts

- **WHEN** la date calendaire d'un jour du plan ne correspond a aucun shift (jour de repos)
- **THEN** le `PlanDay` MUST contenir `shiftType` = null et `workHours` = null

#### Scenario: Persistance du contexte shift en base de donnees

- **WHEN** un plan de transition est sauvegarde
- **THEN** chaque `plan_day` MUST stocker `shift_type`, `work_start_time` et `work_end_time` dans la base de donnees

### Requirement: Calculate transition days from shift dates

Le systeme SHALL calculer automatiquement le nombre de jours de transition a partir de la difference en jours calendaires entre la date de fin du shift de depart et la date de debut du shift d'arrivee.

#### Scenario: Calcul standard

- **WHEN** le shift de depart finit le 10 fevrier et le shift d'arrivee commence le 14 fevrier
- **THEN** le nombre de jours de transition MUST etre 4

#### Scenario: Ecart trop court

- **WHEN** le shift de depart finit le 10 fevrier et le shift d'arrivee commence le 11 fevrier (1 jour d'ecart)
- **THEN** le nombre de jours de transition MUST etre borne a 2 (minimum)

#### Scenario: Ecart trop long

- **WHEN** le shift de depart finit le 1er mars et le shift d'arrivee commence le 15 mars (14 jours d'ecart)
- **THEN** le nombre de jours de transition MUST etre borne a 6 (maximum)

## REMOVED Requirements

### Requirement: Available days parameter
**Reason**: Le parametre `availableDays` est supprime de `PlanningInput`. Le nombre de jours est desormais calcule automatiquement a partir des dates des shifts.
**Migration**: Supprimer `availableDays` de l'interface `PlanningInput`, du validateur Zod `createTransitionPlanSchema`, et du payload POST de l'API `/api/transition-plans`.
