# Egonar Mobile — checkpoint architecture

Ce fichier marque un point de sauvegarde du projet fournisseur.

## Architecture persistante

- `apps/mobile/src/App.js` contient les écrans de connexion, fournisseur et administration.
- `apps/mobile/src/SupplierUniverseGate.js` conserve l’espace fournisseur choisi avec `AsyncStorage`.
- `apps/mobile/src/SupplierAiCoach.js` contient l’accueil IA et l’animation immersive de chaque univers.
- `apps/mobile/src/api.js` conserve les sessions avec `expo-secure-store` afin qu’un redémarrage de l’application ne demande pas systématiquement une nouvelle connexion.
- `apps/mobile/src/config.js` utilise les URLs API publiques configurées pour les appareils mobiles et ne dépend pas de `localhost`.

## Univers fournisseur

- 🛍️ EgonarMarket — Au cœur de l’e-commerce
- 🍽️ Saveurs — Au cœur des saveurs
- ✈️ Évasion — Au cœur des évasions

## Règle de sauvegarde

Le code de référence doit rester commité sur GitHub. L’arrêt ou le redémarrage d’un Codespace ne doit jamais être considéré comme une sauvegarde du projet. Après une reprise de travail, synchroniser le dépôt avec `git pull --ff-only origin main`.
