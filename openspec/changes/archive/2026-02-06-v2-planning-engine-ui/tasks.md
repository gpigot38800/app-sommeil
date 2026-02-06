## 1. Schema DB et migration

- [x] 1.1 Ajouter les tables `transitionPlans` et `planDays` dans `src/db/schema.ts` : `transitionPlans` avec colonnes (id, user_id FK cascade, from_shift text, to_shift text, start_date, days_count, total_deficit_minutes integer default 0, created_at) et `planDays` avec colonnes (id, plan_id FK cascade, day_number, target_sleep_time, target_wake_time, caffeine_cutoff, light_start, light_end, deficit_minutes integer default 0, notes)
- [x] 1.2 Generer la migration Drizzle (`drizzle-kit generate`) et verifier le fichier SQL genere
- [x] 1.3 Appliquer la migration sur la base Supabase (`drizzle-kit push` ou migration manuelle)
- [x] 1.4 Ajouter les politiques RLS pour `transition_plans` (SELECT/INSERT/UPDATE/DELETE filtres par `user_id = auth.uid()`) et `plan_days` (filtres via join sur `transition_plans.user_id`)

## 2. Moteur de regles (planning-engine)

- [x] 2.1 Creer `src/lib/planning-engine/types.ts` avec les types d'entree (`PlanningInput`: profil sommeil, shift depart avec type/horaires, shift arrivee avec type/horaires, nombre de jours) et de sortie (`GeneratedPlanDay`: targetSleepTime, targetWakeTime, caffeineCutoff, lightStart, lightEnd, deficitMinutes, notes, dayNumber) et (`PlanResult`: days[], totalDeficitMinutes, actualDaysCount)
- [x] 2.2 Creer `src/lib/planning-engine/rules.ts` avec les fonctions utilitaires : conversion time string <-> minutes, wrap-around minuit, calcul ecart horaire circulaire, calcul cafeine cutoff (coucher - 6h), calcul fenetre lumiere (2h selon type shift : jour/soir/nuit), calcul deficit sommeil (duree habituelle - duree dispo contrainte par shift)
- [x] 2.3 Creer `src/lib/planning-engine/index.ts` avec la fonction `generateTransitionPlan()` : decalage progressif (max ±1.5h/jour), extension automatique si ecart trop grand (cap 6 jours, loi francaise), validation jours (min 2, max 6), calcul deficit par jour et cumule, generation des notes contextuelles (intro, dernier jour, avertissement deficit > 1h avec conseil sieste 20 min)
- [x] 2.4 Tester le moteur avec les scenarios de la spec : transition jour→nuit, nuit→jour, soir→nuit, wrap-around minuit, extension auto du plan, limites min/max jours, deficit sommeil

## 3. Validators Zod

- [x] 3.1 Creer `src/lib/validators/transition-plan.ts` avec le schema de validation pour la creation d'un plan (fromShiftId: uuid, toShiftId: uuid, availableDays: number 2-6) et la regle fromShiftId !== toShiftId

## 4. API Routes

- [x] 4.1 Creer `src/app/api/transition-plans/route.ts` avec POST (validation Zod, lecture profil + shifts depuis DB, extraction des types de shift, appel planning engine, insertion transition_plan avec from_shift/to_shift en type text + total_deficit_minutes + plan_days avec deficit_minutes, retour plan complet) et GET (liste des plans de l'utilisateur tries par created_at desc)
- [x] 4.2 Creer `src/app/api/transition-plans/[id]/route.ts` avec GET (plan + plan_days joints, verification ownership) et DELETE (suppression avec verification ownership, cascade automatique sur plan_days)

## 5. Composants UI

- [x] 5.1 Creer `src/components/forms/transition-form.tsx` : formulaire avec 2 selects (shifts de l'utilisateur, format "type - date debut / date fin"), input nombre de jours (2-6), bouton generer, etats loading/erreur, message si aucun shift, gestion state du plan selectionne
- [x] 5.2 Creer `src/components/forms/plan-list.tsx` : liste des plans existants (from_shift type, to_shift type, start_date, days_count, deficit cumule total), bouton voir detail, bouton supprimer avec dialog de confirmation, message si aucun plan, refresh apres mutation
- [x] 5.3 Creer `src/components/forms/plan-detail.tsx` : bandeau resume deficit en haut (deficit cumule, message positif si 0h, avertissement orange/rouge si > 4h), puis affichage jour par jour avec cards (numero du jour, heure coucher, heure lever, stop cafeine, fenetre lumiere debut-fin, deficit du jour, notes), layout responsive (grille desktop, stack mobile)

## 6. Page et navigation

- [x] 6.1 Creer `src/app/(dashboard)/transition/page.tsx` : server component qui fetch les shifts et plans de l'utilisateur, passe les donnees aux composants client (TransitionForm, PlanList, PlanDetail)
- [x] 6.2 Ajouter l'entree "Mon plan" dans la sidebar (`src/components/layout/sidebar.tsx`) avec icone appropriee (ex: ClipboardList de lucide-react), pointant vers `/transition`

## 7. Integration et test

- [x] 7.1 Verifier le flux complet : creer des shifts, generer un plan (incluant extension auto si ecart > jours demandes), voir le detail avec deficit, supprimer un plan
- [x] 7.2 Verifier le responsive (mobile < 768px) et le dark mode sur la page transition
- [x] 7.3 Verifier les cas d'erreur : aucun shift, shifts identiques, utilisateur non authentifie
- [x] 7.4 Verifier l'affichage du deficit : bandeau resume (0h positif, < 4h normal, > 4h avertissement), deficit par jour dans les cards, notes avec conseil sieste si deficit > 1h
