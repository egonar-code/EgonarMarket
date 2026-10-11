(() => {
'use strict';
const state={universe:new URLSearchParams(location.search).get('universe')?.toUpperCase()||'MARKET',rows:[],products:[]};
const valid=['MARKET','SAVEURS','EVASION'];
if(!valid.includes(state.universe))state.universe='MARKET';
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const money=n=>new Intl.NumberFormat('fr-FR').format(Number(n)||0);
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const icon=row=>row.icon||'•';
const image=row=>row.image_url||'';
async function load(){
 const list=document.getElementById('categories-page-list');
 list.innerHTML='<div class="empty-state"><h3>Chargement…</h3><p>Nous préparons les catégories.</p></div>';
 try{
  const [catRes,prodRes]=await Promise.all([
   fetch('/api/categories?universe='+encodeURIComponent(state.universe)),
   fetch('/api/products?universe='+encodeURIComponent(state.universe))
  ]);
  if(!catRes.ok)throw new Error('Impossible de charger les catégories.');
  state.rows=await catRes.json(); state.products=prodRes.ok?await prodRes.json():[];
  render();
 }catch(e){list.innerHTML='<div class="empty-state"><h3>Catégories indisponibles</h3><p>'+esc(e.message)+'</p></div>';}
}
function render(){
 const q=norm(document.getElementById('category-search')?.value);
 const filtered=state.rows.filter(r=>!q||norm(r.name+' '+r.description).includes(q));
 const counts={};state.products.forEach(p=>{const k=String(p.category||'').trim();if(k)counts[k]=(counts[k]||0)+1;});
 document.getElementById('category-count').textContent=filtered.length+' catégorie'+(filtered.length>1?'s':'')+' · '+state.products.length+' produit'+(state.products.length>1?'s':'');
 const roots=filtered.filter(r=>!r.parent_slug);
 const groups=[{title:'Catégories principales',rows:roots}];
 filtered.filter(r=>r.parent_slug).forEach(r=>{
   const parent=state.rows.find(x=>String(x.slug)===String(r.parent_slug));
   const title=parent?.name||'Sous-catégories';
   let g=groups.find(x=>x.title===title);if(!g){g={title,rows:[]};groups.push(g);}g.rows.push(r);
 });
 const box=document.getElementById('categories-page-list');box.innerHTML='';
 groups.filter(g=>g.rows.length).forEach(g=>{
  const section=document.createElement('section');section.className='category-page-group';
  section.innerHTML='<div class="category-page-group-head"><h2>'+esc(g.title)+'</h2><span>'+g.rows.length+' élément'+(g.rows.length>1?'s':'')+'</span></div>';
  const grid=document.createElement('div');grid.className='category-page-grid';
  g.rows.forEach(row=>{
   const card=document.createElement('a');card.className='category-page-card';
   card.href='index.html?category='+encodeURIComponent(row.name)+'#produits';
   const photo=row.image_url?'<img src="'+esc(row.image_url)+'" alt="" loading="lazy">':'<span class="category-page-icon">'+esc(icon(row))+'</span>';
   const count=counts[row.name]||0;
   card.innerHTML=photo+'<span class="category-page-copy"><strong>'+esc(row.name)+'</strong><small>'+esc(row.description||'Explorer cette catégorie')+'</small><b>'+ (count?count+' produit'+(count>1?'s':''):'Explorer') +' →</b></span>';
   grid.appendChild(card);
  });
  section.appendChild(grid);box.appendChild(section);
 });
 if(!box.children.length)box.innerHTML='<div class="empty-state"><h3>Aucun résultat</h3><p>Essayez un autre terme de recherche.</p></div>';
}
function setUniverse(u){
 state.universe=u;document.body.dataset.universe=u;
 document.querySelectorAll('.category-universe-tab').forEach(b=>b.classList.toggle('active',b.dataset.universe===u));
 history.replaceState({},'', 'categories.html?universe='+encodeURIComponent(u));
 load();
}
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.category-universe-tab').forEach(b=>b.addEventListener('click',()=>setUniverse(b.dataset.universe)));
 document.getElementById('category-search-form')?.addEventListener('submit',e=>{e.preventDefault();render();});
 document.getElementById('category-search')?.addEventListener('input',render);
 setUniverse(state.universe);
});
})();