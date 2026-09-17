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
      .egonar-all-categories{display:grid;gap:10px}
      .egonar-category-group{overflow:hidden;border:1px solid #e7e7e7;border-radius:16px;background:#fff;box-shadow:0 6px 22px rgba(0,0,0,.045)}
      .egonar-category-toggle{width:100%;appearance:none;border:0;background:#fff;color:#161616;display:flex;align-items:center;gap:12px;padding:17px 20px;text-align:left;font:inherit;font-size:15px;font-weight:850;cursor:pointer}
      .egonar-category-toggle:hover{background:#fafafa}
      .egonar-category-toggle:focus-visible{outline:2px solid currentColor;outline-offset:-3px}
      .egonar-category-toggle .category-icon{font-size:18px}
      .egonar-category-toggle .category-title{flex:1}
      .egonar-category-toggle .category-count{font-size:11px;font-weight:700;color:#999}
      .egonar-category-toggle .category-chevron{font-size:16px;transition:transform .2s ease}
      .egonar-category-group.open .category-chevron{transform:rotate(180deg)}
      .egonar-category-list{display:none;padding:0 20px 18px}
      .egonar-category-group.open .egonar-category-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px 10px}
      .egonar-category-item{appearance:none;border:1px solid #ececec;background:#f9f9f9;color:#222;border-radius:10px;padding:10px 11px;text-align:left;font-size:12px;font-weight:650;cursor:pointer;transition:all .15s ease}
      .egonar-category-item:hover,.egonar-category-item:focus-visible{background:#111;color:#fff;border-color:#111;outline:none}
      @media(max-width:800px){.egonar-category-group.open .egonar-category-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.egonar-category-toggle{padding:15px 14px}.egonar-category-list{padding:0 14px 14px}.egonar-category-group.open .egonar-category-list{grid-template-columns:1fr}.egonar-category-item{padding:10px}}
    `;
    document.head.appendChild(s);
  }

  function activate(label, universe) {
    const input = document.getElementById('search');
    const form = document.getElementById('search-form');
    if (!input || !form) return;
    input.value = label;
    document.body.dataset.categoryUniverse = universe;
    form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    document.getElementById('produits')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function makeGroup(universe) {
    const group = document.createElement('section');
    group.className = `egonar-category-group egonar-category-${universe.toLowerCase()}`;
    group.dataset.universe = universe;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'egonar-category-toggle';
    toggle.setAttribute('aria-expanded', 'false');

    const icon = document.createElement('span');
    icon.className = 'category-icon';
    icon.textContent = ICONS[universe];

    const title = document.createElement('span');
    title.className = 'category-title';
    title.textContent = universe;

    const count = document.createElement('span');
    count.className = 'category-count';
    count.textContent = `${DATA[universe].length} catégories`;

    const chevron = document.createElement('span');
    chevron.className = 'category-chevron';
    chevron.textContent = '⌄';
    chevron.setAttribute('aria-hidden', 'true');

    toggle.append(icon, title, count, chevron);

    const list = document.createElement('div');
    list.className = 'egonar-category-list';
    list.hidden = true;
    list.setAttribute('aria-label', `Catégories ${universe}`);

    DATA[universe].forEach(label => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'egonar-category-item';
      item.textContent = label;
      item.title = `Rechercher ${label} dans ${universe}`;
      item.addEventListener('click', () => activate(label, universe));
      list.appendChild(item);
    });

    toggle.addEventListener('click', () => {
      const isOpen = group.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      list.hidden = !isOpen;
    });

    group.append(toggle, list);
    return group;
  }

  function build() {
    const section = document.getElementById('categories');
    if (!section) return false;
    styles();

    const heading = section.querySelector('.section-head h2');
    if (heading) heading.textContent = 'Toutes nos catégories';

    section.querySelector('.chips')?.remove();
    section.querySelector('.egonar-all-categories')?.remove();

    const container = document.createElement('div');
    container.className = 'egonar-all-categories';
    container.setAttribute('aria-label', 'Toutes nos catégories par plateforme');

    ['MARKET','SAVEURS','EVASION'].forEach(universe => {
      container.appendChild(makeGroup(universe));
    });

    section.appendChild(container);
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
