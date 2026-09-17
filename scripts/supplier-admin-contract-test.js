const fs = require('fs');

const bootstrap = fs.readFileSync('scripts/codespace-bootstrap.sh', 'utf8');
const supplier = fs.readFileSync('apps/web/supplier-app.js', 'utf8');
const admin = fs.readFileSync('apps/web/admin-fournisseurs.html', 'utf8');

const checks = [
  [bootstrap, 'SUPPLIER_PORT="${SUPPLIER_PORT:-3001}"', 'Le bootstrap définit un port fournisseur dédié.'],
  [bootstrap, 'node apps/api/src/supplier-server.js', 'Le bootstrap démarre le serveur fournisseurs.'],
  [bootstrap, '/api/health" >/dev/null 2>&1', 'Le bootstrap vérifie la disponibilité des API.'],
  [supplier, 'window.EGONAR_SUPPLIER_API', 'Le dashboard fournisseur accepte une URL API configurable.'],
  [supplier, '/api/supplier/me', 'Le dashboard fournisseur utilise les routes fournisseurs.'],
  [admin, "const API='/api'", 'Le centre fournisseurs conserve l’API principale pour l’authentification admin.'],
  [admin, 'const supplierJ=', 'Le centre fournisseurs utilise une API dédiée pour la gestion des fournisseurs.'],
  [admin, '/api/supplier/admin/suppliers', 'Le centre fournisseurs appelle les routes admin fournisseurs sur le bon serveur.']
];

let failed = 0;
for (const [contentText, expected, message] of checks) {
  if (!contentText.includes(expected)) {
    console.error(`✗ ${message}`);
    failed++;
  } else {
    console.log(`✓ ${message}`);
  }
}

if (failed) {
  console.error(`\n${failed} contrôle(s) d’intégration fournisseurs ont échoué.`);
  process.exit(1);
}
console.log(`\nsupplier-admin-contract-test: OK (${checks.length} contrôles)`);