## MODIFIED Requirements

### Requirement: Profile save and update

Le systeme SHALL sauvegarder le profil en base de donnees et permettre sa modification ulterieure. Apres la premiere sauvegarde reussie du profil (nouvel utilisateur), le systeme redirige automatiquement vers la page `/planning`.

#### Scenario: Sauvegarde reussie du profil

- **WHEN** l'utilisateur soumet le formulaire avec des donnees valides
- **THEN** les donnees sont enregistrees dans la table `profiles`
- **THEN** un message de confirmation s'affiche
- **THEN** le champ `updated_at` est mis a jour

#### Scenario: Redirection post-profil pour nouvel utilisateur

- **WHEN** un nouvel utilisateur (sans profil existant) sauvegarde son profil pour la premiere fois
- **THEN** le systeme MUST rediriger automatiquement vers `/planning`
- **THEN** un toast de succes MUST s'afficher avant la redirection

#### Scenario: Modification du profil existant sans redirection

- **WHEN** un utilisateur avec un profil existant modifie et sauvegarde ses informations
- **THEN** le formulaire est sauvegarde et un message de succes s'affiche
- **THEN** l'utilisateur MUST rester sur la page `/profil` (pas de redirection)
