(() => {
  'use strict';

  const DATA = {
    MARKET: ['Mode & Vêtements','Téléphones & Accessoires','Informatique & Électronique','Maison & Décoration','Électroménager','Beauté & Soins','Bébé & Enfant','Sports & Loisirs','Alimentation & Épicerie','Supermarché & Quotidien','Accessoires & Maroquinerie','Auto & Moto','Bricolage & Jardin','Bureau & Fournitures','Livres, Culture & Éducation','Produits locaux & Artisanat','Services'],
    SAVEURS: ['Restaurants','Plats sénégalais','Fast-Food','Petit-déjeuner & Brunch','Boissons','Desserts & Pâtisseries','Épicerie','Fruits & Légumes','Boucherie & Poissonnerie','Traiteur & Événementiel','Cuisine maison','Offres & Menus'],
    EVASION: ['Hôtels','Appartements & Locations','Résidences & Maisons d’hôtes','Plages & Resorts','Excursions','Activités & Expériences','Tourisme & Culture','Restaurants & Gastronomie','Transport & Mobilité','Billetterie & Événements','Voyages organisés','Lune de miel & Romantique','Famille','Business & Séminaires','Bien-être','Destinations']
  };

  const ICONS = { MARKET:'🛍️', SAVEURS:'🍽️', EVASION:'✈️' };

  function injectStyles() {
    if (document.getElementById('egonar-category-header-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-category-header-style';
    style.textContent = `
      .egonar-search-shell{position:relative;flex:1;max-width:720px;min-width:0}
      .egonar-search-shell>.search{max-width:none!important;width:100%!important}
      .egonar-all-btn{position:absolute;left:8px;top:8px;height:48px;border:0;border-radius:999px;background:#f5f5f5;color:#111;font-weight:900;font-size:12px;padding:0 14px;cursor:pointer;z-index:4;white-space:nowrap;transition:.2s}
      .egonar-all-btn:hover,.egonar-all-btn[aria-expanded="true"]{background:#073f63;color:#fff}
      .egonar-search-shell>.search input{padding-left:112px!important}
      .egonar-category-panel{position:absolute;left:0;right:0;top:calc(100% + 10px);background:#fff;border:1px solid #e8e8e8;border-radius:20px;padding:14px;box-shadow:0 22px 60px rgba(0,0,0,.16);z-index:100;opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .18s,transform .18s,visibility .18s;overflow:hidden}
      .egonar-category-panel.is-open{opacity:1;visibility:visible;transform:none}
      .egonar-category-title{display:flex;align-items:center;justify-content:space-between;padding:4px 5px 10px;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#777}
      .egonar-category-close{border:0;background:#f3f3f3;border-radius:50%;width:28px;height:28px;cursor:pointer;font-weight:900}
      .egonar-category-row{position:relative;overflow:hidden;margin:6px 0;border-radius:13px;background:#f8f9fa}
      .egonar-category-row-track{display:flex;gap:8px;width:max-content;padding:8px;animation:egonarCategoryMove 42s linear infinite}
      .egonar-category-row:nth-of-type(3) .egonar-category-row-track{animation-duration:48s}
      .egonar-category-row:nth-of-type(4) .egonar-category-row-track{animation-duration:45s}
      .egonar-category-row:hover .egonar-category-row-track,.egonar-category-row:focus-within .egonar-category-row-track{animation-play-state:paused}
      .egonar-category-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #e2e2e2;background:#fff;color:#222;border-radius:999px;padding:9px 13px;font-size:12px;font-weight:750;white-space:nowrap;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:.15s}
      .egonar-category-pill:hover,.egonar-category-pill:focus-visible{background:#073f63;color:#fff;border-color:#073f63;transform:translateY(-1px);outline:none}
      .egonar-category-row-label{position:absolute;left:8px;top:8px;z-index:2;display:none}
      @keyframes egonarCategoryMove{from{transform:translateX(-15%)}to{transform:translateX(0)}}
      @media(max-width:900px){.egonar-search-shell{order:3;flex-basis:100%;max-width:none}.egonar-category-panel{position:fixed;left:12px;right:12px;top:82px;max-height:calc(100vh - 96px);overflow:auto}.egonar-category-row{overflow-x:auto}.egonar-category-row-track{animation:none!important}.egonar-all-btn{top:6px;height:44px}.egonar-search-shell>.search input{padding-left:104px!important}}
      @media(max-width:600px){.egonar-all-btn{font-size:11px;padding:0 11px}.egonar-search-shell>.search input{padding-left:92px!important}.egonar-category-panel{border-radius:16px;padding:10px}.egonar-category-pill{font-size:11px;padding:8px 11px}}
      @media(prefers-reduced-motion:reduce){.egonar-category-row-track{animation:none!important}}
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
    closePanel();
  }

  function closePanel() {
    const panel = document.getElementById('egonar-category-panel');
    const button = document.getElementById('egonar-all-categories');
    if (!panel || !button) return;
    panel.classList.remove('is-open');
    button.setAttribute('aria-expanded','false');
  }

  function row(universe) {
    const wrapper = document.createElement('div');
    wrapper.className = 'egonar-category-row';
    wrapper.setAttribute('aria-label', `Catégories ${universe}`);
    const track = document.createElement('div');
    track.className = 'egonar-category-row-track';
    const values = [...DATA[universe], ...DATA[universe]];
    values.forEach((label, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'egonar-category-pill';
      button.textContent = `${index % DATA[universe].length === 0 ? ICONS[universe] + ' ' : ''}${label}`;
      button.dataset.category = label;
      button.addEventListener('click', () => activate(label));
      track.appendChild(button);
    });
    wrapper.appendChild(track);
    return wrapper;
  }

  function build() {
    if (document.getElementById('egonar-category-header-nav')) return;
    const form = document.getElementById('search-form');
    if (!form || !form.parentNode) return;
    injectStyles();

    const shell = document.createElement('div');
    shell.className = 'egonar-search-shell';
    shell.id = 'egonar-category-header-nav';
    form.parentNode.insertBefore(shell, form);
    shell.appendChild(form);

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.id = 'egonar-all-categories';
    allButton.className = 'egonar-all-btn';
    allButton.setAttribute('aria-expanded','false');
    allButton.setAttribute('aria-controls','egonar-category-panel');
    allButton.textContent = '☰ TOUTES';
    shell.appendChild(allButton);

    const panel = document.createElement('div');
    panel.id = 'egonar-category-panel';
    panel.className = 'egonar-category-panel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','Toutes les catégories EgonarMarket');
    const title = document.createElement('div');
    title.className = 'egonar-category-title';
    title.innerHTML = '<span>TOUTES LES CATÉGORIES</span>';
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'egonar-category-close'; close.textContent = '×'; close.setAttribute('aria-label','Fermer');
    close.addEventListener('click', closePanel);
    title.appendChild(close); panel.appendChild(title);
    ['MARKET','SAVEURS','EVASION'].forEach(u => panel.appendChild(row(u)));
    shell.appendChild(panel);

    allButton.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      allButton.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', event => { if (!shell.contains(event.target)) closePanel(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
