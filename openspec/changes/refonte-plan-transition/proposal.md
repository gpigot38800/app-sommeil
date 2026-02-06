## Why

Le moteur de planification actuel génère des plans de transition incohérents avec le profil de l'utilisateur : il utilise des heures de référence fixes (jour→23:00, soir→01:00, nuit→08:00) au lieu des heures habituelles de coucher/lever saisies dans le profil. De plus, le stop caféine est trop tardif en shift de jour, les jours du plan n'indiquent pas le type de shift ni les horaires de travail, le champ "jours disponibles" est redondant avec les dates des shifts, et le flux post-profil ne redirige pas vers la page planning.

## What Changes

- **BREAKING** : Le moteur de planification (`planning-engine`) utilise désormais les heures habituelles du profil utilisateur comme point de départ au lieu d'heures de référence fixes. Le calcul du plan de transition part de l'heure réelle de coucher de l'utilisateur.
- **BREAKING** : Le calcul du stop caféine est différencié par type de shift : 8h avant coucher pour les shifts de jour (au lieu de 6h), 6h pour les shifts de soir et de nuit.
- Chaque jour du plan de transition affiche une pastille indiquant le type de shift (Jour/Soir/Nuit) et les horaires de travail correspondants.
- **BREAKING** : Suppression du champ "jours disponibles" dans le formulaire de génération du plan. Le nombre de jours est calculé automatiquement à partir de l'écart entre les dates du shift de départ et du shift d'arrivée.
- Après la sauvegarde réussie du profil (nouvel utilisateur), redirection automatique vers `/planning`.

## Capabilities

### New Capabilities

_(aucune nouvelle capability — toutes les modifications portent sur des capabilities existantes)_

### Modified Capabilities

- `planning-engine` : Les heures habituelles du profil deviennent le point de départ du calcul de transition au lieu des heures de référence fixes. Le stop caféine est différencié par type de shift (8h avant coucher en shift jour, 6h sinon). Le nombre de jours est calculé à partir des dates des shifts au lieu d'un paramètre manuel.
- `transition-plan-ui` : Chaque jour du plan affiche une pastille avec le type de shift et les horaires de travail. Suppression du champ "jours disponibles" du formulaire.
- `user-profile` : Redirection vers `/planning` après sauvegarde du profil pour un nouvel utilisateur.

## Impact

- **Planning engine** (`src/lib/planning-engine/index.ts`, `rules.ts`, `types.ts`) : Refonte de `getReferenceSleepTime()` pour intégrer les heures habituelles, modification de `getCaffeineCutoff()` pour différencier par shift, calcul automatique du nombre de jours depuis les dates des shifts.
- **API transition** (`src/app/api/transition-plans/route.ts`) : Suppression du paramètre `availableDays` dans le payload, récupération des dates des shifts pour calculer le nombre de jours.
- **Validateur** (`src/lib/validators/transition-plan.ts`) : Retrait de `availableDays` du schéma Zod.
- **Formulaire transition** (`src/components/forms/transition-form.tsx`) : Suppression du champ "jours disponibles".
- **Plan detail** (`src/components/forms/plan-detail.tsx`) : Ajout des pastilles de shift et horaires de travail par jour.
- **DB schema** (`src/db/schema.ts`) : Ajout potentiel d'un champ `shift_type` et `work_hours` dans la table `plan_days` pour stocker le contexte du shift par jour.
- **Profil** (`src/components/forms/profile-form.tsx`) : Ajout de la redirection post-sauvegarde vers `/planning`.
