(() => {
  'use strict';
  const catalog = window.EgonarCategoryCatalog || {};
  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const slugify = value => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const byUniverse = universe => (catalog[String(universe || 'MARKET').toUpperCase()] || []);
  function resolve(universe, value) {
    const needle = normalize(value);
    if (!needle) return null;
    for (const [slug, name, icon, subs] of byUniverse(universe)) {
      if (normalize(slug) === needle || normalize(name) === needle || slugify(name) === needle) return { slug, name, subcategory: null };
      const sub = (subs || []).find(x => normalize(x) === needle || slugify(x) === needle);
      if (sub) return { slug, name, subcategory: sub };
    }
    return null;
  }
  function terms(universe, value) {
    const match = resolve(universe, value);
    if (!match) return [String(value || '').trim()];
    return match.subcategory ? [match.name, match.subcategory] : [match.name];
  }
  window.EgonarCategoryRuntime = { byUniverse, resolve, terms, slugify };
})();
