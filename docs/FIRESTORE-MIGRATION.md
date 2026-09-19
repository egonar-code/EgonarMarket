# Migration Firestore — EgonarMarket

Cette branche ajoute un backend Firestore parallèle au backend PostgreSQL actuel.

## Architecture

- PostgreSQL reste la source actuelle pendant la migration.
- DATA_BACKEND=firestore fait démarrer le nouvel API Firestore.
- Le portail fournisseur reste temporairement sur PostgreSQL pour permettre une migration progressive.
- L'authentification Admin conserve temporairement le JWT/bcrypt, mais les données du compte Admin sont stockées dans Firestore.

## Collections Firestore

- products
- customers
- orders
- reviews
- admins
- suppliers
- categories
- health

## Configuration Render

Ajouter dans le service Web :

- DATA_BACKEND=firestore
- FIREBASE_SERVICE_ACCOUNT_JSON=<JSON du compte de service Firebase>
- ADMIN_EMAIL=admin@egonarmarket.sn
- ADMIN_PASSWORD=<nouveau mot de passe>
- JWT_SECRET=<secret JWT>

Ne jamais committer FIREBASE_SERVICE_ACCOUNT_JSON dans GitHub.

## Ordre de migration

1. Créer le projet Firebase.
2. Créer la base Cloud Firestore en mode production.
3. Créer un compte de service et générer sa clé privée.
4. Placer le JSON du compte de service uniquement dans Render.
5. Conserver PostgreSQL actif pendant la migration.
6. Exécuter npm run firestore:migrate une seule fois pour copier les données.
7. Exécuter npm run firestore:verify.
8. Passer DATA_BACKEND=firestore.
9. Redéployer et vérifier /api/health puis /admin.html.
10. Une fois le portail fournisseur migré et vérifié, PostgreSQL pourra être retiré.

## Important

Le script de migration conserve les identifiants de documents existants afin de limiter les changements dans les références produit/commande.

L'Admin Firestore utilise encore le hash bcrypt existant. Cela permet de basculer le stockage sans changer immédiatement l'interface de connexion.