## Purpose

Moteur de regles rule-based qui genere un plan de transition sommeil personnalise sur 2-6 jours (max legal en France : 6 jours consecutifs sans repos). Le moteur calcule un decalage progressif des horaires de coucher/lever (max ±1.5h/jour), determine les heures de stop cafeine et les fenetres lumiere/obscurite, calcule le deficit de sommeil accumule pendant la transition, a partir du profil utilisateur et de deux shifts (depart et arrivee).

## ADDED Requirements

### Requirement: Generate transition plan from shifts and profile

Le systeme SHALL generer un `TransitionPlan` complet a partir d'un shift de depart, d'un shift d'arrivee, du profil sommeil de l'utilisateur et du nombre de jours disponibles.

#### Scenario: Generation d'un plan de transition jour vers nuit

- **WHEN** l'utilisateur a un profil avec `habitualSleepTime` = "23:00" et `habitualWakeTime` = "07:00"
- **WHEN** le shift de depart est de type "jour" (07:00-15:00) et le shift d'arrivee est de type "nuit" (21:00-07:00)
- **WHEN** le nombre de jours disponibles est 3
- **THEN** le moteur MUST retourner un tableau de 3 `PlanDay` avec des horaires decales progressivement vers un coucher tardif

#### Scenario: Generation d'un plan de transition nuit vers jour

- **WHEN** le shift de depart est de type "nuit" et le shift d'arrivee est de type "jour"
- **WHEN** le nombre de jours disponibles est 4
- **THEN** le moteur MUST retourner un tableau de 4 `PlanDay` avec des horaires decales progressivement vers un coucher en soiree

#### Scenario: Generation d'un plan de transition impliquant un shift soir

- **WHEN** le shift de depart est de type "soir" (15:00-23:00) et le shift d'arrivee est de type "nuit"
- **WHEN** le nombre de jours disponibles est 3
- **THEN** le moteur MUST retourner un tableau de `PlanDay` avec des horaires decales progressivement depuis les horaires du shift soir vers ceux du shift nuit

#### Scenario: Nombre de jours minimum

- **WHEN** le nombre de jours disponibles est inferieur a 2
- **THEN** le moteur MUST retourner une erreur indiquant qu'un minimum de 2 jours est requis

#### Scenario: Nombre de jours maximum

- **WHEN** le nombre de jours disponibles est superieur a 6
- **THEN** le moteur MUST limiter le plan a 6 jours

### Requirement: Progressive sleep time shifting

Le systeme SHALL decaler les horaires de sommeil de maximum ±1.5 heures par jour pour une transition progressive. Si l'ecart total ne peut pas etre couvert dans le nombre de jours demande (a raison de 1.5h/jour max), le moteur MUST etendre automatiquement le plan jusqu'a couvrir l'ecart, sans depasser 6 jours au total.

#### Scenario: Decalage respecte la limite de 1.5h par jour avec extension

- **WHEN** l'ecart total entre l'heure de coucher actuelle et l'heure de coucher cible est de 6 heures
- **WHEN** le nombre de jours disponibles est 3
- **THEN** chaque jour MUST decaler l'heure de coucher de 1.5h maximum
- **THEN** le plan MUST etre etendu a 4 jours (6h / 1.5h = 4 jours necessaires) car 3 jours ne suffisent pas

#### Scenario: Extension limitee a 6 jours maximum

- **WHEN** l'ecart total est de 10 heures et le nombre de jours disponibles est 3
- **THEN** le plan MUST etre etendu jusqu'a 6 jours maximum (loi francaise : 6 jours consecutifs max)
- **THEN** le dernier jour MUST couvrir l'ecart restant meme si le decalage depasse 1.5h pour ce jour

#### Scenario: Decalage inferieur a la limite quand suffisamment de jours

- **WHEN** l'ecart total est de 4 heures et le nombre de jours disponibles est 5
- **THEN** chaque jour MUST decaler l'heure de coucher d'environ 0.8h (4h / 5j)

#### Scenario: Wrap-around minuit

- **WHEN** l'heure de coucher actuelle est 23:00 et l'heure de coucher cible est 03:00
- **THEN** le moteur MUST gerer correctement le passage de minuit et calculer un ecart de 4 heures (et non 20 heures)

### Requirement: Calculate wake time from sleep duration

Le systeme SHALL calculer l'heure de lever cible en preservant la duree de sommeil habituelle de l'utilisateur.

#### Scenario: Duree de sommeil preservee

- **WHEN** le profil indique `habitualSleepTime` = "23:00" et `habitualWakeTime` = "07:00" (8h de sommeil)
- **WHEN** l'heure de coucher cible du jour est "01:00"
- **THEN** l'heure de lever cible MUST etre "09:00" (01:00 + 8h)

#### Scenario: Lever avec wrap-around minuit

