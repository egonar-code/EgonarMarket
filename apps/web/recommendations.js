(() => {
  const boot = () => {
    const box = document.getElementById('products-list');
    if (!box) return;
    const draw = () => {
      if (document.getElementById('egonar-recommendations')) return;
      if (!box.querySelector('.product-card')) return;
      const section = document.createElement('section');
      section.id = 'egonar-recommendations';
      section.className = 'egonar-reco';
      section.innerHTML = '<strong>✦ Suggestions Egonar AI</strong><span>Des produits complémentaires à votre recherche.</span>';
      box.insertAdjacentElement('afterend', section);
    };
    const observer = new MutationObserver(() => window.setTimeout(draw, 120));
    observer.observe(box, { childList: true, subtree: true });
  };
  document.addEventListener('DOMContentLoaded', boot);
})();
