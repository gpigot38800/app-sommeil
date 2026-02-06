## Purpose

Authentification utilisateur via Supabase Auth avec gestion côté serveur. Ce spec couvre l'inscription, la connexion, la déconnexion, la protection des routes et la gestion des sessions.

## ADDED Requirements

### Requirement: User registration with email and password

Le système SHALL permettre à un nouvel utilisateur de s'inscrire avec une adresse email et un mot de passe.

#### Scenario: Inscription réussie

- **WHEN** un utilisateur soumet le formulaire d'inscription avec un email valide et un mot de passe (minimum 6 caractères)
- **THEN** un compte est créé dans Supabase Auth
- **THEN** l'utilisateur est redirigé vers la page de profil

#### Scenario: Inscription avec email déjà utilisé

- **WHEN** un utilisateur soumet le formulaire d'inscription avec un email déjà enregistré
- **THEN** un message d'erreur s'affiche indiquant que l'email est déjà utilisé
- **THEN** aucun compte en double n'est créé

#### Scenario: Inscription avec mot de passe trop court

- **WHEN** un utilisateur soumet le formulaire d'inscription avec un mot de passe de moins de 6 caractères
- **THEN** un message d'erreur de validation s'affiche
- **THEN** le formulaire n'est pas soumis au serveur

### Requirement: User login with email and password

Le système SHALL permettre à un utilisateur existant de se connecter avec son email et son mot de passe.

#### Scenario: Connexion réussie

- **WHEN** un utilisateur soumet le formulaire de connexion avec des identifiants valides
- **THEN** une session est créée via des cookies HTTP-only
- **THEN** l'utilisateur est redirigé vers le dashboard (page planning)

#### Scenario: Connexion avec identifiants invalides

- **WHEN** un utilisateur soumet le formulaire de connexion avec un email ou mot de passe incorrect
- **THEN** un message d'erreur générique s'affiche ("Email ou mot de passe incorrect")
- **THEN** aucune session n'est créée

### Requirement: User logout

Le système SHALL permettre à un utilisateur connecté de se déconnecter.

#### Scenario: Déconnexion réussie

- **WHEN** un utilisateur clique sur le bouton de déconnexion
- **THEN** la session est supprimée (cookies effacés)
- **THEN** l'utilisateur est redirigé vers la page de connexion

### Requirement: Route protection via middleware

Le système SHALL protéger les routes du dashboard contre les accès non authentifiés.

#### Scenario: Accès non authentifié à une route protégée

- **WHEN** un utilisateur non authentifié tente d'accéder à une route sous `(dashboard)/`
- **THEN** l'utilisateur est redirigé vers `/login`

#### Scenario: Accès authentifié à une route protégée

- **WHEN** un utilisateur authentifié accède à une route sous `(dashboard)/`
- **THEN** la page s'affiche normalement avec les données de l'utilisateur

#### Scenario: Utilisateur connecté accède aux pages auth

- **WHEN** un utilisateur déjà authentifié accède à `/login` ou `/register`
- **THEN** l'utilisateur est redirigé vers le dashboard

### Requirement: Session refresh via middleware

Le système SHALL rafraîchir automatiquement les tokens de session expirés.

#### Scenario: Token expiré rafraîchi automatiquement

- **WHEN** un utilisateur avec un token expiré fait une requête
- **THEN** le middleware rafraîchit le token via Supabase Auth
- **THEN** la requête se poursuit normalement sans interruption pour l'utilisateur
