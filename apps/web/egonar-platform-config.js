(() => {
  window.EgonarPlatformConfig = Object.freeze({
    version: 2,
    languages: Object.freeze(['fr', 'en']),
    defaultLanguage: 'fr',
    platforms: Object.freeze({
      marketplace: Object.freeze({
        label: 'Egonar AI', bodyClass: '',
        placeholder: { fr:'Rechercher avec Egonar AI…', en:'Search with Egonar AI…' },
        intro: { fr:'Décrivez naturellement ce que vous cherchez.', en:'Describe naturally what you are looking for.' },
        suggestions: Object.freeze({fr:Object.freeze([['🎁','Cadeau femme à moins de 25 000 FCFA'],['📱','Smartphone à moins de 100 000 FCFA'],['👔','Tenue homme élégante'],['🎂','Idée cadeau pour anniversaire'],['🏠','Décoration maison moderne'],['💄','Beauté à petit prix'],['🎧','Accessoire Tech tendance'],['👶','Produits bébé essentiels']]),en:Object.freeze([['🎁','Women’s gift under 25,000 FCFA'],['📱','Smartphone under 100,000 FCFA'],['👔','Elegant men’s outfit'],['🎂','Birthday gift idea'],['🏠','Modern home decor'],['💄','Affordable beauty products'],['🎧','Trending tech accessory'],['👶','Baby essentials']])})
      }),
      food: Object.freeze({
        label: 'Saveurs AI', bodyClass: 'food-page',
        placeholder: { fr:'Décrivez ce que vous voulez manger…', en:'Describe what you want to eat…' },
        intro: { fr:'Recherchez un plat, restaurant ou produit alimentaire.', en:'Search for a dish, restaurant or food product.' },
        suggestions: Object.freeze({fr:Object.freeze([['🐟','Poisson frais ce soir'],['🍛','Repas à Dakar'],['🍽️','Restaurant à Dakar'],['🥘','Plat sénégalais pour 4 personnes'],['🥤','Déjeuner rapide à Dakar'],['🎉','Menu pour une fête']]),en:Object.freeze([['🐟','Fresh fish tonight'],['🍛','Meal in Dakar'],['🍽️','Restaurant in Dakar'],['🥘','Senegalese meal for 4 people'],['🥤','Quick lunch in Dakar'],['🎉','Menu for a celebration']])})
      }),
      travel: Object.freeze({
        label: 'Évasion AI', bodyClass: 'travel-page',
        placeholder: { fr:'Décrivez votre prochaine évasion…', en:'Describe your next getaway…' },
        intro: { fr:'Recherchez un hôtel, séjour, activité ou transfert.', en:'Search for a hotel, stay, activity or transfer.' },
        suggestions: Object.freeze({fr:Object.freeze([['🏨','Hôtel à Dakar'],['🌴','Week-end au Sénégal'],['🗿','Activité à Gorée'],['🏖️','Séjour détente au Sénégal'],['🚗','Transfert aéroport Dakar'],['🎒','Voyage petit budget']]),en:Object.freeze([['🏨','Hotel in Dakar'],['🌴','Weekend in Senegal'],['🗿','Activity in Gorée'],['🏖️','Relaxing stay in Senegal'],['🚗','Dakar airport transfer'],['🎒','Budget trip']])})
      })
    })
  });
})();