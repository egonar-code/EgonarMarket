const fs = require('fs');

const pages = [
  ['apps/web/index.html', 'MARKET'],
  ['apps/web/food.html', 'SAVEURS'],
  ['apps/web/travel.html', 'EVASION']
];

let failed = 0;

for (const [file, universe] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const body = html.match(/<body\\b[^>]*>/i)?.[0] || '';

  if (!new RegExp('data-universe=["']' + universe + '["']', 'i').test(body)) {
    console.error('✗ ' + file + ': univers ' + universe + ' absent du body');
    failed++;
  } else {
    console.log('✓ ' + file + ': univers ' + universe + ' correctement déclaré');
  }

  if (html.includes('class="egonar-all-categories"')) {
    console.error('✗ ' + file + ': catégories statiques encore présentes');
    failed++;
  } else {
    console.log('✓ ' + file + ': catégories construites dynamiquement');
  }
}

const header = fs.readFileSync('apps/web/category-header-nav.js', 'utf8');
const taxonomyChecks = [
  ['MARKET', 'Services', 17],
  ['SAVEURS', 'Offres & Menus', 12],
  ['EVASION', 'Destinations', 16]
];

for (const [universe, lastCategory, count] of taxonomyChecks) {
  if (!header.includes(universe + ':') || !header.includes("'" + lastCategory + "'") || !header.includes('DATA[current].length')) {
    console.error('✗ taxonomy runtime incomplète pour ' + universe + ' (' + count + ' catégories attendues)');
    failed++;
  } else {
    console.log('✓ taxonomy runtime présente pour ' + universe + ' (' + count + ' catégories attendues)');
  }
}

if (failed) {
  console.error('\\n' + failed + ' contrôle(s) storefront ont échoué.');
  process.exit(1);
}

console.log('\\nstorefront-category-contract-test: OK');
