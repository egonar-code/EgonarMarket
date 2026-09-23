const fs=require("fs");
const path=require("path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

const server=read("apps/api/src/server-firestore.js");
const supplier=read("apps/api/src/supplier-server-firestore.js");
const admin=read("apps/web/admin.html");
const supplierHtml=read("apps/web/supplier.html");
const supplierJs=read("apps/web/supplier-app.js");
const studioHtml=read("apps/web/egonar-studio.html");
const studioJs=read("apps/web/egonar-studio.js");
const runtime=read("apps/web/studio-runtime.js");
const product=read("apps/web/produit.html");

for(const marker of [
  'const studioUpload = multer(', 'app.post("/api/admin/studio/upload"',
  'app.get("/api/admin/studio/media"', 'app.delete("/api/admin/studio/media/:id"',
  'image_gallery', 'normalizeImageUrls'
]) if(!server.includes(marker)) throw new Error("Fonctionnalité média/gallerie absente du serveur: "+marker);

for(const marker of [
  'app.post("/api/supplier/upload-image"', 'app.get("/api/supplier/media"',
  'app.patch("/api/supplier/profile"', 'image_gallery'
]) if(!supplier.includes(marker)) throw new Error("Fonctionnalité fournisseur absente: "+marker);

for(const marker of ['name="image_gallery"','multiple','id="product-image"','id="supplier-product-image"'])
  if(!admin.includes(marker) && !supplierHtml.includes(marker)) throw new Error("UI galerie absente: "+marker);

for(const marker of ['uploadAdminImages','image_gallery','uploadSupplierImages'])
  if(!admin.includes(marker) && !supplierJs.includes(marker)) throw new Error("Logique galerie absente: "+marker);

for(const marker of ['id="media-tab"','id="media-upload"','id="media-modal"','openMediaPicker','loadMedia'])
  if(!studioHtml.includes(marker) && !studioJs.includes(marker)) throw new Error("Bibliothèque média absente: "+marker);

for(const marker of ['EgonarStudioRuntime','data-content-key','/api/content'])
  if(!runtime.includes(marker)) throw new Error("Runtime Studio dynamique incomplet: "+marker);

if(!product.includes("detail-gallery") || !product.includes("image_gallery")) throw new Error("Galerie fiche produit absente.");
console.log("platform-modernization-contract-test: OK");
