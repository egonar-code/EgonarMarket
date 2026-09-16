const fs = require('fs');
const vm = require('vm');
const runtimeSource = fs.readFileSync(require.resolve('../apps/web/category-runtime.js'), 'utf8');
const catalog = {
  MARKET: [['mode','Mode & Vêtements','👕',['Femme','Homme','Enfant']]],
  SAVEURS: [['plats-senegalais','Plats sénégalais','🍲',['Thiéboudienne','Yassa']]],
  EVASION: [['hotels','Hôtels','🏨',['Hôtels de luxe','Hôtels économiques']]]
};
const context = { window: { EgonarCategoryCatalog: catalog } };
vm.runInNewContext(runtimeSource, context);
const api = context.window.EgonarCategoryRuntime;
if (!api || typeof api.resolve !== 'function') throw new Error('Runtime catégories non initialisé');
const checks = [
  ['MARKET', 'Mode & Vêtements', 'mode'],
  ['MARKET', 'Femme', 'mode'],
  ['SAVEURS', 'Thiéboudienne', 'plats-senegalais'],
  ['EVASION', 'Hôtels de luxe', 'hotels']
];
for (const [universe, label, expected] of checks) {
  const result = api.resolve(universe, label);
  if (!result || result.slug !== expected) throw new Error(`Résolution invalide: ${universe}/${label}`);
}
if (api.resolve('MARKET', 'inconnu') !== null) throw new Error('Une catégorie inconnue ne doit pas être résolue');
console.log('category-runtime-test: OK');
