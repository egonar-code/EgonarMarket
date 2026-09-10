const API = "/api";
let products = [];
let category = "";

const money = n => new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";
const cart = () => JSON.parse(localStorage.getItem("egonarCart") || "[]");
const saveCart = c => { localStorage.setItem("egonarCart", JSON.stringify(c)); updateCount(); };
const updateCount = () => { const e=document.getElementById("cart-count"); if(e) e.textContent=cart().reduce((s,x)=>s+Number(x.quantity||0),0); };
const esc = s => String(s ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

async function api(path, options={}) {
  const r = await fetch(API + path, options);
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

async function load(){
  const box=document.getElementById("products-list") || document.getElementById("products");
  if(box) box.innerHTML='<div class="empty-state"><h3>Chargement…</h3></div>';
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    products = await api(`/products${qs}`);
    render();
  } catch(e) {
    if(box) box.innerHTML=`<div class="empty-state"><h3>Catalogue temporairement indisponible</h3><p>${esc(e.message)}</p><button class="btn primary" onclick="load()">Réessayer</button></div>`;
  }
  updateCount();
}

async function smartSearch(message){
  const box=document.getElementById("products-list") || document.getElementById("products");
  if(box) box.innerHTML='<div class="empty-state"><h3>Recherche intelligente…</h3></div>';
  try {
    const data=await api("/ai/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})});
    products=data.products || [];
    render();
  } catch(e) { if(box) box.innerHTML=`<div class="empty-state"><p>${esc(e.message)}</p></div>`; }
}

function add(id){
  const p=products.find(x=>String(x.id)===String(id)); if(!p) return;
  const stock=Number(p.stock||0); if(stock<=0) return alert("Ce produit est en rupture de stock.");
  const c=cart(); const row=c.find(x=>String(x.product_id)===String(id));
  if(row){ if(row.quantity>=stock) return alert("Stock maximum atteint."); row.quantity++; }
  else c.push({product_id:p.id,name:p.name,price_fcfa:Number(p.price_fcfa),image_url:p.image_url,quantity:1});
  saveCart(c);
  showToast(`${p.name} a été ajouté au panier.`);
}

function showToast(text){
  let t=document.getElementById("toast");
  if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t);}
  t.textContent=text;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800);
}

function render(){
  const box=document.getElementById("products-list") || document.getElementById("products"); if(!box) return;
  const q=(document.getElementById("search")?.value||"").trim().toLowerCase();
  let list=products.filter(p=>!category || String(p.category||"").toLowerCase()===category.toLowerCase());
  if(q) list=list.filter(p=>`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q));
  const sort=document.getElementById("sort")?.value;
  if(sort==="priceAsc") list.sort((a,b)=>a.price_fcfa-b.price_fcfa);
  if(sort==="priceDesc") list.sort((a,b)=>b.price_fcfa-a.price_fcfa);
  box.innerHTML=list.map(p=>`<article class="product-card">
    <a class="product-image" href="produit.html?id=${encodeURIComponent(p.id)}">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:''}</a>
    <div class="product-body"><span class="badge">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>
    <div class="product-bottom"><strong>${money(p.price_fcfa)}</strong><button class="add-btn" data-id="${p.id}" ${Number(p.stock)<=0?'disabled':''}>${Number(p.stock)>0?'Ajouter':'Rupture'}</button></div></div></article>`).join("") || '<div class="empty-state"><h3>Aucun produit trouvé</h3><p>Essayez une autre recherche ou catégorie.</p></div>';
  const c=document.getElementById("result-count"); if(c) c.textContent=`${list.length} produit${list.length>1?'s':''}`;
  box.querySelectorAll(".add-btn").forEach(b=>b.addEventListener("click",()=>add(b.dataset.id)));
}

function voiceSearch(){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition) return alert("La recherche vocale n'est pas disponible sur ce navigateur.");
  const r=new Recognition(); r.lang="fr-FR"; r.interimResults=false; r.onresult=e=>{const text=e.results[0][0].transcript; const i=document.getElementById("search"); if(i)i.value=text; smartSearch(text);}; r.start();
}

document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("search-form")?.addEventListener("submit",e=>{e.preventDefault();smartSearch(document.getElementById("search")?.value||"");});
  document.getElementById("smart-form")?.addEventListener("submit",e=>{e.preventDefault();smartSearch(document.getElementById("smart-search")?.value||"");document.getElementById("produits")?.scrollIntoView({behavior:"smooth"});});
  document.getElementById("sort")?.addEventListener("change",render);
  document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-category]").forEach(x=>x.classList.remove("active"));b.classList.add("active");category=b.dataset.category;load();}));
  load();
});
