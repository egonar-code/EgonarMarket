const API = "/api";
let products = [];
let category = "";
let searchMode = "classic";
let aiQueryText = "";

const DEMO_PRODUCTS = [
  { id: "demo-tee", name: "T-shirt qualité premium", category: "Mode", description: "T-shirt confortable et élégant.", price_fcfa: 10000, stock: 20, image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", verified_level: "VERIFIED", verification_score: 78, rating_average: 4.8, rating_count: 14 },
  { id: "demo-satchel", name: "Sac Élégance", category: "Accessoires", description: "Sac moderne et élégant pour le quotidien.", price_fcfa: 18000, stock: 12, image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80", verified_level: "VERIFIED", verification_score: 72, rating_average: 4.5, rating_count: 8 },
  { id: "demo-watch", name: "Montre classique", category: "Mode", description: "Montre au design intemporel.", price_fcfa: 25000, stock: 8, image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80", verified_level: "STANDARD", verification_score: 54, rating_average: 4.1, rating_count: 3 }
];

const money = n => new Intl.NumberFormat("fr-FR").format(Number(n) || 0) + " FCFA";
const cart = () => { try { return JSON.parse(localStorage.getItem("egonarCart") || "[]"); } catch { return []; } };
const saveCart = c => { localStorage.setItem("egonarCart", JSON.stringify(c)); updateCount(); };
const updateCount = () => { const e = document.getElementById("cart-count"); if (e) e.textContent = cart().reduce((s, x) => s + Number(x.quantity || 0), 0); };
const esc = s => String(s ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const normalize = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

async function api(path, options = {}) { const r = await fetch(API + path, options); const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || "Une erreur est survenue."); return data; }

function siteEnhancements() {
  const nav = document.querySelector("header nav");
  if (nav) {
    const links = [["food.html", "🍽️ Saveurs"],["travel.html", "✈️ Évasion"]];
    links.forEach(([href,label]) => { if (!nav.querySelector(`a[href="${href}"]`)) { const a=document.createElement("a"); a.href=href; a.textContent=label; nav.insertBefore(a,nav.querySelector("a[href=\"suivi.html\"]")||nav.firstChild); } });
  }
  const chips=document.querySelector(".chips");
  if(chips){const extra=[["Bébés & Enfants","Bébés & Enfants"]];extra.forEach(([value,label])=>{if(!chips.querySelector(`[data-category="${CSS.escape(value)}"]`)){const b=document.createElement("button");b.type="button";b.className="chip";b.dataset.category=value;b.textContent=label;b.addEventListener("click",()=>{chips.querySelectorAll("[data-category]").forEach(x=>x.classList.remove("active"));b.classList.add("active");category=value;searchMode="classic";load();});chips.appendChild(b);}});}
}

function injectAiReasonStyles(){
  if(document.getElementById("egonar-ai-reasons-style"))return;
  const s=document.createElement("style");s.id="egonar-ai-reasons-style";s.textContent=`
    .ai-reason{margin:8px 0 10px;border:1px solid rgba(67,153,205,.18);border-radius:14px;background:linear-gradient(180deg,rgba(240,248,255,.74),rgba(247,251,255,.94));overflow:hidden}
    .ai-reason summary{list-style:none;cursor:pointer;padding:9px 11px;font-size:11px;font-weight:800;color:#135b91;display:flex;align-items:center;gap:7px}
    .ai-reason summary::-webkit-details-marker{display:none}.ai-reason summary:after{content:"+";margin-left:auto;font-size:16px;line-height:1;color:#4c8bb5}.ai-reason[open] summary:after{content:"−"}
    .ai-reason ul{margin:0;padding:0 12px 11px 28px;display:grid;gap:5px;color:#446071;font-size:11px;line-height:1.45}.ai-reason li::marker{color:#55a9d8}
    .ai-reason-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border-radius:999px;background:#e8f6ff;color:#135b91;font-size:10px;font-weight:800}
  `;document.head.appendChild(s);
}

function buildAiReasons(p){
  if(searchMode!=="ai") return "";
  const q=normalize(aiQueryText);
  const reasons=[];
  const price=Number(p.price_fcfa||0); const budget=Number(p._ai_budget||0);
  const rating=Number(p.rating_average||0); const ratingCount=Number(p.rating_count||0); const score=Number(p.verification_score||0);
  const deliveryMax=Number(p.delivery_max_minutes||0); const deliveryMin=Number(p.delivery_min_minutes||0);
  const verified=["VERIFIED","PREMIUM"].includes(String(p.verified_level||"").toUpperCase());
  if(budget>0 && price<=budget) reasons.push(`Respecte votre budget de ${money(budget)}.`);
  const words=q.split(/[^a-z0-9]+/).filter(w=>w.length>2).slice(0,8);
  const hay=normalize(`${p.name||""} ${p.description||""} ${p.category||""} ${p.subcategory||""}`);
  const matches=words.filter(w=>hay.includes(w)).slice(0,2);
  if(matches.length) reasons.push(`Correspond à votre recherche : ${matches.join(", ")}.`);
  if(verified) reasons.push(`Produit ${String(p.verified_level).toLowerCase()} et contrôlé par Egonar.`);
  if(rating>=4 && ratingCount>0) reasons.push(`Note ${rating.toFixed(1)}/5 basée sur ${ratingCount} avis.`);
  if(deliveryMax>0) reasons.push(`Livraison estimée ${deliveryMin>0?`${deliveryMin}–`:""}${deliveryMax} min${p.delivery_city?` à ${p.delivery_city}`:""}.`);
  if(score>=68 && reasons.length<4) reasons.push(`Score de confiance Egonar : ${score}/100.`);
  if(!reasons.length) reasons.push("Sélectionné pour sa pertinence globale par rapport à votre recherche.");
  return `<details class="ai-reason"><summary><span class="ai-reason-badge">✦ Pourquoi recommandé</span></summary><ul>${reasons.slice(0,4).map(r=>`<li>${esc(r)}</li>`).join("")}</ul></details>`;
}

async function load(){const box=document.getElementById("products-list")||document.getElementById("products");if(box)box.innerHTML='<div class="empty-state"><h3>Chargement…</h3><p>Nous préparons votre sélection.</p></div>';try{const qs=category?`?category=${encodeURIComponent(category)}`:"";const data=await api(`/products${qs}`);products=Array.isArray(data)?data:(data.products||[]);render();}catch(e){products=DEMO_PRODUCTS.slice();render();showToast("Mode aperçu activé : le catalogue réel sera chargé dès que l’API est disponible.");}updateCount();}

async function smartSearch(message){const text=String(message||"").trim();if(!text)return;aiQueryText=text;const box=document.getElementById("products-list")||document.getElementById("products");if(box)box.innerHTML='<div class="empty-state"><h3>Recherche intelligente…</h3><p>Analyse de votre demande en cours.</p></div>';searchMode="ai";try{const data=await api("/ai/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})});products=Array.isArray(data.products)?data.products:[];const budget=Number(data.budget||0);products=products.map(p=>({...p,_ai_budget:budget}));render();}catch(e){products=DEMO_PRODUCTS.slice();searchMode="classic";const input=document.getElementById("search");if(input)input.value=text;render();}}

function add(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;const stock=Number(p.stock||0);if(stock<=0)return alert("Ce produit est en rupture de stock.");const c=cart();const row=c.find(x=>String(x.product_id)===String(id));if(row){if(row.quantity>=stock)return alert(`Stock maximum atteint : ${stock} unité(s).`);row.quantity+=1;}else c.push({product_id:p.id,name:p.name,price_fcfa:Number(p.price_fcfa||0),image_url:p.image_url||"",quantity:1});saveCart(c);showToast(`${p.name} a été ajouté au panier.`);}
function showToast(text){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t);}t.textContent=text;t.classList.add("show");window.clearTimeout(t._timer);t._timer=window.setTimeout(()=>t.classList.remove("show"),2600);}

function verificationMarkup(p){const level=String(p.verified_level||"STANDARD").toUpperCase();const verified=level==="VERIFIED"||level==="PREMIUM";const rating=Number(p.rating_average||0);const count=Number(p.rating_count||0);const score=Number(p.verification_score||0);return `<div class="product-trust"><span class="trust-pill ${verified?'verified':'pending'}">${verified?'✓ Egonar vérifié':'Vérification standard'}</span>${rating?`<span class="rating-pill">★ ${rating.toFixed(1)} <small>(${count})</small></span>`:''}${score?`<span class="score-pill">${score}/100</span>`:''}</div>`;}
function render(){const box=document.getElementById("products-list")||document.getElementById("products");if(!box)return;const q=searchMode==="classic"?(document.getElementById("search")?.value||"").trim().toLowerCase():"";let list=products.filter(p=>!category||String(p.category||"").toLowerCase()===category.toLowerCase());if(q)list=list.filter(p=>`${p.name||""} ${p.description||""} ${p.category||""} ${p.sku||""}`.toLowerCase().includes(q));const sort=document.getElementById("sort")?.value;if(sort==="priceAsc")list.sort((a,b)=>Number(a.price_fcfa)-Number(b.price_fcfa));if(sort==="priceDesc")list.sort((a,b)=>Number(b.price_fcfa)-Number(a.price_fcfa));box.innerHTML=list.map(p=>{const stock=Number(p.stock||0);const deliveryMax=Number(p.delivery_max_minutes||0);const deliveryMin=Number(p.delivery_min_minutes||0);const delivery=deliveryMax>0?`<small class="delivery-pill">🚚 ${deliveryMin>0?`${deliveryMin}–`:''}${deliveryMax} min · ${esc(p.delivery_city||'Dakar')}</small>`:'';return `<article class="product-card"><a class="product-image" href="produit.html?id=${encodeURIComponent(p.id)}">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">`:`<div class="image-placeholder">EgonarMarket</div>`}</a><div class="product-body">${verificationMarkup(p)}<span class="badge">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${buildAiReasons(p)}${delivery}<div class="product-bottom"><strong>${money(p.price_fcfa)}</strong><button class="add-btn" data-id="${esc(p.id)}" ${stock<=0?'disabled':''}>${stock>0?'Ajouter':'Rupture'}</button></div></div></article>`;}).join("")||'<div class="empty-state"><h3>Aucun produit trouvé</h3><p>Essayez une autre recherche ou catégorie.</p><button type="button" class="btn" id="reset-search">Voir tous les produits</button></div>';const count=document.getElementById("result-count");if(count)count.textContent=`${list.length} produit${list.length>1?'s':''}`;box.querySelectorAll(".add-btn").forEach(b=>b.addEventListener("click",()=>add(b.dataset.id)));document.getElementById("reset-search")?.addEventListener("click",()=>{searchMode="classic";category="";aiQueryText="";const i=document.getElementById("search");if(i)i.value="";document.querySelectorAll("[data-category]").forEach(x=>x.classList.toggle("active",x.dataset.category===""));load();});}

function voiceSearch(){const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition)return alert("La recherche vocale n'est pas disponible sur ce navigateur.");const recognition=new Recognition();recognition.lang="fr-FR";recognition.interimResults=false;recognition.onresult=event=>{const text=event.results[0][0].transcript;const input=document.getElementById("search");if(input)input.value=text;smartSearch(text);};recognition.start();}

document.addEventListener("DOMContentLoaded",()=>{siteEnhancements();injectAiReasonStyles();document.getElementById("search-form")?.addEventListener("submit",e=>{e.preventDefault();const text=document.getElementById("search")?.value||"";runClassicSearch(text);});document.getElementById("smart-form")?.addEventListener("submit",e=>{e.preventDefault();smartSearch(document.getElementById("smart-search")?.value||"");document.getElementById("produits")?.scrollIntoView({behavior:"smooth"});});document.getElementById("sort")?.addEventListener("change",render);document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-category]").forEach(x=>x.classList.remove("active"));b.classList.add("active");category=b.dataset.category||"";searchMode="classic";aiQueryText="";load();}));document.getElementById("voice-search")?.addEventListener("click",voiceSearch);updateCount();load();});
function runClassicSearch(text){searchMode="classic";aiQueryText="";const input=document.getElementById("search");if(input)input.value=String(text||"");render();document.getElementById("produits")?.scrollIntoView({behavior:"smooth"});}
