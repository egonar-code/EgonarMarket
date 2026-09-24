(() => {
  'use strict';

  const normalize = value => String(value || '').trim().toLowerCase();
  const locale = () => localStorage.getItem('egonar_language') === 'en' ? 'en' : 'fr';

  function setValue(node, item, field) {
    const value = field === 'image' ? item.image_url : item[field];
    if (value === undefined || value === null || value === '') return;
    if ((node.tagName === 'IMG' && field === 'image') || field === 'background_image') {
      if (field === 'background_image') {
        const current = node.style.backgroundImage || '';
        const gradient = current.replace(/url\((?:'[^']*'|"[^"]*"|[^)]*)\)/gi, '').replace(/,\s*$/, '').trim();
        node.style.backgroundImage = (gradient ? gradient + ', ' : '') + 'url("' + String(value).replace(/"/g, '\\\"') + '")';
      } else {
        node.src = value;
      }
      return;
    }
    if (node.tagName === 'A' && field === 'cta_url') {
      node.href = value;
      return;
    }
    if (field === 'html') node.innerHTML = String(value);
    else node.textContent = String(value);
  }

  async function load(universe) {
    const u = String(universe || document.body.dataset.universe || '').trim().toUpperCase();
    if (!u) return [];
    const response = await fetch('/api/content?universe=' + encodeURIComponent(u) + '&locale=' + encodeURIComponent(locale()), {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return [];
    return await response.json();
  }

  async function apply(universe) {
    const rows = await load(universe);
    const byKey = new Map(rows.map(row => [normalize(row.key), row]));
    document.querySelectorAll('[data-content-key]').forEach(node => {
      const item = byKey.get(normalize(node.dataset.contentKey));
      if (!item) return;
      const field = node.dataset.contentField || (node.tagName === 'IMG' ? 'image' : 'title');
      setValue(node, item, field);
      if (field === 'cta_label' && item.cta_label) node.textContent = item.cta_label;
      if (field === 'cta_url' && item.cta_url) node.href = item.cta_url;
      if (item.title) node.dataset.contentResolved = 'true';
    });
    document.documentElement.dataset.studioContentLoaded = 'true';
    return rows;
  }

  window.EgonarStudioRuntime = { load, apply };
  const boot = () => apply(document.body.dataset.universe || '');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
