## Context

Le moteur de planification actuel (`planning-engine`) utilise des heures de référence fixes pour déterminer le point de départ et la cible de la transition sommeil (jour→23:00, soir→01:00, nuit→08:00). Ces valeurs sont déconnectées du profil utilisateur. Le stop caféine est uniformément fixé à 6h avant coucher, ce qui est trop tardif en shift de jour. Le formulaire demande manuellement un nombre de "jours disponibles" alors que cette information se déduit des dates des shifts. Enfin, les jours du plan n'affichent pas le contexte du shift (type + horaires de travail), et le flux post-profil ne redirige pas vers la page planning.

## Goals / Non-Goals

**Goals :**
- Utiliser les heures habituelles du profil comme point de départ réel du calcul de transition
- Différencier le stop caféine par type de shift (8h pour jour, 6h pour soir/nuit)
- Calculer automatiquement le nombre de jours à partir des dates des shifts sélectionnés
- Afficher le type de shift et les horaires de travail sur chaque jour du plan
- Rediriger les nouveaux utilisateurs vers `/planning` après sauvegarde du profil

**Non-Goals :**
- Refondre l'algorithme de transition (décalage progressif) — seuls les inputs changent
- Modifier la fenêtre de lumière (inchangée)
- Ajouter de nouvelles tables en base de données

## Decisions

### D1 : Point de départ = heures habituelles du profil

**Choix** : Remplacer `getReferenceSleepTime(shiftType)` par l'heure habituelle de coucher (`habitualSleepTime`) comme point de départ du calcul. La cible reste calculée à partir du shift d'arrivée.

**Raisonnement** : Le point de départ de la transition doit refléter l'état réel de l'utilisateur, pas une heure théorique. Un utilisateur qui se couche à 22:00 en shift de jour ne doit pas recevoir un plan qui commence à 23:00.

**Calcul modifié** :
- `startSleepMinutes` = `timeToMinutes(habitualSleepTime)` (au lieu de `getReferenceSleepTime(fromShift.type)`)
- `targetSleepMinutes` = calculé à partir du shift d'arrivée : on prend l'heure de début du shift d'arrivée et on recule de la durée habituelle de sommeil pour déterminer l'heure de coucher cible. Cela garantit que l'utilisateur dort suffisamment avant son prochain shift.
- **Formule** : `targetSleepMinutes = toShift.startTime - habitualDuration` (avec gestion du wrap-around minuit)

