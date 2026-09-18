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
    'Hôtels':'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=420&q=82',
    'Appartements & Locations':'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=420&q=82',
    'Résidences & Maisons d’hôtes':'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=420&q=82',
    'Plages & Resorts':'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=420&q=82',
    'Excursions':'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=420&q=82',
    'Activités & Expériences':'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=420&q=82',
    'Tourisme & Culture':'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=420&q=82',
    'Restaurants & Gastronomie':'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=420&q=82',
    'Transport & Mobilité':'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=420&q=82',
    'Billetterie & Événements':'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=420&q=82',
    'Voyages organisés':'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=420&q=82',
    'Lune de miel & Romantique':'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=420&q=82',
    'Famille':'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=420&q=82',
    'Business & Séminaires':'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=420&q=82',
    'Bien-être':'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=420&q=82',
    'Destinations':'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=420&q=82'
  };
  const FALLBACK = '/assets/egonar-evasion-fallback.svg';

  const currentUniverse = () => String(document.body?.dataset?.universe || 'MARKET').toUpperCase();

  function injectStyles() {
    if (document.getElementById('egonar-category-premium-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-category-premium-style';
    style.textContent = `
      #categories.egonar-category-hub{width:min(1280px,calc(100% - 32px));padding-top:34px;padding-bottom:34px}
      #categories.egonar-category-hub .section-head{margin-bottom:18px}
      #categories.egonar-category-hub .section-head h2{font-size:clamp(30px,4vw,44px);letter-spacing:-.045em}
      .egonar-category-shell{border:1px solid rgba(17,17,17,.08);border-radius:26px;background:linear-gradient(145deg,#fff,#fafafa);box-shadow:0 18px 55px rgba(17,17,17,.09);overflow:hidden}
      .egonar-category-trigger{width:100%;border:0;background:transparent;color:#111;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;padding:22px 26px;text-align:left;cursor:pointer;font:inherit}
      .egonar-category-trigger:hover{background:#fafafa}.egonar-category-trigger:focus-visible{outline:3px solid #d7d7d7;outline-offset:-3px}
      .egonar-category-brand{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;background:#111;color:#fff;font-size:27px}
      .egonar-category-kicker{display:block;font-size:11px;letter-spacing:.15em;font-weight:900;color:#888;margin-bottom:7px}
      .egonar-category-title{display:block;font-size:22px;font-weight:900;letter-spacing:-.025em}
      .egonar-category-intro{display:block;color:#6d6d6d;font-size:13px;line-height:1.45;margin-top:5px;max-width:760px}
      .egonar-category-action{display:flex;align-items:center;gap:9px;border:1px solid #e4e4e4;background:#fff;border-radius:999px;padding:11px 15px;font-size:12px;font-weight:850;white-space:nowrap}
      .egonar-category-chevron{font-size:18px;line-height:1;transition:transform .2s}.egonar-category-shell.open .egonar-category-chevron{transform:rotate(180deg)}
      .egonar-category-panel{border-top:1px solid #eee;padding:22px 24px 24px;background:#fff}
      .egonar-category-panel[hidden]{display:none!important}
      .egonar-category-toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:16px}
      .egonar-category-toolbar strong{font-size:15px}.egonar-category-count{font-size:12px;color:#888}
      .egonar-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .egonar-category-item{appearance:none;border:1px solid #e8e8ea;background:#fff;color:#171717;border-radius:17px;min-height:96px;padding:10px;text-align:left;cursor:pointer;display:grid;grid-template-columns:86px 1fr auto;gap:14px;align-items:center;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
      .egonar-category-item:hover{transform:translateY(-2px);border-color:#d2d2d5;box-shadow:0 10px 25px rgba(0,0,0,.08)}
      .egonar-category-item:focus-visible{outline:3px solid #d8d8d8}
      .egonar-category-photo{width:86px;height:76px;border-radius:12px;object-fit:cover;background:#f1f1f1;display:block}
      .egonar-category-name{display:block;font-size:16px;font-weight:900;line-height:1.2}
      .egonar-category-desc{display:block;color:#777;font-size:12px;line-height:1.4;margin-top:5px}
      .egonar-category-go{font-size:21px;color:#8a8a8a;padding:0 5px}
      .egonar-category-close{width:100%;margin-top:14px;border:1px dashed #d8d8d8;background:#fff;border-radius:13px;padding:11px;font-size:12px;font-weight:800;color:#666;cursor:pointer}
      .egonar-category-close:hover{color:#111;background:#fafafa}
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

  function makeShell() {
    const [icon,title,kicker,intro]=META.EVASION;
    const categories=DATA.EVASION;
    const shell=document.createElement('div');
    shell.className='egonar-category-shell';
    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='egonar-category-trigger';
    trigger.setAttribute('aria-expanded','false');
    const panelId='egonar-category-panel-evasion';
    trigger.setAttribute('aria-controls',panelId);
    trigger.innerHTML='<span class="egonar-category-brand" aria-hidden="true">'+icon+'</span><span><span class="egonar-category-kicker">'+kicker+'</span><span class="egonar-category-title">'+title+'</span><span class="egonar-category-intro">'+intro+'</span></span><span class="egonar-category-action"><span>Afficher la liste</span><span>'+categories.length+' catégories</span><span class="egonar-category-chevron">⌄</span></span>';
    const panel=document.createElement('div');
    panel.id=panelId;
    panel.className='egonar-category-panel';
    panel.hidden=true;
    const toolbar=document.createElement('div');
    toolbar.className='egonar-category-toolbar';
    toolbar.innerHTML='<strong>Choisissez une catégorie Évasion</strong><span class="egonar-category-count">Hôtels · activités · transport · destinations</span>';
    const grid=document.createElement('div');
    grid.className='egonar-category-grid';
    grid.setAttribute('role','list');
    categories.forEach(category=>{const item=makeItem(category);item.setAttribute('role','listitem');grid.appendChild(item);});
    const close=document.createElement('button');
    close.type='button';
    close.className='egonar-category-close';
    close.textContent='Masquer la liste ↑';
    close.addEventListener('click',()=>{panel.hidden=true;shell.classList.remove('open');trigger.setAttribute('aria-expanded','false');trigger.focus();});
    panel.append(toolbar,grid,close);
    trigger.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;shell.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));});
    shell.append(trigger,panel);
    return shell;
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