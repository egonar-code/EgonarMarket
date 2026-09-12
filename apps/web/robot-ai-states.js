(() => {
  const suggestions = {
    marketplace: ['🎁 Cadeau femme', '💻 Tech à moins de 50 000 FCFA', '👕 Mode homme', '🏠 Maison'],
    food: ['🐟 Poisson frais', '🍲 Repas à Dakar', '🛒 Courses du quotidien', '🍴 Restaurant'],
    travel: ['🏨 Hôtel à Dakar', '🏝️ Week-end au Sénégal', '🎟️ Activité à Gorée', '🚗 Transfert']
  };

  const setState = (section, state) => {
    if (!section) return;
    section.classList.remove('is-idle', 'is-listening', 'is-thinking', 'is-success', 'is-error');
    section.classList.add(`is-${state}`);
    const robot = section.querySelector('.voice-form');
    if (robot) robot.setAttribute('data-ai-state', state);
  };

  const addSuggestions = section => {
    if (!section || section.querySelector('.ai-suggestion-row')) return;
    const area = document.body.classList.contains('food-page') ? 'food' : document.body.classList.contains('travel-page') ? 'travel' : 'marketplace';
    const row = document.createElement('div');
    row.className = 'ai-suggestion-row';
    row.setAttribute('aria-label', 'Suggestions Egonar AI');
    row.innerHTML = suggestions[area].map(text => `<button type="button" class="ai-suggestion">${text}</button>`).join('');
    const hint = section.querySelector('.voice-hint');
    (hint || section.querySelector('.voice-form'))?.insertAdjacentElement('afterend', row);
    row.querySelectorAll('.ai-suggestion').forEach(button => {
      button.addEventListener('click', () => {
        const input = section.querySelector('#egonar-voice-input');
        if (!input) return;
        input.value = button.textContent.replace(/^\S+\s/, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        section.querySelector('#egonar-voice-send')?.click();
      });
    });
  };

  const setup = () => {
    const section = document.getElementById('egonar-voice-assistant');
    if (!section || section.dataset.robotStateReady === '1') return;
    section.dataset.robotStateReady = '1';
    setState(section, 'idle');
    addSuggestions(section);

    const answer = section.querySelector('#egonar-voice-answer');
    const input = section.querySelector('#egonar-voice-input');
    const mic = section.querySelector('#egonar-mic');
    const send = section.querySelector('#egonar-voice-send');

    mic?.addEventListener('click', () => setState(section, 'listening'));
    send?.addEventListener('click', () => {
      if (input?.value.trim()) setState(section, 'thinking');
    });
    input?.addEventListener('keydown', event => {
      if (event.key === 'Enter' && input.value.trim()) setState(section, 'thinking');
    });

    if (answer) {
      const observer = new MutationObserver(() => {
        const text = answer.textContent.trim();
        if (!text) return;
        if (/je vous écoute|i’m listening/i.test(text)) return setState(section, 'listening');
        if (/analyse|analyz/i.test(text)) return setState(section, 'thinking');
        if (/erreur|indisponible|unavailable|could not|pas trouvé/i.test(text)) {
          setState(section, 'error');
          window.setTimeout(() => setState(section, 'idle'), 2500);
          return;
        }
        if (/j’ai trouvé|j'ai trouvé|j’ai analysé|j'ai analysé|i found|i analyzed/i.test(text)) {
          setState(section, 'success');
          window.setTimeout(() => setState(section, 'idle'), 3200);
        }
      });
      observer.observe(answer, { childList: true, characterData: true, subtree: true });
    }
  };

  const boot = () => window.setTimeout(setup, 30);
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
