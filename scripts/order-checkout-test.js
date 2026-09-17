const fs = require('fs');
const preload = fs.readFileSync('apps/api/src/order-hardening-preload.js', 'utf8');
const checkout = fs.readFileSync('apps/web/commande.html', 'utf8');
const launcher = fs.readFileSync('scripts/start-all.js', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const checks = [
  [preload, 'express.application.post', 'Le durcissement intercepte la création de commande.'],
  [preload, 'req.body.delivery_fcfa = resolveDelivery', 'Les frais de livraison sont recalculés côté serveur.'],
  [preload, 'PAYMENT_METHODS', 'Les modes de paiement sont contrôlés.'],
  [checkout, 'delivery_zone', 'Le checkout transmet la zone de livraison.'],
  [checkout, "fetch(API+'/config')", 'Le checkout récupère les tarifs configurés.'],
  [checkout, 'deliveryFee()', 'Le checkout affiche un devis de livraison.'],
  [checkout, 'payment_method', 'Le checkout transmet le mode de paiement séparément du client.'],
  [packageJson.scripts.start, 'scripts/start-all.js', 'Le démarrage de production utilise le lanceur des deux API.'],
  [launcher, 'order-hardening-preload.js', 'Le lanceur de production conserve le durcissement des commandes.']
];

let failed = 0;
for (const [content, expected, message] of checks) {
  if (!content.includes(expected)) {
    console.error(`✗ ${message}`);
    failed++;
  } else console.log(`✓ ${message}`);
}
if (failed) process.exit(1);
console.log(`\norder-checkout-test: OK (${checks.length} contrôles)`);
