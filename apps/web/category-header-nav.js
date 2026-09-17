(() => {
  'use strict';

  const DATA = {
    MARKET: ['Mode & Vêtements','Téléphones & Accessoires','Informatique & Électronique','Maison & Décoration','Électroménager','Beauté & Soins','Bébé & Enfant','Sports & Loisirs','Alimentation & Épicerie','Supermarché & Quotidien','Accessoires & Maroquinerie','Auto & Moto','Bricolage & Jardin','Bureau & Fournitures','Livres, Culture & Éducation','Produits locaux & Artisanat','Services'],
    SAVEURS: ['Restaurants','Plats sénégalais','Fast-Food','Petit-déjeuner & Brunch','Boissons','Desserts & Pâtisseries','Épicerie','Fruits & Légumes','Boucherie & Poissonnerie','Traiteur & Événementiel','Cuisine maison','Offres & Menus'],
    EVASION: ['Hôtels','Appartements & Locations','Résidences & Maisons d’hôtes','Plages & Resorts','Excursions','Activités & Expériences','Tourisme & Culture','Restaurants & Gastronomie','Transport & Mobilité','Billetterie & Événements','Voyages organisés','Lune de miel & Romantique','Famille','Business & Séminaires','Bien-être','Destinations']
  };
  const ICONS = { MARKET:'🛍️', SAVEURS:'🍽️', EVASION:'✈️' };

  function styles() {
    if (document.getElementById('egonar-category-final-style')) return;
    const s = document.createElement('style');
    s.id = 'egonar-category-final-style';
    s.textContent = `
      #categories .section-head{margin-bottom:22px}
      #categories .section-head h2{font-size:clamp(30px,4vw,42px);letter-spacing:-.045em}
      .egonar-all-categories{display:grid;gap:14px}
      .egonar-category-group{overflow:hidden;border:1px solid #e9e9e9;border-radius:18px;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.05)}
      .egonar-category-group-head{display:flex;align-items:center;gap:10px;padding:15px 18px 10px;font-size:13px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
      .egonar-category-group-head small{margin-left:auto;color:#999;font-size:11px;font-weight:700;letter-spacing:0;text-transform:none}
      .egonar-category-scroll{overflow:hidden;position:relative}
      .egonar-category-track{display:flex;gap:8px;width:max-content;padding:3px 18px 15px;animation:egonarCategoriesRight 38s linear infinite}
      .egonar-category-group:nth-child(2) .egonar-category-track{animation-duration:34s;animation-delay:-7s}
      .egonar-category-group:nth-child(3) .egonar-category-track{animation-duration:36s;animation-delay:-14s}
      .egonar-category-scroll:hover .egonar-category-track,.egonar-category-scroll:focus-within .egonar-category-track{animation-play-state:paused}
      .egonar-category-pill{appearance:none;display:inline-flex;align-items:center;white-space:nowrap;border:1px solid #e1e1e1;border-radius:999px;background:#f9f9f9;color:#222;padding:10px 14px;font-size:12px;font-weight:750;cursor:pointer;transition:all .16s ease}
      .egonar-category-pill:hover,.egonar-category-pill:focus-visible{background:#111;color:#fff;border-color:#111;transform:translateY(-1px);outline:none;box-shadow:0 5px 14px rgba(0,0,0,.12)}
      @keyframes egonarCategoriesRight{from{transform:translateX(-25%)}to{transform:translateX(0)}}
      @media(max-width:700px){.egonar-category-scroll{overflow-x:auto;scrollbar-width:none}.egonar-category-scroll::-webkit-scrollbar{display:none}.egonar-category-track{animation:none!important;padding-left:14px;padding-right:14px}.egonar-category-pill{font-size:11px;padding:9px 12px}.egonar-category-group-head{padding-left:14px;padding-right:14px}}
      @media(prefers-reduced-motion:reduce){.egonar-category-track{animation:none!important}}
    `;
    document.head.appendChild(s);
  }

  function activate(label) {
    const input = document.getElementById('search');
    const form = document.getElementById('search-form');
    if (!input || !form) return;
    input.value = label;
    form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    document.getElementById('produits')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function makeGroup(universe) {
    const group = document.createElement('section');
    group.className = 'egonar-category-group';
    const head = document.createElement('div');
    head.className = 'egonar-category-group-head';
    head.innerHTML = `<span>${ICONS[universe]} ${universe}</span><small>${DATA[universe].length} catégories</small>`;
    const scroll = document.createElement('div');
    scroll.className = 'egonar-category-scroll';
    const track = document.createElement('div');
    track.className = 'egonar-category-track';

    const items = [...DATA[universe], ...DATA[universe]];
    items.forEach(label => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'egonar-category-pill';
      button.textContent = label;
      button.title = `Rechercher ${label}`;
      button.addEventListener('click', () => activate(label));
      track.appendChild(button);
    });
    scroll.appendChild(track);
    group.append(head, scroll);
    return group;
  }

  function build() {
    const section = document.getElementById('categories');
    if (!section) return false;
    styles();
    const heading = section.querySelector('.section-head h2');
    if (heading) heading.textContent = 'Toutes nos catégories';
    const old = section.querySelector('.chips');
    if (old) old.remove();
    let container = section.querySelector('.egonar-all-categories');
    if (!container) {
      container = document.createElement('div');
      container.className = 'egonar-all-categories';
      container.setAttribute('aria-label','Toutes nos catégories');
      ['MARKET','SAVEURS','EVASION'].forEach(u => container.appendChild(makeGroup(u)));
      section.appendChild(container);
    }
    return true;
  }

  function start() {
    if (build()) return;
    const observer = new MutationObserver(() => { if (build()) observer.disconnect(); });
    observer.observe(document.documentElement, {childList:true,subtree:true});
    setTimeout(() => observer.disconnect(), 10000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
