const API = location.hostname.endsWith('.app.github.dev')
  ? location.origin.replace('-8080.', '-3000.') + '/api'
  : 'http://localhost:3000/api';

const fallbackProducts = [
  { id:'demo-1', name:'T-shirt qualité premium', category:'Mode', description:'T-shirt confortable et moderne.', price_fcfa:10000, stock:20, image_url:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80' },
  { id:'demo-2', name:'Sac élégant', category:'Accessoires', description:'Sac moderne et élégant.', price_fcfa:18000, stock:12, image_url:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80' },
  { id:'demo-3', name:'Montre classique', category:'Mode', description:'Montre au design intemporel.', price_fcfa:25000, stock:8, image_url:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80' }
];

let products = [];
let category = '';
let query = '';
let sort = 'new';

const money = n => new Intl.NumberFormat('fr-FR').format(Number(n)||0) + ' FCFA';
const cart = () => JSON.parse(localStorage.getItem('egonarCart') || '[]');
const saveCart = c => { localStorage.setItem('egonarCart', JSON.stringify(c)); updateCount(); };
const updateCount = () => { const e=document.getElementById('cart-count'); if(e) e.textContent=cart().reduce((s,x)=>s+Number(x.quantity||0),0); };

async function load(){
  try {
    const r = await fetch(`${API}/products`, {headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error(`API ${r.status}`);
    const data = await r.json();
    products = Array.isArray(data) ? data : (data.products || []);
    if(!products.length) products = fallbackProducts;
  } catch(e) {
    console.warn('API indisponible, affichage du catalogue local.', e);
    products = fallbackProducts;
  }
  render(); updateCount();
}

function render(){
  const box=document.getElementById('products-list') || document.getElementById('products');
  if(!box) return;
  let list=products.filter(p=>!category || String(p.category||p.categorie).toLowerCase()===category.toLowerCase());
  if(query){ const q=query.toLowerCase(); list=list.filter(p=>`${p.name||p.nom} ${p.description||''} ${p.category||p.categorie||''}`.toLowerCase().includes(q)); }
  if(sort==='priceAsc') list.sort((a,b)=>(a.price_fcfa||a.prix)-(b.price_fcfa||b.prix));
  if(sort==='priceDesc') list.sort((a,b)=>(b.price_fcfa||b.prix)-(a.price_fcfa||a.prix));
  box.innerHTML=list.length ? list.map(p=>{
    const name=p.name||p.nom, price=Number(p.price_fcfa||p.prix||0), stock=Number(p.stock||0), image=p.image_url||p.image||'';
    return `<article class="product-card"><a class="product-image" href="produit.html?id=${encodeURIComponent(p.id)}">${image?`<img src="${image}" alt="${name}" loading="lazy" onerror="this.style.display='none'">`:''}</a><div class="product-body"><span class="badge">${p.category||p.categorie||'Produit'}</span><h3>${name}</h3><p>${p.description||''}</p><div class="product-bottom"><strong>${money(price)}</strong><button class="add-btn" data-id="${p.id}" ${stock<=0?'disabled':''}>${stock>0?'Ajouter au panier':'Rupture'}</button></div></div></article>`;
  }).join('') : '<div class="empty-state"><h3>Aucun produit trouvé</h3><p>Essayez une autre recherche ou catégorie.</p></div>';
  const c=document.getElementById('result-count'); if(c) c.textContent=`${list.length} produit${list.length>1?'s':''}`;
  box.querySelectorAll('.add-btn').forEach(b=>b.addEventListener('click',()=>add(b.dataset.id)));
}

function add(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p) return;
  const c=cart(); const row=c.find(x=>String(x.product_id)===String(id)); const stock=Number(p.stock||0);
  if(row){ if(row.quantity>=stock){alert('Stock maximum atteint.');return;} row.quantity++; }
  else c.push({product_id:p.id,name:p.name||p.nom,price_fcfa:Number(p.price_fcfa||p.prix||0),image_url:p.image_url||p.image||'',quantity:1});
  saveCart(c); alert(`${p.name||p.nom} ajouté au panier.`);
}

function runSearch(text){ query=(text||'').trim(); render(); document.getElementById('produits')?.scrollIntoView({behavior:'smooth'}); }

document.getElementById('search-form')?.addEventListener('submit',e=>{e.preventDefault();runSearch(document.getElementById('search')?.value);});
document.getElementById('smart-form')?.addEventListener('submit',e=>{e.preventDefault();runSearch(document.getElementById('smart-search')?.value);});
document.getElementById('sort')?.addEventListener('change',e=>{sort=e.target.value;render();});
document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-category]').forEach(x=>x.classList.remove('active'));b.classList.add('active');category=b.dataset.category;render();}));

document.addEventListener('DOMContentLoaded',load);
