## Context

La V1 de l'App Sommeil est en place avec : authentification Supabase, profil utilisateur, saisie CRUD des shifts, layout dashboard responsive avec dark mode. Le schema Drizzle contient 2 tables (`profiles`, `work_shifts`). Les API routes suivent un pattern coherent : verification auth Supabase, validation Zod, requetes Drizzle, reponses JSON. Le dossier `src/lib/planning-engine/` existe mais est vide.

La V2 doit ajouter le coeur metier : un moteur de regles qui genere des plans de transition sommeil, calcule le deficit de sommeil, et l'interface pour les consulter.

## Goals / Non-Goals

**Goals:**
- Implementer un moteur de regles deterministe qui genere un plan de transition jour/nuit sur 2-6 jours (max legal francais)
- Calculer le deficit de sommeil par jour et cumule pendant la transition
- Persister les plans generes en base de donnees (transition_plans + plan_days) avec deficit
- Fournir une interface pour generer un plan a partir de deux shifts et le consulter jour par jour avec indicateur de deficit
- Suivre les memes patterns d'architecture que la V1 (Server Components + Client Components, API routes, Zod validators)

**Non-Goals:**
- IA/ML pour la generation de plans (V2 = rule-based uniquement)
- Suivi du sommeil reel et de la fatigue (V3)
- Graphiques et charts (V4)
- Notifications push ou locales (V3)
- Integration HealthKit / Google Fit (Phase 2 mobile)

## Decisions

### 1. Moteur de regles comme module pur TypeScript

Le planning engine sera un module pur sans dependance base de donnees, dans `src/lib/planning-engine/`. Il recoit des inputs types et retourne un tableau de `PlanDay` avec deficit de sommeil. Cela permet de le tester unitairement et de l'utiliser cote serveur sans couplage.

**Structure :**
- `src/lib/planning-engine/index.ts` — fonction principale `generateTransitionPlan()`
- `src/lib/planning-engine/types.ts` — types d'entree/sortie (incluant deficit par jour et cumule)
- `src/lib/planning-engine/rules.ts` — regles de calcul (decalage horaire, cafeine, lumiere, deficit)

**Alternative consideree :** Mettre la logique directement dans l'API route. Rejete car non testable et non reutilisable.

### 2. Algorithme de decalage progressif avec extension automatique

L'algorithme central decale les horaires de sommeil de max ±1.5h par jour (compromis entre ±1h et ±2h du PRD). Le nombre de jours va de 2 a 6 (loi francaise : max 6 jours consecutifs sans repos).

