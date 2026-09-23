const fs=require("fs");
const path=require("path");
const server=fs.readFileSync(path.join(__dirname,"..","apps/api/src/server-firestore.js"),"utf8");
const studio=fs.readFileSync(path.join(__dirname,"..","apps/web/egonar-studio.html"),"utf8");
const studioJs=fs.readFileSync(path.join(__dirname,"..","apps/web/egonar-studio.js"),"utf8");
const admin=fs.readFileSync(path.join(__dirname,"..","apps/web/admin.html"),"utf8");

for(const endpoint of [
  'app.get("/api/content"',
  'app.get("/api/admin/studio/content"',
  'app.post("/api/admin/studio/content"',
  'app.patch("/api/admin/studio/content/:id"',
  'app.delete("/api/admin/studio/content/:id"',
  'app.get("/api/admin/studio/categories"',
  'app.post("/api/admin/studio/categories"',
  'app.patch("/api/admin/studio/categories/:id"',
  'app.delete("/api/admin/studio/categories/:id"',
  'app.get("/api/admin/studio/audit"'
]) if(!server.includes(endpoint)) throw new Error("Endpoint Studio manquant: "+endpoint);

for(const marker of ["EGONAR STUDIO","Contenus","Catégories","Historique","data-tab="audit""]) if(!studio.includes(marker)) throw new Error("UI Studio manquante: "+marker);
for(const marker of ["saveContent","publishContent","archiveContent","saveCategory","loadAudit"]) if(!studioJs.includes(marker)) throw new Error("Fonction Studio manquante: "+marker);
if(!admin.includes('href="egonar-studio.html"')) throw new Error("Accès Admin → Studio manquant");
console.log("studio-contract-test: OK");
