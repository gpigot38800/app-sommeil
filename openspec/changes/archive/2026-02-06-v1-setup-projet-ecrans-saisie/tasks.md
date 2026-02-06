## 1. Initialisation du projet

- [x] 1.1 Créer le projet Next.js 15 avec App Router, TypeScript strict, Tailwind CSS (`npx create-next-app@latest app-sommeil`)
- [x] 1.2 Installer et configurer shadcn/ui (init + composants de base : Button, Input, Card, Label, Select, Form, Dialog, Sheet, DropdownMenu, Badge, Separator, Sonner/Toast)
- [x] 1.3 Créer la structure de dossiers : `src/components/forms/`, `src/components/layout/`, `src/components/charts/`, `src/db/`, `src/db/migrations/`, `src/lib/supabase/`, `src/lib/validators/`, `src/lib/planning-engine/`, `src/hooks/`, `src/types/`
- [x] 1.4 Créer le fichier `.env.example` avec les variables requises (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, NEXT_PUBLIC_APP_URL)
- [x] 1.5 Créer le fichier `.env.local` (gitignored) et vérifier que `.gitignore` contient `.env*.local`
- [x] 1.6 Ajouter le PWA manifest (`public/manifest.json`) avec name, short_name, start_url, display, theme_color, icons et la balise `<link rel="manifest">` dans le layout racine

## 2. Configuration Supabase et Drizzle ORM

- [x] 2.1 Installer les dépendances : `@supabase/supabase-js`, `@supabase/ssr`, `drizzle-orm`, `drizzle-kit`, `postgres` (driver), `drizzle-zod`
- [x] 2.2 Créer les clients Supabase : `src/lib/supabase/server.ts` (Server Components / Route Handlers) et `src/lib/supabase/client.ts` (Browser)
- [x] 2.3 Créer le schéma Drizzle dans `src/db/schema.ts` : table `profiles` (id uuid PK FK auth.users, display_name, age, gender, profession, habitual_sleep_time, habitual_wake_time, created_at, updated_at) et table `work_shifts` (id uuid PK, user_id FK, start_date, end_date, shift_type, start_time, end_time, created_at)
- [x] 2.4 Créer le client Drizzle dans `src/db/index.ts` connecté via DATABASE_URL
- [x] 2.5 Configurer `drizzle.config.ts` avec le chemin du schéma et le dossier de migrations
- [x] 2.6 Générer et appliquer la migration initiale (`drizzle-kit generate` puis `drizzle-kit push`)
- [x] 2.7 Configurer les politiques RLS dans Supabase : SELECT/INSERT/UPDATE/DELETE sur `profiles` (id = auth.uid()) et sur `work_shifts` (user_id = auth.uid()), activer RLS sur les deux tables

## 3. Authentification

- [x] 3.1 Créer le middleware Next.js (`src/middleware.ts`) : rafraîchissement des tokens, redirection vers `/login` si non authentifié sur les routes `(dashboard)`, redirection vers le dashboard si déjà authentifié sur `/login` et `/register`
- [x] 3.2 Créer le route group `(auth)` avec son layout centré (sans sidebar) : `src/app/(auth)/layout.tsx`
- [x] 3.3 Créer les schémas Zod de validation : `src/lib/validators/auth.ts` (loginSchema, registerSchema)
- [x] 3.4 Créer la page d'inscription `src/app/(auth)/register/page.tsx` : formulaire email/password avec React Hook Form + Zod, appel Supabase Auth signUp, gestion erreurs (email déjà utilisé, mot de passe trop court), redirection vers le profil
- [x] 3.5 Créer la page de connexion `src/app/(auth)/login/page.tsx` : formulaire email/password, appel Supabase Auth signInWithPassword, gestion erreurs, redirection vers le dashboard
- [x] 3.6 Créer l'action de déconnexion : appel Supabase Auth signOut, suppression cookies, redirection vers `/login`
- [x] 3.7 Créer un hook ou utilitaire `getUser()` côté serveur pour récupérer l'utilisateur authentifié dans les Server Components et Route Handlers

## 4. Layout de l'application (dashboard)

