# EgonarMarket — architecture

## Objectif
Plateforme e-commerce Sénégal, mobile-first, conçue pour évoluer vers la sous-région.

## Structure
- `apps/web/` : interface boutique, panier, checkout, suivi et administration
- `apps/api/` : API Express, authentification admin, catalogue, commandes et recherche intelligente
- `db/` : schéma PostgreSQL
- `.env.example` : variables d'environnement
- `.github/workflows/ci.yml` : validation automatique du JavaScript

## Règles
Le navigateur n'est jamais la source de vérité pour le prix, le stock ou le total d'une commande. Le serveur relit les produits depuis PostgreSQL, verrouille les lignes concernées pendant la création de commande et recalcule le total.

Les secrets restent côté serveur et les intégrations externes (paiements, IA réelle, WhatsApp) utilisent des variables d'environnement.

## Évolution prévue
Paiements Wave/Orange Money, livraison configurable par zone, notifications, avis vérifiés, favoris, recommandations, assistant shopping IA, recherche vocale et application mobile peuvent être ajoutés sans changer le cœur catalogue/commande.

## État actuel
La boutique, l'API, PostgreSQL, le panier, le checkout, le suivi et une administration protégée constituent la base V2. Les connexions externes réelles et les paramètres de production restent à configurer avant le lancement public.
