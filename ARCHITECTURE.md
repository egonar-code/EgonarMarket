# EgonarMarket — architecture

## Objectif
Plateforme e-commerce Sénégal, mobile-first, conçue pour évoluer vers la sous-région et un écosystème multi-services.

## Structure
- `apps/web/` : boutique, panier, checkout, suivi, administration et futurs espaces partenaires
- `apps/api/` : API Express, authentification, catalogue, commandes et recherche intelligente
- `db/` : schéma PostgreSQL, fournisseurs et workflow de validation des produits
- `.env.example` : variables d'environnement
- `.github/workflows/ci.yml` : validation automatique du JavaScript

## Univers
- **Marketplace** : produits grand public et catégories spécialisées
- **Food** : restaurants, plats, menus, livraison et produits alimentaires
- **Travel** : séjours, activités, transferts et services de voyage

Les univers Food et Travel sont accessibles directement depuis la page officielle tout en restant intégrés à l'écosystème Egonar.

## Catégories Marketplace
Mode, Accessoires, Maison, Beauté, Tech, Charcuterie, Poissonnerie et Bébés & Enfants. La structure reste ouverte à de nouvelles catégories sans refonte du catalogue.

## Marketplace fournisseurs
Les fournisseurs indirects ne reçoivent jamais un accès administrateur global. Ils disposent d'un compte partenaire séparé et limité à leur périmètre :
- gestion de leurs produits
- prix et stock
- photos et descriptions
- suivi de leurs ventes

Un produit fournisseur passe par un workflow de validation avant publication (`PENDING` → `APPROVED`, avec possibilité de refus/désactivation). L'administrateur garde le contrôle sur les fournisseurs, les commissions, les validations et les commandes globales.

## Règles
Le navigateur n'est jamais la source de vérité pour le prix, le stock ou le total d'une commande. Le serveur relit les produits depuis PostgreSQL, verrouille les lignes concernées pendant la création de commande et recalcule le total.

Les secrets restent côté serveur et les intégrations externes (paiements, IA réelle, WhatsApp) utilisent des variables d'environnement.

## Évolution prévue
Paiements Wave/Orange Money, livraison configurable par zone, notifications, avis vérifiés, favoris, recommandations, assistant shopping IA, recherche vocale, comptes clients, programme de fidélité, alertes, packs et application mobile peuvent être ajoutés sans changer le cœur catalogue/commande.

## État actuel
La boutique, l'API, PostgreSQL, le panier, le checkout, le suivi et une administration protégée constituent la base V2. Les univers Food/Travel et la fondation marketplace fournisseurs sont maintenant pris en compte dans l'architecture. Les connexions externes réelles et les paramètres de production restent à configurer avant le lancement public.