- [x] 4.1 Installer et configurer `next-themes` pour le dark mode avec `darkMode: "class"` dans Tailwind, thème sombre par défaut
- [x] 4.2 Créer le ThemeProvider dans le layout racine `src/app/layout.tsx` avec `defaultTheme="dark"` et `attribute="class"`
- [x] 4.3 Créer le composant Sidebar (`src/components/layout/sidebar.tsx`) : liens Planning et Profil, indicateur de page active basé sur le pathname, responsive (visible sur desktop >= 768px, overlay sur mobile)
- [x] 4.4 Créer le composant Navbar (`src/components/layout/navbar.tsx`) : nom de l'app, bouton toggle dark/light mode, nom utilisateur ou initiales, bouton déconnexion, bouton hamburger mobile pour ouvrir la sidebar
- [x] 4.5 Créer le layout dashboard `src/app/(dashboard)/layout.tsx` avec Sidebar + Navbar + zone de contenu responsive (max-width, paddings adaptatifs)
- [x] 4.6 Créer le composant ThemeToggle (`src/components/layout/theme-toggle.tsx`) avec basculement dark/light et persistance localStorage

## 5. Écran profil utilisateur

- [x] 5.1 Créer le schéma Zod de validation du profil : `src/lib/validators/profile.ts` (display_name optionnel, age 16-100 requis, gender requis parmi [homme, femme, autre, prefer_not_to_say], profession optionnel, habitual_sleep_time HH:MM requis, habitual_wake_time HH:MM requis)
- [x] 5.2 Créer le Route Handler `POST /api/profile` (`src/app/api/profile/route.ts`) : validation Zod, upsert dans la table profiles via Drizzle, retour du profil mis à jour
- [x] 5.3 Créer le composant formulaire profil `src/components/forms/profile-form.tsx` : React Hook Form + zodResolver, champs pour nom, âge, genre (Select), métier, heure coucher (Input time), heure lever (Input time), messages d'erreur par champ, bouton sauvegarder
- [x] 5.4 Créer la page profil `src/app/(dashboard)/profil/page.tsx` : Server Component qui charge le profil existant depuis Drizzle, pré-rempli le formulaire, affiche un message d'accueil pour les nouveaux utilisateurs
- [x] 5.5 Ajouter la logique de redirection : si l'utilisateur n'a pas complété son profil (age/sleep times manquants), rediriger vers la page profil avec un message d'invitation

## 6. Écran planning des shifts

- [x] 6.1 Créer le schéma Zod de validation des shifts : `src/lib/validators/shift.ts` (shift_type parmi [jour, soir, nuit] requis, start_date requis, end_date requis et >= start_date, start_time HH:MM requis, end_time HH:MM requis)
- [x] 6.2 Créer les Route Handlers pour les shifts : `GET /api/shifts` (liste triée par start_date desc), `POST /api/shifts` (création avec validation Zod), `PUT /api/shifts/[id]` (modification), `DELETE /api/shifts/[id]` (suppression) — tous dans `src/app/api/shifts/`
- [x] 6.3 Créer le composant formulaire shift `src/components/forms/shift-form.tsx` : React Hook Form + zodResolver, Select pour le type (jour/soir/nuit), DatePicker pour dates début/fin, Input time pour horaires, pré-remplissage automatique des horaires selon le type sélectionné (jour: 07h-15h, soir: 15h-23h, nuit: 21h-07h)
- [x] 6.4 Créer le composant liste des shifts `src/components/forms/shift-list.tsx` : affichage de chaque shift avec badge coloré par type (bleu jour, orange soir, indigo nuit), dates et horaires, boutons modifier/supprimer, dialog de confirmation pour la suppression
- [x] 6.5 Créer la page planning `src/app/(dashboard)/planning/page.tsx` : Server Component qui charge les shifts, affiche la liste + bouton "Ajouter un shift" ouvrant un dialog/sheet avec le formulaire, message si aucun shift
- [x] 6.6 Implémenter la logique de rafraîchissement de la liste après création/modification/suppression (via `router.refresh()` ou revalidation)

## 7. Tests et vérification finale

- [x] 7.1 Vérifier que le projet compile sans erreur (`next build`)
- [x] 7.2 Tester le flux complet avec Playwright : inscription → profil → ajout shift → modification shift → suppression shift → déconnexion → connexion
- [x] 7.3 Vérifier le responsive : sidebar mobile, formulaires sur petit écran, dark mode par défaut
- [x] 7.4 Vérifier que les clés secrètes (SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL) ne sont pas exposées côté client
