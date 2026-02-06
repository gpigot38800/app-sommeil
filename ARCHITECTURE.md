# Architecture technique - App Sommeil

> Application web pour travailleurs de nuit : planification du sommeil, suivi de fatigue, transitions jour/nuit.

---

## Stack technique retenue

| Categorie | Choix | Raison principale |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Ecosysteme le plus riche, meilleur chemin vers le mobile |
| **Base de donnees** | Supabase (PostgreSQL) | DB + Auth + Storage gratuit en un seul service |
| **ORM** | Drizzle ORM | 7 kb, type-safe, zero cold start serverless |
| **Authentification** | Supabase Auth | Inclus gratuit, 50K MAU, RLS integre |
| **UI / Styling** | Tailwind CSS + shadcn/ui | Dark mode natif, code possede, composant Chart |
| **Visualisation** | Recharts (via shadcn/ui Chart) | Theming automatique, tous types de graphiques |
| **Mobile** | PWA (Phase 1) + Capacitor (Phase 2) | 100% reutilisation du code |
| **Hebergement** | Vercel | Meilleur support Next.js, deploiement simple |

---

## Framework : Next.js 15 (App Router)

**Pourquoi :**
- Ecosysteme React = le plus riche, chaque outil tiers a un support de premiere classe
- Server Components ideaux pour les dashboards analytiques du sommeil
- Meilleur chemin vers le mobile (PWA + Capacitor)
- Le plus de ressources en francais et meilleur support IA / generation de code
- App Router = layouts imbriques, loading states, streaming SSR

---

## Base de donnees : Supabase (PostgreSQL manage)

**Pourquoi :**
- PostgreSQL manage + Auth + Storage + Realtime en un seul service gratuit
- 500 MB gratuit = des centaines de milliers d'entrees de sommeil
- Row-Level Security (RLS) natif pour isoler les donnees par utilisateur
- Region EU disponible (conformite RGPD)
- Zero configuration supplementaire pour l'authentification

---

## ORM : Drizzle ORM

**Pourquoi :**
- Bundle size de **7 kb** (vs binaire Rust lourd de Prisma)
- Zero cold start sur Vercel serverless
- Type-safe avec excellent TypeScript DX
- Syntaxe proche du SQL = plus de controle sur les requetes
- Drizzle Studio inclus pour explorer la base de donnees
- Fonctionne par-dessus le client Supabase PostgreSQL

---

## Authentification : Supabase Auth

**Pourquoi :**
- Deja inclus dans le free tier Supabase = zero config supplementaire
- Integration native avec Row-Level Security (RLS PostgreSQL)
- Email/password, magic links, providers sociaux (Google, Apple, etc.)
- Gratuit jusqu'a 50 000 MAU
- Propriete totale des donnees (dans votre instance Supabase)

**Contexte important (2025) :**
- NextAuth/Auth.js est en maintenance seule depuis septembre 2025
- Lucia Auth deprecie depuis mars 2025
- Supabase Auth est le choix le plus stable pour un nouveau projet avec Supabase

---

## UI / Styling : Tailwind CSS + shadcn/ui

**Pourquoi :**
- **Dark mode de premiere classe** = critique pour des travailleurs de nuit
- Vous possedez le code (composants copies dans votre projet, pas de dependance npm)
- Composant Chart integre (base sur Recharts) = theming automatique dark/light
- Le plus utilise avec l'IA = meilleure generation de code assistee
- Tres nombreux templates de dashboard Next.js + shadcn/ui disponibles
- Personnalisation maximale, bundle size reduit

---

## Visualisation : Recharts (via shadcn/ui Chart)

**Pourquoi :**
- Le composant `<Chart>` de shadcn/ui utilise Recharts = theming automatique avec le dark mode
- Rendu SVG, integration React declarative
- Couvre tous les besoins du projet :

| Type de graphique | Usage dans l'app |
|---|---|
| Ligne | Duree de sommeil dans le temps |
| Barre | Heures de sommeil par semaine |
| Aire | Tendances de qualite |
| Scatter | Correlation cafeine vs sommeil |
| Pie | Distribution du temps |
| Radar | Analyse multi-facteurs |

> Si besoin de heatmap (patterns de sommeil), ajouter Nivo en complement.

---

## Strategie mobile : PWA (Phase 1) + Capacitor (Phase 2)

### Phase 1 : PWA avec Serwist
- 100% reutilisation du code web existant
- Les infirmiers/travailleurs de nuit installent l'app sur leur ecran d'accueil
- Utilisation hors-ligne (service workers)
- Effort supplementaire : **aucun**

### Phase 2 : Capacitor
- 95%+ reutilisation du code web
- Presence App Store (iOS / Android)
- Push notifications natives
- Integration possible avec HealthKit / Google Fit
- Effort supplementaire : **tres faible**

**Pourquoi pas React Native / Flutter :**
- Codebase separee = charge de travail inacceptable pour un dev solo
- 30-60% reutilisation seulement (React Native) ou 0% (Flutter)

---

## Hebergement : Vercel

**Pourquoi :**
- Vercel est le createur de Next.js = meilleur support
- Deploiement par simple `git push`
- Region EU disponible
- Free tier (Hobby plan) suffisant pour la phase dev/beta

**Evolution prevue :**
- Phase dev/beta : Vercel Hobby (gratuit)
- Phase commerciale : evaluer OVH VPS pour conformite RGPD donnees de sante (hebergeur francais)

---

## Architecture des dossiers

