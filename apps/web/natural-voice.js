(() => {
  // Ce fichier ne remplace pas speechSynthesis.speak().
  // Il ajoute uniquement une animation de bouche synchronisée avec la parole native.
  const install = () => {
    const section = document.getElementById('egonar-voice-assistant');
    if (!section) return;

    if (!document.getElementById('egonar-lipsync-style')) {
      const style = document.createElement('style');
      style.id = 'egonar-lipsync-style';
      style.textContent = `
        #egonar-voice-assistant .egonar-robot-mouth{position:absolute;left:27px;top:50%;width:24px;height:5px;transform:translate(-50%,8px);border-radius:999px;background:#06141f;border:2px solid #66e9ff;box-shadow:0 0 8px rgba(102,233,255,.75);z-index:9;pointer-events:none;opacity:.75}
        #egonar-voice-assistant.is-speaking .egonar-robot-mouth{opacity:1;animation:egonarMouthTalk .13s ease-in-out infinite alternate}
        #egonar-voice-assistant.is-speaking .voice-form::before{animation:none!important}
        #egonar-voice-assistant.is-speaking .voice-form::after{animation:none!important;opacity:0!important}
        @keyframes egonarMouthTalk{0%{height:3px;width:16px;transform:translate(-50%,8px) scaleY(.65)}25%{height:7px;width:24px;transform:translate(-50%,8px) scaleY(1)}50%{height:11px;width:29px;transform:translate(-50%,8px) scaleY(1)}75%{height:5px;width:20px;transform:translate(-50%,8px) scaleY(.75)}100%{height:8px;width:26px;transform:translate(-50%,8px) scaleY(.95)}}
        @media(max-width:600px){#egonar-voice-assistant .egonar-robot-mouth{left:26px;width:21px}}
      `;
      document.head.appendChild(style);
    }

    const form = section.querySelector('.voice-form');
    if (!form || form.querySelector('.egonar-robot-mouth')) return;
    const mouth = document.createElement('span');
    mouth.className = 'egonar-robot-mouth';
    mouth.setAttribute('aria-hidden', 'true');
    form.appendChild(mouth);
  };

  const sync = () => {
    install();
    const section = document.getElementById('egonar-voice-assistant');
    if (!section || !window.speechSynthesis) return;
    section.classList.toggle('is-speaking', !!speechSynthesis.speaking);
  };

  document.addEventListener('DOMContentLoaded', install);
  window.setInterval(sync, 80);
})();
