(() => {
  'use strict';

  const DATA = {
    MARKET: [
      ['Mode & Vêtements','👕','Mode, vêtements et style'],['Téléphones & Accessoires','📱','Smartphones et accessoires'],
      ['Informatique & Électronique','💻','PC, audio, TV et électronique'],['Maison & Décoration','🏠','Maison, meubles et décoration'],
      ['Électroménager','⚡','Équipements du quotidien'],['Beauté & Soins','✨','Beauté, parfums et soins'],
      ['Bébé & Enfant','🧸','Bébé, enfants et puériculture'],['Sports & Loisirs','⚽','Sport, jeux et loisirs'],
      ['Alimentation & Épicerie','🛒','Alimentation et essentiels'],['Supermarché & Quotidien','🧺','Courses du quotidien'],
      ['Accessoires & Maroquinerie','👜','Sacs et accessoires'],['Auto & Moto','🚗','Auto, moto et accessoires'],
      ['Bricolage & Jardin','🛠️','Outils et jardin'],['Bureau & Fournitures','📚','Bureau et fournitures'],
      ['Livres, Culture & Éducation','📖','Livres, culture et apprentissage'],['Produits locaux & Artisanat','🎨','Créations et savoir-faire locaux'],
      ['Services','🤝','Services de nos partenaires']
    ],
    SAVEURS: [
      ['Restaurants','🍽️','Restaurants et tables partenaires'],['Plats sénégalais','🇸🇳','Thiéboudienne, yassa, mafé…'],
      ['Fast-Food','🍔','Burgers, tacos, pizzas et menus'],['Petit-déjeuner & Brunch','🥐','Petit-déjeuner et brunch'],
      ['Boissons','🥤','Jus, cafés et boissons fraîches'],['Desserts & Pâtisseries','🍰','Desserts et pâtisseries'],
      ['Épicerie','🛒','Produits d’épicerie'],['Fruits & Légumes','🥬','Produits frais et de saison'],
      ['Boucherie & Poissonnerie','🐟','Viandes et produits de la mer'],['Traiteur & Événementiel','🎉','Traiteurs et événements'],
      ['Cuisine maison','👩🏾‍🍳','Plats préparés à la maison'],['Offres & Menus','🔥','Promotions, formules et menus'],
      ['Se faire livrer','🛵','Commande et livraison de repas à domicile']
    ],
    EVASION: [
      ['Hôtels','🏨','Hébergements, hôtels et resorts'],['Appartements & Locations','🏡','Appartements, villas et locations'],
      ['Résidences & Maisons d’hôtes','🛏️','Maisons d’hôtes, résidences et lodges'],['Plages & Resorts','🏝️','Plages, resorts, piscines et détente'],
      ['Excursions','🧭','Sorties, quads, balades à dos de chameau et visites guidées'],['Activités & Expériences','🎟️','Quad, dromadaire, jet-ski, surf, kayak et loisirs'],
      ['Tourisme & Culture','🕌','Patrimoine, musées et découvertes'],['Restaurants & Gastronomie','🍴','Tables, dégustations et gastronomie'],
      ['Transport & Mobilité','🚐','Transferts, chauffeurs et location de voiture'],['Billetterie & Événements','🎫','Concerts, festivals et spectacles'],
      ['Voyages organisés','🗺️','Circuits Sénégal, nature, culture et itinéraires organisés'],['Lune de miel & Romantique','💍','Escapades, couples et lune de miel'],
      ['Famille','👨‍👩‍👧','Séjours et sorties pour toute la famille'],['Business & Séminaires','💼','Hôtels business, salles et séminaires'],
      ['Bien-être','🧘🏾','Spa, massages, hammam et détente'],['Destinations','🌍','Sénégal, sous-région et destinations internationales']
    ]
  };

  const META = {
    MARKET:['🛍️','MARKET','TOUTES NOS CATÉGORIES','Trouvez rapidement les produits du quotidien, de la mode, de la maison et de la technologie.'],
    SAVEURS:['🍽️','SAVEURS','TOUTES NOS CATÉGORIES','Restaurants, plats, produits frais et gourmandises réunis dans un même univers.'],
    EVASION:['✈️','ÉVASION','TOUTES NOS CATÉGORIES','Explorez chaque univers du voyage et trouvez rapidement le séjour, l’activité ou le service qui vous correspond.']
  };

  const IMAGES = {
    'Hôtels':'https://n-106-2.cdn.redgalaxy.com/scale/o2/TUI/hotels/DSS03010/S24/28839869.jpg?dsth=644.0795159896282&dstw=1200&quality=80&srch=621&srcmode=3&srcw=1157&srcx=1%2F2&srcy=1%2F2&type=1',
    'Appartements & Locations':'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=85',
    'Résidences & Maisons d’hôtes':'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=85',
    'Plages & Resorts':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
    'Excursions':'https://location-quad-lacrose.com/wp-content/uploads/2019/07/3.jpg',
    'Activités & Expériences':'https://www.lac-rose-excursion.com/_next/image?q=75&url=%2Fexcursions%2Fchameaux.jpg&w=3840',
    'Tourisme & Culture':'https://images.locationscout.net/2024/04/monument-de-la-renaissance-africaine-dakar-senegal-senegal-p5yx.webp?h=1400&q=80',
    'Restaurants & Gastronomie':'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
    'Transport & Mobilité':'https://cdn.generationvoyage.fr/2025/03/Aeroport-International-Blaise-Diagne-au-Senegal.jpeg',
    'Billetterie & Événements':'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=85',
    'Voyages organisés':'https://accro-baobab.com/local/cache-gd2/df/028329cc0b22b877909cc27b322e68.jpg?1788625736=',
    'Lune de miel & Romantique':'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85',
    'Famille':'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=900&q=85',
    'Business & Séminaires':'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',
    'Bien-être':'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85',
    'Destinations':'https://www.directtriphub.com/static/images/places/1676/chutes-de-dindefelo/main.jpg',
    'Se faire livrer':'https://st5.depositphotos.com/1683796/62033/i/450/depositphotos_620339650-stock-photo-woman-paying-food-order-credit.jpg'
  };
  const FALLBACK = '/assets/egonar-evasion-fallback.svg';

  const currentUniverse = () => String(document.body?.dataset?.universe || 'MARKET').toUpperCase();

  function injectStyles() {
    if (document.getElementById('egonar-category-premium-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-category-premium-style';
    style.textContent = `
      #categories.egonar-category-hub{width:min(1280px,calc(100% - 32px));padding-top:34px;padding-bottom:34px}
      .egonar-category-shell{background:#fff;border-radius:28px}
      .egonar-category-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:20px}
      .egonar-category-heading h2{margin:5px 0;font-size:clamp(32px,4vw,46px);letter-spacing:-.045em;color:#122c52}
      .egonar-category-heading p{margin:0;color:#41607c;font-size:16px;line-height:1.45}
      .egonar-category-all-link{border:1px solid #1680ff;background:#fff;color:#0875ed;border-radius:999px;padding:12px 18px;font-weight:850;white-space:nowrap;cursor:pointer}
      .egonar-featured-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .egonar-featured-category{position:relative;min-height:68px;border:1px solid #e6edf2;border-radius:16px;overflow:hidden;padding:11px 13px;background:#fff;color:#172f43;cursor:pointer;display:grid;grid-template-columns:34px 1fr 26px;gap:10px;align-items:center;text-align:left;box-shadow:0 7px 18px rgba(23,83,112,.05);transition:transform .16s,box-shadow .16s,border-color .16s}
      .egonar-featured-category:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(23,83,112,.1);border-color:#b9d7e8}
      .egonar-featured-brand{width:34px;height:34px;border-radius:10px;background:#f0f6fa;display:grid;place-items:center;font-size:17px}
      .egonar-featured-copy{display:flex;flex-direction:column;gap:3px;min-width:0}
      .egonar-featured-copy strong{font-size:13px;line-height:1.15;color:#163a55}
      .egonar-featured-copy small{font-size:10.5px;line-height:1.3;color:#6d8190}
      .egonar-featured-arrow{width:26px;height:26px;border-radius:50%;background:#eef7fb;color:#14527d;display:grid;place-items:center;font-size:18px;font-weight:900}
      .egonar-all-categories-wrap{margin-top:16px}
      .egonar-all-categories-toggle{width:100%;padding:14px;border:1px solid #dce8f2;border-radius:15px;background:#f7fbff;color:#14527d;font-weight:850;cursor:pointer}
      .egonar-all-categories-toggle span{margin-left:8px}
      .egonar-all-categories-panel{padding-top:12px}
      .egonar-all-categories-panel[hidden]{display:none!important}
      .egonar-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .egonar-category-item{appearance:none;border:1px solid #e8e8ea;background:#fff;color:#171717;border-radius:15px;min-height:78px;padding:10px 12px;text-align:left;cursor:pointer;display:grid;grid-template-columns:78px 1fr auto;gap:12px;align-items:center;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
      .egonar-category-item:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(0,0,0,.06);border-color:#cfe0ea}
      .egonar-category-photo{width:78px;height:64px;border-radius:11px;object-fit:cover;display:block;background:#eef3f6}
      .egonar-category-name{display:block;font-size:14px;font-weight:900;line-height:1.2}
      .egonar-category-desc{display:block;color:#777;font-size:11px;line-height:1.35;margin-top:4px}
      .egonar-category-go{font-size:21px;color:#8a8a8a;padding:0 3px}
      @media(max-width:900px){#categories.egonar-category-hub{width:min(100% - 24px,1280px)}.egonar-featured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.egonar-category-grid{grid-template-columns:1fr}}
      @media(max-width:560px){.egonar-category-heading{align-items:flex-start;flex-direction:column}.egonar-featured-grid{grid-template-columns:1fr}.egonar-category-heading h2{font-size:31px}.egonar-featured-category{min-height:62px}.egonar-category-item{grid-template-columns:64px 1fr auto}.egonar-category-photo{width:64px;height:58px}}
        `;
    document.head.appendChild(style);
  }

  function activate(label) {
    const input = document.querySelector('input[type="search"]#search,.food-search input[type="search"],.travel-search input[type="search"],input[type="search"]');
    const form = input?.closest('form');
    if (!input || !form) return;
    input.value = label;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    const target = document.getElementById('travel-smart-results') || document.getElementById('food-smart-results') || document.getElementById('produits') || document.getElementById('explorer');
    target?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function imageFor(label) {
    return IMAGES[label] || FALLBACK;
  }

  function makeItem([label,icon,description]) {
    const item=document.createElement('button');
    item.type='button';
    item.className='egonar-category-item';
    const photo=document.createElement('img');
    photo.className='egonar-category-photo';
    photo.src=FEATURED_IMAGES[label]||IMAGES[label]||FALLBACK;
    photo.alt=label;
    photo.loading='lazy';
    photo.decoding='async';
    photo.addEventListener('error',()=>{photo.onerror=null;photo.src=FALLBACK;},{once:true});
    const copy=document.createElement('span');
    copy.innerHTML='<span class="egonar-category-name">'+label+'</span><span class="egonar-category-desc">'+description+'</span>';
    const go=document.createElement('span');
    go.className='egonar-category-go';
    go.setAttribute('aria-hidden','true');
    go.textContent='›';
    item.append(photo,copy,go);
    item.title='Explorer '+label;
    item.addEventListener('click',()=>activate(label));
    return item;
  }

  const FEATURED_BY_UNIVERSE = {
    MARKET:[
      ['Mode & Vêtements','👕','Mode & Vêtements','Tenues, chaussures et style pour toute la famille.'],
      ['Téléphones & Accessoires','📱','Téléphones & Accessoires','Smartphones, coques, chargeurs et accessoires.'],
      ['Maison & Décoration','🏠','Maison & Décoration','Meubles, décoration et essentiels de la maison.'],
      ['Beauté & Soins','✨','Beauté & Soins','Parfums, maquillage, soins et cheveux.'],
      ['Bébé & Enfant','🧸','Bébé & Enfant','Puériculture, vêtements, jouets et essentiels.'],
      ['Produits locaux & Artisanat','🎨','Produits locaux & Artisanat','Créations sénégalaises et savoir-faire local.']
    ],
    SAVEURS:[
      ['Thiéboudienne','🇸🇳','Thiéboudienne','Le plat sénégalais mis à l’honneur sur Egonar Saveurs.'],
      ['Restaurants','🍽️','Restaurants','Adresses, menus et spécialités à découvrir.'],
      ['Fast-Food','🍔','Fast-Food','Burgers, tacos, pizzas, poulet et menus.'],
      ['Fruits & Légumes','🥬','Fruits & Légumes','Produits frais et paniers de saison.'],
      ['Se faire livrer','🛵','Se faire livrer','Commandez et recevez votre repas à domicile.'],
      ['Offres & Menus','🔥','Offres & Menus','Promotions, menus du jour et formules.']
    ],
    EVASION:[
      ['Hôtels','🏨','Hôtels au Sénégal','Hôtels et séjours sur la Petite Côte.'],
      ['Excursions','🏜️','Excursions','Quads, balades à dos de chameau, sorties et visites guidées.'],
      ['Activités & Expériences','🐪','Activités & Expériences','Dromadaire, quad, jet-ski, surf et expériences locales.'],
      ['Voyages organisés','🗺️','Circuits','Accrobaobab, nature, culture et circuits organisés au Sénégal.'],
      ['Destinations','🌿','Sous-région','Chutes de Dindéfelo et découvertes d’Afrique de l’Ouest.'],
      ['International','🌍','International','Paris, Rome, Dubaï, New York et grandes destinations du monde.']
    ]
  };  const FEATURED_IMAGES = {
    'Mode & Vêtements':'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85',
    'Téléphones & Accessoires':'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85',
    'Informatique & Électronique':'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
    'Maison & Décoration':'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85',
    'Électroménager':'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=85',
    'Beauté & Soins':'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
    'Bébé & Enfant':'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=85',
    'Sports & Loisirs':'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85',
    'Alimentation & Épicerie':'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85',
    'Supermarché & Quotidien':'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85',
    'Accessoires & Maroquinerie':'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85',
    'Auto & Moto':'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85',
    'Bricolage & Jardin':'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85',
    'Bureau & Fournitures':'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',
    'Livres, Culture & Éducation':'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=85',
    'Produits locaux & Artisanat':'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=900&q=85',
    'Services':'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=85',
    'Restaurants':'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
    'Thiéboudienne':'https://upload.wikimedia.org/wikipedia/commons/5/51/Thieboudienne.JPG',
    'Plats sénégalais':'https://upload.wikimedia.org/wikipedia/commons/5/51/Thieboudienne.JPG',
    'Fast-Food':'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    'Petit-déjeuner & Brunch':'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=85',
    'Boissons':'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85',
    'Desserts & Pâtisseries':'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85',
    'Épicerie':'https://cloudfront-eu-central-1.images.arcpublishing.com/le360/S2T4CJSHYBDVPPYWTMJIJSALVI.jpeg',
    'Fruits & Légumes':'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85',
    'Boucherie & Poissonnerie':'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=85',
    'Traiteur & Événementiel':'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85',
    'Cuisine maison':'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
    'Offres & Menus':'https://images.pexels.com/photos/15029878/pexels-photo-15029878.jpeg?auto=compress&cs=tinysrgb&w=900',
    'Se faire livrer':'https://images.pexels.com/photos/8988463/pexels-photo-8988463.jpeg?auto=compress&cs=tinysrgb&w=900',
    'Hôtels':'https://static.fram.fr/photos/vacances-senegal/dakar/vue-panoramique-jumbo-le-saly_849040_tgmob.jpg',
    'Appartements & Locations':'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=85',
    'Résidences & Maisons d’hôtes':'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=85',
    'Plages & Resorts':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
    'Excursions':'https://location-quad-lacrose.com/wp-content/uploads/2019/07/3.jpg',
    'Activités & Expériences':'https://www.lac-rose-excursion.com/_next/image?q=75&url=%2Fexcursions%2Fchameaux.jpg&w=3840',
    'Tourisme & Culture':'https://commons.wikimedia.org/wiki/Special:Redirect/file/African%20Renaissance%20Monument%20%285502494604%29.jpg',
    'Restaurants & Gastronomie':'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
    'Transport & Mobilité':'https://cdn.generationvoyage.fr/2025/03/Aeroport-International-Blaise-Diagne-au-Senegal.jpeg',
    'Billetterie & Événements':'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=85',
    'Voyages organisés':'https://accro-baobab.com/local/cache-gd2/df/028329cc0b22b877909cc27b322e68.jpg?1788625736=',
    'Lune de miel & Romantique':'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85',
    'Famille':'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=900&q=85',
    'Business & Séminaires':'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',
    'Bien-être':'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85',
    'Destinations':'https://www.directtriphub.com/static/images/places/1676/chutes-de-dindefelo/main.jpg',
    'International':'https://images.unsplash.com/photo-1752886355870-17e8ebe79a05?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200'
  };  function makeFeaturedItem([key,icon,title,description]) {
    const item=document.createElement('button');
    item.type='button';
    item.className='egonar-featured-category';
    const brand=document.createElement('span');
    brand.className='egonar-featured-brand';
    brand.textContent=icon;
    const copy=document.createElement('span');
    copy.className='egonar-featured-copy';
    copy.innerHTML='<strong>'+title+'</strong><small>'+description+'</small>';
    const arrow=document.createElement('span');
    arrow.className='egonar-featured-arrow';
    arrow.textContent='›';
    arrow.setAttribute('aria-hidden','true');
    item.append(brand,copy,arrow);
    item.title='Explorer '+title;
    item.addEventListener('click',()=>activate(key));
    return item;
  }
  function makeShell() {
    const universe=currentUniverse();
    const meta=META[universe]||META.MARKET;
    const categories=DATA[universe]||[];
    const featured=FEATURED_BY_UNIVERSE[universe]||[];
    const shell=document.createElement('div'); shell.className='egonar-category-shell';
    shell.innerHTML='<div class="egonar-category-heading"><div><span class="egonar-category-kicker">'+meta[1]+'</span><h2>Toutes nos catégories</h2><p>'+meta[3]+'</p></div><button type="button" class="egonar-category-all-link">Voir toutes les offres →</button></div>';
    const featuredGrid=document.createElement('div'); featuredGrid.className='egonar-featured-grid';
    featured.forEach(x=>featuredGrid.appendChild(makeFeaturedItem(x)));
    const allWrap=document.createElement('div'); allWrap.className='egonar-all-categories-wrap';
    const allToggle=document.createElement('button'); allToggle.type='button'; allToggle.className='egonar-all-categories-toggle'; allToggle.setAttribute('aria-expanded','false'); allToggle.innerHTML='Voir la liste des '+categories.length+' catégories '+meta[1]+' <span>⌄</span>';
    const allPanel=document.createElement('div'); allPanel.className='egonar-all-categories-panel'; allPanel.hidden=true;
    const grid=document.createElement('div'); grid.className='egonar-category-grid'; grid.setAttribute('role','list');
    categories.forEach(category=>{const item=makeItem(category);item.setAttribute('role','listitem');grid.appendChild(item);});
    allPanel.appendChild(grid);
    allToggle.addEventListener('click',()=>{const open=allPanel.hidden;allPanel.hidden=!open;allToggle.setAttribute('aria-expanded',String(open));});
    allWrap.append(allToggle,allPanel); shell.append(featuredGrid,allWrap); return shell;
  }

  function ensureSection() {
    let section=document.getElementById('categories');
    if(section)return section;
    const anchor=document.getElementById('explorer');
    if(!anchor)return null;
    section=document.createElement('section');
    section.id='categories';
    section.className='wrap section egonar-category-hub';
    section.innerHTML='<div class="section-head"><div><p class="eyebrow">EXPLORER</p><h2>Toutes nos catégories</h2></div></div>';
    anchor.parentNode.insertBefore(section,anchor);
    return section;
  }

  function cleanupLegacy() {
    document.getElementById('egonar-category-navigation')?.remove();
    document.getElementById('egonar-all-categories')?.remove();
    document.querySelector('.egonar-search-with-categories')?.classList.remove('egonar-search-with-categories');
  }

  function start() {
    cleanupLegacy();
    const build=()=>{const section=ensureSection();if(!section)return false;injectStyles();section.classList.add('egonar-category-hub');section.querySelector('.egonar-category-shell')?.remove();section.appendChild(makeShell());return true;};
    if(build())return;
    const observer=new MutationObserver(()=>{if(build())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();