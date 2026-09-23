const API="/api";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const call=(url,options={})=>fetch(API+url,{credentials:"include",...options}).then(async r=>({ok:r.ok,data:await r.json().catch(()=>({}))}));
const money=n=>new Intl.NumberFormat("fr-FR").format(Number(n)||0);
let contents=[],categories=[],mediaAssets=[],editingContent=null,editingCategory=null,mediaPickerTarget=null;
const universeLabel={MARKET:"Market",SAVEURS:"Saveurs",EVASION:"Évasion"};
const statusLabel={DRAFT:"Brouillon",PUBLISHED:"Publié",ARCHIVED:"Archivé"};

function message(id,text,ok){const el=$(id);el.textContent=text||"";el.className=text?(ok?"state success":"state error"):"";}
async function uploadImage(file,universe=""){
  if(!file || !file.size) return null;
  const allowed=["image/jpeg","image/png","image/webp","image/gif"];
  if(!allowed.includes(file.type)) throw new Error("Format d’image non pris en charge. Utilisez JPG, PNG, WEBP ou GIF.");
  if(file.size>7*1024*1024) throw new Error("L’image dépasse 7 Mo.");
  const fd=new FormData();fd.append("image",file);if(universe)fd.append("universe",universe);
  const r=await call("/admin/studio/upload",{method:"POST",body:fd});
  if(!r.ok) throw new Error(r.data?.error||"Téléversement de l’image impossible.");
  return r.data;
}
function previewFile(inputId,previewId){
  const input=$(inputId),preview=$(previewId),file=input?.files?.[0];
  if(!file){preview.hidden=true;preview.innerHTML="";return;}
  const url=URL.createObjectURL(file);
  preview.hidden=false;
  preview.innerHTML='<img src="'+url+'" alt="Aperçu de l’image"><small>'+esc(file.name)+' · '+(file.size/1024/1024).toFixed(2)+' Mo</small>';
}
function setPreviewUrl(previewId,url){
  const preview=$(previewId);
  if(!url){preview.hidden=true;preview.innerHTML="";return;}
  preview.hidden=false;
  preview.innerHTML='<img src="'+esc(url)+'" alt="Image actuelle"><small>Image actuelle</small>';
}
function resetContent(){editingContent=null;$("content-form").reset();$("content-form").id.value="";$("content-form").image_url.value="";$("content-form").content_type.value="PAGE";$("content-form").locale.value="fr";$("content-form").sort_order.value="0";$("content-form-title").textContent="Créer / modifier";$("content-image-preview").hidden=true;$("content-image-preview").innerHTML="";message("content-msg","",true);}
function fillContent(x){editingContent=x;$("content-form-title").textContent="Modifier le contenu";for(const key of ["id","content_type","universe","locale","key","title","subtitle","body","image_url","cta_label","cta_url","meta_title","meta_description","sort_order"]){if($("content-form").elements[key])$("content-form").elements[key].value=x[key]??"";}$("content-form").id.value=x.id;setPreviewUrl("content-image-preview",x.image_url||"");message("content-msg","",true);window.scrollTo({top:0,behavior:"smooth"});}
function drawContents(){const q="",list=contents.filter(x=>(!$("content-universe").value||x.universe===$("content-universe").value)&&(!$("content-status").value||x.status===$("content-status").value)&&(!q||String(x.title).toLowerCase().includes(q)));$("content-list").innerHTML=list.map(x=>`<article class="studio-item"><div class="studio-item-main"><h3>${esc(x.title)}</h3><p><strong>${esc(x.key)}</strong> · ${esc(universeLabel[x.universe]||x.universe)} · ${esc(x.locale)}</p><p>${esc(x.subtitle||"")}</p><span class="studio-status ${x.status=== "PUBLISHED"?"published":x.status==="ARCHIVED"?"archived":""}">${esc(statusLabel[x.status]||x.status)}</span></div><div class="studio-actions"><button onclick="fillContent(contents.find(y=>y.id==='${x.id}'))">Modifier</button>${x.status!=="PUBLISHED"&&x.status!=="ARCHIVED"?`<button onclick="publishContent('${x.id}')">Publier</button>`:""}${x.status==="PUBLISHED"?`<button onclick="archiveContent('${x.id}')">Archiver</button>`:""}${x.image_url?`<button onclick="previewContent('${x.id}')">Aperçu</button>`:""}</div></article>`).join("")||'<div class="empty">Aucun contenu pour ces filtres.</div>';}
async function loadContents(){const params=new URLSearchParams();if($("content-universe").value)params.set("universe",$("content-universe").value);if($("content-status").value)params.set("status",$("content-status").value);const r=await call("/admin/studio/content?"+params);if(!r.ok){message("content-msg",r.data.error||"Impossible de charger le contenu.",false);return;}contents=r.data||[];drawContents();}
async function saveContent(e){e.preventDefault();const form=e.currentTarget,b=Object.fromEntries(new FormData(form)),id=b.id;delete b.id;delete b.image;if(form.elements.image?.files?.[0]){try{message("content-msg","Téléversement de l’image…",true);const asset=await uploadImage(form.elements.image.files[0],form.elements.universe.value);b.image_url=asset.url;}catch(err){message("content-msg",err.message,false);return;}}b.sort_order=Number(b.sort_order)||0;const r=await call(id?"/admin/studio/content/"+encodeURIComponent(id):"/admin/studio/content",{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});if(!r.ok){message("content-msg",r.data.error||"Enregistrement impossible.",false);return;}message("content-msg",id?"Contenu mis à jour.":"Brouillon créé.",true);resetContent();await loadContents();}
async function publishContent(id){const r=await call("/admin/studio/content/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"PUBLISHED",active:true})});if(!r.ok)return alert(r.data.error||"Publication impossible.");await loadContents();await loadAudit();}
async function archiveContent(id){const r=await call("/admin/studio/content/"+encodeURIComponent(id),{method:"DELETE"});if(!r.ok)return alert(r.data.error||"Archivage impossible.");await loadContents();await loadAudit();}
function previewContent(id){const x=contents.find(y=>y.id===id);if(!x)return;const w=window.open("about:blank","_blank","width=720,height=720");if(!w)return;w.document.write("<title>Aperçu — "+esc(x.title)+"</title><style>body{font-family:system-ui;padding:30px;max-width:680px;margin:auto}img{max-width:100%;border-radius:14px}h1{font-size:36px}p{line-height:1.6;color:#555}</style><h1>"+esc(x.title)+"</h1><h3>"+esc(x.subtitle||"")+"</h3>"+(x.image_url?"<img src=\""+esc(x.image_url)+"\">":"")+"<p>"+esc(x.body||"")+"</p>");w.document.close();}

function resetCategory(){editingCategory=null;$("category-form").reset();$("category-form").id.value="";$("category-form").image_url.value="";$("category-form").universe.value=$("category-universe").value;$("category-form").active.checked=true;$("category-form-title").textContent="Créer / modifier";$("category-image-preview").hidden=true;$("category-image-preview").innerHTML="";message("category-msg","",true);}
function fillCategory(x){editingCategory=x;$("category-form-title").textContent="Modifier la catégorie";for(const key of ["id","universe","name","slug","description","image_url","icon","parent_slug","sort_order"]){if($("category-form").elements[key])$("category-form").elements[key].value=x[key]??"";}$("category-form").active.checked=x.active!==false;setPreviewUrl("category-image-preview",x.image_url||"");window.scrollTo({top:0,behavior:"smooth"});}
function drawCategories(){const list=categories.filter(x=>x.universe===$("category-universe").value);$("category-list").innerHTML=list.map(x=>`<article class="studio-item"><div class="studio-item-main"><h3>${esc(x.name)}</h3><p>${esc(x.slug)} · ordre ${Number(x.sort_order)||0}</p><p>${esc(x.description||"")}</p>${x.image_url?`<p>🖼️ miniature configurée</p>`:"<p>🖼️ aucune miniature</p>"}</div><div class="studio-actions"><button onclick="fillCategory(categories.find(y=>y.id==='${x.id}'))">Modifier</button>${x.active!==false?`<button onclick="archiveCategory('${x.id}')">Désactiver</button>`:`<button onclick="activateCategory('${x.id}')">Activer</button>`}</div></article>`).join("")||'<div class="empty">Aucune catégorie.</div>';}
async function loadCategories(){const r=await call("/admin/studio/categories?universe="+encodeURIComponent($("category-universe").value));if(!r.ok){message("category-msg",r.data.error||"Impossible de charger les catégories.",false);return;}categories=r.data||[];drawCategories();}
async function saveCategory(e){e.preventDefault();const form=e.currentTarget,b=Object.fromEntries(new FormData(form)),id=b.id;delete b.id;delete b.image;b.active=form.active.checked;b.sort_order=Number(b.sort_order)||0;if(form.elements.image?.files?.[0]){try{message("category-msg","Téléversement de la miniature…",true);const asset=await uploadImage(form.elements.image.files[0],form.elements.universe.value);b.image_url=asset.url;}catch(err){message("category-msg",err.message,false);return;}}const r=await call(id?"/admin/studio/categories/"+encodeURIComponent(id):"/admin/studio/categories",{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});if(!r.ok){message("category-msg",r.data.error||"Enregistrement impossible.",false);return;}message("category-msg","Catégorie enregistrée.",true);resetCategory();await loadCategories();await loadAudit();}
async function archiveCategory(id){const r=await call("/admin/studio/categories/"+encodeURIComponent(id),{method:"DELETE"});if(!r.ok)return alert(r.data.error||"Désactivation impossible.");await loadCategories();await loadAudit();}
async function activateCategory(id){const r=await call("/admin/studio/categories/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:true})});if(!r.ok)return alert(r.data.error||"Activation impossible.");await loadCategories();await loadAudit();}

function drawMedia(targetId="media-list", picker=false){
  const box=$(targetId); if(!box)return;
  const universe=$(picker ? "media-universe" : "media-universe")?.value||"";
  const rows=mediaAssets.filter(x=>!universe||!x.universe||x.universe===universe);
  box.innerHTML=rows.length?rows.map(x=>`<article class="media-item"><img src="${esc(x.url)}" alt="${esc(x.original_name||"Image")}"><div class="media-item-body"><strong>${esc(x.original_name||"Image")}</strong><small>${esc(x.content_type||"")} · ${Math.round(Number(x.size_bytes||0)/1024)} Ko</small><div class="media-item-actions">${picker?`<button type="button" onclick="useStudioMedia('${esc(x.url)}')">Utiliser</button>`:""}<button type="button" onclick="copyMediaUrl('${esc(x.url)}')">Copier le lien</button>${!picker?`<button type="button" onclick="deleteMedia('${esc(x.id)}')">Désactiver</button>`:""}</div></div></article>`).join(""):`<div class="empty">Aucun média disponible.</div>`;
}
async function loadMedia(){
  const r=await call("/admin/studio/media");
  if(!r.ok){message("media-msg",r.data.error||"Impossible de charger la bibliothèque média.",false);return;}
  mediaAssets=r.data||[];
  drawMedia();
}
async function uploadToMediaLibrary(e){
  e.preventDefault();
  const file=$("media-upload")?.files?.[0];
  if(!file)return message("media-msg","Sélectionnez une image.",false);
  try{
    message("media-msg","Téléversement…",true);
    await uploadImage(file,$("media-universe").value);
    message("media-msg","Image ajoutée à la bibliothèque.",true);
    e.currentTarget.reset();
    await loadMedia();
  }catch(err){message("media-msg",err.message,false);}
}
async function deleteMedia(id){
  if(!confirm("Désactiver ce média ?"))return;
  const r=await call("/admin/studio/media/"+encodeURIComponent(id),{method:"DELETE"});
  if(!r.ok)return alert(r.data.error||"Suppression impossible.");
  await loadMedia();await loadAudit();
}
async function copyMediaUrl(url){
  try{await navigator.clipboard.writeText(url);message("media-msg","Lien copié.",true);}catch{alert(url);}
}
function openMediaPicker(target){
  mediaPickerTarget=target;
  $("media-modal").hidden=false;
  drawMedia("media-picker-list",true);
}
function closeMediaPicker(){
  mediaPickerTarget=null;
  $("media-modal").hidden=true;
}
function useStudioMedia(url){
  if(mediaPickerTarget==="content"){
    $("content-form").image_url.value=url;
    setPreviewUrl("content-image-preview",url);
  }else if(mediaPickerTarget==="category"){
    $("category-form").image_url.value=url;
    setPreviewUrl("category-image-preview",url);
  }
  closeMediaPicker();
}
async function loadAudit(){const r=await call("/admin/studio/audit?limit=100");if(!r.ok){$("audit-list").innerHTML='<div class="empty">Historique indisponible.</div>';return;}const rows=r.data||[];$("audit-list").innerHTML=rows.map(x=>`<div class="audit-entry"><strong>${esc(x.action)} · ${esc(x.target_type)} · ${esc(x.target_id)}</strong><span>${esc(x.actor_name||x.actor_email||"Admin")} · ${esc(x.actor_email||"")}</span><small>${esc(x.created_at||"")}</small></div>`).join("")||'<div class="empty">Aucune modification enregistrée.</div>';}

document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.querySelectorAll(".studio-panel").forEach(x=>x.hidden=true);$(btn.dataset.tab+"-tab").hidden=false;if(btn.dataset.tab==="audit")loadAudit();if(btn.dataset.tab==="media")loadMedia();});
$("content-universe").onchange=loadContents;$("content-status").onchange=loadContents;$("new-content").onclick=resetContent;$("reset-content").onclick=resetContent;$("content-form").onsubmit=saveContent;
$("category-universe").onchange=loadCategories;$("new-category").onclick=resetCategory;$("reset-category").onclick=resetCategory;$("category-form").onsubmit=saveCategory;$("refresh-audit").onclick=loadAudit;$("refresh-media").onclick=loadMedia;$("media-universe").onchange=()=>drawMedia();$("media-upload-form").onsubmit=uploadToMediaLibrary;
(async function boot(){const me=await call("/admin/me");if(!me.ok){location.href="/admin-login.html";return;}resetContent();resetCategory();await Promise.all([loadContents(),loadCategories(),loadMedia()]);})();

$("content-image").onchange=()=>previewFile("content-image","content-image-preview");
$("category-image").onchange=()=>previewFile("category-image","category-image-preview");
