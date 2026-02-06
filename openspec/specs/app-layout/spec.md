## Purpose

Layout principal de l'application avec navigation, sidebar responsive et support dark mode natif pour les travailleurs de nuit.

## ADDED Requirements

### Requirement: Dashboard layout with sidebar navigation

Le système SHALL afficher un layout avec une sidebar de navigation pour les pages du dashboard.

#### Scenario: Sidebar affichée sur desktop

- **WHEN** un utilisateur authentifié accède au dashboard sur un écran large (>= 768px)
- **THEN** une sidebar est visible à gauche avec les liens : Planning, Profil
- **THEN** le contenu principal occupe le reste de l'espace

#### Scenario: Sidebar en mode mobile

- **WHEN** un utilisateur accède au dashboard sur un écran mobile (< 768px)
- **THEN** la sidebar est masquée par défaut
- **THEN** un bouton hamburger dans la navbar permet d'ouvrir/fermer la sidebar en overlay

### Requirement: Top navbar

Le système SHALL afficher une barre de navigation en haut de l'écran.

#### Scenario: Navbar affichée avec les éléments essentiels

- **WHEN** un utilisateur authentifié est sur le dashboard
- **THEN** la navbar affiche : le nom de l'application, un bouton de basculement dark/light mode, le nom de l'utilisateur ou ses initiales, un bouton de déconnexion

### Requirement: Dark mode as default

Le système SHALL utiliser le dark mode par défaut et permettre le basculement vers le light mode.

#### Scenario: Dark mode activé par défaut

- **WHEN** un utilisateur accède à l'application pour la première fois
- **THEN** le thème sombre est appliqué (fond sombre, texte clair)

#### Scenario: Basculement de thème

- **WHEN** l'utilisateur clique sur le bouton de basculement de thème
- **THEN** le thème change entre dark et light
- **THEN** le choix est persisté dans le localStorage

#### Scenario: Thème persisté entre sessions

- **WHEN** l'utilisateur revient sur l'application après avoir choisi le light mode
- **THEN** le light mode est restauré sans flash de dark mode

### Requirement: Auth layout without sidebar

Le système SHALL afficher un layout simplifié pour les pages d'authentification.

#### Scenario: Layout auth centré

- **WHEN** un utilisateur non authentifié accède à `/login` ou `/register`
- **THEN** la page affiche le formulaire centré sans sidebar ni navbar de dashboard
- **THEN** le dark mode est également appliqué

### Requirement: Active navigation state

Le système SHALL indiquer la page active dans la navigation.

#### Scenario: Lien actif mis en évidence

- **WHEN** l'utilisateur est sur la page planning
- **THEN** le lien "Planning" dans la sidebar est visuellement distinct (style actif)
- **THEN** les autres liens ont leur style normal

### Requirement: Responsive content area

Le système SHALL adapter le contenu principal aux différentes tailles d'écran.

#### Scenario: Contenu responsive

- **WHEN** l'utilisateur accède au dashboard
- **THEN** le contenu principal a un max-width adapté et des paddings responsifs
- **THEN** les formulaires et listes s'adaptent à la largeur disponible
