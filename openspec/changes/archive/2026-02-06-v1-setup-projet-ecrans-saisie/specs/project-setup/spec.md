## Purpose

Initialisation du projet Next.js 15 avec App Router, TypeScript, Tailwind CSS, shadcn/ui et configuration PWA de base. Ce spec couvre la structure des dossiers, les dépendances et la configuration initiale du projet.

## ADDED Requirements

### Requirement: Project initialization with Next.js 15

Le système SHALL être initialisé comme un projet Next.js 15 utilisant App Router avec TypeScript en mode strict.

#### Scenario: Nouveau projet créé avec la bonne structure

- **WHEN** le projet est initialisé
- **THEN** le répertoire `src/app/` existe avec un `layout.tsx` racine et un `page.tsx`
- **THEN** TypeScript est configuré en mode strict (`strict: true` dans `tsconfig.json`)
- **THEN** le projet compile sans erreur avec `next build`

### Requirement: Tailwind CSS and shadcn/ui configured

Le système SHALL utiliser Tailwind CSS avec shadcn/ui pour les composants UI.

#### Scenario: Tailwind et shadcn/ui fonctionnels

- **WHEN** un composant utilise des classes Tailwind (ex: `className="bg-primary text-white"`)
- **THEN** les styles sont appliqués correctement au rendu
- **THEN** les composants shadcn/ui (`Button`, `Input`, `Card`, etc.) sont disponibles dans `src/components/ui/`

### Requirement: Folder structure follows architecture

Le système SHALL suivre la structure de dossiers définie dans ARCHITECTURE.md.

#### Scenario: Structure des dossiers conforme

- **WHEN** le projet est initialisé
- **THEN** les répertoires suivants existent : `src/app/`, `src/components/ui/`, `src/components/forms/`, `src/components/layout/`, `src/db/`, `src/lib/`, `src/hooks/`, `src/types/`

### Requirement: Environment variables configured

Le système SHALL utiliser des variables d'environnement pour la configuration Supabase et l'URL de l'application.

#### Scenario: Variables d'environnement requises définies

- **WHEN** l'application démarre
- **THEN** les variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et `DATABASE_URL` sont accessibles
- **THEN** un fichier `.env.example` documente toutes les variables requises

#### Scenario: Clés secrètes non exposées côté client

- **WHEN** le code client est compilé
- **THEN** les variables `SUPABASE_SERVICE_ROLE_KEY` et `DATABASE_URL` ne sont PAS incluses dans le bundle client

### Requirement: PWA basic manifest

Le système SHALL inclure un manifest PWA de base pour l'installation sur écran d'accueil.

#### Scenario: Manifest PWA présent et valide

- **WHEN** un utilisateur accède à l'application
- **THEN** un fichier `manifest.json` est servi avec les champs `name`, `short_name`, `start_url`, `display: standalone`, `theme_color` et `icons`
- **THEN** la balise `<link rel="manifest">` est présente dans le HTML
