(() => {
  if (!('speechSynthesis' in window)) return;

  const synth = window.speechSynthesis;
  let voices = [];

  const refresh = () => { voices = synth.getVoices() || []; };
  refresh();
  if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', refresh);

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

  // Surveille directement l'état réel de SpeechSynthesis : la bouche suit la parole,
  // même lorsque le navigateur ne permet pas de remplacer speechSynthesis.speak().
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

  // Quand la voix démarre, on choisit automatiquement la meilleure voix disponible.
  // Le patch reste volontairement léger pour ne jamais bloquer SpeechSynthesis.
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
        // Fallback : si un navigateur refuse la voix sélectionnée, on relance avec les
        // paramètres natifs sans sélection forcée.
        try {
          if (utterance instanceof SpeechSynthesisUtterance) {
            utterance.voice = null;
            utterance.lang = utterance.lang || 'fr-FR';
          }
          return originalSpeak(utterance);
        } catch (_) { return undefined; }
      }
    };
  } catch (_) {}
})();
