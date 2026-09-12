(() => {
  const scan = () => document.querySelectorAll('#products-list .product-card').forEach(async card => {
    if (card.dataset.confidenceReady) return;
    const link = card.querySelector('.product-image[href*="produit.html?id="]');
    if (!link) return;
    const id = new URL(link.href, location.href).searchParams.get('id');
    if (!id) return;
    card.dataset.confidenceReady = '1';
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(id)}`);
      if (!r.ok) return;
      const p = await r.json();
      const body = card.querySelector('.product-body');
      if (!body) return;
      const row = document.createElement('div');
      row.className = 'catalog-confidence';
      const good = ['VERIFIED', 'PREMIUM'].includes(p.verified_level);
      row.innerHTML = `${good ? '<span class="cc-good">✓ Egonar vérifié</span>' : '<span class="cc-neutral">Vérification en cours</span>'}${Number(p.rating_average) ? `<span class="cc-rate">★ ${Number(p.rating_average).toFixed(1)}</span>` : ''}`;
      body.insertBefore(row, body.querySelector('h3'));
      const max = Number(p.delivery_max_minutes || 0);
      if (max > 0) {
        const d = document.createElement('small');
        d.className = 'cc-delivery';
        d.textContent = `🚚 ${Number(p.delivery_min_minutes || 0) > 0 ? `${p.delivery_min_minutes}–` : ''}${max} min · ${p.delivery_city || 'Dakar'}`;
        body.appendChild(d);
      }
    } catch (_) {}
  });
  const style = document.createElement('style');
  style.textContent = '.catalog-confidence{display:flex;gap:7px;flex-wrap:wrap;margin:7px 0}.catalog-confidence span,.cc-delivery{font-size:12px}.cc-good{background:#e8f7ed;color:#176b3a;padding:4px 8px;border-radius:999px;font-weight:800}.cc-neutral{background:#f1f1f1;color:#666;padding:4px 8px;border-radius:999px}.cc-rate{background:#fff4d6;color:#7a5600;padding:4px 8px;border-radius:999px;font-weight:700}.cc-delivery{display:block;color:#666;margin-top:5px}';
  if (!document.getElementById('catalog-confidence-style')) { style.id = 'catalog-confidence-style'; document.head.appendChild(style); }
  document.addEventListener('DOMContentLoaded', scan);
  if (document.readyState !== 'loading') scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
