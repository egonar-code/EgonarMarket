(() => {
  if (!('speechSynthesis' in window)) {
    window.egonarSpeak = () => false;
    return;
  }

  const synth = window.speechSynthesis;
  let voices = [];
  let currentUtterance = null;

  const refresh = () => {
    voices = synth.getVoices() || [];
  };

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
    if (voice.localService === false) score += 12;
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

  const setSpeaking = active => {
    const section = document.getElementById('egonar-voice-assistant');
    if (!section) return;
    section.classList.toggle('is-speaking', !!active);
    const mouth = section.querySelector('.egonar-robot-mouth');
    mouth?.classList.toggle('is-speaking', !!active);
  };

  const waitForVoices = () => new Promise(resolve => {
    refresh();
    if (voices.length) return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if ('onvoiceschanged' in synth) synth.removeEventListener('voiceschanged', finish);
      refresh();
      resolve();
    };
    if ('onvoiceschanged' in synth) {
      synth.addEventListener('voiceschanged', finish, { once: true });
      window.setTimeout(finish, 700);
    } else {
      window.setTimeout(finish, 120);
    }
  });

  const cleanText = text => String(text || '').replace(/\s+/g, ' ').trim();

  window.egonarSpeak = async (text, lang = 'fr-FR') => {
    const clean = cleanText(text);
    if (!clean) return false;
    await waitForVoices();

    try { synth.cancel(); } catch (_) {}
    setSpeaking(false);

    const utterance = new SpeechSynthesisUtterance(clean);
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || lang;
    utterance.rate = String(lang).toLowerCase().startsWith('en') ? 0.93 : 0.91;
    utterance.pitch = String(lang).toLowerCase().startsWith('en') ? 1.01 : 1.03;
    utterance.volume = 1;
    currentUtterance = utterance;

    utterance.addEventListener('start', () => {
      currentUtterance = utterance;
      setSpeaking(true);
    });
    utterance.addEventListener('end', () => {
      if (currentUtterance === utterance) currentUtterance = null;
      setSpeaking(false);
    });
    utterance.addEventListener('error', () => {
      if (currentUtterance === utterance) currentUtterance = null;
      setSpeaking(false);
    });

    try {
      synth.speak(utterance);
      return true;
    } catch (_) {
      setSpeaking(false);
      return false;
    }
  };
})();
