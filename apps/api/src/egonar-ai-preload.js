const express = require('express');
const db = require('./db');
const { buildIntent, rankProducts, buildReply } = require('./egonar-ai');

const originalPost = express.application.post;
const originalGet = express.application.get;

express.application.post = function patchedPost(path, ...handlers) {
  if (path === '/api/ai/search') {
    return originalPost.call(this, path, async (req, res) => {
      try {
        const message = String(req.body?.message || '').trim();
        const language = String(req.body?.language || 'auto');
        if (!message) return res.status(400).json({ error: 'Votre demande est vide.' });
        const intent = buildIntent(message, { language });
        const params = [];
        const clauses = intent.words.map(word => {
          params.push(`%${word}%`);
          const n = params.length;
          return `(name ILIKE $${n} OR description ILIKE $${n} OR category ILIKE $${n} OR subcategory ILIKE $${n})`;
        });
        let sql = `SELECT id,name,category,subcategory,description,price_fcfa,stock,image_url,verified_level,verification_score,rating_average,rating_count,delivery_min_minutes,delivery_max_minutes,delivery_city FROM products WHERE active=TRUE`;
        if (clauses.length) sql += ` AND (${clauses.join(' OR ')})`;
        if (intent.budget) { params.push(intent.budget); sql += ` AND price_fcfa <= $${params.length}`; }
        sql += ' LIMIT 40';
        const result = await db.query(sql, params);
        const products = rankProducts(result.rows, intent).slice(0, 12);
        res.json({ message, language: intent.language, intent: { budget: intent.budget, city: intent.city, fastDelivery: intent.fastDelivery }, reply: buildReply(intent.language, products.length, intent), products });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Recherche Egonar AI indisponible.' });
      }
    });
  }
  return originalPost.call(this, path, ...handlers);
};

express.application.get = function patchedGet(path, ...handlers) {
  if (path === '/api/products') {
    return originalGet.call(this, path, async (req, res) => {
      try {
        const q = String(req.query.q || '').trim();
        const category = String(req.query.category || '').trim();
        const params = [];
        const where = ['active = TRUE'];
        if (q) { params.push(`%${q}%`); const n = params.length; where.push(`(name ILIKE $${n} OR description ILIKE $${n} OR category ILIKE $${n} OR sku ILIKE $${n})`); }
        if (category) { params.push(category); where.push(`category = $${params.length}`); }
        const result = await db.query(`SELECT id,name,slug,category,subcategory,description,price_fcfa,old_price_fcfa,stock,sku,image_url,verified_level,verification_score,rating_average,rating_count,delivery_min_minutes,delivery_max_minutes,delivery_city FROM products WHERE ${where.join(' AND ')} ORDER BY stock > 0 DESC, created_at DESC`, params);
        res.json(result.rows);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Impossible de charger les produits.' });
      }
    });
  }
  return originalGet.call(this, path, ...handlers);
};
