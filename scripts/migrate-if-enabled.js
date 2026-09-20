const enabled = ["1", "true", "yes", "on"].includes(String(process.env.FIRESTORE_MIGRATE_ON_START || "").trim().toLowerCase());

if (!enabled) {
  console.log("Firestore migration automatique désactivée.");
  process.exit(0);
}

console.log("Firestore migration automatique activée.");
require("./migrate-pg-to-firestore.js");
