const { spawnSync } = require("child_process");

const useFirestore = String(process.env.DATA_BACKEND || "postgres").toLowerCase() === "firestore";
const command = useFirestore ? "scripts/init-firestore.js" : "apps/api/src/seed.js";

console.log(`Preparing datastore: ${useFirestore ? "firestore" : "postgres"}`);

const result = spawnSync(process.execPath, [command], {
  env: process.env,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(Number.isInteger(result.status) ? result.status : 1);
