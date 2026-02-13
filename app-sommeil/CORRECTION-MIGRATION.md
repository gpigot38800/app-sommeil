# 🔧 Correction : Permettre les horaires NULL pour les repos

## 🐛 Problème rencontré

Lors de l'exécution du script de seed, erreur :
```
ERROR: null value in column "start_time" of relation "work_shifts" violates not-null constraint
```

**Cause** : Les shifts de type "repos" ou "absence" n'ont pas d'horaires (start_time et end_time à NULL), mais la table `work_shifts` avait une contrainte NOT NULL sur ces colonnes.

## ✅ Solution appliquée

### 1. Modification du schéma Drizzle (`src/db/schema.ts`)
```typescript
// AVANT
startTime: time("start_time").notNull(),
endTime: time("end_time").notNull(),

// APRÈS
startTime: time("start_time"), // Nullable pour les repos/absences
endTime: time("end_time"), // Nullable pour les repos/absences
```

### 2. Création de la migration SQL

Nouvelle migration : `src/db/migrations/0004_allow_nullable_shift_times.sql`

```sql
ALTER TABLE work_shifts
  ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE work_shifts
  ALTER COLUMN end_time DROP NOT NULL;
```

## 🚀 Actions à effectuer MAINTENANT

### Étape 1 : Appliquer la migration dans Supabase

1. Va dans **Supabase Dashboard** > **SQL Editor**
2. Crée une nouvelle query
3. Copie et colle ce code :

```sql
-- Autoriser start_time et end_time à être NULL pour les repos/absences
ALTER TABLE work_shifts
  ALTER COLUMN start_time DROP NOT NULL;

ALTER TABLE work_shifts
  ALTER COLUMN end_time DROP NOT NULL;
```

4. Exécute (Run)
5. Tu devrais voir : ✅ "Success. No rows returned"

### Étape 2 : Réexécuter le script de seed

Maintenant que la contrainte est levée, tu peux réexécuter le script de seed :

1. Dans **SQL Editor**, nouvelle query
2. Copie TOUT le contenu de `src/db/seeds/demo-data.sql`
3. Exécute
4. Cette fois, ça devrait fonctionner ! ✅

## 🧪 Vérification

Pour vérifier que la migration a fonctionné :

```sql
-- Vérifier la structure de la table
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'work_shifts'
  AND column_name IN ('start_time', 'end_time');
```

Tu devrais voir :
```
column_name  | is_nullable | data_type
-------------+-------------+---------------------
start_time   | YES         | time without time zone
end_time     | YES         | time without time zone
```

## 📝 Note technique

Cette modification est **logique et nécessaire** car :
- Un jour de repos (code 'R', 'RH', 'RC') n'a pas d'horaires
- Une absence (code 'CA', 'RTT', 'MAL') n'a pas d'horaires
- Seuls les shifts de travail (M, S, N, J, JL, NL) ont des horaires

Cette approche est plus propre que de mettre des horaires factices comme '00:00' - '00:00' pour les repos.
