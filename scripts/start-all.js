const { spawn } = require("child_process");

const commonEnv = { ...process.env };
const main = spawn(process.execPath, ["-r", "./apps/api/src/order-hardening-preload.js", "apps/api/src/server.js"], {
  env: { ...commonEnv, PORT: process.env.PORT || "3000" },
  stdio: "inherit"
});
const supplier = spawn(process.execPath, ["apps/api/src/supplier-server.js"], {
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
