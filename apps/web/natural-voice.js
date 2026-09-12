(() => {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const originalSpeak = synth.speak.bind(synth);
  let voices = [];

  const refresh = () => { voices = synth.getVoices(); };
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
    if (voice.localService === false) score += 22;
    if (/natural|neural|online|premium|enhanced|google|microsoft|siri|ava|amelie|samantha|victoria|sophia|thomas|daniel/.test(name)) score += 18;
    if (wanted.startsWith('fr') && /france|french|français|francais|google français|google francais/.test(name)) score += 12;
    if (wanted.startsWith('en') && /english|united states|united kingdom|google us|google uk/.test(name)) score += 12;
    return score;
  };

  const pickVoice = lang => {
    const matches = voices.filter(v => String(v.lang || '').toLowerCase().startsWith(String(lang || '').slice(0, 2).toLowerCase()));
    return (matches.length ? matches : voices).slice().sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang))[0] || null;
  };

  const naturalizeText = text => String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\bEgonar AI\b/g, 'Egonar AI')
    .replace(/([.!?])\s+/g, '$1 ')
    .trim();

  const speak = utterance => {
    if (!(utterance instanceof SpeechSynthesisUtterance)) return originalSpeak(utterance);
    const lang = utterance.lang || document.documentElement.lang || 'fr-FR';
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || lang;
    utterance.rate = lang.toLowerCase().startsWith('en') ? 0.93 : 0.91;
    utterance.pitch = lang.toLowerCase().startsWith('en') ? 1.01 : 1.03;
    utterance.volume = 1;
    utterance.text = naturalizeText(utterance.text);

    const section = document.getElementById('egonar-voice-assistant');
    section?.classList.add('is-speaking');
    utterance.addEventListener('end', () => section?.classList.remove('is-speaking'));
    utterance.addEventListener('error', () => section?.classList.remove('is-speaking'));
    return originalSpeak(utterance);
  };

  try { synth.speak = speak; } catch (_) {}
})();
