const { spawn } = require("child_process");

const commonEnv = { ...process.env };
const mainEntry = String(process.env.DATA_BACKEND || "postgres").toLowerCase() === "firestore" ? "apps/api/src/server-firestore.js" : "apps/api/src/server.js";
const mainArgs = mainEntry.endsWith("server.js") ? ["-r", "./apps/api/src/order-hardening-preload.js", mainEntry] : [mainEntry];
const main = spawn(process.execPath, mainArgs, {
  env: { ...commonEnv, PORT: process.env.PORT || "3000" },
  stdio: "inherit"
});
const supplierEntry = String(process.env.DATA_BACKEND || "postgres").toLowerCase() === "firestore" ? "apps/api/src/supplier-server-firestore.js" : "apps/api/src/supplier-server.js";
const supplier = spawn(process.execPath, [supplierEntry], {
  env: { ...commonEnv, SUPPLIER_PORT: process.env.SUPPLIER_PORT || "3001" },
  stdio: "inherit"
});

let stopping = false;
const stop = code => {
  if (stopping) return;
  stopping = true;
  for (const child of [main, supplier]) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 5000).unref();
};
main.on("exit", (code, signal) => { if (!stopping) stop(typeof code === "number" ? code : 1); });
supplier.on("exit", (code, signal) => { if (!stopping) stop(typeof code === "number" ? code : 1); });
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
