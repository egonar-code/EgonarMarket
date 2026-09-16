export const MOBILE_ROLE = String(process.env.EXPO_PUBLIC_APP_ROLE || "supplier").toLowerCase() === "admin" ? "admin" : "supplier";

const publicSupplierApi = "https://expert-acorn-r7p567r4xq593p776-3001.app.github.dev";
const publicMainApi = "https://expert-acorn-r7p567r4xq593p776-3000.app.github.dev";

export const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_BASE_URL || (MOBILE_ROLE === "supplier" ? publicSupplierApi : publicMainApi)).replace(/\/$/, "");
export const SUPPLIER_API_BASE_URL = String(process.env.EXPO_PUBLIC_SUPPLIER_API_BASE_URL || publicSupplierApi).replace(/\/$/, "");
export const APP_NAME = MOBILE_ROLE === "admin" ? "Egonar Admin" : "Egonar Fournisseur";
