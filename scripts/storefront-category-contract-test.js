const fs = require('fs');

const pages = [
  ['apps/web/index.html', 'MARKET', ['SAVEURS', 'EVASION']],
  ['apps/web/food.html', 'SAVEURS', ['MARKET', 'EVASION']],
  ['apps/web/travel.html', 'EVASION', ['MARKET', 'SAVEURS']]
];

const expectedCounts = { MARKET: 17, SAVEURS: 12, EVASION: 16 };
let failed = 0;

for (const [file, universe, forbidden] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const body = html.match(/<body\\b[^>]*>/i)?.[0] || '';
  if (!new RegExp('data-universe=["']' + universe + '["']', 'i').test(body)) {
    console.error('✗ ' + file + ': univers ' + universe + ' absent du body');
    failed++;
  } else {
    console.log('✓ ' + file + ': univers ' + universe + ' correctement déclaré');
  }

  for (const other of forbidden) {
    const pattern = new RegExp('(?:' + other + '|catégories\\s+' + other + ')', 'i');
    if (pattern.test(html)) {
      console.error('✗ ' + file + ': contenu statique cross-univers détecté (' + other + ')');
      failed++;
    }
  }

  if (html.includes('class="egonar-all-categories"')) {
    console.error('✗ ' + file + ': conteneur statique de catégories encore présent');
    failed++;
  } else {
    console.log('✓ ' + file + ': catégories construites dynamiquement par l'univers courant');
  }

  const header = fs.readFileSync('apps/web/category-header-nav.js', 'utf8');
  const count = expectedCounts[universe];
  if (!header.includes(universe + ':') || !header.includes("'" + (universe === 'MARKET' ? 'Services' : universe === 'SAVEURS' ? 'Offres & Menus' : 'Destinations') + "'")) {
    console.error('✗ taxonomy runtime incomplète pour ' + universe);
    failed++;
  }
}

if (failed) {
  console.error('\n' + failed + ' contrôle(s) storefront ont échoué.');
  process.exit(1);
}
console.log('\nstorefront-category-contract-test: OK');
