#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PREVIEW_PORT || 8080);
const ROOT = path.join(__dirname, '..', 'apps', 'web');

const products = [
  { id: 'demo-1', name: 'T-shirt qualité premium', category: 'Mode', description: 'Coupe moderne et tissu confortable.', price_fcfa: 10000, old_price_fcfa: 12000, stock: 20, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80' },
  { id: 'demo-2', name: 'Sac Élégance', category: 'Accessoires', description: 'Un sac moderne et élégant pour le quotidien.', price_fcfa: 18000, stock: 12, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80' },
  { id: 'demo-3', name: 'Montre classique', category: 'Mode', description: 'Montre au design intemporel.', price_fcfa: 25000, stock: 8, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80' },
  { id: 'demo-4', name: 'Écouteurs Bluetooth', category: 'Tech', description: 'Son sans fil pratique pour le quotidien.', price_fcfa: 15000, stock: 10, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80' }
];

function sendJson(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function safePath(requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const target = path.normalize(path.join(ROOT, decoded === '/' ? '/index.html' : decoded));
  if (!target.startsWith(ROOT)) return null;
  return target;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/', true);
  const pathname = parsed.pathname || '/';

  if (pathname === '/api/health') return sendJson(res, 200, { ok: true, mode: 'preview', service: 'EgonarMarket' });
  if (pathname === '/api/products') return sendJson(res, 200, products);
  if (pathname.startsWith('/api/products/')) {
    const id = pathname.split('/').pop();
    const product = products.find(p => p.id === id);
    return product ? sendJson(res, 200, product) : sendJson(res, 404, { error: 'Produit introuvable.' });
  }
  if (pathname === '/api/categories') return sendJson(res, 200, [...new Set(products.map(p => p.category))]);
  if (pathname === '/api/ai/search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let message = '';
      try { message = String(JSON.parse(body || '{}').message || '').toLowerCase(); } catch {}
      const budgetMatch = message.match(/(?:moins de|à moins de|budget de)\s*([0-9\s]+)/);
      const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, '')) : null;
      const words = message.split(/\s+/).filter(Boolean);
      const result = products.filter(p => {
        const hay = `${p.name} ${p.category} ${p.description}`.toLowerCase();
        const textMatch = words.length === 0 || words.some(w => w.length > 3 && hay.includes(w));
        const budgetMatchOk = !budget || p.price_fcfa <= budget;
        return textMatch && budgetMatchOk;
      });
      sendJson(res, 200, { message: 'Résultats de démonstration', budget, products: result.length ? result : products.slice(0, 3) });
    });
    return;
  }

  const filePath = safePath(pathname);
  if (!filePath) return sendJson(res, 403, { error: 'Accès refusé.' });
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return sendJson(res, 404, { error: 'Fichier introuvable.' });
    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`EgonarMarket preview: http://0.0.0.0:${PORT}`));
