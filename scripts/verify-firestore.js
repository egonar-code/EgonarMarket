const { getDb, docToData } = require("../apps/api/src/firestore");
require("dotenv").config();

async function main() {
  const firestore = getDb();
  const collections = ["products", "customers", "orders", "reviews", "admins", "suppliers", "categories"];
  const counts = {};
  for (const name of collections) {
    const snap = await firestore.collection(name).limit(1000).get();
    counts[name] = snap.size;
  }
  const adminEmail = String(process.env.ADMIN_EMAIL || "admin@egonarmarket.sn").trim().toLowerCase();
  const adminSnap = await firestore.collection("admins").where("email", "==", adminEmail).limit(1).get();
  console.log(JSON.stringify({
    ok: true,
    projectConfigured: true,
    collections: counts,
    adminPresent: !adminSnap.empty,
    sampleProduct: (await firestore.collection("products").limit(1).get()).docs.map(docToData)[0] || null
  }, null, 2));
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exit(1);
});
