## ADDED Requirements

### Requirement: Transition plans table schema

Le systeme SHALL stocker les plans de transition dans une table `transition_plans`.

#### Scenario: Table transition_plans creee avec les bonnes colonnes

- **WHEN** la migration est appliquee a la base de donnees
- **THEN** la table `transition_plans` existe avec les colonnes : `id` (uuid PK), `user_id` (uuid FK profiles, NOT NULL), `from_shift` (text NOT NULL, type de shift : "jour", "soir" ou "nuit"), `to_shift` (text NOT NULL, type de shift : "jour", "soir" ou "nuit"), `start_date` (date NOT NULL), `days_count` (integer NOT NULL), `total_deficit_minutes` (integer, default 0, deficit de sommeil cumule en minutes), `created_at` (timestamptz, default now)

#### Scenario: Suppression en cascade depuis profiles

- **WHEN** un profil utilisateur est supprime
- **THEN** tous ses plans de transition MUST etre supprimes automatiquement (ON DELETE CASCADE)

### Requirement: Plan days table schema

Le systeme SHALL stocker les jours de plan dans une table `plan_days`.

#### Scenario: Table plan_days creee avec les bonnes colonnes

- **WHEN** la migration est appliquee a la base de donnees
- **THEN** la table `plan_days` existe avec les colonnes : `id` (uuid PK), `plan_id` (uuid FK transition_plans, NOT NULL), `day_number` (integer NOT NULL), `target_sleep_time` (time NOT NULL), `target_wake_time` (time NOT NULL), `caffeine_cutoff` (time NOT NULL), `light_start` (time NOT NULL), `light_end` (time NOT NULL), `deficit_minutes` (integer, default 0, deficit de sommeil en minutes pour ce jour), `notes` (text)

#### Scenario: Suppression en cascade depuis transition_plans

- **WHEN** un plan de transition est supprime
- **THEN** tous ses jours MUST etre supprimes automatiquement (ON DELETE CASCADE)

### Requirement: RLS policies for transition tables

Le systeme SHALL activer les politiques RLS sur les tables de transition pour isoler les donnees par utilisateur.

#### Scenario: Utilisateur ne voit que ses propres plans

- **WHEN** un utilisateur authentifie effectue un SELECT sur `transition_plans`
- **THEN** seules les lignes ou `user_id` correspond a son `auth.uid()` sont retournees

#### Scenario: Utilisateur ne voit que les jours de ses propres plans

- **WHEN** un utilisateur authentifie effectue un SELECT sur `plan_days`
- **THEN** seules les lignes dont le `plan_id` correspond a un plan lui appartenant sont retournees

#### Scenario: Utilisateur ne peut pas modifier les plans d'un autre

- **WHEN** un utilisateur tente un UPDATE ou DELETE sur un plan qui ne lui appartient pas
- **THEN** l'operation MUST etre refusee par la politique RLS

### Requirement: Migration for transition tables

Le systeme SHALL generer une migration Drizzle pour les nouvelles tables.

#### Scenario: Migration generee et appliquee

- **WHEN** la commande `drizzle-kit generate` est executee apres ajout des tables au schema
- **THEN** un nouveau fichier de migration SQL MUST etre cree dans `src/db/migrations/`
- **THEN** ce fichier MUST creer les tables `transition_plans` et `plan_days` avec toutes leurs contraintes
