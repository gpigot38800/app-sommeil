## Context

Premier changement du projet App Sommeil. Aucun code n'existe encore. L'objectif est de poser le socle technique complet (Next.js 15, Supabase, Drizzle ORM) et de livrer les deux premiers écrans fonctionnels (profil utilisateur et planning des shifts) avec authentification.

L'application cible des travailleurs de nuit (infirmiers, ouvriers, etc.) qui ont besoin d'une interface utilisable en conditions de faible luminosité — le dark mode est donc un impératif dès le départ.

Le développeur est solo. La stack doit minimiser la complexité opérationnelle tout en restant extensible pour les phases V2-V4 (moteur de transition, suivi sommeil, graphiques).

## Goals / Non-Goals

**Goals :**

- Projet Next.js 15 (App Router) fonctionnel avec TypeScript strict
- Authentification complète (inscription, connexion, déconnexion, protection des routes)
- Schéma DB pour `profiles` et `work_shifts` avec migrations Drizzle et RLS Supabase
- Écran profil : saisie genre, âge, métier, heures de sommeil habituelles
- Écran planning : CRUD complet des shifts (jour/soir/nuit) avec dates et horaires
- Layout responsive avec navigation et dark mode par défaut
- PWA manifest de base (installable sur écran d'accueil)

**Non-Goals :**

- Moteur de planification de transition sommeil (V2)
- Tables `transition_plans`, `plan_days`, `sleep_records`, `fatigue_scores`, `caffeine_logs` (V2-V3)
- Graphiques et visualisation (V4)
- Intégration HealthKit / Google Fit (V4+)
- Notifications push (V3)
- Déploiement production / CI-CD (hors scope V1)

## Decisions

### 1. Authentification : Supabase Auth avec Server-Side

**Choix** : Utiliser `@supabase/ssr` pour gérer l'authentification côté serveur via les cookies.

**Alternatives considérées** :
- Client-side uniquement (`@supabase/supabase-js` dans le navigateur) — plus simple mais pas de protection des routes côté serveur, pas de Server Components authentifiés
- NextAuth/Auth.js — déprécié/maintenance seule depuis sept. 2025

**Rationale** : `@supabase/ssr` permet de créer un client Supabase serveur dans les Server Components et les Route Handlers, ce qui donne accès à l'utilisateur authentifié partout. Le middleware Next.js rafraîchit les tokens automatiquement.

### 2. Structure des routes : Route Groups

**Choix** : Utiliser les route groups Next.js `(auth)` et `(dashboard)`.

- `(auth)/` : pages publiques (login, register) — layout minimal sans sidebar
- `(dashboard)/` : pages protégées (profil, planning) — layout complet avec sidebar/navbar

**Rationale** : Séparation nette des layouts. Le middleware protège toutes les routes `(dashboard)` en redirigeant vers `/login` si non authentifié.

### 3. ORM et migrations : Drizzle avec push

**Choix** : Utiliser `drizzle-kit push` pour appliquer le schéma directement en développement, et `drizzle-kit generate` + `drizzle-kit migrate` pour la production.

**Rationale** : `push` est plus rapide en itération locale. Les migrations générées assurent la traçabilité en production.

### 4. Validation : Zod côté client et serveur

**Choix** : Définir les schémas Zod dans `src/lib/validators/` et les utiliser à la fois dans les formulaires (validation client) et dans les Route Handlers (validation serveur).

**Rationale** : Source unique de vérité pour la validation. Zod s'intègre nativement avec les formulaires React (via `useForm` + `zodResolver`) et avec Drizzle (`drizzle-zod`).

### 5. Formulaires : React Hook Form + shadcn/ui Form

**Choix** : Utiliser `react-hook-form` avec le composant `<Form>` de shadcn/ui et `@hookform/resolvers/zod`.

**Alternatives considérées** :
- Server Actions avec `useActionState` — plus simple pour les cas basiques mais moins flexible pour les formulaires complexes (shifts avec dates/heures multiples)
- Formik — plus lourd, moins bonne intégration TypeScript

**Rationale** : React Hook Form est le standard avec shadcn/ui. Validation Zod intégrée, gestion d'erreurs par champ, performance optimale (pas de re-renders inutiles).

### 6. API : Route Handlers Next.js

**Choix** : Route Handlers dans `src/app/api/` pour les opérations CRUD.

- `POST /api/profile` — créer/mettre à jour le profil
- `GET /api/shifts` — lister les shifts de l'utilisateur
- `POST /api/shifts` — créer un shift
- `PUT /api/shifts/[id]` — modifier un shift
- `DELETE /api/shifts/[id]` — supprimer un shift

**Rationale** : Les Route Handlers Next.js sont le pattern standard avec App Router. Ils permettent la validation serveur, l'accès à l'utilisateur authentifié via le client Supabase serveur, et sont compatibles avec un futur client mobile (Capacitor).

### 7. Dark mode : class strategy avec Tailwind

**Choix** : Configurer Tailwind avec `darkMode: "class"` et utiliser `next-themes` pour la persistance du thème.

**Rationale** : Le dark mode est activé par défaut pour les travailleurs de nuit. `next-themes` gère la persistance (localStorage), l'hydratation sans flash, et le basculement. shadcn/ui supporte nativement cette approche.

### 8. Schéma DB : deux tables pour la V1

**Choix** : Créer uniquement `profiles` et `work_shifts` dans le schéma Drizzle.

- `profiles` : lié à `auth.users` par l'id, contient les infos personnelles et les heures de sommeil habituelles
- `work_shifts` : shifts de travail avec type (jour/soir/nuit), dates et horaires

**Rationale** : Aligné avec le scope V1. Les tables supplémentaires seront ajoutées dans les changements V2-V3 via de nouvelles migrations.

## Risks / Trade-offs

**[Dépendance Supabase free tier]** → Le free tier Supabase met en pause les projets inactifs après 7 jours. Mitigation : accéder au projet régulièrement pendant le développement. En production, passer au plan Pro ($25/mois).

**[Pas de Server Actions]** → Le choix des Route Handlers au lieu des Server Actions ajoute du code boilerplate (fetch côté client). Mitigation : les Route Handlers sont plus explicites et réutilisables par un futur client mobile. Trade-off acceptable pour la V1.

**[RLS complexité]** → Les politiques Row-Level Security Supabase doivent être correctement configurées pour chaque table. Une erreur expose les données d'autres utilisateurs. Mitigation : tester les politiques RLS dans Supabase Dashboard avant le déploiement. Utiliser des requêtes simples (`user_id = auth.uid()`).

**[PWA limitations iOS]** → Les PWA sur iOS ont des limitations (pas de push notifications, badge limité). Mitigation : le PWA de la V1 est minimal (installable, offline-capable). Les push notifications viendront avec Capacitor en Phase 2.
