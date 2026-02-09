
---

# Objectif MVP

Creer une plateforme web B2B vendue aux hopitaux pour :

* Gerer les plannings des salaries (import CSV + saisie manuelle)
* Calculer automatiquement les niveaux de fatigue de chaque employe
* Afficher un dashboard d'alertes visuelles (vert/orange/rouge/critique)
* Permettre aux managers/RH de suivre la recuperation de leurs equipes

---

## Decisions cles

- **Admin uniquement** : pas de login employe pour le MVP
- **Import CSV + saisie manuelle** des shifts
- **Fatigue calculee automatiquement** (algorithme, pas d'input employe)
- **Alertes visuelles sur dashboard** (pas d'email pour le MVP)

---

## Utilisateurs cibles

| Role | Description | Acces |
|------|-------------|-------|
| **Admin / RH** | Gestionnaire de l'hopital, cadre de sante | Seul utilisateur authentifie |
| **Employe** | Infirmier, aide-soignant, medecin | Pas de login - donnees gerees par l'admin |

---

## Stack technique

* **Framework** : Next.js 15 (App Router)
* **Base de donnees** : Supabase (PostgreSQL)
* **ORM** : Drizzle ORM
* **Authentification** : Supabase Auth (admin uniquement)
* **UI** : Tailwind CSS + shadcn/ui
* **Graphiques** : Recharts (via shadcn/ui Chart)
* **Import CSV** : papaparse
* **Mobile** : PWA (Phase 1)
* **Hebergement** : Vercel

---

## Modele de donnees

### `organizations` - Les hopitaux
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| name | text NOT NULL | Nom de l'hopital |
| createdAt / updatedAt | timestamptz | Timestamps |

### `admin_profiles` - Administrateurs (seuls utilisateurs auth)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK (FK auth.users) | Lie a Supabase Auth |
| organizationId | uuid FK organizations | Hopital |
| displayName | text | Nom affiche |
| email | text | Email |
| role | text DEFAULT 'admin' | Pour future extension |

### `employees` - Salaries (pas d'auth, donnees uniquement)
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| organizationId | uuid FK organizations | Hopital |
| matricule | text | Identifiant interne (matching CSV) |
| firstName / lastName | text NOT NULL | Prenom / Nom |
| department | text | Service (Urgences, Reanimation...) |
| position | text | Poste (IDE, AS, Cadre...) |
| employmentType | text | temps_plein / temps_partiel / interimaire |
| contractHoursPerWeek | numeric | Heures contractuelles/semaine |
| habitualSleepTime / habitualWakeTime | time | Heures sommeil estimees |
| isActive | boolean DEFAULT true | Soft delete |

### `shift_codes` - Mapping codes vacation par hopital
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| organizationId | uuid FK organizations | Hopital |
| code | text NOT NULL | Code vacation (M, S, N...) |
| label | text | Libelle |
| shiftCategory | text NOT NULL | jour / soir / nuit / repos / absence |
| defaultStartTime / defaultEndTime | time | Horaires par defaut |
| defaultDurationMinutes | integer | Duree par defaut |
| includesBreakMinutes | integer DEFAULT 0 | Pause incluse |
| isWorkShift | boolean DEFAULT true | Travail ou repos/absence |

### `work_shifts` - Shifts avec rattachement employe
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| organizationId | uuid FK organizations | Hopital |
| employeeId | uuid FK employees | Employe |
| startDate / endDate | date | Dates |
| shiftType | text | jour / soir / nuit |
| startTime / endTime | time | Horaires |
| shiftCode | text | Code original CSV |
| breakMinutes | integer | Duree pause |

### `fatigue_scores` - Scores calcules automatiquement
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| employeeId | uuid FK employees | Employe |
| organizationId | uuid FK organizations | Hopital |
| calculatedAt | timestamptz | Date de calcul |
| periodStart / periodEnd | date | Fenetre analysee |
| windowDays | integer | 7, 14 ou 30 jours |
| cumulativeDeficitMinutes | integer | Deficit cumule |
| recoveryScore | integer (0-100) | Adequation repos |
| riskLevel | text | low / medium / high / critical |
| shiftCount / nightShiftCount | integer | Stats shifts |

---

## Logique de calcul de fatigue (algorithmique)

### Inputs
* Shifts de l'employe sur une fenetre glissante (7j, 14j, 30j)
* Heures de sommeil habituelles (defaut 23:00-07:00)

### Calcul
1. Pour chaque jour, estimer l'opportunite de sommeil selon le type de shift
2. Calculer le deficit quotidien = max(0, duree_habituelle - sommeil_estime)
3. Appliquer le score de recuperation (repos reduit le deficit de ~50%)
4. Facteurs aggravants :
   - Nuits consecutives (3+ = facteur x1.5)
   - Quick return (<11h entre shifts)
   - Depassement heures contractuelles

### Niveaux de risque

| Niveau | Couleur | Seuil (deficit 7j cumule) |
|--------|---------|---------------------------|
| LOW | Vert | < 2h (120 min) |
| MEDIUM | Orange | 2-4h (120-240 min) |
| HIGH | Rouge | 4-8h (240-480 min) |
| CRITICAL | Rouge pulsant | > 8h (480 min) OU 3+ nuits consecutives sans repos |

---

## Ecrans MVP

1. **Login / Register** - Inscription admin + creation hopital
2. **Dashboard** (`/admin/dashboard`) - KPI, alertes, tableau employes color-coded, charts
3. **Employes** (`/admin/employees`) - CRUD employes avec badges fatigue, filtres par service
4. **Detail employe** (`/admin/employees/[id]`) - Historique fatigue, shifts, tendance
5. **Planning** (`/admin/planning`) - Vue shifts multi-employes, ajout manuel
6. **Import CSV** (`/admin/import`) - Upload, mapping colonnes, preview, confirmation
7. **Parametres** (`/admin/settings`) - Config organisation, codes vacation

---

## Import CSV

### Auto-detection
* Separateur : point-virgule / virgule / tabulation
* Encodage : UTF-8 / Windows-1252
* Format date : DD/MM/YYYY / YYYY-MM-DD / MM/DD/YYYY

### Dictionnaire de mapping automatique
Reconnait les noms de colonnes courants (Matricule, Nom, Prenom, Service, Date, Code, Heure Debut, Heure Fin, Duree, Pause, etc.)

### Codes vacation pre-configures
M (Matin), S (Soir), N (Nuit), J (Journee), JL (Jour Long), NL (Nuit Longue), R (Repos), RH, RC, CA, RTT, JF, MAL, FM, AST...

### Flux d'import
1. Upload CSV (drag & drop ou bouton)
2. Auto-detection separateur/encodage/dates
3. Mapping colonnes (auto + correction manuelle)
4. Resolution codes vacation via table `shift_codes`
5. Matching employes (matricule ou nom+prenom)
6. Preview avec statuts (valide/warning/erreur)
7. Options (filtrer absences, gestion doublons)
8. Confirmation import + rapport

---

## Fonctionnalites cles

* Import CSV en masse compatible logiciels hospitaliers (Octime, Chronos, Kronos, NurseGrid)
* Calcul automatique de fatigue (pas d'input employe)
* **Alertes de conformite reglementaire** (Code du Travail - 6 regles)
* Dashboard avec alertes visuelles (banniere rouge si cas critiques)
* CRUD employes avec filtres par service
* Gestion codes vacation personnalisables par hopital
* Pattern de rotation (sequence de codes applicable a N employes)
* Charts : fatigue par employe, distribution shifts, tendances

---

## Conformite reglementaire (Code du Travail)

Detection automatique de 6 regles du Code du Travail, affichees en temps reel dans le planning (pastilles rouges + tooltip) et le dashboard (banniere + tableau detaille).

### Regles implementees

| # | Regle | Seuil | Severite | Reference |
|---|-------|-------|----------|-----------|
| 1 | Repos minimum entre 2 shifts | 11h | `violation` si <11h, `critical` si <9h | Art. L3131-1 |
| 2 | Duree max journaliere | 12h (derogation hopital) | `violation` | Art. L3121-18 |
| 3 | Duree max hebdomadaire | 48h | `violation` si >48h, `critical` si >54h | Art. L3121-20 |
| 4 | Nuits consecutives max | 3 nuits | `violation` si 4, `critical` si 5+ | |
| 5 | Repos hebdomadaire | 35h consecutives min | `violation` | Art. L3132-2 |
| 6 | Jours consecutifs travailles | 6 max | `violation` si 7+ | Art. L3132-1 |

### Affichage

* **Planning** : pastille rouge sur chaque cellule en violation, tooltip au survol avec detail, bordure rouge si critique
* **Dialog shift** : encart orange "Alertes reglementaires" affichant les violations en temps reel lors de la creation/modification d'un shift
* **Dashboard** : banniere "X violations reglementaires cette semaine", tableau detaille (employe, service, type, date, severite), KPI "Violations Code du Travail"

---

## Roadmap

### V1 - Fondations
* Schema DB multi-tenancy
* Auth admin + onboarding organisation
* CRUD employes

### V2 - Planning
* Import CSV multi-format
* Gestion shifts manuelle
* Codes vacation parametrables

### V3 - Intelligence
* Moteur de calcul de fatigue
* Scores automatiques
* Alertes visuelles

### V4 - Dashboard & Polish
* Dashboard KPI + charts
* Banniere alertes
* Responsive mobile
* Tests E2E

### V5 - Conformite reglementaire
* Moteur de conformite Code du Travail (6 regles)
* Alertes visuelles dans le planning (pastilles + tooltip)
* Warning temps reel dans le dialog de creation de shift
* Banniere + tableau violations dans le dashboard
* KPI violations dans les indicateurs

---

## Critere de succes MVP

* Un admin peut :
  * Creer son organisation et enregistrer ses employes
  * Importer un planning CSV depuis son logiciel hospitalier
  * Voir en un coup d'oeil qui est en fatigue critique
  * Naviguer par service pour identifier les equipes a risque
  * Consulter le detail fatigue d'un employe specifique
  * Identifier les violations du Code du Travail directement dans le planning
  * Voir un resume des violations reglementaires dans le dashboard

---

## Documentation
- [PRD.md](./PRD.md) - Ce document
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique
