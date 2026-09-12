const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function detectLanguage(text, requested = 'auto') {
  if (requested === 'fr' || requested === 'en') return requested;
  const q = normalize(text);
  const english = /\b(i|want|need|looking|find|under|budget|gift|product|delivery|today|tomorrow|hotel|restaurant)\b/i.test(q);
  return english ? 'en' : 'fr';
}

function parseBudget(text) {
  const q = normalize(text);
  const m = q.match(/(?:moins de|a moins de|budget|max|maximum|under|less than)\s*([0-9][0-9\s]*)/i) || q.match(/([0-9][0-9\s]{2,})\s*(?:fcfa|f|francs?)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/\s/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildIntent(message, options = {}) {
  const q = normalize(message);
  const stop = new Set(['pour','avec','moins','plus','dans','une','des','les','cherche','recherche','donne','moi','je','veux','mon','ma','un','a','au','en','et','the','for','with','under','less','than','i','want','need','find','looking']);
  const words = q.split(/\s+/).filter(w => w.length > 2 && !stop.has(w)).slice(0, 12);
  const city = ['dakar','thies','thies','rufisque','saly','pikine','guediawaye'].find(c => q.includes(c)) || '';
  return {
    language: detectLanguage(message, options.language || 'auto'),
    budget: parseBudget(message),
    city,
    fastDelivery: /aujourd|maintenant|urgent|today|now|fast/i.test(q),
    words
  };
}

function scoreProduct(product, intent) {
  let score = 0;
  const hay = normalize([product.name, product.description, product.category, product.subcategory].join(' '));
  for (const word of intent.words) if (hay.includes(word)) score += 12;
  if (intent.budget) {
    const price = Number(product.price_fcfa || 0);
    score += price <= intent.budget ? 25 : -Math.min(30, Math.ceil(((price - intent.budget) / intent.budget) * 30));
  }
  if (Number(product.stock || 0) > 0) score += 14;
  score += Math.min(10, Number(product.rating_average || 0) * 2);
  score += Math.min(20, Number(product.verification_score || 0) * 0.2);
  if (product.verified_level === 'VERIFIED') score += 10;
  if (product.verified_level === 'PREMIUM') score += 16;
  if (intent.city && normalize(product.delivery_city) === normalize(intent.city)) score += 8;
  if (intent.fastDelivery && Number(product.delivery_max_minutes || 0) > 0 && Number(product.delivery_max_minutes) <= 120) score += 8;
  return Math.round(Math.max(0, score));
}

function rankProducts(products, intent) {
  return products.map(p => ({ ...p, egonar_match_score: scoreProduct(p, intent), egonar_verified: ['VERIFIED','PREMIUM'].includes(p.verified_level) }))
    .sort((a, b) => b.egonar_match_score - a.egonar_match_score || Number(b.stock || 0) - Number(a.stock || 0));
}

function buildReply(language, count, intent) {
  if (language === 'en') return count ? `I found ${count} relevant result${count > 1 ? 's' : ''}. The most relevant and trusted options are ranked first.` : 'I could not find an exact match. Add a budget, city, or more detail.';
  return count ? `J’ai trouvé ${count} résultat${count > 1 ? 's' : ''}. Les options les plus pertinentes et les plus fiables sont classées en premier.` : 'Je n’ai pas trouvé de résultat exact. Ajoutez un budget, une ville ou précisez votre besoin.';
}

module.exports = { normalize, detectLanguage, parseBudget, buildIntent, scoreProduct, rankProducts, buildReply };