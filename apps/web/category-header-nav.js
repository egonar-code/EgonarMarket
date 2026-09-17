(() => {
  'use strict';

  const DATA = {
    MARKET: ['Mode & Vêtements','Téléphones & Accessoires','Informatique & Électronique','Maison & Décoration','Électroménager','Beauté & Soins','Bébé & Enfant','Sports & Loisirs','Alimentation & Épicerie','Supermarché & Quotidien','Accessoires & Maroquinerie','Auto & Moto','Bricolage & Jardin','Bureau & Fournitures','Livres, Culture & Éducation','Produits locaux & Artisanat','Services'],
    SAVEURS: ['Restaurants','Plats sénégalais','Fast-Food','Petit-déjeuner & Brunch','Boissons','Desserts & Pâtisseries','Épicerie','Fruits & Légumes','Boucherie & Poissonnerie','Traiteur & Événementiel','Cuisine maison','Offres & Menus'],
    EVASION: ['Hôtels','Appartements & Locations','Résidences & Maisons d’hôtes','Plages & Resorts','Excursions','Activités & Expériences','Tourisme & Culture','Restaurants & Gastronomie','Transport & Mobilité','Billetterie & Événements','Voyages organisés','Lune de miel & Romantique','Famille','Business & Séminaires','Bien-être','Destinations']
  };
  const META = { MARKET:['🛍️','MARKET'], SAVEURS:['🍽️','SAVEURS'], EVASION:['✈️','ÉVASION'] };

  const universe = () => {
    const value = String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
    return DATA[value] ? value : 'MARKET';
  };

  function styles() {
    if (document.getElementById('egonar-category-final-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-category-final-style';
    style.textContent = `
      #categories .section-head{margin-bottom:18px}
      #categories .section-head h2{font-size:clamp(28px,4vw,40px);letter-spacing:-.04em}
      .egonar-all-categories{display:grid;gap:10px}
      .egonar-category-group{overflow:hidden;border:1px solid #e7e7e7;border-radius:16px;background:#fff;box-shadow:0 6px 22px rgba(0,0,0,.045)}
      .egonar-category-toggle{width:100%;appearance:none;border:0;background:#fff;color:#161616;display:flex;align-items:center;gap:12px;padding:17px 20px;text-align:left;font:inherit;font-size:15px;font-weight:850;cursor:pointer}
      .egonar-category-toggle:hover,.egonar-category-toggle:focus-visible{background:#fafafa;outline:2px solid currentColor;outline-offset:-3px}
      .egonar-category-toggle .category-icon{font-size:18px}.egonar-category-toggle .category-title{flex:1}.egonar-category-toggle .category-count{font-size:11px;font-weight:700;color:#999}.egonar-category-toggle .category-chevron{font-size:17px;transition:transform .2s ease}.egonar-category-group.open .category-chevron{transform:rotate(180deg)}
      .egonar-category-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px 10px;padding:0 20px 18px}.egonar-category-list[hidden]{display:none!important}
      .egonar-category-item{appearance:none;border:1px solid #ececec;background:#f9f9f9;color:#222;border-radius:10px;padding:10px 11px;text-align:left;font-size:12px;font-weight:650;cursor:pointer;transition:.15s ease}.egonar-category-item:hover,.egonar-category-item:focus-visible{background:#111;color:#fff;border-color:#111;outline:none}
      @media(max-width:800px){.egonar-category-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.egonar-category-toggle{padding:15px 14px}.egonar-category-list{grid-template-columns:1fr;padding:0 14px 14px}.egonar-category-item{padding:10px}}
    `;
    document.head.appendChild(style);
  }

  function activate(label) {
    const input = document.querySelector('input[type="search"]#search, .food-search input[type="search"], .travel-search input[type="search"], input[type="search"]');
    const form = input?.closest('form');
    if (!input || !form) return;
    input.value = label;
    form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    document.getElementById('produits')?.scrollIntoView({behavior:'smooth',block:'start'});
    document.getElementById('food-smart-results')?.scrollIntoView({behavior:'smooth',block:'start'});
    document.getElementById('travel-smart-results')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function makeGroup(current) {
    const group = document.createElement('section');
    group.className = 'egonar-category-group';
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'egonar-category-toggle'; toggle.setAttribute('aria-expanded','false');
    const [iconText,titleText] = META[current];
    toggle.innerHTML = `<span class="category-icon" aria-hidden="true">${iconText}</span><span class="category-title">${titleText}</span><span class="category-count">${DATA[current].length} catégories</span><span class="category-chevron" aria-hidden="true">⌄</span>`;
    const listId = `egonar-category-list-${current.toLowerCase()}`;
    toggle.setAttribute('aria-controls',listId);
    const list = document.createElement('div'); list.id=listId; list.className='egonar-category-list'; list.hidden=true;
    DATA[current].forEach(label => { const item=document.createElement('button'); item.type='button'; item.className='egonar-category-item'; item.textContent=label; item.addEventListener('click',()=>activate(label)); list.appendChild(item); });
    toggle.addEventListener('click',()=>{ const open=!list.hidden; list.hidden=open; group.classList.toggle('open',!open); toggle.setAttribute('aria-expanded',String(!open)); });
    group.append(toggle,list); return group;
  }

  function ensureSection() {
    let section=document.getElementById('categories');
    if (section) return section;
    const anchor=document.getElementById('explorer'); if(!anchor) return null;
    section=document.createElement('section'); section.id='categories'; section.className='wrap section';
    section.innerHTML='<div class="section-head"><div><p class="eyebrow">EXPLORER</p><h2>Toutes nos catégories</h2></div></div>';
    anchor.parentNode.insertBefore(section,anchor); return section;
  }

  function build() {
    const section=ensureSection(); if(!section) return false;
    styles();
    const current=universe();
    const heading=section.querySelector('.section-head h2'); if(heading) heading.textContent='Toutes nos catégories';
    const stale=section.querySelector('.egonar-all-categories'); if(stale) stale.remove();
    const container=document.createElement('div'); container.className='egonar-all-categories'; container.setAttribute('aria-label',`Catégories ${META[current][1]}`); container.appendChild(makeGroup(current)); section.appendChild(container);
    return true;
  }

  function cleanupLegacySearchNavigation() {
    document.getElementById('egonar-category-navigation')?.remove();
    document.getElementById('egonar-all-categories')?.remove();
    document.querySelector('.egonar-search-with-categories')?.classList.remove('egonar-search-with-categories');
  }

  function start() {
    cleanupLegacySearchNavigation();
    if(build()) return;
    const observer=new MutationObserver(()=>{ cleanupLegacySearchNavigation(); if(build()) observer.disconnect(); });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
