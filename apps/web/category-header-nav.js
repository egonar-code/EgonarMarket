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
      ['Hôtels','🏨','Hôtels et hébergements'],['Appartements & Locations','🏡','Locations courte et longue durée'],
      ['Résidences & Maisons d’hôtes','🛏️','Résidences et maisons d’hôtes'],['Plages & Resorts','🏝️','Plages, resorts et détente'],
      ['Excursions','🧭','Excursions et sorties'],['Activités & Expériences','🎟️','Visites et expériences'],
      ['Tourisme & Culture','🕌','Patrimoine et découverte'],['Restaurants & Gastronomie','🍴','Restaurants et gastronomie'],
      ['Transport & Mobilité','🚐','Transferts et chauffeurs'],['Billetterie & Événements','🎫','Billets et événements'],
      ['Voyages organisés','🗺️','Circuits et voyages accompagnés'],['Lune de miel & Romantique','💍','Séjours romantiques'],
      ['Famille','👨‍👩‍👧','Séjours et activités en famille'],['Business & Séminaires','💼','Déplacements professionnels'],
      ['Bien-être','🧘🏾','Spa, détente et bien-être'],['Destinations','🌍','Explorez les destinations']
    ]
  };

  const META = {
    MARKET:['🛍️','MARKET','LE GRAND MARCHÉ','Tout ce dont vous avez besoin, dans un espace simple à explorer.'],
    SAVEURS:['🍽️','SAVEURS','À TABLE','Restaurants, plats et produits frais réunis au même endroit.'],
    EVASION:['✈️','ÉVASION','PARTEZ À LA DÉCOUVERTE','Séjours, activités et expériences pour votre prochaine escapade.']
  };

  const currentUniverse = () => {
    const value = String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
    return DATA[value] ? value : 'MARKET';
  };

  function injectStyles() {
    if (document.getElementById('egonar-category-premium-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-category-premium-style';
    style.textContent = `
      #categories.egonar-category-hub .section-head{margin-bottom:18px}
      #categories.egonar-category-hub .section-head h2{font-size:clamp(28px,4vw,40px);letter-spacing:-.045em}
      .egonar-category-shell{border:1px solid rgba(17,17,17,.08);border-radius:24px;background:linear-gradient(145deg,#fff,#fafafa);box-shadow:0 16px 45px rgba(17,17,17,.08);overflow:hidden}
      .egonar-category-trigger{width:100%;border:0;background:transparent;color:#111;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:20px 22px;text-align:left;cursor:pointer;font:inherit}
      .egonar-category-trigger:hover{background:#fafafa}.egonar-category-trigger:focus-visible{outline:3px solid #ddd;outline-offset:-3px}
      .egonar-category-brand{width:50px;height:50px;border-radius:15px;display:grid;place-items:center;background:#111;color:#fff;font-size:24px}
      .egonar-category-kicker{display:block;font-size:10px;letter-spacing:.14em;font-weight:900;color:#888;margin-bottom:6px}
      .egonar-category-title{display:block;font-size:19px;font-weight:900;letter-spacing:-.02em}
      .egonar-category-intro{display:block;color:#777;font-size:12px;margin-top:4px}
      .egonar-category-action{display:flex;align-items:center;gap:8px;border:1px solid #e7e7e7;background:#fff;border-radius:999px;padding:9px 12px;font-size:11px;font-weight:850;white-space:nowrap}
      .egonar-category-chevron{transition:transform .2s}.egonar-category-shell.open .egonar-category-chevron{transform:rotate(180deg)}
      .egonar-category-panel{border-top:1px solid #eee;padding:18px 20px 20px;background:#fff}
      .egonar-category-panel[hidden]{display:none!important}
      .egonar-category-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
      .egonar-category-toolbar strong{font-size:12px}.egonar-category-count{font-size:11px;color:#888}
      .egonar-category-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .egonar-category-item{appearance:none;border:1px solid #ececef;background:#fafafa;color:#191919;border-radius:15px;min-height:76px;padding:11px;text-align:left;cursor:pointer;display:grid;grid-template-columns:34px 1fr;gap:10px;align-items:center;transition:.16s ease}
      .egonar-category-item:hover{transform:translateY(-2px);background:#fff;border-color:#d5d5d8;box-shadow:0 8px 20px rgba(0,0,0,.07)}
      .egonar-category-item:focus-visible{outline:3px solid #ddd}
      .egonar-category-icon{width:34px;height:34px;border-radius:11px;background:#fff;display:grid;place-items:center;font-size:17px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
      .egonar-category-name{font-size:12px;font-weight:850;line-height:1.25}.egonar-category-desc{display:block;color:#888;font-size:9px;margin-top:3px;line-height:1.3}
      .egonar-category-close{width:100%;margin-top:12px;border:1px dashed #ddd;background:#fff;border-radius:12px;padding:9px;font-size:11px;font-weight:800;color:#666;cursor:pointer}
      .egonar-category-close:hover{color:#111;background:#fafafa}
      @media(max-width:1000px){.egonar-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:700px){.egonar-category-trigger{padding:16px}.egonar-category-brand{width:44px;height:44px}.egonar-category-action span:first-child{display:none}.egonar-category-panel{padding:14px}.egonar-category-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}}
      @media(max-width:460px){.egonar-category-grid{grid-template-columns:1fr}.egonar-category-title{font-size:16px}.egonar-category-intro{font-size:11px}}
    `;
    document.head.appendChild(style);
  }

  function activate(label) {
    const input = document.querySelector('input[type="search"]#search,.food-search input[type="search"],.travel-search input[type="search"],input[type="search"]');
    const form = input?.closest('form');
    if (!input || !form) return;
    input.value = label;
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    ['produits','food-smart-results','travel-smart-results'].forEach(id => document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  function makeItem([label,icon,description]) {
    const item=document.createElement('button');
    item.type='button';item.className='egonar-category-item';
    item.innerHTML='<span class="egonar-category-icon" aria-hidden="true">'+icon+'</span><span><span class="egonar-category-name">'+label+'</span><span class="egonar-category-desc">'+description+'</span></span>';
    item.addEventListener('click',()=>activate(label));
    return item;
  }

  function makeShell(current) {
    const [icon,title,kicker,intro]=META[current], categories=DATA[current];
    const shell=document.createElement('div');shell.className='egonar-category-shell';
    const trigger=document.createElement('button');trigger.type='button';trigger.className='egonar-category-trigger';trigger.setAttribute('aria-expanded','false');
    const panelId='egonar-category-panel-'+current.toLowerCase();trigger.setAttribute('aria-controls',panelId);
    trigger.innerHTML='<span class="egonar-category-brand" aria-hidden="true">'+icon+'</span><span><span class="egonar-category-kicker">'+kicker+'</span><span class="egonar-category-title">'+title+'</span><span class="egonar-category-intro">'+intro+'</span></span><span class="egonar-category-action"><span>Explorer</span><span>'+categories.length+' catégories</span><span class="egonar-category-chevron">⌄</span></span>';
    const panel=document.createElement('div');panel.id=panelId;panel.className='egonar-category-panel';panel.hidden=true;
    const toolbar=document.createElement('div');toolbar.className='egonar-category-toolbar';toolbar.innerHTML='<strong>Choisissez une catégorie</strong><span class="egonar-category-count">Uniquement '+title+'</span>';
    const grid=document.createElement('div');grid.className='egonar-category-grid';grid.setAttribute('role','list');
    categories.forEach(category=>{const item=makeItem(category);item.setAttribute('role','listitem');grid.appendChild(item);});
    const close=document.createElement('button');close.type='button';close.className='egonar-category-close';close.textContent='Masquer les catégories ↑';
    close.addEventListener('click',()=>{panel.hidden=true;shell.classList.remove('open');trigger.setAttribute('aria-expanded','false');trigger.focus();});
    panel.append(toolbar,grid,close);
    trigger.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;shell.classList.toggle('open',open);trigger.setAttribute('aria-expanded',String(open));});
    shell.append(trigger,panel);return shell;
  }

  function ensureSection() {
    let section=document.getElementById('categories');if(section)return section;
    const anchor=document.getElementById('explorer');if(!anchor)return null;
    section=document.createElement('section');section.id='categories';section.className='wrap section egonar-category-hub';
    section.innerHTML='<div class="section-head"><div><p class="eyebrow">EXPLORER</p><h2>Toutes nos catégories</h2></div></div>';
    anchor.parentNode.insertBefore(section,anchor);return section;
  }

  function build() {
    const section=ensureSection();if(!section)return false;injectStyles();
    section.classList.add('egonar-category-hub');
    section.querySelector('.egonar-category-shell')?.remove();
    section.querySelector('.egonar-all-categories')?.remove();
    section.appendChild(makeShell(currentUniverse()));return true;
  }

  function cleanup(){document.getElementById('egonar-category-navigation')?.remove();document.getElementById('egonar-all-categories')?.remove();document.querySelector('.egonar-search-with-categories')?.classList.remove('egonar-search-with-categories');}

  function start(){cleanup();if(build())return;const observer=new MutationObserver(()=>{cleanup();if(build())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();