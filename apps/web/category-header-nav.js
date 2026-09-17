(() => {
  'use strict';

  const DATA = {
    MARKET: ['Mode & Vêtements','Téléphones & Accessoires','Informatique & Électronique','Maison & Décoration','Électroménager','Beauté & Soins','Bébé & Enfant','Sports & Loisirs','Alimentation & Épicerie','Supermarché & Quotidien','Accessoires & Maroquinerie','Auto & Moto','Bricolage & Jardin','Bureau & Fournitures','Livres, Culture & Éducation','Produits locaux & Artisanat','Services'],
    SAVEURS: ['Restaurants','Plats sénégalais','Fast-Food','Petit-déjeuner & Brunch','Boissons','Desserts & Pâtisseries','Épicerie','Fruits & Légumes','Boucherie & Poissonnerie','Traiteur & Événementiel','Cuisine maison','Offres & Menus'],
    EVASION: ['Hôtels','Appartements & Locations','Résidences & Maisons d’hôtes','Plages & Resorts','Excursions','Activités & Expériences','Tourisme & Culture','Restaurants & Gastronomie','Transport & Mobilité','Billetterie & Événements','Voyages organisés','Lune de miel & Romantique','Famille','Business & Séminaires','Bien-être','Destinations']
  };

  const ICONS = { MARKET:'🛍️', SAVEURS:'🍽️', EVASION:'✈️' };

  function injectStyles() {
    if (document.getElementById('egonar-all-categories-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-all-categories-style';
    style.textContent = `
      #categories .section-head{margin-bottom:20px}
      #categories .section-head h2{font-size:clamp(30px,4vw,42px);letter-spacing:-.045em}
      .egonar-all-categories{display:grid;gap:16px}
      .egonar-category-group{border:1px solid #ececec;border-radius:18px;background:#fff;padding:14px 0 12px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.045)}
      .egonar-category-group-head{display:flex;align-items:center;gap:9px;padding:0 18px 10px;font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .egonar-category-group-head small{font-size:10px;color:#999;font-weight:700;letter-spacing:.06em;margin-left:auto;text-transform:none}
      .egonar-category-scroll{overflow:hidden;position:relative}
      .egonar-category-track{display:flex;gap:9px;width:max-content;padding:2px 18px 5px;animation:egonarCategoriesLTR 48s linear infinite}
      .egonar-category-group:nth-child(2) .egonar-category-track{animation-duration:42s;animation-delay:-9s}
      .egonar-category-group:nth-child(3) .egonar-category-track{animation-duration:45s;animation-delay:-18s}
      .egonar-category-scroll:hover .egonar-category-track,.egonar-category-scroll:focus-within .egonar-category-track{animation-play-state:paused}
      .egonar-category-pill{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;border:1px solid #e3e3e3;background:#fafafa;color:#222;border-radius:999px;padding:10px 14px;font-size:13px;font-weight:750;cursor:pointer;transition:transform .16s,background .16s,color .16s,border-color .16s,box-shadow .16s}
      .egonar-category-pill:hover,.egonar-category-pill:focus-visible{background:#111;color:#fff;border-color:#111;transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.12);outline:none}
      @keyframes egonarCategoriesLTR{from{transform:translateX(-35%)}to{transform:translateX(0)}}
      @media(max-width:700px){
        .egonar-category-group{border-radius:15px}
        .egonar-category-group-head{padding-left:14px;padding-right:14px}
        .egonar-category-scroll{overflow-x:auto;scrollbar-width:none}
        .egonar-category-scroll::-webkit-scrollbar{display:none}
        .egonar-category-track{animation:none!important;padding-left:14px;padding-right:14px}
        .egonar-category-pill{font-size:12px;padding:9px 12px}
      }
      @media(prefers-reduced-motion:reduce){.egonar-category-track{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function activate(label) {
    const input = document.getElementById('search');
    const form = document.getElementById('search-form');
    if (!input || !form) return;
    input.value = label;
    form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    document.getElementById('produits')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function makeGroup(universe) {
    const group = document.createElement('section');
    group.className = 'egonar-category-group';
    group.setAttribute('aria-label', `Toutes les catégories ${universe}`);

    const head = document.createElement('div');
    head.className = 'egonar-category-group-head';
    head.innerHTML = `<span>${ICONS[universe]} ${universe === 'MARKET' ? 'MARKET' : universe === 'SAVEURS' ? 'SAVEURS' : 'EVASION'}</span><small>${DATA[universe].length} catégories</small>`;
    group.appendChild(head);

    const scroll = document.createElement('div');
    scroll.className = 'egonar-category-scroll';
    const track = document.createElement('div');
    track.className = 'egonar-category-track';

    // Deux passages permettent une animation continue sans vide visuel.
    [...DATA[universe], ...DATA[universe]].forEach((label, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'egonar-category-pill';
      button.textContent = `${index === 0 || index === DATA[universe].length ? ICONS[universe] + ' ' : ''}${label}`;
      button.title = `Rechercher : ${label}`;
      button.addEventListener('click', () => activate(label));
      track.appendChild(button);
    });

    scroll.appendChild(track);
    group.appendChild(scroll);
    return group;
  }

  function build() {
    // Nettoyage de l'ancienne version qui plaçait TOUTES dans le header.
    document.getElementById('egonar-category-header-nav')?.remove();

    const section = document.getElementById('categories');
    if (!section || section.dataset.egonarAllCategories === '1') return;
    injectStyles();

    const heading = section.querySelector('.section-head h2');
    if (heading) heading.textContent = 'Toutes nos catégories';
    const eyebrow = section.querySelector('.section-head .eyebrow');
    if (eyebrow) eyebrow.textContent = 'EXPLORER';

    const oldChips = section.querySelector('.chips');
    if (!oldChips) return;
    oldChips.remove();

    const container = document.createElement('div');
    container.className = 'egonar-all-categories';
    container.setAttribute('aria-label', 'Toutes nos catégories');
    ['MARKET','SAVEURS','EVASION'].forEach(universe => container.appendChild(makeGroup(universe)));
    section.appendChild(container);
    section.dataset.egonarAllCategories = '1';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
