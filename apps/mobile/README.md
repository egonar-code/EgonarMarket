# EgonarMarket Mobile

Une base Expo/React Native partagée pour produire deux applications séparées :

- **Egonar Admin** : pilotage global de la plateforme.
- **Egonar Fournisseur** : espace isolé de chaque fournisseur.

Les deux builds utilisent la même base de code et la même API. Le rôle est fixé au build avec `EXPO_PUBLIC_APP_ROLE`.

## Développement

Depuis `apps/mobile` :

```bash
npm install
EXPO_PUBLIC_APP_ROLE=supplier EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm start
```

Pour l'Admin :

```bash
EXPO_PUBLIC_APP_ROLE=admin EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm start
```

Pour un téléphone réel, `EXPO_PUBLIC_API_BASE_URL` doit pointer vers une URL HTTPS accessible depuis le téléphone, pas vers `localhost`.

## Séparation des droits

Le mobile fournisseur appelle uniquement les endpoints fournisseur et les résultats sont filtrés côté API par `supplier_id`. Le mobile Admin utilise les endpoints d'administration et de validation.

## Suite de production

1. authentification mobile avec jetons persistés dans SecureStore ;
2. notifications push ;
3. dashboard commandes temps réel ;
4. gestion produit complète avec upload d'image ;
5. statistiques et commissions fournisseur ;
6. validation fournisseurs/produits et audit côté Admin ;
7. builds Android/iOS séparés et signature de production.
