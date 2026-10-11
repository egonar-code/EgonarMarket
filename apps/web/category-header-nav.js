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
      ['Restaurants','🍽️','Restaurants et tables partenaires'],['Thiéboudienne','🇸🇳','Le plat national : riz au poisson, légumes et tradition sénégalaise'],['Plats sénégalais','🇸🇳','Thiéboudienne, yassa, mafé…'],
      ['Fast-Food','🍔','Burgers, tacos, pizzas et menus'],['Petit-déjeuner & Brunch','🥐','Petit-déjeuner et brunch'],
      ['Boissons','🥤','Jus, cafés et boissons fraîches'],['Desserts & Pâtisseries','🍰','Desserts et pâtisseries'],
      ['Épicerie','🛒','Produits d’épicerie'],['Fruits & Légumes','🥬','Produits frais et de saison'],
      ['Boucherie & Poissonnerie','🐟','Viandes et produits de la mer'],['Traiteur & Événementiel','🎉','Traiteurs et événements'],
      ['Cuisine maison','👩🏾‍🍳','Plats préparés à la maison'],['Plats & Menus','🍲','Plats, menus et formules à partager'],
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
    'Tourisme & Culture':'/assets/user-evasion-monument.jpg',
    'Restaurants & Gastronomie':'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
    'Transport & Mobilité':'https://cdn.generationvoyage.fr/2025/03/Aeroport-International-Blaise-Diagne-au-Senegal.jpeg',
    'Billetterie & Événements':'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=85',
    'Voyages organisés':'https://accro-baobab.com/local/cache-gd2/df/028329cc0b22b877909cc27b322e68.jpg?1788625736=',
    'Lune de miel & Romantique':'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85',
    'Famille':'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=900&q=85',
    'Business & Séminaires':'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',
    'Bien-être':'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85',
    'Destinations':'https://commons.wikimedia.org/wiki/Special:FilePath/DindefeloFalls_01.jpg?width=1200',
    'Se faire livrer':'https://images.pexels.com/photos/8988463/pexels-photo-8988463.jpeg?auto=compress&cs=tinysrgb&w=900'
  };
  const FALLBACKS = {MARKET:'/assets/egonar-market-fallback.svg',SAVEURS:'/assets/egonar-saveurs-fallback.svg',EVASION:'/assets/egonar-evasion-fallback.svg'};
  const fallbackForUniverse = () => FALLBACKS[currentUniverse()] || FALLBACKS.MARKET;
  const FALLBACK = '/assets/egonar-evasion-fallback.svg';

  const USER_ASSETS = {
    'Thiéboudienne':'/assets/user-saveurs-thieboudienne.jpg',
    'Plats sénégalais':'/assets/user-saveurs-thieboudienne.jpg',
    'Plats & Menus':'/assets/user-saveurs-plats-menus.jpg',
    'Épicerie':'https://images.unsplash.com/photo-1604719312566-8912e9c8a213?auto=format&fit=crop&w=900&q=85',
    'Se faire livrer':'/assets/user-saveurs-delivery.png',
    'Tourisme & Culture':'/assets/user-evasion-monument.jpg'
  };
  const IMAGE_FALLBACKS = {
    'Thiéboudienne':'https://upload.wikimedia.org/wikipedia/commons/5/51/Thieboudienne.JPG',
    'Plats sénégalais':'https://upload.wikimedia.org/wikipedia/commons/5/51/Thieboudienne.JPG',
    'Plats & Menus':'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85',
    'Épicerie':'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=900&q=85',
    'Se faire livrer':'https://images.pexels.com/photos/8988463/pexels-photo-8988463.jpeg?auto=compress&cs=tinysrgb&w=900',
    'Tourisme & Culture':'https://commons.wikimedia.org/wiki/Special:Redirect/file/African%20Renaissance%20Monument%20%285502494604%29.jpg'
  };


  const currentUniverse = () => String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
  const SERVER_CATEGORIES = {};
  async function loadServerCategories(universe) {
    try {
      const response = await fetch('/api/categories?universe=' + encodeURIComponent(universe), { headers: { Accept: 'application/json' } });
      if (!response.ok) return;
      const rows = await response.json();
      if (Array.isArray(rows) && rows.length) SERVER_CATEGORIES[universe] = rows.map(row => [row.name, row.icon || '•', row.description || '', row.image_url || '']);
    } catch {}
  }

  function injectStyles() {
    if (document.getElementById('egonar-category-premium-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-category-premium-style';
    style.textContent = `
      #categories.egonar-category-hub{width:min(1480px,calc(100% - 48px));padding:30px 0 36px}
      #categories.egonar-category-hub .egonar-category-shell{background:transparent}
      .egonar-category-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:20px}
      .egonar-category-kicker{display:block;font-size:12px;font-weight:900;letter-spacing:.16em;color:#1675d1;margin-bottom:7px}
      .egonar-category-heading h2{margin:0 0 7px;font-size:clamp(32px,4vw,46px);letter-spacing:-.045em;color:#102a52}
      .egonar-category-heading p{margin:0;color:#365778;font-size:17px;line-height:1.45}
      .egonar-category-all-link{border:1px solid #0875ed;background:#fff;color:#0875ed;border-radius:999px;padding:13px 19px;font-weight:850;white-space:nowrap;cursor:pointer}
      .egonar-featured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .egonar-featured-category{position:relative;min-height:280px;border:0;border-radius:19px;overflow:hidden;padding:0;background:#e8f2f9;color:#fff;cursor:pointer;display:flex;align-items:stretch;text-align:left;box-shadow:0 10px 26px rgba(15,43,71,.12);isolation:isolate;transition:transform .2s,box-shadow .2s}
      .egonar-featured-category:hover{transform:translateY(-3px);box-shadow:0 18px 34px rgba(15,43,71,.2)}
      .egonar-featured-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;transition:transform .5s}
      .egonar-featured-category:hover .egonar-featured-photo{transform:scale(1.06)}
      .egonar-featured-shade{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(3,20,37,.02) 10%,rgba(3,20,37,.12) 38%,rgba(2,10,18,.88) 100%)}
      .egonar-featured-badge{position:absolute;top:13px;right:13px;padding:8px 11px;border-radius:999px;background:rgba(5,28,53,.82);font-size:12px;font-weight:850;backdrop-filter:blur(8px)}
      .egonar-featured-brand{position:absolute;left:15px;bottom:83px;width:43px;height:43px;border-radius:14px;background:#fff;color:#0875ed;display:grid;place-items:center;font-size:23px;box-shadow:0 4px 14px #001c3430}
      .egonar-featured-copy{position:absolute;left:16px;right:52px;bottom:15px;display:flex;flex-direction:column;gap:4px;min-width:0}
      .egonar-featured-copy strong{font-size:19px;line-height:1.15;color:#fff;text-shadow:0 1px 6px #0008}
      .egonar-featured-copy small{font-size:13px;line-height:1.35;color:#fff}
      .egonar-featured-arrow{position:absolute;right:13px;bottom:18px;width:38px;height:38px;border-radius:50%;background:#fff;color:#092e5b;display:grid;place-items:center;font-size:25px;font-weight:800}
      .egonar-all-categories-wrap{margin-top:16px}
      .egonar-all-categories-toggle{width:100%;padding:16px;border:1px solid #d8e7f5;border-radius:15px;background:#f4f9ff;color:#12538a;font-size:15px;font-weight:900;cursor:pointer}
      .egonar-all-categories-toggle span{margin-left:8px}
      .egonar-all-categories-panel{padding-top:14px}
      .egonar-all-categories-panel[hidden]{display:none!important}
      .egonar-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .egonar-category-item{appearance:none;border:1px solid #e1eaf1;background:#fff;color:#172b40;border-radius:16px;min-height:100px;padding:11px 13px;text-align:left;cursor:pointer;display:grid;grid-template-columns:88px 1fr auto;gap:14px;align-items:center;transition:transform .16s,box-shadow .16s,border-color .16s}
      .egonar-category-item:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.07);border-color:#b9d8f2}
      .egonar-category-photo{width:88px;height:78px;border-radius:12px;object-fit:cover;display:block;background:#eef3f6}
      .egonar-category-name{display:block;font-size:16px;font-weight:900;line-height:1.2;color:#142e4b}
      .egonar-category-desc{display:block;color:#536b7f;font-size:13px;line-height:1.4;margin-top:5px}
      .egonar-category-go{font-size:25px;color:#0875ed;padding:0 4px}
      @media(max-width:1050px){.egonar-featured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.egonar-featured-category{min-height:250px}}
      @media(max-width:650px){#categories.egonar-category-hub{width:min(100% - 24px,1480px)}.egonar-category-heading{align-items:flex-start;flex-direction:column}.egonar-category-heading h2{font-size:31px}.egonar-category-heading p{font-size:15px}.egonar-featured-grid{grid-template-columns:1fr 1fr;gap:9px}.egonar-featured-category{min-height:225px}.egonar-featured-copy{right:43px;left:11px;bottom:12px}.egonar-featured-copy strong{font-size:15px}.egonar-featured-copy small{font-size:11px}.egonar-featured-brand{left:11px;bottom:77px;width:36px;height:36px;font-size:20px}.egonar-featured-badge{top:9px;right:9px;font-size:10px;padding:6px 8px}.egonar-featured-arrow{right:8px;bottom:10px;width:30px;height:30px;font-size:20px}.egonar-category-grid{grid-template-columns:1fr}.egonar-category-item{grid-template-columns:76px 1fr auto;min-height:90px;gap:11px}.egonar-category-photo{width:76px;height:68px}.egonar-category-name{font-size:15px}.egonar-category-desc{font-size:12px}}
      @media(max-width:380px){.egonar-featured-grid{grid-template-columns:1fr}.egonar-featured-category{min-height:230px}}
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

  function makeItem([label,icon,description,imageUrl]) {
    const item=document.createElement('button');
    item.type='button';
    item.className='egonar-category-item'+(label==='Se faire livrer'?' egonar-delivery-category':'');
    const photo=document.createElement('img');
    photo.className='egonar-category-photo';
    photo.src=imageUrl||USER_ASSETS[label]||FEATURED_IMAGES[label]||IMAGES[label]||fallbackForUniverse();
    photo.alt=label;
    photo.loading='lazy';
    photo.decoding='async';
    photo.addEventListener('error',()=>{photo.onerror=null;photo.src=IMAGE_FALLBACKS[label]||fallbackForUniverse();},{once:true});
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
      ['Plats & Menus','🍲','Plats & Menus','Formules, menus familiaux et plats à partager.']
    ],
    EVASION:[
      ['Hôtels','🏨','Hôtels au Sénégal','Séjours confortables et adresses sélectionnées au Sénégal et ailleurs.'],
      ['Transport & Mobilité','🚘','Transferts','AIBD et déplacements pour simplifier votre voyage.'],
      ['Excursions','🏜️','Activités & Excursions','Quads, balades en chameau, visites et expériences locales.'],
      ['Plages & Resorts','🌴','Séjours & Plages','Détente, soleil et escapades au bord de l’eau.'],
      ['Voyages organisés','🔭','Circuits','Agrobaobab, culture, nature et itinéraires organisés.'],
      ['Au Sénégal','🇸🇳','Au Sénégal','Dakar, Saly, Petite Côte, Casamance, Saint-Louis et plus.'],
      ['Sous-région','🌿','Sous-région','Chutes de Dindéfelo, Guinée-Bissau, Cap-Vert et découvertes.'],
      ['International','🌍','International','Préparez vos prochaines destinations dans le monde entier.']
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
    'Thiéboudienne':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Senegalese%20Thieboudienne.JPG',
    'Plats sénégalais':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Senegalese%20Thieboudienne.JPG',
    'Fast-Food':'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    'Petit-déjeuner & Brunch':'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=85',
    'Boissons':'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85',
    'Desserts & Pâtisseries':'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85',
    'Épicerie':'https://commons.wikimedia.org/wiki/Special:Redirect/file/Senegalese%20Thieboudienne.JPG',
    'Fruits & Légumes':'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85',
    'Boucherie & Poissonnerie':'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=85',
    'Traiteur & Événementiel':'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85',
    'Cuisine maison':'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
    'Plats & Menus':'https://storage.googleapis.com/skai-imagegen/_/2024/09/13/01J7PC4D3N07K9ACZB3MYQ1TV1',
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
    'International':'https://images.unsplash.com/photo-1752886355870-17e8ebe79a05?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=1200',

    'Hôtels au Sénégal':'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85',
    'Transferts':'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=900&q=85',
    'Activités & Excursions':'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=900&q=85',
    'Séjours & Plages':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
    'Circuits':'https://accro-baobab.com/local/cache-gd2/df/028329cc0b22b877909cc27b322e68.jpg',
    'Au Sénégal':'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=900&q=85',
    'Sous-région':'https://commons.wikimedia.org/wiki/Special:FilePath/DindefeloFalls_01.jpg?width=1200',
    'International':'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=900&q=85',
    'Hôtels':'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85',
    'Excursions':'https://location-quad-lacrose.com/wp-content/uploads/2019/07/3.jpg',
    'Voyages organisés':'https://accro-baobab.com/local/cache-gd2/df/028329cc0b22b877909cc27b322e68.jpg',
    'Destinations':'https://www.directtriphub.com/static/images/places/1676/chutes-de-dindefelo/main.jpg'
  };
  const FEATURED_BADGES = {'Hôtels':'＋ 1 200 hôtels','Transferts':'＋ 200 transferts','Activités & Expériences':'＋ 350 activités','Excursions':'＋ 350 activités','Plages & Resorts':'＋ 500 séjours','Séjours & Plages':'＋ 500 séjours','Voyages organisés':'＋ 150 circuits','Circuits':'＋ 150 circuits','Au Sénégal':'＋ 300 offres','Sous-région':'＋ 250 destinations','Destinations':'＋ 250 destinations','International':'＋ 1 000 destinations','Mode & Vêtements':'Sélection mode','Téléphones & Accessoires':'High-tech','Maison & Décoration':'Maison','Thiéboudienne':'Cuisine sénégalaise','Restaurants':'Adresses gourmandes','Fast-Food':'Menus','Fruits & Légumes':'Produits frais','Se faire livrer':'Livraison rapide','Plats & Menus':'Menus à partager'};
  function makeFeaturedItem([key,icon,title,description]) {
    const item=document.createElement('button');
    item.type='button';
    item.className='egonar-featured-category';
    const photo=document.createElement('img');
    photo.className='egonar-featured-photo';
    photo.src=FEATURED_IMAGES[title]||FEATURED_IMAGES[key]||FEATURED_IMAGES[title.replace(' au Sénégal','')]||FALLBACK;
    photo.alt=title;
    photo.loading='lazy';
    photo.decoding='async';
    photo.addEventListener('error',()=>{photo.onerror=null;photo.src=fallbackForUniverse();},{once:true});
    const shade=document.createElement('span');shade.className='egonar-featured-shade';shade.setAttribute('aria-hidden','true');
    const badge=document.createElement('span');badge.className='egonar-featured-badge';badge.textContent=FEATURED_BADGES[title]||'À découvrir';
    const brand=document.createElement('span');brand.className='egonar-featured-brand';brand.textContent=icon;
    const copy=document.createElement('span');copy.className='egonar-featured-copy';
    copy.innerHTML='<strong>'+title+'</strong><small>'+description+'</small>';
    const arrow=document.createElement('span');arrow.className='egonar-featured-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');
    item.append(photo,shade,badge,brand,copy,arrow);
    item.title='Explorer '+title;
    item.addEventListener('click',()=>activate(key));
    return item;
  }
  function makeShell() {
    const universe=currentUniverse();
    const meta=META[universe]||META.MARKET;
    const categories=SERVER_CATEGORIES[universe]||DATA[universe]||[];
    const featured=FEATURED_BY_UNIVERSE[universe]||[];
    const shell=document.createElement('div'); shell.className='egonar-category-shell';
    shell.innerHTML='<div class="egonar-category-heading"><div><span class="egonar-category-kicker">'+meta[1]+'</span><h2>Toutes nos catégories</h2><p>'+meta[3]+'</p></div><button type="button" class="egonar-category-all-link">Voir toutes les offres →</button></div>';\n    shell.querySelector('.egonar-category-all-link').addEventListener('click',()=>{const target=document.getElementById(universe==='MARKET'?'produits':universe==='SAVEURS'?'explorer':'sejours')||document.getElementById('travel-smart-results');target?.scrollIntoView({behavior:'smooth',block:'start'});});
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

  async function start() {
    cleanupLegacy();
    const universe=currentUniverse();
    await loadServerCategories(universe);
    const build=()=>{const section=ensureSection();if(!section)return false;injectStyles();section.classList.add('egonar-category-hub');section.querySelector('.egonar-category-shell')?.remove();section.appendChild(makeShell());return true;};
    if(build())return;
    const observer=new MutationObserver(()=>{if(build())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();