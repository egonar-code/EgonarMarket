(() => {
  'use strict';

  const UNIVERSES = {
    MARKET: '🛍️',
    SAVEURS: '🍽️',
    EVASION: '✈️'
  };

  function currentUniverse() {
    const value = String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
    return UNIVERSES[value] ? value : 'MARKET';
  }

  function activateSearch(label) {
    const value = String(label || '').trim();
    if (!value) return false;

    const universe = currentUniverse();
    const input = document.querySelector('input[type="search"]#search, input[type="search"]');
    const form = input?.closest('form');
    if (!input || !form) return false;

    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const target = document.getElementById(universe === 'MARKET' ? 'produits' : 'food-smart-results')
      || document.getElementById('explorer');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  function categoryContext(label) {
    return window.EgonarCategoryRuntime?.resolve?.(currentUniverse(), label) || null;
  }

  function categoriesForCurrentUniverse() {
    const universe = currentUniverse();
    const catalog = window.EgonarCategoryRuntime?.byUniverse?.(universe) || [];
    return catalog.map(entry => ({
      name: entry[1],
      icon: entry[2] || '•'
    }));
  }

  function createCategoryButton(category) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'egonar-category-marquee-item';
    button.dataset.category = category.name;
    button.dataset.universe = currentUniverse();
    button.title = `Rechercher : ${category.name}`;
    button.innerHTML = `<span aria-hidden="true">${category.icon}</span><span>${category.name}</span>`;
    button.addEventListener('click', () => activateSearch(category.name));
    return button;
  }

  function buildCategoryNavigation() {
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('search');
    if (!form || !searchInput || document.getElementById('egonar-category-navigation')) return;

    const universe = currentUniverse();
    const categories = categoriesForCurrentUniverse();
    if (!categories.length) return;

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.id = 'egonar-all-categories';
    allButton.className = 'egonar-all-categories';
    allButton.setAttribute('aria-expanded', 'false');
    allButton.setAttribute('aria-controls', 'egonar-category-navigation');
    allButton.innerHTML = `<span class="egonar-all-icon" aria-hidden="true">☰</span><span>CATÉGORIES</span><span class="egonar-all-chevron" aria-hidden="true">⌄</span>`;
    form.insertBefore(allButton, searchInput);
    form.classList.add('egonar-search-with-categories');

    const navigation = document.createElement('div');
    navigation.id = 'egonar-category-navigation';
    navigation.className = 'egonar-category-navigation';
    navigation.hidden = true;
    navigation.setAttribute('aria-label', `Catégories ${universe}`);

    const row = document.createElement('div');
    row.className = 'egonar-category-row';
    row.dataset.universe = universe;

    const label = document.createElement('span');
    label.className = 'egonar-category-row-label';
    label.textContent = `${UNIVERSES[universe]} ${universe}`;

    const viewport = document.createElement('div');
    viewport.className = 'egonar-category-marquee';
    viewport.setAttribute('role', 'list');
    const track = document.createElement('div');
    track.className = 'egonar-category-marquee-track';
    categories.forEach(category => track.appendChild(createCategoryButton(category)));

    viewport.appendChild(track);
    row.append(label, viewport);
    navigation.appendChild(row);
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

  function enhanceExistingCategories() {
    document.querySelectorAll('.egonar-category-item').forEach(item => {
      item.querySelectorAll('.egonar-category-subcats span').forEach(span => {
        if (span.dataset.egonarCategoryInteractive === '1') return;
        span.dataset.egonarCategoryInteractive = '1';
        span.setAttribute('role', 'button');
        span.setAttribute('tabindex', '0');
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
    });
  }

  function styles() {
    if (document.getElementById('egonar-category-interactions-style')) return;
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
      .egonar-category-marquee:hover .egonar-category-marquee-track,.egonar-category-marquee:focus-within .egonar-category-marquee-track{animation-play-state:paused}
      .egonar-category-marquee-item{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;border:1px solid #e4e4e4;background:#fafafa;border-radius:999px;padding:8px 12px;color:#222;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:.18s}
      .egonar-category-marquee-item:hover,.egonar-category-marquee-item:focus-visible{background:#111;color:#fff;border-color:#111;transform:translateY(-1px);outline:none}
      @keyframes egonar-category-right{from{transform:translateX(-50%)}to{transform:translateX(0)}}
      @media(max-width:900px){.egonar-category-row{grid-template-columns:1fr}.egonar-category-row-label{text-align:left;padding:2px 8px 0}.egonar-category-marquee-track{animation-duration:26s}.egonar-search-with-categories #search{min-width:0}}
      @media(max-width:600px){.egonar-all-categories{padding:0 10px;font-size:11px}.egonar-all-categories span:nth-child(2){display:none}.egonar-category-navigation{border-radius:13px}.egonar-category-row{padding:4px 8px}.egonar-category-marquee-item{font-size:11px;padding:7px 10px}}
      @media(prefers-reduced-motion:reduce){.egonar-category-marquee-track{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function enhance() {
    styles();
    enhanceExistingCategories();
    buildCategoryNavigation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else enhance();

  const observer = new MutationObserver(() => enhance());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.EgonarCategoryInteractions = { activateSearch, enhance, currentUniverse };
})();
