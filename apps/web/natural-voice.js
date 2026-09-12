(() => {
  // Le navigateur garde son propre moteur vocal : on ne surcharge jamais speechSynthesis.speak().
  // Ce script gère uniquement l'intégration visuelle du robot et la bouche pendant la parole.

  const STYLE_ID = 'egonar-robot-inline-style';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #egonar-voice-assistant .egonar-inline-robot{
        position:absolute;
        left:-22px;
        top:50%;
        width:92px;
        height:92px;
        transform:translate(-1px,-50%);
        z-index:5;
        pointer-events:none;
        filter:drop-shadow(0 8px 20px rgba(52,205,255,.22));
      }
      #egonar-voice-assistant .egonar-inline-robot svg{
        width:100%;height:100%;display:block;overflow:visible;
      }
      #egonar-voice-assistant .egonar-inline-robot .egonar-mouth{
        transform-box:fill-box;
        transform-origin:center;
        transition:transform .12s ease, opacity .12s ease;
      }
      #egonar-voice-assistant .egonar-inline-robot .mouth-frame{
        stroke-opacity:.42;
        fill:#06141f;
      }
      #egonar-voice-assistant .egonar-inline-robot .mouth-line{stroke-opacity:.46}
      #egonar-voice-assistant .egonar-inline-robot .mouth-line-2{stroke-opacity:.12}
      #egonar-voice-assistant.is-speaking .egonar-inline-robot .egonar-mouth{
        animation:egonarNaturalMouth .17s ease-in-out infinite alternate;
      }
      #egonar-voice-assistant.is-speaking .egonar-inline-robot .mouth-frame{stroke-opacity:.62}
      #egonar-voice-assistant.is-speaking .egonar-inline-robot .mouth-line{stroke-opacity:.72}
      #egonar-voice-assistant.is-speaking .egonar-inline-robot .mouth-line-2{stroke-opacity:.22}
      #egonar-voice-assistant.is-speaking .voice-form::before,
      #egonar-voice-assistant.is-speaking .voice-form::after{animation:none!important;opacity:0!important}
      @keyframes egonarNaturalMouth{
        0%{transform:scaleY(.82)}
        28%{transform:scaleY(1.02)}
        56%{transform:scaleY(.72)}
        78%{transform:scaleY(1.12)}
        100%{transform:scaleY(.88)}
      }
      @media(max-width:600px){
        #egonar-voice-assistant .egonar-inline-robot{left:-12px;width:72px;height:72px}
      }
      @media(prefers-reduced-motion:reduce){
        #egonar-voice-assistant .egonar-inline-robot .egonar-mouth{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  async function mountRobot() {
    const section = document.getElementById('egonar-voice-assistant');
    if (!section || section.dataset.robotInlineReady === '1') return;
    const form = section.querySelector('.voice-form');
    if (!form) return;

    injectStyle();

    try {
      const response = await fetch('egonar-robot.svg', { cache: 'no-store' });
      if (!response.ok) return;
      const svgText = await response.text();
      if (!svgText.includes('egonar-mouth')) return;

      const holder = document.createElement('span');
      holder.className = 'egonar-inline-robot';
      holder.setAttribute('aria-hidden', 'true');
      holder.innerHTML = svgText;
      form.appendChild(holder);
      section.dataset.robotInlineReady = '1';

      // On masque le robot de fond de la barre afin de n'avoir qu'un seul robot visible.
      form.classList.add('has-inline-robot');
    } catch (_) {}
  }

  function syncSpeaking() {
    const section = document.getElementById('egonar-voice-assistant');
    if (!section || !('speechSynthesis' in window)) return;
    section.classList.toggle('is-speaking', !!window.speechSynthesis.speaking);
    mountRobot();
  }

  function boot() {
    mountRobot();
    window.setInterval(syncSpeaking, 80);
  }

  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();
})();
