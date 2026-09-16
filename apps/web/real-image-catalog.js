(() => {
  'use strict';
  const REAL_IMAGES = {
    tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
    bag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85',
    watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
    home: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85',
    beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
    tech: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
    kids: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=85',
    default: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85'
  };
  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const categoryImage = category => {
    const c = normalize(category);
    if (c === 'mode') return REAL_IMAGES.tshirt;
    if (c === 'accessoires') return REAL_IMAGES.bag;
    if (c === 'maison') return REAL_IMAGES.home;
    if (c === 'beaute') return REAL_IMAGES.beauty;
    if (c === 'tech') return REAL_IMAGES.tech;
    if (c.includes('bebe') || c.includes('enfant')) return REAL_IMAGES.kids;
    return REAL_IMAGES.default;
  };
  window.EgonarRealImages = REAL_IMAGES;
  window.imageForProduct = function realImageForProduct(product = {}) {
    const name = normalize(product.name);
    if (name.includes('t-shirt') || name.includes('tshirt')) return REAL_IMAGES.tshirt;
    if (name.includes('sac') || name.includes('bag')) return REAL_IMAGES.bag;
    if (name.includes('montre') || name.includes('watch')) return REAL_IMAGES.watch;
    const source = String(product.image_url || '').trim();
    if (/^https?:\/\//i.test(source)) return source;
    return categoryImage(product.category);
  };
})();
