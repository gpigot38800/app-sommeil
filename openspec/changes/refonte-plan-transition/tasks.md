## 1. Migration DB et types

- [x] 1.1 Ajouter les colonnes `shift_type` (text, nullable), `work_start_time` (time, nullable) et `work_end_time` (time, nullable) dans la table `plan_days` du schema Drizzle (`src/db/schema.ts`)
- [x] 1.2 Generer et appliquer la migration SQL via Drizzle
- [x] 1.3 Mettre a jour `PlanningInput` dans `types.ts` : remplacer `availableDays: number` par `fromShiftEndDate: string` et `toShiftStartDate: string`, ajouter les dates des shifts
- [x] 1.4 Mettre a jour `GeneratedPlanDay` dans `types.ts` : ajouter `shiftType: ShiftType | null`, `workStartTime: string | null`, `workEndTime: string | null`, rendre `lightStart` et `lightEnd` nullable (`string | null`)

## 2. Moteur de planification (planning-engine)

- [x] 2.1 Modifier `generateTransitionPlan()` dans `index.ts` : remplacer `getReferenceSleepTime(fromShift.type)` par `timeToMinutes(habitualSleepTime)` comme point de depart
- [x] 2.2 Modifier le calcul de `targetSleepMinutes` : utiliser `toShift.startTime - habitualDuration` (avec wrap-around minuit) au lieu de `getReferenceSleepTime(toShift.type)`
- [x] 2.3 Calculer le nombre de jours automatiquement : `daysBetween = differenceInCalendarDays(toShiftStartDate, fromShiftEndDate)`, clamper entre MIN_DAYS et MAX_DAYS, supprimer la logique d'extension basee sur `daysNeeded`
- [x] 2.4 Associer le contexte shift a chaque jour du plan : mapper chaque dayNumber a une date calendaire, determiner si la date tombe dans le fromShift, toShift ou est un jour de repos, remplir `shiftType`, `workStartTime`, `workEndTime`
- [x] 2.5 Modifier `calculateCaffeineCutoff()` dans `rules.ts` : ajouter le parametre `shiftType`, appliquer 480 min (8h) pour "jour", 360 min (6h) pour "soir" et "nuit"
- [x] 2.6 Modifier `calculateLightWindow()` dans `rules.ts` : pour "jour" et "soir" calculer une fenetre de 2h avant coucher (lumiere tamisee), pour "nuit" retourner `null`/`null`, pour jour de repos traiter comme "jour"
- [x] 2.7 Modifier `generateNotes()` dans `index.ts` : la note d'introduction ("Decalez progressivement...") n'apparait que si `fromShift.type === "nuit"` ET (`toShift.type === "jour"` OU `toShift.type === "soir"`) ET `deficit > 0`
- [x] 2.8 Supprimer `getReferenceSleepTime()` de `rules.ts` (devenue inutile)

## 3. Validateur et API

- [x] 3.1 Modifier `createTransitionPlanSchema` dans `src/lib/validators/transition-plan.ts` : supprimer `availableDays` du schema Zod
- [x] 3.2 Modifier la route `POST /api/transition-plans` dans `route.ts` : supprimer `availableDays` du destructuring, recuperer les dates `endDate`/`startDate` des shifts depuis la DB, passer `fromShiftEndDate` et `toShiftStartDate` au moteur
- [x] 3.3 Persister les nouveaux champs (`shift_type`, `work_start_time`, `work_end_time`) dans l'insertion des `plan_days`
- [x] 3.4 Mettre a jour la route `GET /api/transition-plans/[id]` pour retourner les nouveaux champs dans la reponse

## 4. Formulaire de transition (UI)

- [x] 4.1 Supprimer le champ "Nombre de jours disponibles" et le state `availableDays` dans `transition-form.tsx`
- [x] 4.2 Supprimer `availableDays` du payload JSON envoye a l'API dans `handleSubmit`
- [x] 4.3 Mettre a jour l'interface `PlanDay` dans `transition-form.tsx` pour inclure les nouveaux champs (`shiftType`, `workStartTime`, `workEndTime`, `lightStart`/`lightEnd` nullable)

## 5. Detail du plan (UI)

- [x] 5.1 Ajouter la pastille type de shift dans chaque card de `plan-detail.tsx` : "Jour" en vert (bg-green-500/20), "Soir" en orange (bg-orange-500/20), "Nuit" en indigo (bg-indigo-500/20), "Repos" en style neutre
- [x] 5.2 Afficher les horaires de travail sous la pastille quand le shiftType n'est pas null (ex: "07:00 - 15:00")
- [x] 5.3 Renommer le libelle lumiere en "Lumiere tamisee" et ne l'afficher que si `lightStart` et `lightEnd` ne sont pas null (masque pour les shifts de nuit)

## 6. Redirection post-profil

- [x] 6.1 Ajouter une prop `isNewUser` a `ProfileForm` dans `profile-form.tsx`, passee depuis la page profil
- [x] 6.2 Apres sauvegarde reussie, si `isNewUser` est true, appeler `router.push("/planning")` au lieu de rester sur `/profil`
- [x] 6.3 Dans la page profil (`app/(dashboard)/profil/page.tsx`), passer `isNewUser` en se basant sur l'absence de profil existant

## 7. Tests et verification

- [x] 7.1 Tester la generation de plan avec des heures habituelles differentes des references fixes (ex: coucher 21:30 au lieu de 23:00) et verifier que le plan part de 21:30
- [x] 7.2 Tester le stop cafeine : verifier 8h avant coucher pour shift jour, 6h pour soir/nuit
- [x] 7.3 Tester le calcul automatique des jours : verifier le clamp entre 2 et 6 avec differents ecarts de dates
- [x] 7.4 Tester l'affichage des pastilles et horaires de travail sur le plan detail (jour, soir, nuit, repos)
- [x] 7.5 Tester la lumiere tamisee : visible pour jour/soir/repos, absente pour nuit
- [x] 7.6 Tester la redirection post-profil : nouveau utilisateur redirige vers /planning, utilisateur existant reste sur /profil
- [x] 7.7 Tester le responsive et dark mode avec Playwright sur la page transition