**Alternative rejetée** : Garder `getReferenceSleepTime()` comme fallback si le profil est incomplet. Rejeté car le profil est déjà requis (validation existante dans l'API).

### D2 : Stop caféine différencié par type de shift

**Choix** : Modifier `calculateCaffeineCutoff()` pour accepter le type de shift du jour courant et appliquer :
- Shift **jour** : 8h avant coucher (480 min)
- Shift **soir** : 6h avant coucher (360 min)
- Shift **nuit** : 6h avant coucher (360 min)

**Raisonnement** : En shift de jour, l'utilisateur se couche typiquement entre 22:00 et 00:00. Avec 6h avant coucher, le stop caféine tombe à 16:00-18:00, ce qui est trop permissif. Avec 8h, on obtient 14:00-16:00, plus raisonnable pour un sommeil de qualité. Les shifts soir/nuit impliquent des couchers plus tardifs où 6h suffit.

**Signature modifiée** : `calculateCaffeineCutoff(targetSleepMinutes: number, shiftType: ShiftType): string`

**Alternative rejetée** : Règle dynamique basée sur la durée avant coucher (e.g., toujours couper à 14:00). Rejeté car trop rigide et ne s'adapte pas aux horaires variables.

### D3 : Calcul automatique du nombre de jours

**Choix** : Supprimer le paramètre `availableDays` de `PlanningInput`. Calculer le nombre de jours à partir de la différence entre `fromShift.endDate` et `toShift.startDate`.

**Calcul** :
```
daysBetween = differenceInCalendarDays(toShift.startDate, fromShift.endDate)
actualDays = clamp(daysBetween, MIN_DAYS, MAX_DAYS)
```

Si `daysBetween < MIN_DAYS` (2), on génère quand même 2 jours (transition minimale). Si `daysBetween > MAX_DAYS` (6), on plafonne à 6 jours.

**Impact API** : Le payload POST passe de `{ fromShiftId, toShiftId, availableDays }` à `{ fromShiftId, toShiftId }`. L'API calcule les jours côté serveur à partir des dates des shifts.

**Impact types** : `PlanningInput` remplace `availableDays: number` par `fromShiftEndDate: string` et `toShiftStartDate: string`.

**Alternative rejetée** : Garder le champ mais le pré-remplir automatiquement. Rejeté car l'utilisateur a demandé la suppression pure et simple — la valeur se déduit des données existantes.

### D4 : Pastilles shift et horaires de travail par jour du plan

**Choix** : Ajouter deux champs à `GeneratedPlanDay` : `shiftType` (ShiftType | null) et `workHours` (string | null, format "HH:MM - HH:MM"). Ces informations sont calculées par le moteur et transmises à l'UI.

**Logique de mapping jour → shift** :
- Le moteur reçoit les dates des deux shifts (début/fin)
- Pour chaque jour du plan, on détermine à quelle date calendaire il correspond (startDate du plan + dayNumber - 1)
- Si cette date tombe pendant le `fromShift` → type = fromShift.type, horaires = fromShift
- Si cette date tombe pendant le `toShift` → type = toShift.type, horaires = toShift
- Sinon (jour de repos entre les deux) → type = null (jour de repos)

**Impact DB** : Ajout de deux colonnes optionnelles dans `plan_days` :
- `shift_type` (text, nullable) : type de shift ce jour-là
- `work_start_time` (time, nullable) : heure début de travail
- `work_end_time` (time, nullable) : heure fin de travail

**Impact UI** (`plan-detail.tsx`) : Affichage d'une pastille colorée (même style que dans shift-list) et des horaires de travail sous le titre "Jour N".

**Alternative rejetée** : Stocker uniquement dans le frontend sans persister en DB. Rejeté car les données doivent être cohérentes lors de la relecture d'un plan sauvegardé.

### D5 : Redirection post-profil vers /planning

**Choix** : Dans `profile-form.tsx`, après `router.refresh()`, ajouter `router.push("/planning")` pour les nouveaux utilisateurs (détection via la prop `isNewUser` ou l'absence de profil existant).

**Raisonnement** : Le parcours logique est : profil → planning → transition. Après avoir complété son profil, l'utilisateur doit saisir ses shifts.

**Alternative rejetée** : Redirection côté serveur (middleware). Rejeté car la redirection ne doit se faire qu'après la première sauvegarde, pas à chaque visite du profil.

## Risks / Trade-offs

**[Heures habituelles comme point de départ]** → Si l'utilisateur a des heures habituelles très décalées par rapport à son shift actuel, le plan pourrait sembler contre-intuitif. Mitigation : le profil demande bien les heures "habituelles" (hors shift), donc elles reflètent le rythme naturel de l'utilisateur.

**[Calcul automatique des jours]** → Si l'écart entre les shifts est de 0-1 jour, le plan sera très agressif (minimum 2 jours, mais gros décalage par jour). Mitigation : afficher un avertissement si le nombre de jours calculé est inférieur au minimum recommandé par l'algorithme (`daysNeeded`).

**[Migration DB]** → L'ajout de colonnes à `plan_days` nécessite une migration. Les plans existants auront des valeurs null pour les nouveaux champs. Mitigation : les champs sont nullable, l'UI gère gracieusement l'absence de données (pas de pastille affichée si null).

**[Stop caféine 8h en jour]** → Pourrait sembler restrictif pour certains utilisateurs habitués au café l'après-midi. Mitigation : c'est une recommandation, pas une contrainte. Le plan affiche l'heure, l'utilisateur reste libre.
