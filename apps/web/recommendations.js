(() => {
  const money = n => new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' FCFA';
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esc = s => String(s || '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const addStyle = () => {
    if (document.getElementById('egonar-reco-style')) return;
    const s = document.createElement('style'); s.id = 'egonar-reco-style';
    s.textContent = '.egonar-reco{margin:24px 0;padding:18px;border:1px solid #e6eef3;border-radius:20px;background:#f8fbfd}.egonar-reco strong{display:block;color:#14374b;font-size:17px}.egonar-reco-sub{display:block;margin:4px 0 14px;color:#718795;font-size:11px}.egonar-reco-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.egonar-reco-card{background:#fff;border:1px solid #e5edf2;border-radius:14px;padding:10px}.egonar-reco-card small{color:#6e8491}.egonar-reco-card h4{margin:5px 0;font-size:12px;color:#17384b}.egonar-reco-card b{color:#0b5e8d;font-size:12px}@media(max-width:600px){.egonar-reco-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  };
  const boot = () => {
    addStyle();
    const box = document.getElementById('products-list'); if (!box) return;
    const draw = async () => {
      if (document.getElementById('egonar-recommendations')) return;
      const cards = [...box.querySelectorAll('.product-card')]; if (!cards.length) return;
      let catalog = []; try { const r = await fetch('/api/products'); if (r.ok) catalog = await r.json(); } catch { return; }
      const seen = new Set(cards.map(c => norm(c.querySelector('h3')?.textContent)));
      const category = norm(cards[0].querySelector('.badge')?.textContent);
      const picks = (Array.isArray(catalog) ? catalog : []).filter(p => Number(p.stock || 0) > 0 && !seen.has(norm(p.name))).sort((a,b) => (norm(b.category) === category ? 20 : 0) - (norm(a.category) === category ? 20 : 0) || Number(b.rating_average || 0) - Number(a.rating_average || 0)).slice(0,3);
      if (!picks.length) return;
      const section = document.createElement('section'); section.id = 'egonar-recommendations'; section.className = 'egonar-reco';
      section.innerHTML = '<strong>✦ Suggestions Egonar AI</strong><span class="egonar-reco-sub">Des produits proches et complémentaires à votre recherche.</span><div class="egonar-reco-grid">' + picks.map(p => '<article class="egonar-reco-card"><small>'+esc(p.category || 'Sélection')+'</small><h4>'+esc(p.name)+'</h4><b>'+money(p.price_fcfa)+'</b></article>').join('') + '</div>';
      box.insertAdjacentElement('afterend', section);
    };
    const observer = new MutationObserver(() => window.setTimeout(draw, 160)); observer.observe(box,{childList:true,subtree:true});
  };
  document.addEventListener('DOMContentLoaded', boot);
})();
