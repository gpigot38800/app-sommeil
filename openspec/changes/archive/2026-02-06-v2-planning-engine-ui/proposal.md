## Why

La V1 a mis en place les fondations : authentification, profil utilisateur, saisie des shifts et layout dashboard. Cependant, l'application ne fournit pas encore sa valeur principale : **aider les travailleurs de nuit a adapter leur sommeil lors des transitions de shift**. Sans moteur de planification ni interface de plan de transition, l'app est un simple carnet de shifts. La V2 doit delivrer le coeur fonctionnel du MVP : generer un plan de transition personnalise, calculer le deficit de sommeil pendant la transition, et permettre a l'utilisateur de le consulter et le suivre.

## What Changes

- Ajout des tables `transition_plans` (avec `total_deficit_minutes`) et `plan_days` (avec `deficit_minutes`) dans le schema Drizzle
- Creation du moteur de regles (`planning-engine`) qui genere un `TransitionPlan` sur 2-6 jours (max legal francais), avec extension automatique si l'ecart horaire le necessite, calcul du deficit de sommeil par jour et cumule
- Support des 3 types de shifts (jour, soir, nuit) dans le moteur avec fenetres lumiere adaptees
- Nouvelle page `/transition` pour lancer la generation d'un plan et afficher le resultat jour par jour avec bandeau deficit
- Nouvelle page de detail d'un jour du plan avec checklist (heure coucher, lever, stop cafeine, fenetre lumiere, deficit)
- API routes pour creer, lister et consulter les plans de transition (stockage du type de shift en text, pas en ID)
- Validators Zod pour les plans de transition et les jours de plan

## Capabilities

### New Capabilities
- `planning-engine`: Moteur de regles rule-based qui calcule un plan de transition sommeil sur 2-6 jours, avec decalage progressif des horaires (max ±1.5h/jour, extension auto jusqu'a 6 jours), stop cafeine, fenetres lumiere/obscurite adaptees au type de shift (jour/soir/nuit), et calcul du deficit de sommeil (par jour + cumule)
- `transition-plan-ui`: Interface utilisateur pour generer un plan de transition (selection shift depart/arrivee, jours disponibles), afficher la liste des jours du plan avec deficit cumule, consulter le detail de chaque jour sous forme de checklist avec indicateur de deficit, et bandeau d'avertissement si deficit > 4h

### Modified Capabilities
- `database-schema`: Ajout des tables `transition_plans` (avec from_shift/to_shift en type text, total_deficit_minutes) et `plan_days` (avec deficit_minutes) avec leurs colonnes, foreign keys et politiques RLS

## Impact

- **Base de donnees** : 2 nouvelles tables (`transition_plans`, `plan_days`) avec colonnes deficit + migration Drizzle + politiques RLS
- **Code backend** : Nouveau module `src/lib/planning-engine/` (algorithme de generation + deficit), nouvelles API routes (`/api/transition-plans`)
- **Code frontend** : Nouvelles pages dashboard (`/transition`), nouveaux composants (formulaire de generation, vue plan jour par jour, checklist detail, bandeau deficit)
- **Validators** : Nouveaux schemas Zod pour `transition_plans` et `plan_days` (jours 2-6)
- **Navigation** : Ajout de l'entree "Mon plan" dans la sidebar du dashboard
