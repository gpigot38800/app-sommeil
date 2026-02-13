# Configuration du Mode Démo

Ce guide explique comment configurer le compte de démonstration pour permettre aux visiteurs de tester l'application sans créer de compte.

## 📋 Prérequis

- Accès à votre projet Supabase
- Base de données existante avec les tables créées

## 🚀 Étapes d'installation

### 1. Créer le compte d'authentification

1. Allez dans le **Supabase Dashboard**
2. Accédez à **Authentication > Users**
3. Cliquez sur **"Add user"** ou **"Invite user"**
4. Remplissez les informations :
   - **Email** : `demo@demo.com`
   - **Password** : `Demo123!`
   - **✅ Cochez "Auto Confirm User"** (important !)
5. Cliquez sur **"Create User"**

### 2. Exécuter le script de seed

1. Allez dans le **Supabase Dashboard**
2. Accédez à **SQL Editor**
3. Créez une nouvelle query
4. Copiez tout le contenu du fichier `src/db/seeds/demo-data.sql`
5. Exécutez la query (Ctrl + Enter ou bouton "Run")

Le script va :
- ✅ Créer l'organisation "Hôpital Démo"
- ✅ Lier le compte demo@demo.com à cette organisation
- ✅ Créer 13 codes vacation (M, S, N, J, JL, NL, R, RH, RC, CA, RTT, MAL, FM)
- ✅ Créer 12 employés fictifs répartis sur 4 services
- ✅ Générer un planning sur 2 semaines avec des cas réalistes incluant :
  - 🔴 4 nuits consécutives (violation critique)
  - 🔴 Quick return de 8h entre shifts (violation)
  - 🔴 7 jours consécutifs travaillés (violation)
  - 🔴 Shift de 13h dépassant la limite de 12h (violation)
  - ✅ Des horaires normaux conformes

### 3. Vérification

1. Allez sur votre application : `http://localhost:3000/login`
2. Cliquez sur **"🚀 Essayer l'application de démo"**
3. Vous devriez être redirigé vers le dashboard avec :
   - Un badge **"MODE DÉMO"** dans la navbar
   - 12 employés listés
   - Des alertes de fatigue et violations réglementaires

## 🎨 Fonctionnalités du mode démo

### Page de login
- Nouveau bouton **"🚀 Essayer l'application de démo"**
- Auto-connexion transparente avec le compte demo@demo.com

### Dashboard
- Badge **"MODE DÉMO"** visible dans la navbar
- Données réalistes pré-chargées
- Alertes de conformité réglementaire
- Graphiques de fatigue

### Données de démonstration

**Services** :
- Urgences (3 employés)
- Réanimation (3 employés)
- Médecine (3 employés)
- Chirurgie (3 employés)

**Cas d'usage démontrés** :
- ✅ Planning normal avec rotation jour/soir/nuit
- 🔴 Violations du Code du Travail (repos <11h, 4+ nuits consécutives, 7 jours travaillés, durée >12h)
- 📊 Calculs de fatigue automatiques
- 📈 Graphiques et tendances

## 🔧 Réinitialisation des données

Si les données de démo sont modifiées et que vous voulez les réinitialiser :

### Option 1 : Via SQL Editor
```sql
-- Supprimer les données existantes
DELETE FROM work_shifts WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM employees WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM shift_codes WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM fatigue_scores WHERE organization_id = '00000000-0000-0000-0000-000000000001';

-- Réexécuter le script de seed
-- (copier/coller le contenu de demo-data.sql)
```

### Option 2 : Supprimer et recréer
```sql
-- Supprimer complètement l'organisation (cascade sur toutes les tables)
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';

-- Réexécuter le script de seed complet
-- (copier/coller le contenu de demo-data.sql)
```

## 📝 Notes importantes

- Le mot de passe **Demo123!** est public - **NE PAS** utiliser ce compte en production
- Les données démo sont modifiables par les visiteurs - pensez à les réinitialiser régulièrement
- Le badge "MODE DÉMO" est automatiquement affiché pour l'email demo@demo.com

## 🎯 Pour désactiver le mode démo

Si vous voulez retirer temporairement le bouton de démo :

1. Ouvrez `src/app/(auth)/login/page.tsx`
2. Commentez ou supprimez le bouton démo (lignes du `<div className="relative my-6">` jusqu'au `</Button>`)
3. Ou supprimez le compte demo@demo.com de Supabase Auth

## ❓ Dépannage

### "Le compte démo n'est pas encore configuré"
➡️ Le compte demo@demo.com n'existe pas dans Supabase Auth. Créez-le (étape 1).

### "Impossible de se connecter"
➡️ Vérifiez que le compte est bien confirmé (Auto Confirm User coché).

### Pas d'employés affichés après connexion
➡️ Le script SQL n'a pas été exécuté ou a échoué. Vérifiez les logs dans SQL Editor.

### Violation "organization_id not found"
➡️ La fonction `link_demo_admin()` n'a pas trouvé le compte. Assurez-vous que demo@demo.com existe avant d'exécuter le script.
