(() => {
  'use strict';

  function currentUniverse() {
    const value = String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
    return ['MARKET','SAVEURS','EVASION'].includes(value) ? value : 'MARKET';
  }

  function activateSearch(label) {
    const value = String(label || '').trim();
    if (!value) return false;
    const input = document.querySelector('input[type="search"]#search, .food-search input[type="search"], .travel-search input[type="search"], input[type="search"]');
    const form = input?.closest('form');
    if (!input || !form) return false;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles:true }));
    form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    const target = document.getElementById(currentUniverse() === 'MARKET' ? 'produits' : currentUniverse() === 'SAVEURS' ? 'food-smart-results' : 'travel-smart-results') || document.getElementById('explorer');
    target?.scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }

  function enhance() {
    document.querySelectorAll('.egonar-category-subcats span').forEach(span => {
      if (span.dataset.egonarCategoryInteractive === '1') return;
      span.dataset.egonarCategoryInteractive = '1';
      span.setAttribute('role','button');
      span.setAttribute('tabindex','0');
      span.classList.add('egonar-category-action');
      const label = span.textContent.trim();
      const context = window.EgonarCategoryRuntime?.resolve?.(currentUniverse(), label);
      if (context?.name) span.title = `Filtrer ${context.name} · ${label}`;
      span.addEventListener('click', () => activateSearch(label));
      span.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateSearch(label); }
      });
    });
    if (!document.getElementById('egonar-category-interactions-style')) {
      const style=document.createElement('style');
      style.id='egonar-category-interactions-style';
      style.textContent='.egonar-category-action{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}.egonar-category-action:hover,.egonar-category-action:focus-visible{transform:translateY(-1px);box-shadow:0 3px 10px rgba(15,47,65,.10);outline:none}.egonar-category-action:focus-visible{outline:2px solid currentColor;outline-offset:2px}';
      document.head.appendChild(style);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, {once:true}); else enhance();
  new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
  window.EgonarCategoryInteractions={activateSearch,enhance,currentUniverse};
})();