- **WHEN** l'heure de coucher cible est "22:00" et la duree de sommeil est 9h
- **THEN** l'heure de lever cible MUST etre "07:00"

### Requirement: Calculate caffeine cutoff time

Le systeme SHALL calculer l'heure limite de consommation de cafeine a 6 heures avant l'heure de coucher cible.

#### Scenario: Cutoff cafeine calcule

- **WHEN** l'heure de coucher cible du jour est "23:00"
- **THEN** le `caffeineCutoff` MUST etre "17:00" (23:00 - 6h)

#### Scenario: Cutoff cafeine avec wrap-around

- **WHEN** l'heure de coucher cible est "03:00"
- **THEN** le `caffeineCutoff` MUST etre "21:00" (03:00 - 6h)

### Requirement: Calculate light exposure window

Le systeme SHALL calculer une fenetre d'exposition a la lumiere de 2 heures adaptee au type de shift cible.

#### Scenario: Fenetre lumiere pour transition vers shift jour

- **WHEN** le shift d'arrivee est de type "jour"
- **THEN** la fenetre lumiere (`lightStart` a `lightEnd`) MUST etre de 2 heures centree autour de l'heure de lever cible (lumiere au reveil pour avancer le rythme circadien)

#### Scenario: Fenetre lumiere pour transition vers shift soir

- **WHEN** le shift d'arrivee est de type "soir"
- **THEN** la fenetre lumiere (`lightStart` a `lightEnd`) MUST etre de 2 heures placee en fin de matinee (lumiere moderee pour un cycle intermediaire)

#### Scenario: Fenetre obscurite pour transition vers shift nuit

- **WHEN** le shift d'arrivee est de type "nuit"
- **THEN** la fenetre lumiere (`lightStart` a `lightEnd`) MUST etre de 2 heures centree 2h avant l'heure de coucher cible (obscurite pour retarder le rythme circadien)

### Requirement: Calculate sleep deficit per day

Le systeme SHALL calculer le deficit de sommeil pour chaque jour du plan de transition. Le deficit est la difference entre la duree de sommeil habituelle et la duree de sommeil reellement disponible ce jour-la, en tenant compte des contraintes du shift (heure de debut du shift qui tronque le sommeil si le lever cible est apres le debut du shift).

#### Scenario: Pas de deficit quand le sommeil n'est pas contraint

- **WHEN** l'heure de lever cible est "07:00" et le shift du jour commence a "15:00"
- **WHEN** la duree de sommeil habituelle est 8h
- **THEN** le deficit pour ce jour MUST etre 0h (le sommeil complet est possible)

#### Scenario: Deficit quand le shift tronque le sommeil

- **WHEN** l'heure de coucher cible est "01:00" et le shift du lendemain commence a "07:00"
- **WHEN** la duree de sommeil habituelle est 8h
- **THEN** l'heure de lever forcee MUST etre "07:00" (debut du shift) au lieu de "09:00" (coucher + 8h)
- **THEN** le deficit pour ce jour MUST etre 2h (6h de sommeil au lieu de 8h)

#### Scenario: Deficit cumule sur la transition

- **WHEN** un plan de 4 jours a des deficits de 0h, 1.5h, 2h et 0h
- **THEN** le deficit cumule MUST etre 3.5h
- **THEN** le moteur MUST retourner le deficit par jour ET le deficit cumule total

### Requirement: Generate day-specific notes

Le systeme SHALL generer des notes textuelles pour chaque jour du plan avec des conseils contextuels.

#### Scenario: Notes du premier jour

- **WHEN** le moteur genere le premier jour du plan
- **THEN** les notes MUST contenir un conseil d'introduction a la transition

#### Scenario: Notes du dernier jour

- **WHEN** le moteur genere le dernier jour du plan
- **THEN** les notes MUST contenir un rappel que l'utilisateur devrait etre adapte au nouveau rythme

#### Scenario: Notes en cas de deficit de sommeil

- **WHEN** un jour du plan a un deficit de sommeil superieur a 1h
- **THEN** les notes MUST contenir un avertissement et un conseil pour compenser (sieste courte de 20 min recommandee)

### Requirement: Pure function without side effects

Le moteur de regles SHALL etre une fonction pure TypeScript sans dependance a la base de donnees ni effets de bord.

#### Scenario: Appel sans contexte DB

- **WHEN** la fonction `generateTransitionPlan()` est appelee avec des inputs types (profil, shifts, nombre de jours)
- **THEN** elle MUST retourner un tableau de `PlanDay` avec deficit par jour et deficit cumule, sans effectuer d'appel reseau ni d'acces base de donnees

#### Scenario: Resultats deterministes

- **WHEN** la fonction est appelee deux fois avec les memes inputs
- **THEN** elle MUST retourner exactement le meme resultat
