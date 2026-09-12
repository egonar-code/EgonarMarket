(() => {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  let voices = [];

  const refresh = () => { voices = synth.getVoices() || []; };
  refresh();
  if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', refresh);

  const injectLipSyncStyle = () => {
    if (document.getElementById('egonar-lipsync-style')) return;
    const style = document.createElement('style');
    style.id = 'egonar-lipsync-style';
    style.textContent = `
      #egonar-voice-assistant .egonar-robot-mouth{
        position:absolute;left:27px;top:50%;width:22px;height:4px;
        transform:translate(-50%,8px) scaleY(.72);transform-origin:center;
        border-radius:999px;background:#06141f;border:2px solid #66e9ff;
        box-shadow:0 0 8px rgba(102,233,255,.75),inset 0 0 5px rgba(102,233,255,.18);
        z-index:8;pointer-events:none;opacity:0;
      }
      #egonar-voice-assistant .egonar-robot-mouth.is-speaking,
      #egonar-voice-assistant.is-speaking .egonar-robot-mouth{
        opacity:1;
        animation:egonarMouthTalk .14s ease-in-out infinite alternate;
      }
      #egonar-voice-assistant.is-speaking .voice-form::before{
        animation:none!important;
        transform:translate(-1px,-50%)!important;
        filter:drop-shadow(0 8px 28px rgba(91,215,255,.58));
      }
      #egonar-voice-assistant.is-speaking .voice-form::after{
        animation:none!important;
        opacity:0!important;
      }
      #egonar-voice-assistant.is-speaking .voice-form:before{
        animation:none!important;
      }
      @keyframes egonarMouthTalk{
        0%{height:3px;width:17px;transform:translate(-50%,8px) scaleY(.65)}
        25%{height:6px;width:23px;transform:translate(-50%,8px) scaleY(.95)}
        50%{height:10px;width:28px;transform:translate(-50%,8px) scaleY(1)}
        75%{height:5px;width:20px;transform:translate(-50%,8px) scaleY(.78)}
        100%{height:8px;width:26px;transform:translate(-50%,8px) scaleY(.95)}
      }
      @media(max-width:600px){#egonar-voice-assistant .egonar-robot-mouth{left:26px}}
      @media(prefers-reduced-motion:reduce){#egonar-voice-assistant .egonar-robot-mouth{animation:none!important}}
    `;
    document.head.appendChild(style);
  };

  const voiceScore = (voice, lang) => {
    const name = String(voice.name || '').toLowerCase();
    const vlang = String(voice.lang || '').toLowerCase();
    const wanted = String(lang || '').toLowerCase();
    let score = 0;

    if (vlang === wanted) score += 140;
    else if (vlang.startsWith(wanted.slice(0, 2))) score += 70;
    if (voice.default) score += 12;
    if (voice.localService === false) score += 25;

    if (/natural|neural|online|premium|enhanced/.test(name)) score += 30;
    if (/google|microsoft|siri/.test(name)) score += 20;

    if (wanted.startsWith('fr')) {
      if (/france|french|français|francais|french france|google français|google francais|hortense|amelie|aurelie|audrey|thomas|daniel/.test(name)) score += 24;
    }
    if (wanted.startsWith('en')) {
      if (/english|united states|united kingdom|google us|google uk|samantha|victoria/.test(name)) score += 18;
    }

    return score;
  };

  const pickVoice = lang => {
    refresh();
    const wanted = String(lang || 'fr-FR').toLowerCase();
    const exact = voices.filter(v => String(v.lang || '').toLowerCase() === wanted);
    const regional = voices.filter(v => String(v.lang || '').toLowerCase().startsWith(wanted.slice(0, 2)));
    const pool = exact.length ? exact : regional.length ? regional : voices;
    return pool.slice().sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0] || null;
  };

  const ensureMouth = section => {
    injectLipSyncStyle();
    if (!section) return null;
    const form = section.querySelector('.voice-form');
    if (!form) return null;
    let mouth = form.querySelector('.egonar-robot-mouth');
    if (!mouth) {
      mouth = document.createElement('span');
      mouth.className = 'egonar-robot-mouth';
      mouth.setAttribute('aria-hidden', 'true');
      form.appendChild(mouth);
    }
    return mouth;
  };

  const setSpeaking = active => {
    const section = document.getElementById('egonar-voice-assistant');
    if (!section) return;
    const mouth = ensureMouth(section);
    section.classList.toggle('is-speaking', !!active);
    mouth?.classList.toggle('is-speaking', !!active);
  };

  const finishSpeaking = () => setSpeaking(false);

  try {
    const originalSpeak = synth.speak.bind(synth);

    synth.speak = utterance => {
      if (!(utterance instanceof SpeechSynthesisUtterance)) return originalSpeak(utterance);

      const prepareAndSpeak = () => {
        try {
          refresh();
          const requestedLang = utterance.lang || document.documentElement.lang || 'fr-FR';
          const voice = pickVoice(requestedLang);
          if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang || requestedLang;
          } else {
            utterance.lang = requestedLang;
          }

          const isEnglish = String(requestedLang).toLowerCase().startsWith('en');
          utterance.rate = isEnglish ? 0.94 : 0.90;
          utterance.pitch = isEnglish ? 1.01 : 1.02;
          utterance.volume = 1;
          utterance.text = String(utterance.text || '').replace(/\s+/g, ' ').trim();

          const mouthStart = () => setSpeaking(true);
          const mouthEnd = () => finishSpeaking();
          utterance.addEventListener('start', mouthStart, { once: true });
          utterance.addEventListener('end', mouthEnd, { once: true });
          utterance.addEventListener('error', mouthEnd, { once: true });
          utterance.addEventListener('cancel', mouthEnd, { once: true });
          ensureMouth(document.getElementById('egonar-voice-assistant'));
          return originalSpeak(utterance);
        } catch (_) {
          finishSpeaking();
          try {
            return originalSpeak(utterance);
          } catch (_) { return undefined; }
        }
      };

      // Chrome/ChromeOS can expose the voice list a moment after page load.
      refresh();
      if (!voices.length) {
        window.setTimeout(() => { refresh(); prepareAndSpeak(); }, 140);
        return undefined;
      }
      return prepareAndSpeak();
    };
  } catch (_) {}
})();
