const fs = require('fs');
const path = require('path');

const baseFile = path.join(__dirname, '..', 'db', 'migrations', '20260916_category_taxonomy.sql');
const fixFile = path.join(__dirname, '..', 'db', 'migrations', '20260916_category_taxonomy_fix.sql');
const sql = fs.readFileSync(baseFile, 'utf8');
const fix = fs.readFileSync(fixFile, 'utf8');
const required = {
  MARKET: ['Mode & Vêtements','Téléphones & Accessoires','Informatique & Électronique','Maison & Décoration','Électroménager','Beauté & Soins','Bébé & Enfant','Sports & Loisirs','Alimentation & Épicerie','Supermarché & Quotidien','Accessoires & Maroquinerie','Auto & Moto','Bricolage & Jardin','Bureau & Fournitures','Livres, Culture & Éducation','Produits locaux & Artisanat','Services'],
  SAVEURS: ['Restaurants','Plats sénégalais','Fast-Food','Petit-déjeuner & Brunch','Boissons','Desserts & Pâtisseries','Épicerie','Fruits & Légumes','Boucherie & Poissonnerie','Traiteur & Événementiel','Cuisine maison','Offres & Menus'],
  EVASION: ['Hôtels','Appartements & Locations','Résidences & Maisons d’hôtes','Plages & Resorts','Excursions','Activités & Expériences','Tourisme & Culture','Restaurants & Gastronomie','Transport & Mobilité','Billetterie & Événements','Voyages organisés','Lune de miel & Romantique','Famille','Business & Séminaires','Bien-être','Destinations']
};
for (const [universe, categories] of Object.entries(required)) {
  const tupleCount = (sql.match(new RegExp(`\\('${universe}',`, 'g')) || []).length;
  if (tupleCount < categories.length) throw new Error(`Nombre de catégories insuffisant pour ${universe}: ${tupleCount}/${categories.length}`);
  for (const category of categories) {
    if (!sql.includes(`'${category}'`)) throw new Error(`Catégorie manquante: ${universe} / ${category}`);
  }
}
if (!sql.includes('CREATE TABLE IF NOT EXISTS category_catalog')) throw new Error('Table category_catalog manquante');
if (!sql.includes('filters JSONB')) throw new Error('Métadonnées de filtres manquantes');
if (!sql.includes('parent_slug')) throw new Error('Hiérarchie parent/sous-catégorie manquante');
if (!fix.includes("'maison-deco'")) throw new Error('Correction de la sous-catégorie Décoration manquante');
console.log('category-taxonomy-test: OK');
