# Architecture technique - Plateforme B2B de gestion de fatigue hospitaliere

> Application web B2B pour hopitaux : gestion des plannings, calcul automatique de fatigue, dashboard d'alertes.

---

## Stack technique retenue

| Categorie | Choix | Raison principale |
|-----------|-------|-------------------|
| **Framework** | Next.js 15 (App Router) | Ecosysteme riche, Server Components pour dashboards |
| **Base de donnees** | Supabase (PostgreSQL) | DB + Auth + RLS en un seul service |
| **ORM** | Drizzle ORM | 7 kb, type-safe, zero cold start serverless |
| **Authentification** | Supabase Auth | Admin uniquement, RLS par organisation |
| **UI / Styling** | Tailwind CSS + shadcn/ui | Dark mode natif, composants possedes |
| **Visualisation** | Recharts (via shadcn/ui Chart) | Theming automatique, tous types de graphiques |
| **Import CSV** | papaparse | ~5kb, parsing robuste multi-encodage |
| **Mobile** | PWA (Phase 1) + Capacitor (Phase 2) | 100% reutilisation du code |
| **Hebergement** | Vercel | Meilleur support Next.js |

---

## Modele B2B - Multi-tenancy

### Principes
- **Isolation par organisation** : chaque hopital ne voit que ses propres donnees
- **Admin uniquement** : seuls les gestionnaires/RH ont un compte auth
- **Employes = donnees** : les salaries sont des enregistrements, pas des utilisateurs auth
- **RLS sur toutes les tables** : filtrage automatique par `organization_id`

### Flux d'authentification
1. Admin s'inscrit (email + mot de passe + nom de l'hopital)
2. Creation automatique : organisation -> admin_profile -> codes vacation par defaut
3. Redirect vers `/admin/dashboard`

---

## Architecture des dossiers

```
app-sommeil/
├── public/                  # Assets statiques, icones PWA, manifest
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Routes publiques (login, register)
│   │   ├── (dashboard)/     # Routes protegees (admin)
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/   # Tableau de bord principal
│   │   │   │   ├── employees/   # Gestion employes
│   │   │   │   ├── planning/    # Vue planning / shifts manuels
│   │   │   │   ├── import/      # Import CSV
│   │   │   │   └── settings/    # Parametres organisation + codes vacation
│   │   ├── api/
│   │   │   ├── auth/            # Routes auth
│   │   │   └── admin/           # API admin
│   │   │       ├── employees/   # CRUD employes
│   │   │       ├── shifts/      # CRUD shifts + import CSV + bulk
│   │   │       ├── shift-codes/ # CRUD codes vacation
│   │   │       └── fatigue/     # Calcul + consultation fatigue
│   │   ├── layout.tsx       # Layout racine
│   │   └── page.tsx         # Redirect -> /admin/dashboard
│   ├── components/
│   │   ├── ui/              # Composants shadcn/ui
│   │   ├── charts/          # Graphiques fatigue, shifts, tendances
│   │   ├── dashboard/       # Composants dashboard (KPI, alertes, table)
│   │   ├── forms/           # Formulaires (employes, shifts, CSV, rotation)
│   │   └── layout/          # Navbar, Sidebar, DashboardShell
│   ├── db/
│   │   ├── schema.ts        # Schema Drizzle (toutes tables)
│   │   ├── migrations/      # Migrations SQL
│   │   └── index.ts         # Client Drizzle
│   ├── lib/
│   │   ├── supabase/        # Clients Supabase (server + browser)
│   │   ├── planning-engine/ # Moteur de regles (legacy B2C, fonctions reutilisees)
│   │   ├── fatigue-engine/  # Moteur de calcul de fatigue B2B
│   │   │   ├── index.ts     # calculateEmployeeFatigue()
│   │   │   ├── types.ts     # FatigueResult, DailyEstimate, RiskLevel
│   │   │   ├── estimators.ts # estimateSleepOpportunity()
│   │   │   └── __tests__/   # Tests unitaires Vitest
│   │   ├── validators/      # Schemas Zod
│   │   └── utils.ts         # Utilitaires
│   ├── hooks/               # Custom React hooks
│   └── types/               # Types TypeScript partages
├── drizzle.config.ts        # Configuration Drizzle
├── tailwind.config.ts       # Configuration Tailwind
├── next.config.ts           # Configuration Next.js
└── package.json
```

---

## Modele de donnees (tables Supabase)

### `organizations`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| name | text NOT NULL | Nom de l'hopital |
| created_at | timestamptz | Date de creation |
| updated_at | timestamptz | Date de mise a jour |

### `admin_profiles`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK, FK auth.users) | ID utilisateur Supabase |
| organization_id | uuid (FK organizations) | Hopital de l'admin |
| display_name | text | Nom affiche |
| email | text | Email |
| role | text DEFAULT 'admin' | Role (admin, viewer...) |
| created_at | timestamptz | Date de creation |

