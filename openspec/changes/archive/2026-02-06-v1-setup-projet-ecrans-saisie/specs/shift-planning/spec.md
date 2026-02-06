## Purpose

Écran de saisie du planning de travail permettant l'ajout, la modification et la suppression de shifts avec type (jour/soir/nuit), dates et horaires.

## ADDED Requirements

### Requirement: Shift list display

Le système SHALL afficher la liste des shifts de l'utilisateur sur la page planning.

#### Scenario: Liste des shifts affichée

- **WHEN** un utilisateur authentifié accède à la page planning
- **THEN** la liste de ses shifts est affichée, triée par date de début décroissante
- **THEN** chaque shift affiche : type (jour/soir/nuit), date de début, date de fin, horaires

#### Scenario: Aucun shift enregistré

- **WHEN** un utilisateur sans shifts accède à la page planning
- **THEN** un message indique qu'aucun shift n'est enregistré
- **THEN** un bouton "Ajouter un shift" est visible

### Requirement: Shift creation

Le système SHALL permettre l'ajout d'un nouveau shift de travail.

#### Scenario: Création réussie d'un shift

- **WHEN** l'utilisateur remplit le formulaire d'ajout avec un type (jour/soir/nuit), une date de début, une date de fin, une heure de début et une heure de fin
- **THEN** le shift est enregistré dans la table `work_shifts`
- **THEN** le shift apparaît dans la liste
- **THEN** un message de confirmation s'affiche

#### Scenario: Pré-remplissage des horaires selon le type

- **WHEN** l'utilisateur sélectionne le type "nuit"
- **THEN** les horaires sont pré-remplis avec des valeurs par défaut (ex: 21h00 - 07h00)
- **WHEN** l'utilisateur sélectionne le type "jour"
- **THEN** les horaires sont pré-remplis (ex: 07h00 - 15h00)
- **WHEN** l'utilisateur sélectionne le type "soir"
- **THEN** les horaires sont pré-remplis (ex: 15h00 - 23h00)

### Requirement: Shift form validation

Le système SHALL valider les données du shift avant sauvegarde.

#### Scenario: Champs obligatoires manquants

- **WHEN** l'utilisateur soumet le formulaire sans remplir tous les champs requis (type, date début, date fin, heure début, heure fin)
- **THEN** des messages d'erreur s'affichent sous chaque champ manquant

#### Scenario: Date de fin avant date de début

- **WHEN** l'utilisateur entre une date de fin antérieure à la date de début
- **THEN** un message d'erreur indique que la date de fin doit être postérieure ou égale à la date de début

#### Scenario: Type de shift invalide

- **WHEN** une requête tente de créer un shift avec un type autre que jour, soir ou nuit
- **THEN** la requête est rejetée avec une erreur de validation

### Requirement: Shift modification

Le système SHALL permettre la modification d'un shift existant.

#### Scenario: Modification réussie

- **WHEN** l'utilisateur clique sur un shift existant et modifie ses données
- **THEN** le formulaire de modification est pré-rempli avec les données actuelles
- **THEN** après sauvegarde, les modifications sont enregistrées en base de données
- **THEN** la liste est mise à jour

### Requirement: Shift deletion

Le système SHALL permettre la suppression d'un shift existant.

#### Scenario: Suppression avec confirmation

- **WHEN** l'utilisateur clique sur le bouton de suppression d'un shift
- **THEN** une boîte de dialogue de confirmation s'affiche
- **WHEN** l'utilisateur confirme la suppression
- **THEN** le shift est supprimé de la base de données
- **THEN** le shift disparaît de la liste

#### Scenario: Annulation de la suppression

- **WHEN** l'utilisateur clique sur le bouton de suppression puis annule
- **THEN** le shift n'est pas supprimé
- **THEN** la liste reste inchangée

### Requirement: Shift type visual distinction

Le système SHALL distinguer visuellement les types de shifts dans la liste.

#### Scenario: Couleurs distinctes par type

- **WHEN** la liste des shifts est affichée
- **THEN** chaque type de shift a un badge de couleur distincte (ex: bleu pour jour, orange pour soir, indigo pour nuit)