```
app-sommeil/
├── public/                  # Assets statiques, icones PWA, manifest
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Routes publiques (login, register)
│   │   ├── (dashboard)/     # Routes protegees
│   │   │   ├── planning/    # Saisie des shifts
│   │   │   ├── transition/  # Plan de transition jour/nuit
│   │   │   ├── suivi/       # Suivi sommeil + fatigue
│   │   │   ├── stats/       # Graphiques et tendances
│   │   │   └── profil/      # Profil utilisateur
│   │   ├── api/             # Route Handlers (API)
│   │   ├── layout.tsx       # Layout racine (dark mode, providers)
│   │   └── page.tsx         # Landing page
│   ├── components/
│   │   ├── ui/              # Composants shadcn/ui (generes)
│   │   ├── charts/          # Composants graphiques personnalises
│   │   ├── forms/           # Formulaires (shifts, sommeil, fatigue)
│   │   └── layout/          # Navbar, Sidebar, Footer
│   ├── db/
│   │   ├── schema.ts        # Schema Drizzle (tables)
│   │   ├── migrations/      # Migrations SQL
│   │   └── index.ts         # Client Drizzle
│   ├── lib/
│   │   ├── supabase/        # Clients Supabase (server + browser)
│   │   ├── planning-engine/ # Moteur de regles transition sommeil
│   │   ├── validators/      # Schemas Zod
│   │   └── utils.ts         # Utilitaires
│   ├── hooks/               # Custom React hooks
│   └── types/               # Types TypeScript partages
├── drizzle.config.ts        # Configuration Drizzle
├── tailwind.config.ts       # Configuration Tailwind
├── next.config.ts           # Configuration Next.js
├── .env.local               # Variables d'environnement (local)
└── package.json
```

---

## Modele de donnees (tables Supabase)

### `profiles`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (PK, FK auth.users) | ID utilisateur Supabase |
| display_name | text | Nom affiche |
| age | integer | Age |
| gender | text | Genre |
| profession | text | Metier |
| habitual_sleep_time | time | Heure de coucher habituelle |
| habitual_wake_time | time | Heure de lever habituelle |
| created_at | timestamptz | Date de creation |
| updated_at | timestamptz | Date de mise a jour |

### `work_shifts`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK profiles) | Proprietaire |
| start_date | date | Date de debut |
| end_date | date | Date de fin |
| shift_type | text | Type de shift (jour, soir, nuit) |
| start_time | time | Heure de debut du shift |
| end_time | time | Heure de fin du shift |
| created_at | timestamptz | Date de creation |

### `transition_plans`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK profiles) | Proprietaire |
| from_shift | text | Shift de depart |
| to_shift | text | Shift d'arrivee |
| start_date | date | Date de debut du plan |
| days_count | integer | Nombre de jours (2-5) |
| created_at | timestamptz | Date de creation |

### `plan_days`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (PK) | Identifiant unique |
| plan_id | uuid (FK transition_plans) | Plan parent |
| day_number | integer | Jour dans le plan (1, 2, 3...) |
| target_sleep_time | time | Heure coucher cible |
| target_wake_time | time | Heure lever cible |
| caffeine_cutoff | time | Heure stop cafeine |
| light_start | time | Debut fenetre lumiere |
| light_end | time | Fin fenetre lumiere |
| notes | text | Conseils du jour |

### `sleep_records`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK profiles) | Proprietaire |
| date | date | Date de la nuit |
| actual_sleep_start | timestamptz | Heure d'endormissement reelle |
| actual_sleep_end | timestamptz | Heure de reveil reelle |
| quality | integer | Qualite ressentie (1-5) |
| source | text | Source (manual, healthkit, google_fit) |
| created_at | timestamptz | Date de creation |

### `fatigue_scores`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK profiles) | Proprietaire |
| date | date | Date |
| score | integer | Score de fatigue (1-10) |
| note | text | Commentaire optionnel |
| created_at | timestamptz | Date de creation |

### `caffeine_logs`
| Colonne | Type | Description |
|---|---|---|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK profiles) | Proprietaire |
| consumed_at | timestamptz | Heure de consommation |
| type | text | Type (cafe, the, energy_drink) |
| amount_mg | integer | Quantite de cafeine en mg |

> Toutes les tables ont des politiques RLS activees : chaque utilisateur ne voit que ses propres donnees.

---

## Couts

### Phase dev / beta : $0/mois

| Service | Tier | Limites |
|---|---|---|
| Vercel | Hobby (gratuit) | 100 GB bandwidth, builds illimites |
| Supabase | Free | 500 MB DB, 50K MAU, 1 GB storage |
| **Total** | **$0/mois** | |

### Phase commerciale : ~$45/mois

| Service | Tier | Cout |
|---|---|---|
| Vercel | Pro | $20/mois |
| Supabase | Pro | $25/mois (8 GB DB, 100K MAU, 100 GB storage) |
| **Total** | **~$45/mois** | |

### Option RGPD donnees de sante

| Service | Tier | Cout |
|---|---|---|
| OVH VPS | Comfort | $5-10/mois (hebergement francais, conformite RGPD) |
| Supabase | Self-hosted sur OVH | Gratuit (open source) |

---

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...votre-service-role-key

# Base de donnees (Drizzle)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Securite** : Ne jamais commiter `.env.local`. Le fichier `.gitignore` doit contenir `.env*.local`.
> `NEXT_PUBLIC_*` sont exposees cote client (cles publiques uniquement).
> `SUPABASE_SERVICE_ROLE_KEY` et `DATABASE_URL` ne doivent jamais etre exposees cote client.
