(() => {
  window.EgonarPlatformConfig = Object.freeze({
    version: 1,
    languages: Object.freeze(['fr', 'en']),
    defaultLanguage: 'fr',
    platforms: Object.freeze({
      marketplace: Object.freeze({
        label: 'Egonar AI',
        bodyClass: '',
        placeholder: 'Rechercher avec Egonar AI…',
        intro: 'Décrivez naturellement ce que vous cherchez.',
        suggestions: Object.freeze([
          ['🎁', 'Cadeau femme à moins de 25 000 FCFA'],
          ['📱', 'Smartphone à moins de 100 000 FCFA'],
          ['👔', 'Tenue homme élégante'],
          ['🎂', 'Idée cadeau pour anniversaire'],
          ['🏠', 'Décoration maison moderne'],
          ['💄', 'Beauté à petit prix'],
          ['🎧', 'Accessoire Tech tendance'],
          ['👶', 'Produits bébé essentiels']
        ])
      }),
      food: Object.freeze({
        label: 'Saveurs AI',
        bodyClass: 'food-page',
        placeholder: 'Décrivez ce que vous voulez manger…',
        intro: 'Recherchez un plat, restaurant ou produit alimentaire.',
        suggestions: Object.freeze([
          ['🐟', 'Poisson frais ce soir'],
          ['🍛', 'Repas à Dakar'],
          ['🍽️', 'Restaurant à Dakar'],
          ['🥘', 'Plat sénégalais pour 4 personnes'],
          ['🥤', 'Déjeuner rapide à Dakar'],
          ['🎉', 'Menu pour une fête']
        ])
      }),
      travel: Object.freeze({
        label: 'Évasion AI',
        bodyClass: 'travel-page',
        placeholder: 'Décrivez votre prochaine évasion…',
        intro: 'Recherchez un hôtel, séjour, activité ou transfert.',
        suggestions: Object.freeze([
          ['🏨', 'Hôtel à Dakar'],
          ['🌴', 'Week-end au Sénégal'],
          ['🗿', 'Activité à Gorée'],
          ['🏖️', 'Séjour détente au Sénégal'],
          ['🚗', 'Transfert aéroport Dakar'],
          ['🎒', 'Voyage petit budget']
        ])
      })
    })
  });
})();
