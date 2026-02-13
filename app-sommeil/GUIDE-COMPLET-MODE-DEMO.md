# 🚀 Guide Complet : Activer le Mode Démo

## Ce que tu vas faire (résumé)

1. ✅ Créer un compte `demo@demo.com` dans Supabase Auth
2. ✅ Corriger la base de données (autoriser NULL sur certaines colonnes)
3. ✅ Remplir la base avec des données de démo
4. ✅ Tester l'application

**Temps estimé** : 5-10 minutes

---

## 📋 ÉTAPE 1 : Créer le compte démo dans Supabase Auth

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet "app-sommeil"
3. Dans le menu de gauche, clique sur **"Authentication"**
4. Clique sur **"Users"**
5. Clique sur le bouton **"Add user"** (en haut à droite)
6. Remplis le formulaire :
   ```
   Email: demo@demo.com
   Password: Demo123!
   ```
7. ⚠️ **IMPORTANT** : Coche la case **"Auto Confirm User"**
8. Clique sur **"Create User"**

✅ **Le compte existe maintenant !** Passe à l'étape suivante.

---

## 🔧 ÉTAPE 2 : Corriger la base de données

### Pourquoi cette étape ?
Les jours de repos (type 'R') n'ont pas d'horaires, mais la table `work_shifts` n'acceptait pas les valeurs NULL. On va corriger ça.

### Comment faire ?

1. Dans Supabase, va dans **"SQL Editor"** (menu de gauche)
2. Clique sur **"New query"** (bouton en haut)
3. Ouvre le fichier `app-sommeil/step2-fix.sql` sur ton ordinateur
4. Copie tout le contenu (2 lignes) :
   ```sql
   ALTER TABLE work_shifts ALTER COLUMN start_time DROP NOT NULL;
   ALTER TABLE work_shifts ALTER COLUMN end_time DROP NOT NULL;
   ```
5. Colle dans l'éditeur SQL de Supabase
6. Clique sur **"Run"** (ou Ctrl + Enter)
7. Tu dois voir en bas : ✅ **"Success. No rows returned"**

✅ **La correction est appliquée !** Cette modification est permanente, tu n'auras jamais à la refaire.

---

## 📊 ÉTAPE 3 : Remplir la base avec les données de démo

### Qu'est-ce qui va être créé ?
- 1 organisation "Hôpital Démo"
- 12 employés répartis sur 4 services
- 13 codes vacation (M, S, N, J, etc.)
- Un planning de 2 semaines avec des cas réalistes

### Comment faire ?

1. Toujours dans **SQL Editor**, clique sur **"New query"** (pour une nouvelle fenêtre propre)
2. Ouvre le fichier `app-sommeil/src/db/seeds/demo-data.sql` sur ton ordinateur
3. **Sélectionne TOUT le contenu** (Ctrl+A dans le fichier)
4. Copie (Ctrl+C)
5. Colle dans l'éditeur SQL de Supabase
6. Clique sur **"Run"** (ou Ctrl + Enter)
7. ⏳ **Attends quelques secondes** (le script crée beaucoup de données)
8. En bas, tu dois voir : ✅ **"Success"** avec le message "Seed démo terminé !"

✅ **Les données sont créées !**

---

## 🧪 ÉTAPE 4 : Tester l'application

1. Ouvre un terminal dans le dossier `app-sommeil`
2. Si l'app n'est pas déjà lancée, lance-la :
   ```bash
   npm run dev
   ```
3. Ouvre ton navigateur sur http://localhost:3000/login
4. Tu dois voir :
   - Le formulaire de connexion classique
   - Un séparateur **"OU"**
   - Un bouton **"🚀 Essayer l'application de démo"**

5. **Clique sur le bouton de démo**
6. Tu es automatiquement connecté et redirigé vers `/admin/dashboard`

### Ce que tu dois voir sur le dashboard :

✅ **Badge "MODE DÉMO"** en haut à droite (à côté du toggle dark/light)
✅ **12 employés** dans le tableau
✅ **Alertes de fatigue** (badges verts/oranges/rouges)
✅ **Des violations réglementaires** (bannière rouge)
✅ **Des graphiques** avec des données

---

## ✅ Vérifications finales

### Navigue dans l'application :

- **`/admin/employees`** → Tu dois voir 12 employés avec leurs services
- **`/admin/planning`** → Tu dois voir un planning avec des shifts et des pastilles rouges (violations)
- **`/admin/employees/[id]`** → Clique sur un employé → Tu vois son historique

### Teste le badge MODE DÉMO :

- Le badge **"MODE DÉMO"** doit être visible dans la navbar
- Il ne doit apparaître **que quand tu es connecté avec demo@demo.com**

---

## 🎯 Récapitulatif : Qu'est-ce qu'on a fait ?

| Action | Fichier/Lieu | Statut |
|--------|--------------|--------|
| Compte demo@demo.com créé | Supabase Auth | ✅ À faire |
| Colonnes start_time/end_time nullable | step2-fix.sql | ✅ À faire |
| Données de démo insérées | demo-data.sql | ✅ À faire |
| Bouton démo ajouté | login/page.tsx | ✅ Déjà fait |
| Badge MODE DÉMO ajouté | navbar.tsx | ✅ Déjà fait |

---

## ❓ Si tu as un problème

### Erreur "compte démo pas configuré"
➡️ Le compte demo@demo.com n'existe pas dans Supabase Auth (retour à l'étape 1)

### Erreur "null value violates not-null constraint"
➡️ La correction de l'étape 2 n'a pas été appliquée (refais l'étape 2)

### Pas d'employés sur le dashboard
➡️ Le script de seed n'a pas été exécuté ou a échoué (refais l'étape 3)

### Le bouton démo n'apparaît pas
➡️ Redémarre le serveur local (`npm run dev`)

---

## 🎉 C'est tout !

Une fois ces 4 étapes terminées, ton application a un mode démo pleinement fonctionnel ! Les visiteurs de ton portfolio pourront l'essayer en 1 clic sans créer de compte. 🚀
