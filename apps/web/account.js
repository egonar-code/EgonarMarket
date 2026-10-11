const API="/api";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const money=n=>new Intl.NumberFormat("fr-FR").format(Number(n)||0)+" FCFA";
let customer=null;
async function api(path,opt={}){const r=await fetch(API+path,{credentials:"include",...opt}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Une erreur est survenue.");return d}
function authForm(){
 const root=document.getElementById("auth-view");
 root.innerHTML='<div class="review-form"><div style="display:flex;gap:8px;margin-bottom:18px"><button class="btn primary" id="tab-login">Connexion</button><button class="btn secondary" id="tab-register">Créer un compte</button></div><form id="account-form"><div id="account-fields"></div><button class="btn primary" type="submit" id="account-submit">Connexion</button><p id="account-msg" class="muted small"></p></form></div>';
 let mode="login";
 const render=()=>{document.getElementById("account-fields").innerHTML=mode==="login"?'<input required name="email" type="email" placeholder="Email"><input required name="password" type="password" minlength="8" placeholder="Mot de passe">':'<input required name="name" maxlength="100" placeholder="Nom complet"><input required name="email" type="email" placeholder="Email"><input name="phone" placeholder="Téléphone / WhatsApp"><input required name="password" type="password" minlength="8" placeholder="Mot de passe (8 caractères minimum)">';document.getElementById("account-submit").textContent=mode==="login"?"Connexion":"Créer mon compte"};
 render();
 document.getElementById("tab-login").onclick=()=>{mode="login";render()};
 document.getElementById("tab-register").onclick=()=>{mode="register";render()};
 document.getElementById("account-form").onsubmit=async e=>{e.preventDefault();const msg=document.getElementById("account-msg");try{const d=await api(mode==="login"?"/customer/login":"/customer/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});customer=d.customer;dashboard()}catch(err){msg.textContent=err.message}};
}
async function dashboard(){
 const root=document.getElementById("auth-view");
 try{
  const [orders,favorites,recent]=await Promise.all([api("/customer/orders"),api("/customer/favorites"),api("/customer/recently-viewed")]);
  root.innerHTML='<div class="review-form"><h2>Bonjour '+esc(customer.name)+'</h2><p class="muted">'+esc(customer.email)+'</p><button class="btn secondary" id="logout">Se déconnecter</button></div><div class="section"><h2>Mes commandes ('+orders.length+')</h2>'+(orders.length?orders.slice(0,8).map(o=>'<article class="review-card"><strong>'+esc(o.order_number)+'</strong><p>'+esc(o.status)+' · '+money(o.total_fcfa)+'</p><a class="btn secondary" href="suivi.html?order='+encodeURIComponent(o.order_number)+'">Suivre</a></article>').join(""):"<p class='muted'>Aucune commande pour le moment.</p>")+'</div><div class="section"><h2>Mes favoris ('+favorites.length+')</h2><div class="products">'+(favorites.map(p=>'<article class="product-card"><img src="'+esc(p.image_url)+'" alt=""><h3>'+esc(p.name)+'</h3><strong>'+money(p.price_fcfa)+'</strong><a class="btn secondary" href="produit.html?id='+encodeURIComponent(p.id)+'">Voir</a></article>').join("")||"<p class='muted'>Aucun favori.</p>")+'</div></div><div class="section"><h2>Récemment consultés</h2><div class="products">'+(recent.map(p=>'<article class="product-card"><img src="'+esc(p.image_url)+'" alt=""><h3>'+esc(p.name)+'</h3><strong>'+money(p.price_fcfa)+'</strong><a class="btn secondary" href="produit.html?id='+encodeURIComponent(p.id)+'">Voir</a></article>').join("")||"<p class='muted'>Votre historique apparaîtra ici.</p>")+'</div></div>';
  document.getElementById("logout").onclick=async()=>{await api("/customer/logout",{method:"POST"});customer=null;authForm()};
 }catch{authForm()}
}
(async()=>{try{const d=await api("/customer/me");customer=d.customer;dashboard()}catch{authForm()}})();