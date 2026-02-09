Contraintes et Politiques :
- NE JAMAIS exposer les clés API au client 

Dépendances :
- Préférer les composants existants plutôt que d'ajouter de nouvelles 
bibliothèques UI

À la fin de chaque développement qui implique l'interface graphique :
- Tester avec playwright-skill, l'interface doit être responsive, fonctionnel et répondre au besoin développé

Documentation :
- Ajoute une section documentation avec les liens vers @PRD.md  & 
@ARCHITECTURE.md 

Context7 :
Utilise toujours context7 lorsque j'ai besoin de génération de code, d'étapes de configuration ou d'installation, ou de documentation de bibliothèque/API. Cela signifie que tu dois automatiquement utiliser les outils MCP Context7 pour résoudre l'identifiant de bibliothèque et obtenir la documentation de bibliothèque sans que j'aie à le demander explicitement.

Note : Toutes les spécifications doivent être rédigées en français, y compris les specs OpenSpec (sections Purpose et Scenarios). Seuls les titres de Requirements doivent rester en anglais avec les mots-clés SHALL/MUST pour la validation OpenSpeC