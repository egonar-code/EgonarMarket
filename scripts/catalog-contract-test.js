const fs = require("fs");

const read = path => fs.readFileSync(path, "utf8");
const checks = [
  ["db/schema.sql", "CHECK (universe IN ('MARKET','SAVEURS','EVASION'))", "Le schéma autorise les trois univers."],
  ["db/schema.sql", "trg_products_publication_state", "Le schéma applique le garde-fou de publication."],
  ["db/schema.sql", "approval_status IS DISTINCT FROM 'APPROVED'", "Le schéma désactive les produits non approuvés existants."],
  ["db/migrations/20260916_product_universes.sql", "ADD COLUMN IF NOT EXISTS universe TEXT NOT NULL DEFAULT 'MARKET'", "La migration des univers est présente."],
  ["db/migrations/20260916_product_publication_guard.sql", "trg_products_publication_state", "Le garde-fou de publication est présent."],
  ["apps/web/app.js", "URLSearchParams({universe:\"MARKET\"})", "Le catalogue Market est explicitement filtré."],
  ["apps/web/food-app.js", "universe=SAVEURS", "Saveurs utilise son univers dédié."],
  ["apps/web/travel-app.js", "universe=EVASION", "Évasion utilise son univers dédié."],
  ["apps/web/food-app.js", "product_id:id,quantity:1", "Saveurs ajoute au panier avec le contrat product_id/quantity."],
  ["apps/web/travel-app.js", "product_id:id,quantity:1", "Évasion ajoute au panier avec le contrat product_id/quantity."],
  ["apps/api/src/server.js", "const UNIVERSES = new Set([\"MARKET\",\"SAVEURS\",\"EVASION\"])", "L'API valide les univers."],
  ["apps/api/src/supplier-server.js", "active,approval_status,supplier_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,'PENDING'", "Les produits fournisseurs sont inactifs tant qu'ils ne sont pas validés."],
  ["apps/api/src/supplier-server.js", "approval === \"APPROVED\"", "L'approbation admin pilote l'activation publique."],
];

let failed = 0;
for (const [file, expected, message] of checks) {
  if (!fs.existsSync(file)) {
    console.error(`✗ ${file}: fichier introuvable`);
    failed++;
    continue;
  }
  const content = read(file);
  if (!content.includes(expected)) {
    console.error(`✗ ${message}`);
    failed++;
  } else {
    console.log(`✓ ${message}`);
  }
}

if (failed) {
  console.error(`\n${failed} contrôle(s) ont échoué.`);
  process.exit(1);
}
console.log(`\nTous les contrôles catalogue/univers sont OK (${checks.length}).`);
