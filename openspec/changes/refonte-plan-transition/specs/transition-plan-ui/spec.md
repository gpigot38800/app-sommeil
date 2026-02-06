## MODIFIED Requirements

### Requirement: Transition plan generation form

Le systeme SHALL afficher un formulaire permettant a l'utilisateur de generer un plan de transition. Le formulaire contient uniquement deux selects (shift de depart et shift d'arrivee). Le nombre de jours est calcule automatiquement.

#### Scenario: Formulaire affiche avec les shifts de l'utilisateur

- **WHEN** l'utilisateur accede a la page `/transition`
- **THEN** un formulaire s'affiche avec un select "Shift de depart" et un select "Shift d'arrivee"
- **THEN** les selects MUST etre remplis avec les shifts existants de l'utilisateur (format : type + date debut - date fin)
- **THEN** le champ "Nombre de jours disponibles" MUST ne pas etre present dans le formulaire

#### Scenario: Formulaire vide si aucun shift

- **WHEN** l'utilisateur n'a aucun shift enregistre
- **THEN** le formulaire MUST afficher un message invitant a creer des shifts dans la section Planning
- **THEN** le bouton de generation MUST etre desactive

#### Scenario: Validation du formulaire

- **WHEN** l'utilisateur soumet le formulaire sans selectionner les deux shifts
- **THEN** un message d'erreur MUST s'afficher pour les champs manquants

#### Scenario: Shift depart et arrivee identiques

- **WHEN** l'utilisateur selectionne le meme shift comme depart et arrivee
- **THEN** un message d'erreur MUST indiquer que les shifts doivent etre differents

### Requirement: Plan generation via API

Le systeme SHALL generer et persister un plan de transition via une API route. Le payload de l'API ne contient que `fromShiftId` et `toShiftId`. Le nombre de jours est calcule cote serveur a partir des dates des shifts.

#### Scenario: Generation reussie

- **WHEN** l'utilisateur soumet le formulaire avec des shifts valides
- **THEN** l'API `POST /api/transition-plans` MUST etre appelee avec `{ fromShiftId, toShiftId }`
- **THEN** le plan genere MUST etre sauvegarde en base de donnees (tables `transition_plans` et `plan_days`)
- **THEN** le plan complet (avec ses jours, deficits et contexte shift) MUST etre retourne au client

#### Scenario: Utilisateur non authentifie

- **WHEN** un utilisateur non authentifie appelle `POST /api/transition-plans`
- **THEN** l'API MUST retourner une erreur 401

#### Scenario: Donnees invalides

- **WHEN** l'API recoit des donnees qui ne passent pas la validation Zod
- **THEN** l'API MUST retourner une erreur 400 avec les details de validation

### Requirement: Plan detail view with daily checklist

Le systeme SHALL afficher le detail d'un plan de transition avec une vue jour par jour sous forme de checklist. Chaque jour affiche une pastille indiquant le type de shift et les horaires de travail.

#### Scenario: Affichage du detail apres generation

- **WHEN** un plan est genere avec succes
- **THEN** le detail du plan MUST s'afficher automatiquement sous le formulaire
- **THEN** chaque jour MUST etre affiche dans une card avec : numero du jour, pastille type de shift (Jour/Soir/Nuit) avec code couleur, horaires de travail (ex: "07:00 - 15:00"), heure coucher cible, heure lever cible, heure stop cafeine, deficit de sommeil du jour, notes/conseils
- **THEN** la ligne "Lumiere tamisee" MUST s'afficher uniquement si `lightStart` et `lightEnd` ne sont pas null (c'est-a-dire pour les shifts jour, soir et repos, mais PAS pour les shifts de nuit)

#### Scenario: Affichage lumiere tamisee pour shift jour ou soir

- **WHEN** un jour du plan est un shift de jour ou de soir (ou un jour de repos)
- **WHEN** `lightStart` et `lightEnd` sont renseignes
- **THEN** la card MUST afficher une ligne "Lumiere tamisee" avec l'icone appropriee et la plage horaire (ex: "21:00 - 23:00")
- **THEN** le libelle MUST indiquer que la lumiere doit etre tamisee pour preparer le sommeil

#### Scenario: Pas d'affichage lumiere pour shift de nuit

- **WHEN** un jour du plan est un shift de nuit
- **WHEN** `lightStart` et `lightEnd` sont null
- **THEN** la card MUST ne PAS afficher de ligne "Lumiere tamisee"

#### Scenario: Pastille de shift avec code couleur

- **WHEN** un jour du plan correspond a un shift de type "nuit"
- **THEN** la pastille MUST afficher "Nuit" avec un fond indigo (bg-indigo-500/20)
- **WHEN** un jour du plan correspond a un shift de type "jour"
- **THEN** la pastille MUST afficher "Jour" avec un fond vert (bg-green-500/20)
- **WHEN** un jour du plan correspond a un shift de type "soir"
- **THEN** la pastille MUST afficher "Soir" avec un fond orange (bg-orange-500/20)

#### Scenario: Jour de repos sans shift

- **WHEN** un jour du plan ne correspond a aucun shift (jour de repos)
- **THEN** la pastille MUST afficher "Repos" avec un style neutre
- **THEN** aucune ligne "Horaires de travail" MUST etre affichee

#### Scenario: Affichage du detail en cliquant sur un plan existant

- **WHEN** l'utilisateur clique sur un plan dans la liste
- **THEN** le detail de ce plan MUST s'afficher avec les memes informations incluant pastilles et horaires

## REMOVED Requirements

### Requirement: Available days field in form
**Reason**: Le champ "Nombre de jours disponibles (2-6)" est supprime du formulaire. Le nombre de jours est calcule automatiquement a partir des dates des shifts selectionnes.
**Migration**: Supprimer l'input number `availableDays`, le state associe, et la transmission de ce champ dans le payload POST.
