const fs = require('fs');

const admin = fs.readFileSync('apps/web/admin.html', 'utf8');
const tracking = fs.readFileSync('apps/web/suivi.html', 'utf8');
const checkout = fs.readFileSync('apps/web/commande.html', 'utf8');
const preload = fs.readFileSync('apps/api/src/order-hardening-preload.js', 'utf8');

const checks = [
  [admin, "j('/admin/orders')", "Le tableau admin charge les commandes depuis l'API sécurisée."],
  [admin, "'/api/admin/orders/'+id+'/status'", "Le tableau admin utilise la route de changement de statut."],
  [admin, 'EN_ATTENTE_PAIEMENT', "Le tableau admin connaît le statut de paiement en attente."],
  [admin, 'EN_LIVRAISON', "Le tableau admin connaît le statut de livraison."],
  [admin, 'ANNULEE', "Le tableau admin connaît le statut d'annulation."],
  [admin, 'orders.filter(x=>x.status!==\'ANNULEE\')', "Le chiffre d'affaires exclut les commandes annulées."],
  [tracking, '/api/orders/:order_number', "Le suivi client repose sur le numéro de commande."],
  [tracking, 'setInterval(load,30000)', "Le suivi actualise automatiquement l'état de la commande."],
  [checkout, "suivi.html?order=", "Le checkout redirige vers le suivi après création."],
  [preload, 'status', "Le durcissement serveur traite le statut de commande."]
];

let failed = 0;
for (const [content, expected, message] of checks) {
  if (!content.includes(expected)) {
    console.error(`✗ ${message}`);
    failed++;
  } else {
    console.log(`✓ ${message}`);
  }
}

if (failed) {
  console.error(`\n${failed} contrôle(s) admin/commandes ont échoué.`);
  process.exit(1);
}
console.log(`\nadmin-orders-contract-test: OK (${checks.length} contrôles)`);