### `employees`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| organization_id | uuid (FK organizations) | Hopital |
| matricule | text | Identifiant interne hopital |
| first_name | text NOT NULL | Prenom |
| last_name | text NOT NULL | Nom |
| department | text | Service |
| position | text | Poste/fonction |
| employment_type | text | temps_plein / temps_partiel / interimaire |
| contract_hours_per_week | numeric | Heures contractuelles/semaine |
| habitual_sleep_time | time DEFAULT '23:00' | Heure coucher estimee |
| habitual_wake_time | time DEFAULT '07:00' | Heure lever estimee |
| is_active | boolean DEFAULT true | Soft delete |
| created_at / updated_at | timestamptz | Timestamps |

### `shift_codes`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| organization_id | uuid (FK organizations) | Hopital |
| code | text NOT NULL | Code vacation |
| label | text | Libelle |
| shift_category | text NOT NULL | jour / soir / nuit / repos / absence |
| default_start_time | time | Heure debut par defaut |
| default_end_time | time | Heure fin par defaut |
| default_duration_minutes | integer | Duree par defaut |
| includes_break_minutes | integer DEFAULT 0 | Pause incluse |
| is_work_shift | boolean DEFAULT true | Travail ou repos |

### `work_shifts`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| organization_id | uuid (FK organizations) | Hopital |
| employee_id | uuid (FK employees) | Employe |
| start_date | date | Date de debut |
| end_date | date | Date de fin |
| shift_type | text | Type normalise (jour/soir/nuit) |
| start_time | time | Heure de debut |
| end_time | time | Heure de fin |
| shift_code | text | Code original CSV |
| break_minutes | integer DEFAULT 0 | Duree pause |
| created_at | timestamptz | Date de creation |

### `fatigue_scores`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| employee_id | uuid (FK employees) | Employe |
| organization_id | uuid (FK organizations) | Hopital |
| calculated_at | timestamptz | Date de calcul |
| period_start | date | Debut fenetre |
| period_end | date | Fin fenetre |
| window_days | integer | 7, 14 ou 30 jours |
| cumulative_deficit_minutes | integer | Deficit cumule |
| recovery_score | integer | Score recuperation (0-100) |
| risk_level | text | low / medium / high / critical |
| shift_count | integer | Nombre de shifts |
| night_shift_count | integer | Nombre de nuits |

> **Tables legacy B2C** (profiles, transition_plans, plan_days) restent en DB mais ne sont plus referencees.
> Toutes les nouvelles tables ont des politiques RLS activees par `organization_id`.

---

## Moteur de calcul de fatigue

### Algorithme
Pour chaque employe, sur une fenetre glissante :
1. Recuperer les shifts de la periode
2. Estimer l'opportunite de sommeil par jour selon le type de shift
3. Calculer le deficit quotidien
4. Appliquer le score de recuperation (repos reduit le deficit de ~50%)
5. Facteurs aggravants : nuits consecutives, quick return, overtime
6. Determiner le niveau de risque

### Seuils de risque

| Niveau | Seuil deficit 7j | Description |
|--------|-------------------|-------------|
| LOW | < 120 min | Situation normale |
| MEDIUM | 120-240 min | Vigilance requise |
| HIGH | 240-480 min | Action recommandee |
| CRITICAL | > 480 min | Intervention urgente |

### Declenchement
- Ouverture du dashboard (si donnees > 1h)
- Apres import CSV (automatique)
- Bouton "Recalculer" manuel

---

## Import CSV

### Formats supportes
- **Francais** (Octime, Chronos) : point-virgule, DD/MM/YYYY
- **International** (Kronos, NurseGrid) : virgule, YYYY-MM-DD
- **Minimal** : matricule + date + code vacation

### Auto-detection
- Separateur, encodage (UTF-8/Windows-1252), format date

### Mapping colonnes
Dictionnaire de noms reconnus automatiquement (Matricule, Nom, Prenom, Service, Date, Code, etc.)

---

## Navigation

```
/admin/dashboard      -> Tableau de bord (KPI, alertes, charts)
/admin/employees      -> Liste employes (CRUD, filtres par service)
/admin/employees/[id] -> Detail employe (fatigue, historique)
/admin/planning       -> Vue planning multi-employes
/admin/import         -> Import CSV
/admin/settings       -> Parametres organisation + codes vacation
```

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

---

## Couts

### Phase dev / beta : $0/mois
| Service | Tier | Limites |
|---------|------|---------|
| Vercel | Hobby (gratuit) | 100 GB bandwidth |
| Supabase | Free | 500 MB DB, 50K MAU |

### Phase commerciale : ~$45/mois
| Service | Tier | Cout |
|---------|------|------|
| Vercel | Pro | $20/mois |
| Supabase | Pro | $25/mois |

---

## Documentation
- [PRD.md](./PRD.md) - Product Requirements Document B2B
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Ce document
