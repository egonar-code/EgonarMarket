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
      ['Cuisine maison','👩🏾‍🍳','Plats préparés à la maison'],['Offres & Menus','🔥','Promotions, formules et menus']
    ],
    EVASION: [
      ['Hôtels','🏨','Hébergements, hôtels et resorts'],['Appartements & Locations','🏡','Appartements, villas et locations'],
      ['Résidences & Maisons d’hôtes','🛏️','Maisons d’hôtes, résidences et lodges'],['Plages & Resorts','🏝️','Plages, resorts, piscines et détente'],
      ['Excursions','🧭','Sorties, circuits et visites guidées'],['Activités & Expériences','🎟️','Quad, surf, kayak, culture et loisirs'],
      ['Tourisme & Culture','🕌','Patrimoine, musées et découvertes'],['Restaurants & Gastronomie','🍴','Tables, dégustations et gastronomie'],
      ['Transport & Mobilité','🚐','Transferts, chauffeurs et location de voiture'],['Billetterie & Événements','🎫','Concerts, festivals et spectacles'],
      ['Voyages organisés','🗺️','Circuits, packages et voyages accompagnés'],['Lune de miel & Romantique','💍','Escapades, couples et lune de miel'],
      ['Famille','👨‍👩‍👧','Séjours et sorties pour toute la famille'],['Business & Séminaires','💼','Hôtels business, salles et séminaires'],
      ['Bien-être','🧘🏾','Spa, massages, hammam et détente'],['Destinations','🌍','Sénégal, sous-région et destinations internationales']
    ]
  };

  const META = {
    EVASION:['✈️','ÉVASION','TOUTES NOS CATÉGORIES','Explorez chaque univers du voyage et trouvez rapidement le séjour, l’activité ou le service qui vous correspond.']
  };

  const IMAGES = {
    'Hôtels':'https://static.service-voyages.com/photos/vacances-senegal/saly/piscine-lagoon-movenpick-resort-lamantin-saly_823513_panobd.jpg',
    'Appartements & Locations':'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=85',
    'Résidences & Maisons d’hôtes':'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=85',
    'Plages & Resorts':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
    'Excursions':'https://www.au-senegal.com/local/cache-vignettes/L1200xH630/b3f2e790bf56a67dc7387f849428a2-5fcb9.png',
    'Activités & Expériences':'https://www.au-senegal.com/local/cache-vignettes/L1200xH630/b3f2e790bf56a67dc7387f849428a2-5fcb9.png',
    'Tourisme & Culture':'https://images.locationscout.net/2024/04/monument-de-la-renaissance-africaine-dakar-senegal-senegal-p5yx.webp?h=1400&q=80',
    'Restaurants & Gastronomie':'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
    'Transport & Mobilité':'https://cdn.generationvoyage.fr/2025/03/Aeroport-International-Blaise-Diagne-au-Senegal.jpeg',
    'Billetterie & Événements':'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=85',
    'Voyages organisés':'https://cdn.explorecams.com/storage/photos/3sgYkZPowv_1600.jpg',
    'Lune de miel & Romantique':'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=85',
    'Famille':'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=900&q=85',
    'Business & Séminaires':'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',
    'Bien-être':'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=85',
    'Destinations':'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=85'
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
      .egonar-featured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .egonar-featured-category{position:relative;min-height:205px;border:0;border-radius:20px;overflow:hidden;padding:0;text-align:left;color:#fff;cursor:pointer;background:#10283a;box-shadow:0 12px 28px rgba(23,83,112,.12);transition:transform .2s,box-shadow .2s}
      .egonar-featured-category:hover{transform:translateY(-4px);box-shadow:0 18px 38px rgba(23,83,112,.2)}
      .egonar-featured-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .egonar-featured-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.02) 15%,rgba(0,0,0,.82) 100%)}
      .egonar-featured-badge{position:absolute;left:15px;bottom:62px;width:45px;height:45px;border-radius:14px;background:#fff;color:#0875ed;display:grid;place-items:center;font-size:22px;box-shadow:0 6px 18px rgba(0,0,0,.14)}
      .egonar-featured-copy{position:absolute;left:16px;right:48px;bottom:16px;display:flex;flex-direction:column;gap:4px}
      .egonar-featured-copy strong{font-size:19px;line-height:1.1}
      .egonar-featured-copy small{font-size:12px;line-height:1.35;color:#fff}
      .egonar-featured-arrow{position:absolute;right:14px;bottom:14px;width:40px;height:40px;border-radius:50%;background:#fff;color:#122c52;display:grid;place-items:center;font-size:22px;font-weight:900}
      .egonar-all-categories-wrap{margin-top:16px}
      .egonar-all-categories-toggle{width:100%;padding:14px;border:1px solid #dce8f2;border-radius:15px;background:#f7fbff;color:#14527d;font-weight:850;cursor:pointer}
      .egonar-all-categories-toggle span{margin-left:8px}
      .egonar-all-categories-panel{padding-top:14px}
      .egonar-all-categories-panel[hidden]{display:none!important}
      .egonar-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .egonar-category-item{appearance:none;border:1px solid #e8e8ea;background:#fff;color:#171717;border-radius:17px;min-height:96px;padding:10px;text-align:left;cursor:pointer;display:grid;grid-template-columns:86px 1fr auto;gap:14px;align-items:center;transition:transform .16s ease,box-shadow .16s ease}
      .egonar-category-item:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(0,0,0,.08)}
      .egonar-category-photo{width:86px;height:76px;border-radius:12px;object-fit:cover;background:#f1f1f1;display:block}
      .egonar-category-name{display:block;font-size:16px;font-weight:900;line-height:1.2}
      .egonar-category-desc{display:block;color:#777;font-size:12px;line-height:1.4;margin-top:5px}
      .egonar-category-go{font-size:21px;color:#8a8a8a;padding:0 5px}
      @media(max-width:800px){#categories.egonar-category-hub{width:min(100% - 24px,1280px)}.egonar-featured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.egonar-category-grid{grid-template-columns:1fr}}
      @media(max-width:560px){.egonar-category-heading{align-items:flex-start;flex-direction:column}.egonar-featured-grid{grid-template-columns:1fr}.egonar-category-heading h2{font-size:31px}.egonar-featured-category{min-height:190px}}
      @media(max-width:800px){#categories.egonar-category-hub{width:min(100% - 24px,1280px)}.egonar-category-grid{grid-template-columns:1fr}.egonar-category-trigger{padding:18px}.egonar-category-panel{padding:17px}.egonar-category-brand{width:50px;height:50px}}
      @media(max-width:560px){.egonar-category-trigger{grid-template-columns:auto 1fr;gap:13px}.egonar-category-action{grid-column:1/-1;justify-content:center}.egonar-category-title{font-size:19px}.egonar-category-intro{font-size:12px}.egonar-category-toolbar{align-items:flex-start;flex-direction:column;gap:5px}.egonar-category-item{grid-template-columns:72px 1fr auto;min-height:88px;gap:11px}.egonar-category-photo{width:72px;height:64px}.egonar-category-name{font-size:15px}.egonar-category-desc{font-size:11px}}
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
    photo.src=imageFor(label);
    photo.alt='';
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

  const FEATURED = [
    ['Hôtels','🏨','Hôtels et séjours au Sénégal','Découvrez des adresses au Sénégal, notamment sur la Petite Côte.'],
    ['Transport & Mobilité','🚐','Transferts AIBD & mobilité','Arrivez, partez et déplacez-vous facilement au Sénégal.'],
    ['Activités & Expériences','🏜️','Activités & Excursions','Quads, balades à dos de chameau, visites et expériences locales.'],
    ['Plages & Resorts','🏝️','Séjours & Plages','Soleil, plages, piscines et escapades au bord de l’Atlantique.'],
    ['Voyages organisés','🧭','Circuits & découvertes','Agrobaobab, nature, culture et itinéraires organisés.'],
    ['Tourisme & Culture','🇸🇳','Au Sénégal','Dakar, Saly, Petite Côte, Casamance, Saint-Louis et plus.'],
    ['Destinations','🌿','Sous-région','Dindéfelo, Afrique de l’Ouest et grandes découvertes régionales.'],
    ['International','🌍','International','Paris, Dubaï, Rome, New York et destinations du monde entier.']
  ];
  const FEATURED_IMAGES = {
    'Hôtels':IMAGES['Hôtels'],
    'Transport & Mobilité':IMAGES['Transport & Mobilité'],
    'Activités & Expériences':IMAGES['Activités & Expériences'],
    'Plages & Resorts':IMAGES['Plages & Resorts'],
    'Voyages organisés':IMAGES['Voyages organisés'],
    'Tourisme & Culture':IMAGES['Tourisme & Culture'],
    'Destinations':'https://img.geocaching.com/cache/large/b4a78f15-ae41-4a97-9301-b06fdbb3d65d.jpg',
    'International':'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85'
  };

  function makeFeaturedItem([key,icon,title,description]) {
    const item=document.createElement('button');
    item.type='button'; item.className='egonar-featured-category';
    const photo=document.createElement('img'); photo.className='egonar-featured-photo'; photo.src=FEATURED_IMAGES[key]||FALLBACK; photo.alt=title; photo.loading='lazy'; photo.decoding='async';
    photo.addEventListener('error',()=>{photo.onerror=null;photo.src=FALLBACK;},{once:true});
    item.innerHTML='<span class="egonar-featured-overlay"></span><span class="egonar-featured-badge">'+icon+'</span><span class="egonar-featured-copy"><strong>'+title+'</strong><small>'+description+'</small></span><span class="egonar-featured-arrow">→</span>';
    item.insertBefore(photo,item.firstChild);
    item.addEventListener('click',()=>activate(key));
    return item;
  }

  function makeShell() {
    const shell=document.createElement('div'); shell.className='egonar-category-shell';
    shell.innerHTML='<div class="egonar-category-heading"><div><span class="egonar-category-kicker">ÉVASION</span><h2>Toutes nos catégories</h2><p>Trouvez l’inspiration pour votre prochaine aventure parmi nos univers de voyage.</p></div><button type="button" class="egonar-category-all-link">Voir toutes les offres →</button></div>';
    const featured=document.createElement('div'); featured.className='egonar-featured-grid';
    FEATURED.forEach(x=>featured.appendChild(makeFeaturedItem(x)));
    const allWrap=document.createElement('div'); allWrap.className='egonar-all-categories-wrap';
    const allToggle=document.createElement('button'); allToggle.type='button'; allToggle.className='egonar-all-categories-toggle'; allToggle.setAttribute('aria-expanded','false'); allToggle.innerHTML='Explorer les 16 catégories Évasion <span>⌄</span>';
    const allPanel=document.createElement('div'); allPanel.className='egonar-all-categories-panel'; allPanel.hidden=true;
    const grid=document.createElement('div'); grid.className='egonar-category-grid'; grid.setAttribute('role','list');
    DATA.EVASION.forEach(category=>{const item=makeItem(category);item.setAttribute('role','listitem');grid.appendChild(item);});
    allPanel.appendChild(grid); allToggle.addEventListener('click',()=>{const open=allPanel.hidden;allPanel.hidden=!open;allToggle.setAttribute('aria-expanded',String(open));});
    allWrap.append(allToggle,allPanel); shell.append(featured,allWrap); return shell;
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
    if(currentUniverse() !== 'EVASION') {
      document.getElementById('categories')?.remove();
      return;
    }
    const build=()=>{const section=ensureSection();if(!section)return false;injectStyles();section.classList.add('egonar-category-hub');section.querySelector('.egonar-category-shell')?.remove();section.appendChild(makeShell());return true;};
    if(build())return;
    const observer=new MutationObserver(()=>{if(build())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();