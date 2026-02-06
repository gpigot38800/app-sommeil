
---

# 🎯 Objectif MVP

Créer une app iOS pour travailleurs de nuit qui :

* Collecte planning + habitudes de sommeil
* Génère un plan de transition jour/nuit personnalisé
* Rappelle quoi faire (sommeil, caféine, lumière)
* Suit fatigue + sommeil
* Stocke tout dans une base de donnée 

---

# 🧱 Stack

* iOS : **SwiftUI**
* Persistance locale : **SwiftData** (ou CoreData)
* Graphiques : **Swift Charts**
* Notifications : **Local Notifications**
* Architecture : **MVVM simple**
* Backend : base de donnée progresSQL

---

# 🗄️ Modèle de données (local)

* `UserProfile`

  * habitualSleepTime, habitualWakeTime

* `WorkShift`

  * startDate, endDate, type

* `SleepRecord`

  * date, actualSleepStart, actualSleepEnd, source

* `TransitionPlan`

  * createdAt, fromShift, toShift, days[]

* `PlanDay`

  * targetSleepTime, targetWakeTime, caffeineCutoff, lightWindow, notes

* `FatigueScore`

  * date, score (1–10), note

---

# 🧠 Logique de planification (v1, rule-based)

Inputs :

* Ancien shift
* Nouveau shift
* Heures habituelles
* Jours disponibles

Règles :

* Décaler le sommeil de max ±1–2h / jour
* Définir :

  * Heure coucher cible
  * Heure lever cible
  * Heure stop caféine
  * Fenêtre lumière / obscurité
* Générer un tableau de `PlanDay` sur 2–5 jours

Output :

* `TransitionPlan` affiché jour par jour

---

# 📱 Écrans MVP

1. Entrer son profil genre, age, metier,  )
2. Profil sommeil
3. Saisie planning (shifts)
4. Mon plan de transition (liste jours)
5. Détail d’un jour (checklist)
6. Suivi :

   * Sommeil réel vs cible
   * Fatigue score
7. Progrès (charts simples)

---

# ⏰ Fonctionnalités clés

* Générer plan → `TransitionPlan`
* Notifications locales :

  * Heure coucher
  * Stop caféine
  * Lumière / obscurité
* Saisie fatigue quotidienne (1–10)
* Graphiques simples (Swift Charts)

---

# 🗺️ Roadmap

V1

* Setup projet, SwiftData, écrans de saisie

V2

* Moteur de règles + génération du plan + UI plan

V3

* Sync sommeil, fatigue, notifications, suivi

V4

* Charts, polish UX, TestFlight

---

# 🏗️ Architecture (simple)

* Models/
* ViewModels/
* Views/
* Services/

  * PlanningEngine
  * NotificationService
  * StorageService

---

# 🚀 Critère de succès MVP

* Un utilisateur peut :

  * Entrer son planning
  * Obtenir un plan clair
  * Suivre ses consignes
  * Voir son sommeil réel vs cible
  * Noter sa fatigue

--
