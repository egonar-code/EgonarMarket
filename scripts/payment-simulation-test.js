const { spawn } = require('child_process');
const http = require('http');

const BASE = 'http://127.0.0.1:3010';
const env = {
  ...process.env,
  PORT: '3010',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://egonar:egonar_password@127.0.0.1:5432/egonarmarket',
  JWT_SECRET: process.env.JWT_SECRET || 'egonarmarket-payment-test-secret',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@egonarmarket.sn',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'EgonarCI2026!',
  NODE_ENV: 'test',
  DELIVERY_DAKAR_FCFA: '1500',
  DELIVERY_OTHER_FCFA: '3000'
};

function waitForHealth() {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const attempt = () => {
      http.get(BASE + '/api/health', res => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - started > 15000) return reject(new Error('API non disponible après 15 secondes.'));
      setTimeout(attempt, 250);
    };
    attempt();
  });
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const server = spawn(process.execPath, ['-r', './apps/api/src/order-hardening-preload.js', 'apps/api/src/server.js'], {
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  server.stderr.on('data', chunk => { stderr += chunk.toString(); });

  try {
    await waitForHealth();

    const products = await request('/api/products?universe=MARKET');
    if (products.status !== 200 || !products.body.length) throw new Error('Aucun produit MARKET approuvé disponible pour le test.');
    const product = products.body.find(p => Number(p.stock) >= 4) || products.body[0];

    const baseCustomer = {
      name: 'Client Test Paiement',
      phone: '+221770000000',
      email: 'payment-test@egonarmarket.sn',
      address: 'Rue Test 1',
      city: 'Dakar'
    };

    const createOrder = payment_method => request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: baseCustomer,
        payment_method,
        delivery_zone: 'DAKAR',
        delivery_fcfa: 999999,
        items: [{ product_id: product.id, quantity: 1 }]
      })
    });

    const methods = ['A_PAYER', 'LIVRAISON', 'WAVE', 'ORANGE_MONEY'];
    const orders = [];
    for (const method of methods) {
      const result = await createOrder(method);
      if (result.status !== 201) throw new Error(method + ': création refusée: ' + JSON.stringify(result.body));
      orders.push({ method, ...result.body });
    }

    if (!['CONFIRMEE', 'CONFIRMEE'].every((x, i) => orders[i].status === x)) {
      throw new Error('A_PAYER/LIVRAISON doivent créer une commande confirmée.');
    }
    if (orders[2].status !== 'EN_ATTENTE_PAIEMENT' || orders[3].status !== 'EN_ATTENTE_PAIEMENT') {
      throw new Error('WAVE/ORANGE_MONEY doivent rester en attente de paiement.');
    }
    if (orders.some(o => o.payment_status !== 'PENDING')) {
      throw new Error('Le paiement simulé doit rester explicitement PENDING.');
    }
    if (orders.some(o => Number(o.total_fcfa) !== Number(product.price_fcfa) + 1500)) {
      throw new Error('Le serveur doit recalculer les frais de livraison Dakar à 1500 FCFA.');
    }

    const invalidPayment = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: baseCustomer,
        payment_method: 'BITCOIN',
        delivery_zone: 'DAKAR',
        items: [{ product_id: product.id, quantity: 1 }]
      })
    });
    if (invalidPayment.status !== 400) throw new Error('Un mode de paiement invalide a été accepté.');

    const missingLocation = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customer: { ...baseCustomer, city: '' },
        payment_method: 'LIVRAISON',
        items: [{ product_id: product.id, quantity: 1 }]
      })
    });
    if (missingLocation.status !== 400) throw new Error('Une commande sans zone ni ville a été acceptée.');

    const tracked = await request('/api/orders/' + encodeURIComponent(orders[2].order_number));
    if (tracked.status !== 200 || tracked.body.status !== 'EN_ATTENTE_PAIEMENT') {
      throw new Error('Le suivi de commande ne reflète pas le statut de paiement.');
    }

    console.log('✓ A_PAYER et LIVRAISON → CONFIRMEE');
    console.log('✓ WAVE et ORANGE_MONEY → EN_ATTENTE_PAIEMENT');
    console.log('✓ Frais de livraison recalculés côté serveur (Dakar = 1500 FCFA)');
    console.log('✓ Montant de livraison falsifié ignoré');
    console.log('✓ Mode de paiement invalide bloqué');
    console.log('✓ Localisation de livraison obligatoire');
    console.log('✓ Suivi de commande cohérent');
    console.log('\npayment-simulation-test: OK');
  } finally {
    server.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 300));
    if (server.exitCode && server.exitCode !== 0) {
      console.error(stderr);
    }
  }
}

main().catch(err => {
  console.error('payment-simulation-test: FAIL');
  console.error(err.message || err);
  process.exit(1);
});