**Comportement d'extension :** Si l'ecart total entre les shifts ne peut pas etre couvert dans le nombre de jours demande a raison de 1.5h/jour max, le moteur etend automatiquement le plan (jusqu'a 6 jours). Si meme 6 jours ne suffisent pas, le dernier jour couvre l'ecart restant (decalage > 1.5h accepte pour le dernier jour uniquement).

Le calcul :

1. Calculer l'ecart total entre heure coucher actuelle et heure coucher cible
2. Calculer le nombre de jours necessaires : ceil(ecart / 1.5h), cap a 6
3. Si necessaires > demandes, utiliser necessaires (extension)
4. Pour chaque jour, calculer :
   - `targetSleepTime` = heure coucher precedente + increment
   - `targetWakeTime` = targetSleepTime + duree sommeil habituelle (deduit du profil)
   - `caffeineCutoff` = targetSleepTime - 6h (recommandation standard)
   - `lightStart` / `lightEnd` = fenetre de 2h selon type de shift cible
   - `deficitMinutes` = max(0, duree habituelle - duree dispo avant le shift suivant)

**Alternative consideree :** Decalage fixe de 1h/jour. Rejete car trop lent pour des transitions avec peu de jours disponibles.

### 3. Gestion des 3 types de shifts (jour, soir, nuit)

Le moteur supporte les 3 types de shifts. La fenetre lumiere s'adapte :
- **Shift jour** : lumiere au lever (avancer le rythme circadien)
- **Shift soir** : lumiere en fin de matinee (cycle intermediaire)
- **Shift nuit** : obscurite avant coucher (retarder le rythme circadien)

Les horaires de reference par type de shift :
- Jour : coucher ~23:00, lever ~07:00
- Soir : coucher ~01:00, lever ~09:00
- Nuit : coucher ~08:00, lever ~16:00

### 4. Calcul du deficit de sommeil

Le deficit est calcule par jour : difference entre duree de sommeil habituelle et duree reellement disponible (contrainte par le shift). Stocke en minutes dans `plan_days.deficit_minutes` et cumule dans `transition_plans.total_deficit_minutes`. L'API retourne les deux valeurs. L'UI affiche un bandeau resume et un indicateur par jour.

### 5. Tables DB conformes a ARCHITECTURE.md

Deux nouvelles tables :

- `transition_plans` : metadata du plan (from_shift text, to_shift text, start_date, days_count, total_deficit_minutes)
- `plan_days` : jours du plan avec FK vers transition_plans (target_sleep_time, target_wake_time, caffeine_cutoff, light_start, light_end, deficit_minutes, notes)

Les champs `from_shift` et `to_shift` stockent le type de shift en texte ("jour", "soir", "nuit") et non un ID. Cela rend les donnees lisibles et auto-suffisantes.

Les deux tables ont des politiques RLS (user_id pour transition_plans, via join pour plan_days). Migration Drizzle generee via `drizzle-kit generate`.

**Alternative consideree :** Stocker les plan_days en JSON dans transition_plans. Rejete car moins flexible pour les requetes et contraire au schema relationnel defini dans ARCHITECTURE.md.

### 6. API route unique pour generer + persister

Une seule route `POST /api/transition-plans` recoit les parametres (fromShiftId, toShiftId, availableDays), recupere le profil et les shifts, extrait les types de shifts, appelle le planning engine, persiste le resultat (avec types et deficit), et retourne le plan complet. Cela evite des allers-retours client-serveur.

Routes :
- `POST /api/transition-plans` — generer un nouveau plan
- `GET /api/transition-plans` — lister les plans de l'utilisateur
- `GET /api/transition-plans/[id]` — detail d'un plan avec ses jours

**Alternative consideree :** Generer cote client puis envoyer a l'API pour sauvegarde. Rejete car le profil et les shifts doivent etre lus depuis la DB (securite RLS).

### 7. Interface en deux vues avec bandeau deficit

- **Page `/transition`** : formulaire de generation (selectionner shift depart + shift arrivee + nombre de jours 2-6) + liste des plans existants avec deficit cumule affiche.
- **Vue detail plan** : bandeau resume deficit en haut, puis cards jour par jour (heure coucher, lever, stop cafeine, fenetre lumiere, deficit du jour, notes). Avertissement visuel si deficit > 4h.

Composants client : `TransitionForm` (formulaire), `PlanList` (liste des plans), `PlanDetail` (bandeau deficit + vue jour par jour avec cards). Page serveur pour le data fetching initial.

**Alternative consideree :** Page separee `/transition/[id]` pour le detail. Rejete car la navigation simple (une seule page) est plus intuitive pour un MVP mobile-first.

### 8. Gestion du temps circulaire (24h)

Les horaires de nuit traversent minuit (ex: coucher 22:00, lever 06:00). Le moteur de regles travaille en minutes depuis minuit (0-1439) et gere le wrap-around. Les heures sont stockees en `time` (HH:MM) en DB et converties en minutes pour les calculs.

## Risks / Trade-offs

- **Decalage de 1.5h/jour peut etre trop rapide pour certains utilisateurs** → V3 pourra ajuster le parametre. Pour le MVP, 1.5h est un bon compromis base sur la litterature du sommeil.

- **Le dernier jour peut depasser 1.5h de decalage** → Quand l'ecart est trop grand pour 6 jours, le dernier jour absorbe l'ecart restant. C'est un compromis acceptable car 6 jours est la limite legale.

- **Le deficit est une estimation theorique** → Base sur les horaires de shift et la duree habituelle, pas sur le sommeil reel. L'utilisateur doit comprendre que c'est previsionnel. Un message clair dans l'UI l'indiquera.

- **Pas de validation que les shifts selectionnes sont consecutifs** → L'utilisateur pourrait generer un plan entre deux shifts non adjacents. Acceptable pour le MVP, on affiche un avertissement si l'ecart entre les shifts est > 7 jours.

- **Le plan genere est statique** → Une fois genere, le plan ne se met pas a jour si l'utilisateur modifie ses shifts. Le comportement est explicite : on genere un nouveau plan si les shifts changent.

- **Pas de prise en compte du chronotype** → Le moteur V2 est generique. La personnalisation avancee (chronotype matin/soir, age, sensibilite cafeine) pourra etre ajoutee en V3+.
