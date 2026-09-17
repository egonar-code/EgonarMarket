(() => {
  'use strict';

  const normalize = value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  function activateSearch(label) {
    const value = String(label || '').trim();
    if (!value) return;
    const input = document.getElementById('search');
    const form = document.getElementById('search-form');
    if (!input || !form) return;
    input.value = value;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    document.getElementById('produits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function categoryContext(label) {
    const universe = String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
    return window.EgonarCategoryRuntime?.resolve?.(universe, label) || null;
  }

  const CATEGORY_BARS = {
    MARKET: [
      ['Mode & Vêtements', '👕'], ['Téléphones & Accessoires', '📱'], ['Informatique & Électronique', '💻'],
      ['Maison & Décoration', '🏠'], ['Électroménager', '🧺'], ['Beauté & Soins', '✨'], ['Bébé & Enfant', '🧸'],
      ['Sports & Loisirs', '⚽'], ['Alimentation & Épicerie', '🛒'], ['Supermarché & Quotidien', '🏪'],
      ['Accessoires & Maroquinerie', '👜'], ['Auto & Moto', '🚗'], ['Bricolage & Jardin', '🔧'],
      ['Bureau & Fournitures', '📚'], ['Livres, Culture & Éducation', '📖'], ['Produits locaux & Artisanat', '🇸🇳'], ['Services', '🧰']
    ],
    SAVEURS: [
      ['Restaurants', '🍽️'], ['Plats sénégalais', '🇸🇳'], ['Fast-Food', '🍔'], ['Petit-déjeuner & Brunch', '🥐'],
      ['Boissons', '🥤'], ['Desserts & Pâtisseries', '🍰'], ['Épicerie', '🛒'], ['Fruits & Légumes', '🥭'],
      ['Boucherie & Poissonnerie', '🐟'], ['Traiteur & Événementiel', '👨‍🍳'], ['Cuisine maison', '🏡'], ['Offres & Menus', '🎁']
    ],
    EVASION: [
      ['Hôtels', '🏨'], ['Appartements & Locations', '🏡'], ['Résidences & Maisons d’hôtes', '🛏️'], ['Plages & Resorts', '🏖️'],
      ['Excursions', '🚌'], ['Activités & Expériences', '🎯'], ['Tourisme & Culture', '🏛️'], ['Restaurants & Gastronomie', '🍴'],
      ['Transport & Mobilité', '🚐'], ['Billetterie & Événements', '🎟️'], ['Voyages organisés', '🧳'], ['Lune de miel & Romantique', '💍'],
      ['Famille', '👨‍👩‍👧‍👦'], ['Business & Séminaires', '💼'], ['Bien-être', '🧘'], ['Destinations', '🌍']
    ]
  };

  function allCategories() {
    const catalog = window.EgonarCategoryCatalog || {};
    const universes = ['MARKET', 'SAVEURS', 'EVASION'];
    const result = {};
    universes.forEach(universe => {
      const fromCatalog = window.EgonarCategoryRuntime?.byUniverse?.(universe) || [];
      result[universe] = fromCatalog.length
        ? fromCatalog.map(entry => [entry[1], entry[2] || '•'])
        : CATEGORY_BARS[universe];
    });
    return result;
  }

  function createCategoryButton(name, icon, universe) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'egonar-category-marquee-item';
    button.dataset.category = name;
    button.dataset.universe = universe;
    button.innerHTML = `<span aria-hidden="true">${icon}</span><span>${name}</span>`;
    button.title = `Rechercher : ${name}`;
    button.addEventListener('click', () => activateSearch(name));
    button.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateSearch(name);
      }
    });
    return button;
  }

  function buildCategoryNavigation() {
    const form = document.getElementById('search-form');
    if (!form || document.getElementById('egonar-category-navigation')) return;

    const searchInput = document.getElementById('search');
    if (!searchInput) return;

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.id = 'egonar-all-categories';
    allButton.className = 'egonar-all-categories';
    allButton.setAttribute('aria-expanded', 'false');
    allButton.setAttribute('aria-controls', 'egonar-category-navigation');
    allButton.innerHTML = '<span class="egonar-all-icon" aria-hidden="true">☰</span><span>TOUTES</span><span class="egonar-all-chevron" aria-hidden="true">⌄</span>';

    form.insertBefore(allButton, searchInput);
    form.classList.add('egonar-search-with-categories');

    const navigation = document.createElement('div');
    navigation.id = 'egonar-category-navigation';
    navigation.className = 'egonar-category-navigation';
    navigation.hidden = true;
    navigation.setAttribute('aria-label', 'Toutes les catégories');

    const labels = { MARKET: 'MARKET', SAVEURS: 'SAVEURS', EVASION: 'EVASION' };
    const data = allCategories();
    Object.keys(labels).forEach(universe => {
      const row = document.createElement('div');
      row.className = `egonar-category-row egonar-category-row-${universe.toLowerCase()}`;
      row.dataset.universe = universe;
      row.innerHTML = `<span class="egonar-category-row-label">${universe === 'MARKET' ? '🛍️' : universe === 'SAVEURS' ? '🍽️' : '✈️'} ${labels[universe]}</span>`;

      const viewport = document.createElement('div');
      viewport.className = 'egonar-category-marquee';
      viewport.setAttribute('role', 'list');
      const track = document.createElement('div');
      track.className = 'egonar-category-marquee-track';

      const items = data[universe] || [];
      [...items, ...items].forEach(([name, icon]) => track.appendChild(createCategoryButton(name, icon, universe)));
      viewport.appendChild(track);
      row.appendChild(viewport);
      navigation.appendChild(row);
    });

    form.parentNode.insertBefore(navigation, form.nextSibling);

    const setOpen = open => {
      navigation.hidden = !open;
      allButton.setAttribute('aria-expanded', String(open));
      allButton.classList.toggle('is-open', open);
    };
    allButton.addEventListener('click', () => setOpen(navigation.hidden));

    document.addEventListener('click', event => {
      if (!navigation.hidden && !form.contains(event.target) && !navigation.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !navigation.hidden) {
        setOpen(false);
        allButton.focus();
      }
    });
  }

  function enhance() {
    document.querySelectorAll('.egonar-category-item').forEach(item => {
      item.querySelectorAll('.egonar-category-subcats span').forEach(span => {
        if (span.dataset.egonarCategoryInteractive === '1') return;
        span.dataset.egonarCategoryInteractive = '1';
        span.setAttribute('role', 'button');
        span.setAttribute('tabindex', '0');
        span.classList.add('egonar-category-action');
        const label = span.textContent.trim();
        const context = categoryContext(label);
        if (context?.name) span.title = `Filtrer ${context.name} · ${label}`;
        span.addEventListener('click', () => activateSearch(label));
        span.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activateSearch(label);
          }
        });
      });

      const summary = item.querySelector('summary');
      if (summary && summary.dataset.egonarCategoryInteractive !== '1') {
        summary.dataset.egonarCategoryInteractive = '1';
        const label = summary.textContent.trim();
        summary.addEventListener('dblclick', () => activateSearch(label));
        summary.title = 'Double-cliquez pour filtrer cette catégorie';
      }
    });

    buildCategoryNavigation();

    if (!document.getElementById('egonar-category-interactions-style')) {
      const style = document.createElement('style');
      style.id = 'egonar-category-interactions-style';
      style.textContent = `
        .egonar-search-with-categories{display:flex;align-items:stretch;gap:0}
        .egonar-all-categories{flex:0 0 auto;display:flex;align-items:center;gap:7px;border:1px solid #ddd;border-right:0;background:#fff;color:#111;padding:0 14px;border-radius:12px 0 0 12px;font-size:12px;font-weight:900;letter-spacing:.04em;cursor:pointer;white-space:nowrap}
        .egonar-all-categories:hover,.egonar-all-categories.is-open{background:#111;color:#fff;border-color:#111}
        .egonar-all-icon{font-size:15px}.egonar-all-chevron{font-size:14px;transition:transform .2s}.egonar-all-categories.is-open .egonar-all-chevron{transform:rotate(180deg)}
        .egonar-search-with-categories #search{border-radius:0;border-right:0}
        .egonar-category-navigation{width:100%;margin:10px 0 0;padding:8px 0 6px;background:#fff;border:1px solid #e9e9e9;border-radius:16px;box-shadow:0 14px 35px #00000012;overflow:hidden}
        .egonar-category-navigation[hidden]{display:none}
        .egonar-category-row{display:grid;grid-template-columns:96px minmax(0,1fr);align-items:center;gap:12px;padding:5px 10px}
        .egonar-category-row-label{font-size:10px;font-weight:900;letter-spacing:.08em;color:#777;text-align:center;white-space:nowrap}
        .egonar-category-marquee{min-width:0;overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 3%,#000 97%,transparent)}
        .egonar-category-marquee-track{display:flex;width:max-content;gap:8px;animation:egonar-category-right 34s linear infinite}
        .egonar-category-row-saveurs .egonar-category-marquee-track{animation-duration:29s;animation-delay:-7s}
        .egonar-category-row-evasion .egonar-category-marquee-track{animation-duration:38s;animation-delay:-12s}
        .egonar-category-marquee:hover .egonar-category-marquee-track,.egonar-category-marquee:focus-within .egonar-category-marquee-track{animation-play-state:paused}
        .egonar-category-marquee-item{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;border:1px solid #e4e4e4;background:#fafafa;border-radius:999px;padding:8px 12px;color:#222;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:.18s}
        .egonar-category-marquee-item:hover,.egonar-category-marquee-item:focus-visible{background:#111;color:#fff;border-color:#111;transform:translateY(-1px);outline:none}
        @keyframes egonar-category-right{from{transform:translateX(-50%)}to{transform:translateX(0)}}
        .egonar-category-action{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}.egonar-category-action:hover,.egonar-category-action:focus-visible{transform:translateY(-1px);box-shadow:0 3px 10px rgba(15,47,65,.10);outline:none}.egonar-category-action:focus-visible{outline:2px solid currentColor;outline-offset:2px}
        @media(max-width:900px){.egonar-category-row{grid-template-columns:1fr}.egonar-category-row-label{text-align:left;padding:2px 8px 0}.egonar-category-navigation{margin-top:8px}.egonar-category-marquee-track{animation-duration:26s}.egonar-search-with-categories #search{min-width:0}}
        @media(max-width:600px){.egonar-all-categories{padding:0 10px;font-size:11px}.egonar-all-categories span:nth-child(2){display:none}.egonar-category-navigation{border-radius:13px}.egonar-category-row{padding:4px 8px}.egonar-category-marquee-item{font-size:11px;padding:7px 10px}}
        @media(prefers-reduced-motion:reduce){.egonar-category-marquee-track{animation:none!important}}
      `;
      document.head.appendChild(style);
    }
  }

  document.addEventListener('DOMContentLoaded', enhance);
  new MutationObserver(enhance).observe(document.documentElement, { childList: true, subtree: true });
  window.EgonarCategoryInteractions = { activateSearch, enhance, normalize };
})();
