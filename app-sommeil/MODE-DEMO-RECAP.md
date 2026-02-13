# 🎯 Mode Démo - Récapitulatif des modifications

## ✅ Ce qui a été fait

### 1. Script SQL de seed (`src/db/seeds/demo-data.sql`)
Créé un script complet qui génère :
- 1 organisation "Hôpital Démo" avec un ID fixe
- 13 codes vacation (M, S, N, J, JL, NL, R, RH, RC, CA, RTT, MAL, FM)
- 12 employés fictifs répartis sur 4 services (Urgences, Réanimation, Médecine, Chirurgie)
- Un planning de 2 semaines avec des cas réalistes incluant des violations de conformité
- Une fonction automatique pour lier le compte demo@demo.com à l'organisation

### 2. Page de login modifiée (`src/app/(auth)/login/page.tsx`)
Ajouté :
- Un nouveau bouton **"🚀 Essayer l'application de démo"**
- Une fonction `loginAsDemo()` qui se connecte automatiquement avec demo@demo.com / Demo123!
- Un état `demoLoading` pour gérer le chargement
- Un séparateur visuel "OU" entre les deux options de connexion
- Gestion des erreurs si le compte n'est pas configuré

### 3. Badge MODE DÉMO dans la navbar (`src/components/layout/navbar.tsx`)
Ajouté :
- Détection automatique du mode démo (userEmail === "demo@demo.com")
- Badge "MODE DÉMO" affiché dans la navbar (caché sur mobile pour économiser l'espace)
- Variant "secondary" pour un style discret mais visible

### 4. Documentation complète (`DEMO-SETUP.md`)
Guide détaillé avec :
- Instructions pas à pas pour créer le compte
- Explication du script SQL
- Vérification de l'installation
- Dépannage des problèmes courants
- Méthode de réinitialisation des données

## 🚀 Prochaines étapes - À faire MAINTENANT

### Étape 1 : Créer le compte d'authentification dans Supabase

1. Ouvre **Supabase Dashboard** : https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **Authentication** > **Users**
4. Clique sur **"Add user"** (ou "Invite user")
5. Remplis :
   ```
   Email: demo@demo.com
   Password: Demo123!
   ✅ Auto Confirm User (IMPORTANT !)
   ```
6. Clique sur **"Create User"** ou **"Send Invite"**

### Étape 2 : Exécuter le script SQL

1. Dans Supabase Dashboard, va dans **SQL Editor**
2. Clique sur **"New query"**
3. Ouvre le fichier `app-sommeil/src/db/seeds/demo-data.sql`
4. Copie TOUT le contenu (c'est long, ~400 lignes)
5. Colle dans l'éditeur SQL de Supabase
6. Clique sur **"Run"** (ou Ctrl + Enter)
7. Tu devrais voir : ✅ "Success. No rows returned"
8. En bas, tu devrais voir le message : "Seed démo terminé ! Créez maintenant le compte demo@demo.com dans Supabase Auth."

> ⚠️ Si tu as déjà créé le compte à l'étape 1, c'est parfait ! La fonction `link_demo_admin()` va automatiquement le lier à l'organisation.

### Étape 3 : Tester l'application

1. Lance l'application en local si ce n'est pas déjà fait :
   ```bash
   cd app-sommeil
   npm run dev
   ```

2. Ouvre http://localhost:3000/login

3. Tu devrais voir :
   - Le formulaire de connexion habituel
   - Un séparateur "OU"
   - Un nouveau bouton **"🚀 Essayer l'application de démo"**

4. Clique sur le bouton de démo

5. Tu devrais être redirigé vers `/admin/dashboard` avec :
   - Un badge **"MODE DÉMO"** en haut à droite (à côté du toggle de thème)
   - 12 employés listés dans le tableau
   - Des alertes de conformité et de fatigue

## 🧪 Tests à effectuer

Une fois connecté en mode démo, vérifie :

### Dashboard
- [ ] Badge "MODE DÉMO" visible dans la navbar
- [ ] 12 employés affichés dans le tableau
- [ ] Alertes de fatigue (rouge/orange/vert)
- [ ] Bannière de violations réglementaires
- [ ] Graphiques de fatigue fonctionnels

### Page Employés (`/admin/employees`)
- [ ] Liste de 12 employés
- [ ] Filtres par service (Urgences, Réanimation, Médecine, Chirurgie)
- [ ] Badges de niveau de fatigue

### Page Planning (`/admin/planning`)
- [ ] Planning avec des shifts sur 2 semaines
- [ ] Pastilles rouges sur les violations de conformité
- [ ] Tooltip au survol des violations
- [ ] Possibilité de naviguer entre les semaines

### Page Détail Employé
- [ ] Historique des shifts
- [ ] Graphique de fatigue
- [ ] Tendances sur 7/14/30 jours

## 🎨 Ce qui rend le mode démo attractif

### Données réalistes
- 4 services hospitaliers différents
- Noms français crédibles
- Matricules (E001, E002, etc.)
- Postes variés (Infirmier, Aide-Soignant)

### Cas d'usage démontrés
- **Sophie Martin (Urgences)** : 4 nuits consécutives → violation critique
- **Thomas Bernard (Urgences)** : Quick return de 8h → violation
- **Marie Dubois (Urgences)** : 7 jours consécutifs → violation
- **Emma Robert (Réanimation)** : Shift de 13h → violation durée max
- **Autres** : Horaires normaux pour montrer la conformité

### Expérience utilisateur
- **0 friction** : Un seul clic pour accéder
- **Badge visible** : L'utilisateur sait qu'il est en mode démo
- **Données pré-chargées** : Tout est prêt à l'emploi
- **Violations visibles** : Montre la valeur de l'app immédiatement

## 📊 Métriques à suivre (optionnel)

Si tu veux tracker l'utilisation du mode démo :
- Nombre de clics sur le bouton de démo
- Temps passé dans l'app en mode démo
- Pages visitées en mode démo
- Conversions (démo → création de compte réel)

## 🔄 Maintenance

### Réinitialiser les données régulièrement
Les visiteurs peuvent modifier les données de démo. Pour les réinitialiser :

```sql
-- Dans Supabase SQL Editor
DELETE FROM work_shifts WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM employees WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM shift_codes WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM fatigue_scores WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';

-- Puis réexécuter le script demo-data.sql
```

### Sécurité
Le mot de passe **Demo123!** est public, ce qui est normal pour un compte de démo. Assure-toi simplement que ce compte n'a pas accès à des données sensibles (ce qui est le cas avec l'isolation par organization_id).

## 🎉 Résultat final

Avec ces modifications, ton portfolio offre maintenant :
1. **Une expérience sans friction** : 1 clic pour essayer
2. **Des données réalistes** : 12 employés, 4 services, 2 semaines de planning
3. **Une valeur immédiate** : Violations visibles, alertes de fatigue, graphiques
4. **Une indication claire** : Badge MODE DÉMO pour éviter toute confusion

Les visiteurs peuvent explorer toutes les fonctionnalités sans avoir à créer de compte, ce qui augmentera considérablement le taux d'engagement sur ton portfolio ! 🚀
