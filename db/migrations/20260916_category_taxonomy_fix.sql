DELETE FROM category_catalog
WHERE universe='MARKET' AND slug='maison-decoration';

INSERT INTO category_catalog (universe, slug, name, description, icon, sort_order, filters)
VALUES (
  'MARKET','maison-decoration','Maison & Décoration','Mobilier, décoration, rangement et équipement de la maison.','🏠',40,
  '{"room":["Salon","Chambre","Cuisine","Salle de bain","Bureau"],"condition":["Neuf","Seconde main"]}'
)
ON CONFLICT (universe, slug) DO UPDATE SET
  name=EXCLUDED.name,
  description=EXCLUDED.description,
  icon=EXCLUDED.icon,
  sort_order=EXCLUDED.sort_order,
  filters=EXCLUDED.filters,
  updated_at=NOW();

INSERT INTO category_catalog (universe, slug, name, description, parent_slug, sort_order)
VALUES ('MARKET','maison-deco','Décoration','Objets et accessoires déco.','maison-decoration',42)
ON CONFLICT (universe, slug) DO UPDATE SET
  name=EXCLUDED.name,
  description=EXCLUDED.description,
  parent_slug=EXCLUDED.parent_slug,
  sort_order=EXCLUDED.sort_order,
  updated_at=NOW();
