## Why

L'application n'existe pas encore. Pour démarrer le MVP destiné aux travailleurs de nuit, il faut d'abord mettre en place le socle technique (projet Next.js 15, base de données Supabase, authentification) et les premiers écrans de saisie (profil utilisateur, planning des shifts). Sans cette fondation, aucune fonctionnalité métier (plan de transition, suivi sommeil, graphiques) ne peut être construite.

## What Changes

- Initialisation du projet Next.js 15 (App Router) avec TypeScript, Tailwind CSS et shadcn/ui
- Configuration de Supabase (authentification, base de données PostgreSQL)
- Mise en place de Drizzle ORM avec le schéma de base de données (tables `profiles`, `work_shifts`)
- Création des écrans d'authentification (inscription, connexion)
- Création de l'écran de saisie du profil utilisateur (genre, âge, métier, heures de sommeil habituelles)
- Création de l'écran de saisie du planning (ajout/modification/suppression de shifts)
- Layout principal de l'application (navigation, sidebar, dark mode)
- Configuration PWA de base (manifest, icônes)

## Capabilities

### New Capabilities

- `project-setup` : Initialisation du projet Next.js 15, configuration Tailwind/shadcn/ui, structure des dossiers, variables d'environnement, configuration PWA de base
- `auth` : Authentification utilisateur via Supabase Auth (inscription email/password, connexion, déconnexion, protection des routes)
- `database-schema` : Schéma Drizzle ORM pour les tables `profiles` et `work_shifts`, migrations, client Drizzle, politiques RLS Supabase
- `user-profile` : Écran de saisie et modification du profil utilisateur (genre, âge, métier, heures de sommeil habituelles)
- `shift-planning` : Écran de saisie du planning de travail (ajout, modification, suppression de shifts avec type jour/soir/nuit, dates et horaires)
- `app-layout` : Layout principal avec navigation, sidebar responsive, support dark mode natif pour travailleurs de nuit

### Modified Capabilities

_(Aucune — premier changement du projet)_

## Impact

- **Code** : Création complète du répertoire `src/` avec l'arborescence définie dans ARCHITECTURE.md (app/, components/, db/, lib/, hooks/, types/)
- **Base de données** : Création des tables `profiles` et `work_shifts` dans Supabase avec politiques RLS
- **Dépendances** : Next.js 15, React 19, Tailwind CSS, shadcn/ui, Drizzle ORM, Supabase JS client, Zod
- **Infrastructure** : Configuration Vercel-ready, variables d'environnement Supabase
- **APIs** : Route handlers pour le profil utilisateur et les shifts (CRUD)
