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
        position:absolute;left:27px;top:50%;width:25px;height:5px;
        transform:translate(-50%,8px) scaleY(.7);transform-origin:center;
        border-radius:999px;background:#06141f;border:2px solid #66e9ff;
        box-shadow:0 0 8px rgba(102,233,255,.75),inset 0 0 5px rgba(102,233,255,.18);
        z-index:8;pointer-events:none;opacity:.95;
        animation:egonarMouthIdle 2.8s ease-in-out infinite;
      }
      #egonar-voice-assistant.is-speaking .egonar-robot-mouth,
      #egonar-voice-assistant .egonar-robot-mouth.is-speaking{
        animation:egonarMouthTalk .16s ease-in-out infinite alternate;
      }
      #egonar-voice-assistant.is-speaking .voice-form::before{
        filter:drop-shadow(0 8px 32px rgba(91,215,255,.68));
      }
      @keyframes egonarMouthIdle{0%,100%{height:4px;transform:translate(-50%,8px) scaleY(.65)}50%{height:5px;transform:translate(-50%,8px) scaleY(.9)}}
      @keyframes egonarMouthTalk{0%{height:4px;width:18px;transform:translate(-50%,8px) scaleY(.7)}35%{height:9px;width:27px;transform:translate(-50%,8px) scaleY(1)}70%{height:5px;width:21px;transform:translate(-50%,8px) scaleY(.78)}100%{height:11px;width:29px;transform:translate(-50%,8px) scaleY(1.05)}}
      @media(max-width:600px){#egonar-voice-assistant .egonar-robot-mouth{left:26px;width:21px}}
      @media(prefers-reduced-motion:reduce){#egonar-voice-assistant .egonar-robot-mouth{animation:none!important}}
    `;
    document.head.appendChild(style);
  };

  const voiceScore = (voice, lang) => {
    const name = String(voice.name || '').toLowerCase();
    const vlang = String(voice.lang || '').toLowerCase();
    const wanted = String(lang || '').toLowerCase();
    let score = 0;
    if (vlang === wanted) score += 100;
    if (vlang.startsWith(wanted.split('-')[0])) score += 55;
    if (voice.default) score += 18;
    if (voice.localService === false) score += 10;
    if (/natural|neural|online|premium|enhanced|google|microsoft|siri|ava|amelie|samantha|victoria|sophia|thomas|daniel/.test(name)) score += 18;
    if (wanted.startsWith('fr') && /france|french|français|francais/.test(name)) score += 12;
    if (wanted.startsWith('en') && /english|united states|united kingdom|google us|google uk/.test(name)) score += 12;
    return score;
  };

  const pickVoice = lang => {
    refresh();
    const wanted = String(lang || '').slice(0, 2).toLowerCase();
    const matches = voices.filter(v => String(v.lang || '').toLowerCase().startsWith(wanted));
    return (matches.length ? matches : voices).slice().sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0] || null;
  };

  const ensureMouth = section => {
    injectLipSyncStyle();
    if (!section) return;
    const form = section.querySelector('.voice-form');
    if (!form || form.querySelector('.egonar-robot-mouth')) return;
    const mouth = document.createElement('span');
    mouth.className = 'egonar-robot-mouth';
    mouth.setAttribute('aria-hidden', 'true');
    form.appendChild(mouth);
  };

  const setSpeaking = active => {
    const section = document.getElementById('egonar-voice-assistant');
    if (!section) return;
    ensureMouth(section);
    section.classList.toggle('is-speaking', !!active);
    section.querySelector('.egonar-robot-mouth')?.classList.toggle('is-speaking', !!active);
  };

  // La bouche suit l'état réel de SpeechSynthesis, donc l'animation démarre
  // exactement lorsque le navigateur considère que la voix est en train de parler.
  let wasSpeaking = false;
  window.setInterval(() => {
    const active = !!synth.speaking;
    if (active !== wasSpeaking) {
      wasSpeaking = active;
      setSpeaking(active);
    }
    const section = document.getElementById('egonar-voice-assistant');
    if (section) ensureMouth(section);
  }, 60);

  // Sélection automatique d'une voix plus naturelle, avec fallback natif si le navigateur refuse.
  try {
    const originalSpeak = synth.speak.bind(synth);
    synth.speak = utterance => {
      try {
        if (utterance instanceof SpeechSynthesisUtterance) {
          const lang = utterance.lang || document.documentElement.lang || 'fr-FR';
          const voice = pickVoice(lang);
          if (voice) utterance.voice = voice;
          utterance.lang = voice?.lang || lang;
          utterance.rate = String(lang).toLowerCase().startsWith('en') ? 0.93 : 0.92;
          utterance.pitch = String(lang).toLowerCase().startsWith('en') ? 1.01 : 1.03;
          utterance.volume = 1;
          ensureMouth(document.getElementById('egonar-voice-assistant'));
        }
      } catch (_) {}
      try {
        return originalSpeak(utterance);
      } catch (_) {
        try {
          if (utterance instanceof SpeechSynthesisUtterance) utterance.voice = null;
          return originalSpeak(utterance);
        } catch (_) { return undefined; }
      }
    };
  } catch (_) {}
})();
