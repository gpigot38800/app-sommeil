## Purpose

Écran de saisie et modification du profil utilisateur permettant de renseigner les informations personnelles (genre, âge, métier) et les heures de sommeil habituelles.

## ADDED Requirements

### Requirement: Profile form displays all fields

Le système SHALL afficher un formulaire de profil avec tous les champs nécessaires.

#### Scenario: Formulaire de profil affiché

- **WHEN** un utilisateur authentifié accède à la page profil
- **THEN** le formulaire affiche les champs : nom affiché, âge, genre (sélection), métier, heure de coucher habituelle, heure de lever habituelle

### Requirement: Profile creation on first access

Le système SHALL guider l'utilisateur vers la complétion de son profil après l'inscription.

#### Scenario: Nouveau utilisateur redirigé vers le profil

- **WHEN** un utilisateur fraîchement inscrit accède au dashboard pour la première fois
- **THEN** il est redirigé vers la page de profil avec un message l'invitant à compléter ses informations

### Requirement: Profile form validation

Le système SHALL valider les données du profil avant sauvegarde.

#### Scenario: Validation des champs obligatoires

- **WHEN** l'utilisateur soumet le formulaire sans remplir les champs âge, heure de coucher et heure de lever
- **THEN** des messages d'erreur s'affichent sous chaque champ manquant
- **THEN** le formulaire n'est pas soumis

#### Scenario: Validation de l'âge

- **WHEN** l'utilisateur entre un âge inférieur à 16 ou supérieur à 100
- **THEN** un message d'erreur indique que l'âge doit être entre 16 et 100

#### Scenario: Validation des heures de sommeil

- **WHEN** l'utilisateur sélectionne des heures de coucher et lever
- **THEN** les heures MUST être au format HH:MM valide

### Requirement: Profile save and update

Le système SHALL sauvegarder le profil en base de données et permettre sa modification ultérieure.

#### Scenario: Sauvegarde réussie du profil

- **WHEN** l'utilisateur soumet le formulaire avec des données valides
- **THEN** les données sont enregistrées dans la table `profiles`
- **THEN** un message de confirmation s'affiche
- **THEN** le champ `updated_at` est mis à jour

#### Scenario: Modification du profil existant

- **WHEN** un utilisateur avec un profil existant accède à la page profil
- **THEN** le formulaire est pré-rempli avec les données actuelles
- **THEN** l'utilisateur peut modifier et sauvegarder ses changements

### Requirement: Gender selection options

Le système SHALL proposer des options de genre inclusives.

#### Scenario: Options de genre affichées

- **WHEN** l'utilisateur interagit avec le champ genre
- **THEN** les options suivantes sont disponibles : Homme, Femme, Autre, Préfère ne pas répondre
