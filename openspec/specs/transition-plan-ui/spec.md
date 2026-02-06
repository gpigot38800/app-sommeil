## Purpose

Interface utilisateur pour generer des plans de transition sommeil, les consulter jour par jour, visualiser les recommandations sous forme de checklist et voir le deficit de sommeil accumule. Inclut le formulaire de generation, la liste des plans existants, le detail par jour avec deficit, et les API routes associees.

## Requirements

### Requirement: Transition plan generation form

Le systeme SHALL afficher un formulaire permettant a l'utilisateur de generer un plan de transition.

#### Scenario: Formulaire affiche avec les shifts de l'utilisateur

- **WHEN** l'utilisateur accede a la page `/transition`
- **THEN** un formulaire s'affiche avec un select "Shift de depart", un select "Shift d'arrivee" et un champ "Nombre de jours" (2-6)
- **THEN** les selects MUST etre remplis avec les shifts existants de l'utilisateur (format : type + date debut - date fin)

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

Le systeme SHALL generer et persister un plan de transition via une API route. L'API MUST stocker le type de shift (text: "jour", "soir", "nuit") dans les champs `from_shift` et `to_shift` de la table `transition_plans` (et non l'ID du shift).

#### Scenario: Generation reussie

- **WHEN** l'utilisateur soumet le formulaire avec des shifts valides et un nombre de jours entre 2 et 6
- **THEN** l'API `POST /api/transition-plans` MUST etre appelee
- **THEN** le plan genere MUST etre sauvegarde en base de donnees (tables `transition_plans` et `plan_days`)
- **THEN** le plan complet (avec ses jours et deficits) MUST etre retourne au client

#### Scenario: Utilisateur non authentifie

- **WHEN** un utilisateur non authentifie appelle `POST /api/transition-plans`
- **THEN** l'API MUST retourner une erreur 401

#### Scenario: Donnees invalides

- **WHEN** l'API recoit des donnees qui ne passent pas la validation Zod
- **THEN** l'API MUST retourner une erreur 400 avec les details de validation

#### Scenario: Extension automatique du plan

- **WHEN** l'ecart horaire entre les shifts necessite plus de jours que demande
- **THEN** l'API MUST retourner un plan etendu (jusqu'a 6 jours max) et informer le client du nombre final de jours

### Requirement: List existing transition plans

Le systeme SHALL afficher la liste des plans de transition existants de l'utilisateur.

#### Scenario: Liste des plans affichee

- **WHEN** l'utilisateur accede a la page `/transition`
- **THEN** la liste des plans existants MUST s'afficher sous le formulaire, triee par date de creation decroissante
- **THEN** chaque plan MUST afficher : shift depart (type), shift arrivee (type), date de debut, nombre de jours, deficit cumule total

#### Scenario: Aucun plan existant

- **WHEN** l'utilisateur n'a aucun plan de transition
- **THEN** un message MUST indiquer qu'aucun plan n'a encore ete genere

#### Scenario: API liste des plans

- **WHEN** un GET est effectue sur `/api/transition-plans`
- **THEN** l'API MUST retourner tous les plans de l'utilisateur authentifie, tries par `created_at` decroissant

### Requirement: Plan detail view with daily checklist

Le systeme SHALL afficher le detail d'un plan de transition avec une vue jour par jour sous forme de checklist.

#### Scenario: Affichage du detail apres generation

- **WHEN** un plan est genere avec succes
- **THEN** le detail du plan MUST s'afficher automatiquement sous le formulaire
- **THEN** chaque jour MUST etre affiche dans une card avec : numero du jour, heure coucher cible, heure lever cible, heure stop cafeine, fenetre lumiere (debut - fin), deficit de sommeil du jour, notes/conseils

#### Scenario: Affichage du detail en cliquant sur un plan existant

- **WHEN** l'utilisateur clique sur un plan dans la liste
- **THEN** le detail de ce plan MUST s'afficher avec les memes informations

#### Scenario: API detail d'un plan

- **WHEN** un GET est effectue sur `/api/transition-plans/[id]`
- **THEN** l'API MUST retourner le plan avec tous ses jours (plan_days) inclus
- **THEN** si le plan n'appartient pas a l'utilisateur, l'API MUST retourner une erreur 404

### Requirement: Sleep deficit summary display

Le systeme SHALL afficher un resume du deficit de sommeil en haut du detail du plan.

#### Scenario: Resume deficit affiche

- **WHEN** le detail d'un plan est affiche
- **THEN** un bandeau resume MUST afficher le deficit de sommeil cumule total sur la duree du plan (ex: "Deficit estime : 3.5h sur 4 jours")

#### Scenario: Pas de deficit

- **WHEN** le plan n'a aucun deficit (tous les jours a 0h)
- **THEN** le bandeau MUST afficher un message positif (ex: "Aucun deficit de sommeil prevu")

#### Scenario: Deficit important

- **WHEN** le deficit cumule depasse 4h
- **THEN** le bandeau MUST afficher un avertissement visuel (couleur orange/rouge) avec un conseil de recuperation

### Requirement: Sidebar navigation entry

Le systeme SHALL ajouter une entree "Mon plan" dans la sidebar de navigation du dashboard.

#### Scenario: Entree visible dans la sidebar

- **WHEN** l'utilisateur est connecte et voit le dashboard
- **THEN** la sidebar MUST contenir une entree "Mon plan" avec une icone appropriee, pointant vers `/transition`

#### Scenario: Etat actif de la navigation

- **WHEN** l'utilisateur est sur la page `/transition`
- **THEN** l'entree "Mon plan" dans la sidebar MUST etre mise en surbrillance (style actif)

### Requirement: Delete a transition plan

Le systeme SHALL permettre a l'utilisateur de supprimer un plan de transition.

#### Scenario: Suppression avec confirmation

- **WHEN** l'utilisateur clique sur le bouton de suppression d'un plan
- **THEN** une boite de dialogue de confirmation MUST s'afficher
- **WHEN** l'utilisateur confirme la suppression
- **THEN** le plan et tous ses jours associes MUST etre supprimes de la base de donnees

#### Scenario: API suppression

- **WHEN** un DELETE est effectue sur `/api/transition-plans/[id]`
- **THEN** le plan et ses plan_days MUST etre supprimes (cascade)
- **THEN** si le plan n'appartient pas a l'utilisateur, l'API MUST retourner une erreur 404

### Requirement: Responsive design and dark mode

L'interface de transition MUST etre responsive (mobile-first) et supporter le dark mode.

#### Scenario: Affichage mobile

- **WHEN** l'utilisateur consulte la page sur un ecran mobile (< 768px)
- **THEN** les cards des jours MUST s'empiler verticalement
- **THEN** le formulaire MUST occuper toute la largeur

#### Scenario: Dark mode

- **WHEN** le theme sombre est actif
- **THEN** tous les composants de la page transition MUST respecter le theme sombre (couleurs, contrastes)
