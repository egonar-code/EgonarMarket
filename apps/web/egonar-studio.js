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
function setPublishInput(value){const input=$("content-form").elements.publish_at;if(!input)return;if(!value){input.value="";return;}const d=new Date(value);if(Number.isNaN(d.getTime())){input.value="";return;}const pad=n=>String(n).padStart(2,"0");input.value=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());}
function setPreviewUrl(previewId,url){
  const preview=$(previewId);
  if(!url){preview.hidden=true;preview.innerHTML="";return;}
  preview.hidden=false;
  preview.innerHTML='<img src="'+esc(url)+'" alt="Image actuelle"><small>Image actuelle</small>';
}
function resetContent(){editingContent=null;$("content-form").reset();$("content-form").id.value="";$("content-form").image_url.value="";$("content-form").content_type.value="PAGE";$("content-form").locale.value="fr";$("content-form").publish_at.value="";$("content-form").sort_order.value="0";$("content-form-title").textContent="Créer / modifier";$("content-image-preview").hidden=true;$("content-image-preview").innerHTML="";message("content-msg","",true);}
function fillContent(x){editingContent=x;$("content-form-title").textContent="Modifier le contenu";for(const key of ["id","content_type","universe","locale","key","title","subtitle","body","image_url","cta_label","cta_url","meta_title","meta_description","publish_at","sort_order"]){if($("content-form").elements[key])$("content-form").elements[key].value=x[key]??"";}$("content-form").id.value=x.id;setPublishInput(x.publish_at);setPreviewUrl("content-image-preview",x.image_url||"");message("content-msg","",true);window.scrollTo({top:0,behavior:"smooth"});}
function publishLabel(x){if(x.status!=="PUBLISHED")return statusLabel[x.status]||x.status; if(x.publish_at){const t=new Date(x.publish_at);if(!Number.isNaN(t.getTime())&&t.getTime()>Date.now())return "Programmé";}return "Publié";}
function drawContents(){const q="",list=contents.filter(x=>(!$("content-universe").value||x.universe===$("content-universe").value)&&(!$("content-status").value||x.status===$("content-status").value)&&(!q||String(x.title).toLowerCase().includes(q)));$("content-list").innerHTML=list.map(x=>`<article class="studio-item"><div class="studio-item-main"><h3>${esc(x.title)}</h3><p><strong>${esc(x.key)}</strong> · ${esc(universeLabel[x.universe]||x.universe)} · ${esc(x.locale)}</p><p>${esc(x.subtitle||"")}</p><span class="studio-status ${x.status=== "PUBLISHED"?"published":x.status==="ARCHIVED"?"archived":""}">${esc(publishLabel(x))}</span></div><div class="studio-actions"><button onclick="fillContent(contents.find(y=>y.id==='${x.id}'))">Modifier</button>${x.status!=="PUBLISHED"&&x.status!=="ARCHIVED"?`<button onclick="publishContent('${x.id}')">Publier</button>`:""}${x.status==="PUBLISHED"?`<button onclick="archiveContent('${x.id}')">Archiver</button>`:""}${x.image_url?`<button onclick="previewContent('${x.id}')">Aperçu</button>`:""}</div></article>`).join("")||'<div class="empty">Aucun contenu pour ces filtres.</div>';}
async function loadContents(){const params=new URLSearchParams();if($("content-universe").value)params.set("universe",$("content-universe").value);if($("content-status").value)params.set("status",$("content-status").value);const r=await call("/admin/studio/content?"+params);if(!r.ok){message("content-msg",r.data.error||"Impossible de charger le contenu.",false);return;}contents=r.data||[];drawContents();}
function visualPage(universe){return universe==="MARKET"?"index.html":universe==="SAVEURS"?"food.html":"travel.html";}
function visualRow(slot,locale="fr"){return contents.find(x=>x.universe===slot.universe&&x.key===slot.key&&x.locale===locale&&x.status!=="ARCHIVED")||null;}
function drawVisuals(){
  const box=$("visual-list"); if(!box)return;
  const catalog=Array.isArray(window.EgonarStudioVisualCatalog)?window.EgonarStudioVisualCatalog:[];
  const groups={MARKET:[],SAVEURS:[],EVASION:[]};
  catalog.forEach(slot=>{if(groups[slot.universe])groups[slot.universe].push(slot);});
  const names={MARKET:"Market",SAVEURS:"Saveurs",EVASION:"Évasion"};
  box.innerHTML=Object.entries(groups).map(([universe,slots])=>`<div class="visual-group"><h3>${esc(names[universe])}</h3><div class="visual-grid">${slots.map(slot=>{
    const row=visualRow(slot);
    const image=row?.image_url||slot.defaultImage||"";
    const state=row?.status==="PUBLISHED"?"Publié":"Par défaut";
    return `<article class="visual-card"><img src="${esc(image)}" alt="${esc(slot.label)}" onerror="this.style.opacity='.35'"><div class="visual-card-body"><h3>${esc(slot.label)}</h3><p>${esc(slot.zone)}</p><span class="visual-state ${row?.status==="PUBLISHED"?"live":""}">${esc(state)}</span><div class="visual-card-actions"><button type="button" class="primary-action" onclick="replaceVisualImage('${esc(slot.key)}')">Remplacer la photo</button><button type="button" onclick="editVisualContent('${esc(slot.key)}')">Modifier le contenu</button><a class="btn secondary" href="${esc(visualPage(slot.universe))}" target="_blank" rel="noopener">Voir la plateforme</a></div></div></article>`;
  }).join("")}</div></div>`).join("");
}
async function loadVisuals(){
  const r=await call("/admin/studio/content");
  if(!r.ok){message("visual-msg",r.data?.error||"Impossible de charger les visuels.",false);return;}
  contents=r.data||[];
  drawVisuals();
}
function activateStudioTab(tab){
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));
  document.querySelectorAll(".studio-panel").forEach(x=>x.hidden=true);
  const panel=$(tab+"-tab"); if(panel)panel.hidden=false;
  if(tab==="dashboard")drawDashboard();
  if(tab==="visuals")loadVisuals();
  if(tab==="content")loadContents();
  if(tab==="categories")loadCategories();
  if(tab==="media")loadMedia();
  if(tab==="audit")loadAudit();
}
function drawDashboard(){
  const box=$("dashboard-stats"); if(!box)return;
  const published=contents.filter(x=>x.status==="PUBLISHED").length;
  const drafts=contents.filter(x=>x.status==="DRAFT").length;
  const visuals=(window.EgonarStudioVisualCatalog||[]).length;
  const configured=(window.EgonarStudioVisualCatalog||[]).filter(slot=>visualRow(slot)).length;
  box.innerHTML=[
    ["Contenus",contents.length,"Toutes langues et plateformes"],
    ["Publiés",published,"Contenus actuellement publiés"],
    ["Brouillons",drafts,"Contenus en préparation"],
    ["Visuels",configured+"/"+visuals,"Emplacements configurés"]
  ].map(([a,b,d])=>'<div class="studio-stat"><strong>'+esc(b)+'</strong><span>'+esc(a)+'</span><small>'+esc(d)+'</small></div>').join("");
}
function openVisualEditor(key,locale="fr"){
  const slot=(window.EgonarStudioVisualCatalog||[]).find(x=>x.key===key); if(!slot)return;
  const row=visualRow(slot,locale)||visualRow(slot,"fr")||visualRow(slot,"en");
  const form=$("visual-editor-form");
  form.reset();
  form.elements.id.value=row?.id||"";
  form.elements.key.value=slot.key;
  form.elements.universe.value=slot.universe;
  form.elements.content_type.value=row?.content_type||"BANNER";
  form.elements.locale.value=row?.locale||locale;
  form.elements.title.value=row?.title||slot.label;
  form.elements.subtitle.value=row?.subtitle||"";
  form.elements.body.value=row?.body||"";
  form.elements.cta_label.value=row?.cta_label||"";
  form.elements.cta_url.value=row?.cta_url||"";
  form.elements.image_url.value=row?.image_url||"";
  setPreviewUrl("visual-editor-image",row?.image_url||slot.defaultImage||"");
  form.dataset.slotKey=slot.key;
  $("visual-editor-title").textContent="Modifier — "+slot.label;
  $("visual-editor-msg").textContent="";
  $("visual-editor-modal").hidden=false;
}
function closeVisualEditor(){$("visual-editor-modal").hidden=true;}
async function saveVisualEditor(e){
  e.preventDefault();
  const form=e.currentTarget,b=Object.fromEntries(new FormData(form)),id=b.id; delete b.id;
  b.status="PUBLISHED";b.active=true;b.publish_at=null;b.sort_order=0;
  const r=await call(id?"/admin/studio/content/"+encodeURIComponent(id):"/admin/studio/content",{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});
  if(!r.ok){message("visual-editor-msg",r.data?.error||"Enregistrement impossible.",false);return;}
  message("visual-editor-msg","Contenu enregistré et publié.",true);
  await loadVisuals(); await loadContents(); drawDashboard(); await loadAudit();
  setTimeout(closeVisualEditor,350);
}
function editVisualContent(key){openVisualEditor(key,"fr");}
async function replaceVisualImage(key){
  const slot=(window.EgonarStudioVisualCatalog||[]).find(x=>x.key===key); if(!slot)return;
  const input=document.createElement("input"); input.type="file"; input.accept="image/jpeg,image/png,image/webp,image/gif";
  input.onchange=async()=>{
    const file=input.files?.[0]; if(!file)return;
    try{
      message("visual-msg","Téléversement de la nouvelle image…",true);
      const asset=await uploadImage(file,slot.universe);
      for(const locale of ["fr","en"]){
        const row=visualRow(slot,locale);
        if(row){
          const r=await call("/admin/studio/content/"+encodeURIComponent(row.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({image_url:asset.url,status:"PUBLISHED",active:true,publish_at:null})});
          if(!r.ok)throw new Error(r.data?.error||"Impossible de publier l’image.");
        }else{
          const created=await call("/admin/studio/content",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content_type:"BANNER",universe:slot.universe,locale,key:slot.key,title:slot.label,image_url:asset.url,subtitle:"",body:"",cta_label:"",cta_url:"",meta_title:"",meta_description:"",publish_at:null,sort_order:0})});
          if(!created.ok)throw new Error(created.data?.error||"Impossible de créer le visuel.");
          const id=created.data?.id;
          if(id){
            const published=await call("/admin/studio/content/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"PUBLISHED",active:true})});
            if(!published.ok)throw new Error(published.data?.error||"Impossible de publier le visuel.");
          }
        }
      }
      message("visual-msg","Photo remplacée et publiée sur les deux langues.",true);
      await Promise.all([loadVisuals(),loadAudit()]);
    }catch(err){message("visual-msg",err.message||"Remplacement impossible.",false);}
  };
  input.click();
}
async function saveContent(e){e.preventDefault();const form=e.currentTarget,b=Object.fromEntries(new FormData(form)),id=b.id;delete b.id;delete b.image;if(form.elements.image?.files?.[0]){try{message("content-msg","Téléversement de l’image…",true);const asset=await uploadImage(form.elements.image.files[0],form.elements.universe.value);b.image_url=asset.url;}catch(err){message("content-msg",err.message,false);return;}}b.sort_order=Number(b.sort_order)||0;b.publish_at=b.publish_at?new Date(b.publish_at).toISOString():null;const r=await call(id?"/admin/studio/content/"+encodeURIComponent(id):"/admin/studio/content",{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});if(!r.ok){message("content-msg",r.data.error||"Enregistrement impossible.",false);return;}message("content-msg",id?"Contenu mis à jour.":"Brouillon créé.",true);resetContent();await loadContents();}
async function publishContent(id){const x=contents.find(y=>y.id===id);const publishAt=x?.publish_at?new Date(x.publish_at):null;const r=await call("/admin/studio/content/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"PUBLISHED",active:true,publish_at:publishAt&&!Number.isNaN(publishAt.getTime())?publishAt.toISOString():null})});if(!r.ok)return alert(r.data.error||"Publication impossible.");await loadContents();await loadAudit();}
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
async function openMediaPicker(target){
  mediaPickerTarget=target;
  $("media-modal").hidden=false;
  message("media-picker-msg","Chargement de la bibliothèque…",true);
  await loadMedia();
  drawMedia("media-picker-list",true);
  message("media-picker-msg","",true);
}
function closeMediaPicker(){
  mediaPickerTarget=null;
  $("media-modal").hidden=true;
  const input=$("media-picker-upload");
  if(input)input.value="";
  message("media-picker-msg","",true);
}
async function uploadFromMediaPicker(){
  const file=$("media-picker-upload")?.files?.[0];
  if(!file)return message("media-picker-msg","Sélectionnez une image.",false);
  const target=mediaPickerTarget;
  if(!target)return;
  const universe=target==="content"?$("content-form").elements.universe.value:$("category-form").elements.universe.value;
  try{
    message("media-picker-msg","Téléversement de l’image…",true);
    const asset=await uploadImage(file,universe);
    await loadMedia();
    useStudioMedia(asset.url);
  }catch(err){
    message("media-picker-msg",err.message||"Téléversement impossible.",false);
  }
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

document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>activateStudioTab(btn.dataset.tab));
$("content-universe").onchange=loadContents;$("content-status").onchange=loadContents;$("new-content").onclick=resetContent;$("reset-content").onclick=resetContent;$("content-form").onsubmit=saveContent; $("visual-editor-form").onsubmit=saveVisualEditor;
$("refresh-dashboard").onclick=drawDashboard; $("refresh-visuals").onclick=loadVisuals;$("category-universe").onchange=loadCategories;$("new-category").onclick=resetCategory;$("reset-category").onclick=resetCategory;$("category-form").onsubmit=saveCategory;$("refresh-audit").onclick=loadAudit;$("refresh-media").onclick=loadMedia;$("media-universe").onchange=()=>drawMedia();$("media-upload-form").onsubmit=uploadToMediaLibrary;
(async function boot(){const me=await call("/admin/me");if(!me.ok){location.href="/admin-login.html";return;}resetContent();resetCategory();await Promise.all([loadContents(),loadCategories(),loadMedia()]);drawDashboard();})();

$("content-image").onchange=()=>previewFile("content-image","content-image-preview");
$("category-image").onchange=()=>previewFile("category-image","category-image-preview");
