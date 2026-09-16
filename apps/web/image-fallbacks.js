(() => {
  'use strict';
  const FALLBACKS = {
    MARKET: '/images/product-cover.svg',
    SAVEURS: '/images/saveurs-cover.svg',
    EVASION: '/images/evasion-cover.svg'
  };
  const isExternalImage = src => /^https?:\/\//i.test(String(src || ''));
  function fallback(product = {}) {
    const universe = String(product.universe || '').toUpperCase();
    return FALLBACKS[universe] || FALLBACKS.MARKET;
  }
  function bind(root = document) {
    root.querySelectorAll?.('img').forEach(img => {
      if (img.dataset.egonarImageFallbackBound === '1') return;
      img.dataset.egonarImageFallbackBound = '1';
      const universe = img.dataset.universe || document.body.dataset.universe || 'MARKET';
      if (!img.getAttribute('src')) img.src = fallback({ universe });
      img.addEventListener('error', () => {
        img.onerror = null;
        img.src = fallback({ universe: img.dataset.universe || universe });
      }, { once: true });
    });
  }

  const CATEGORY_CATALOG = {
    MARKET: [
      ['mode','Mode & Vêtements','👕',['Femme','Homme','Enfant','Chaussures','Vêtements traditionnels','Sport & Fitness']],
      ['telephones-accessoires','Téléphones & Accessoires','📱',['Smartphones','Coques & Protections','Chargeurs & Câbles','Écouteurs & Casques','Power banks']],
      ['informatique-electronique','Informatique & Électronique','💻',['Ordinateurs','Tablettes','Imprimantes','Accessoires informatiques']],
      ['maison-decoration','Maison & Décoration','🏠',['Meubles','Décoration','Literie','Cuisine','Salle de bain','Éclairage']],
      ['electromenager','Électroménager','🧊',['Réfrigérateurs','Congélateurs','Machines à laver','Climatiseurs','Ventilateurs','Fours & cuisinières']],
      ['beaute-soins','Beauté & Soins','💄',['Parfums','Maquillage','Soins visage','Soins corps','Cheveux','Barbe']],
      ['bebe-enfant','Bébé & Enfant','🧸',['Vêtements','Chaussures','Jouets','Puériculture','Alimentation bébé']],
      ['sports-loisirs','Sports & Loisirs','⚽',['Fitness','Football','Running','Sports collectifs','Jeux','Loisirs']],
      ['alimentation-epicerie','Alimentation & Épicerie','🛒',['Produits alimentaires','Boissons','Épicerie','Produits locaux','Produits bio/naturels']],
      ['supermarche-quotidien','Supermarché & Quotidien','🧴',['Entretien','Hygiène','Lessive','Papier & consommables','Produits ménagers']],
      ['accessoires-maroquinerie','Accessoires & Maroquinerie','👜',['Sacs','Portefeuilles','Montres','Bijoux','Lunettes','Ceintures']],
      ['auto-moto','Auto & Moto','🚗',['Accessoires auto','Entretien','Pièces','Équipements','Moto']],
      ['bricolage-jardin','Bricolage & Jardin','🔧',['Outils','Matériaux','Électricité','Plomberie','Jardinage']],
      ['bureau-fournitures','Bureau & Fournitures','📎',['Fournitures scolaires','Papeterie','Bureau','Matériel professionnel']],
      ['livres-culture-education','Livres, Culture & Éducation','📖',['Livres','Formation','Fournitures scolaires','Jeux éducatifs']],
      ['produits-locaux-artisanat','Produits locaux & Artisanat','🧺',['Artisanat sénégalais','Objets traditionnels','Décoration locale','Produits faits main']],
      ['services','Services','🛠️',['Services professionnels','Services à domicile','Réparation','Informatique','Beauté','Événementiel']]
    ],
    SAVEURS: [
      ['restaurants','Restaurants','🍽️',['Sénégalais','Africain','Fast-food','Grillades','Italien','Asiatique','International']],
      ['plats-senegalais','Plats sénégalais','🍲',['Thiéboudienne','Yassa','Mafé','Ceebu yapp','Thiébou yapp','Soupou kandia','Domoda']],
      ['fast-food','Fast-Food','🍔',['Burgers','Tacos','Shawarma','Sandwichs','Pizzas','Poulet','Frites']],
      ['petit-dejeuner-brunch','Petit-déjeuner & Brunch','🥐',['Petit-déjeuner','Brunch','Viennoiseries','Crêpes','Pancakes']],
      ['boissons','Boissons','🥤',['Jus naturels','Bissap','Bouye','Gingembre','Smoothies','Café','Thé']],
      ['desserts-patisseries','Desserts & Pâtisseries','🍰',['Gâteaux','Pâtisseries','Glaces','Desserts','Chocolats']],
      ['epicerie','Épicerie','🛍️',['Riz','Huiles','Céréales','Conserves','Épices','Produits frais']],
      ['fruits-legumes','Fruits & Légumes','🥬',['Fruits','Légumes','Paniers frais']],
      ['boucherie-poissonnerie','Boucherie & Poissonnerie','🐟',['Viande','Poulet','Poisson','Fruits de mer']],
      ['traiteur-evenementiel','Traiteur & Événementiel','🎉',['Mariages','Baptêmes','Anniversaires','Entreprises','Buffets']],
      ['cuisine-maison','Cuisine maison','🏡',['Plats faits maison','Pâtisseries maison','Produits artisanaux']],
      ['offres-menus','Offres & Menus','🏷️',['Menus du jour','Menus famille','Formules','Promotions']]
    ],
    EVASION: [
      ['hotels','Hôtels','🏨',['Hôtels','Hôtels de luxe','Hôtels économiques','Resorts','Hôtels business']],
      ['locations','Appartements & Locations','🏡',['Appartements','Villas','Maisons','Studios','Locations courte durée']],
      ['residences-maisons-hotes','Résidences & Maisons d’hôtes','🛖',['Maisons d’hôtes','Résidences','Lodges','Auberges']],
      ['plages-resorts','Plages & Resorts','🏝️',['Plages','Resorts','Piscines','Beach clubs']],
      ['excursions','Excursions','🚌',['Excursions à la journée','Circuits','Visites guidées','Safaris','Sorties en groupe']],
      ['activites-experiences','Activités & Expériences','🎟️',['Quad','Jet-ski','Surf','Pêche','Kayak','Randonnée','Équitation','Activités culturelles']],
      ['tourisme-culture','Tourisme & Culture','🏛️',['Musées','Monuments','Sites historiques','Patrimoine','Villages traditionnels']],
      ['restaurants-gastronomie','Restaurants & Gastronomie','🍴',['Restaurants','Gastronomie locale','Dégustations','Expériences culinaires']],
      ['transport-mobilite','Transport & Mobilité','🚗',['Location de voiture','Chauffeur privé','Transferts aéroport','Taxi','Transport touristique']],
      ['billetterie-evenements','Billetterie & Événements','🎫',['Concerts','Festivals','Spectacles','Événements culturels','Événements sportifs']],
      ['voyages-organises','Voyages organisés','🗺️',['Circuits Sénégal','Circuits Afrique','Voyages internationaux','Packages']],
      ['lune-de-miel-romantique','Lune de miel & Romantique','❤️',['Séjours couple','Escapades','Lune de miel','Week-ends romantiques']],
      ['famille','Famille','👨‍👩‍👧‍👦',['Activités enfants','Séjours famille','Sorties familiales']],
      ['business-seminaires','Business & Séminaires','💼',['Hôtels business','Salles de conférence','Séminaires','Team building']],
      ['bien-etre','Bien-être','🧘',['Spas','Massages','Hammam','Yoga','Bien-être']],
      ['destinations','Destinations','🌍',['Dakar','Saly','Somone','Ngaparou','Saint-Louis','Sine-Saloum','Casamance','Lac Rose','Gorée','Sénégal oriental','Sous-région','International']]
    ]
  };

  const UNIVERSE_LABELS = { MARKET: 'MARKET', SAVEURS: 'SAVEURS', EVASION: 'ÉVASION' };
  const css = () => {
    if (document.getElementById('egonar-category-catalog-style')) return;
    const s = document.createElement('style');
    s.id = 'egonar-category-catalog-style';
    s.textContent = `
      .egonar-category-panel{margin:18px 0 28px;padding:20px;border:1px solid rgba(15,47,65,.10);border-radius:22px;background:rgba(255,255,255,.96);box-shadow:0 10px 30px rgba(15,47,65,.06)}
      .egonar-category-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:16px}.egonar-category-head h3{margin:0;font-size:20px}.egonar-category-head p{margin:5px 0 0;opacity:.72;font-size:13px}
      .egonar-category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}
      .egonar-category-item{border:1px solid rgba(15,47,65,.09);border-radius:16px;background:#fff;padding:13px 14px}.egonar-category-item summary{cursor:pointer;list-style:none;font-weight:800;display:flex;gap:9px;align-items:center}.egonar-category-item summary::-webkit-details-marker{display:none}.egonar-category-item summary:after{content:'+';margin-left:auto;opacity:.5}.egonar-category-item[open] summary:after{content:'−'}.egonar-category-subcats{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.egonar-category-subcats span{font-size:11px;padding:5px 8px;border-radius:999px;background:#f3f7f9;color:#38505d}
      .egonar-category-filters{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.egonar-filter{font-size:11px;padding:6px 9px;border-radius:999px;background:#eef7fb;color:#145c7c;font-weight:700}.egonar-category-count{font-size:11px;opacity:.55;white-space:nowrap}
      @media(max-width:650px){.egonar-category-grid{grid-template-columns:1fr}.egonar-category-panel{padding:15px}.egonar-category-head{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(s);
  };

  function categoryPanel(universe) {
    const list = CATEGORY_CATALOG[universe] || [];
    if (!list.length || document.querySelector(`[data-egonar-category-panel="${universe}"]`)) return;
    const panel = document.createElement('section');
    panel.className = 'egonar-category-panel';
    panel.dataset.egonarCategoryPanel = universe;
    panel.innerHTML = `<div class="egonar-category-head"><div><h3>${UNIVERSE_LABELS[universe]} · Catégories</h3><p>Explorez les catégories, sous-catégories et critères utiles.</p></div><span class="egonar-category-count">${list.length} catégories</span></div><div class="egonar-category-grid">${list.map(([slug,name,icon,subs]) => `<details class="egonar-category-item"><summary><span>${icon}</span><span>${name}</span></summary><div class="egonar-category-subcats">${subs.map(x => `<span>${x}</span>`).join('')}</div></details>`).join('')}</div><div class="egonar-category-filters"><span class="egonar-filter">Prix</span><span class="egonar-filter">Disponibilité</span><span class="egonar-filter">Localisation</span><span class="egonar-filter">Avis</span><span class="egonar-filter">Vérifié Egonar</span><span class="egonar-filter">Promotions</span></div></section>`;
    const anchor = document.querySelector('main .section') || document.querySelector('main');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor);
  }

  function enhanceCategoryUi() {
    css();
    const universe = String(document.body?.dataset?.universe || 'MARKET').toUpperCase();
    categoryPanel(universe);
    if (universe === 'MARKET') {
      const chips = document.querySelector('.chips');
      const list = CATEGORY_CATALOG.MARKET;
      if (chips && !chips.dataset.egonarCategoryEnhanced) {
        chips.dataset.egonarCategoryEnhanced = '1';
        chips.innerHTML = `<button type="button" class="chip active" data-category="">Toutes</button>${list.slice(0,12).map(([slug,name,icon]) => `<button type="button" class="chip" data-category="${name.replace(/&amp;/g,'&')}">${icon} ${name}</button>`).join('')}<span class="category-more" title="Voir toutes les catégories">+ ${list.length-12} autres</span>`;
      }
    }
  }

  window.EgonarImage = { fallback, bind, isExternalImage };
  window.EgonarCategoryCatalog = CATEGORY_CATALOG;
  document.addEventListener('DOMContentLoaded', () => { bind(document); enhanceCategoryUi(); });
  new MutationObserver(() => { bind(document); enhanceCategoryUi(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
