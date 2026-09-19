const bcrypt = require("bcryptjs");
const { getDb } = require("../apps/api/src/firestore");
require("dotenv").config();

async function main() {
  const email = String(process.env.ADMIN_EMAIL || "admin@egonarmarket.sn").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!password || password === "replace-this-password") throw new Error("ADMIN_PASSWORD doit être défini pour Firestore.");

  const firestore = getDb();
  const query = await firestore.collection("admins").where("email", "==", email).limit(1).get();
  const ref = query.empty ? firestore.collection("admins").doc(email.replace(/[^a-z0-9._-]/g, "_")) : query.docs[0].ref;
  const existing = await ref.get();
  const now = new Date();
  const data = {
    email,
    role: "admin",
    updated_at: now
  };

  if (!existing.exists) {
    data.id = ref.id;
    data.password_hash = await bcrypt.hash(password, 12);
    data.created_at = now;
    await ref.set(data);
    console.log("Compte administrateur Firestore créé:", email);
  } else {
    data.password_hash = await bcrypt.hash(password, 12);
    data.id = existing.data().id || ref.id;
    await ref.set(data, { merge: true });
    console.log("Compte administrateur Firestore mis à jour:", email);
  }
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exit(1);
});
