export const MOBILE_ROLE = String(process.env.EXPO_PUBLIC_APP_ROLE || "supplier").toLowerCase() === "admin" ? "admin" : "supplier";
const defaultApi = MOBILE_ROLE === "supplier" ? "http://localhost:3001" : "http://localhost:3000";
export const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_BASE_URL || defaultApi).replace(/\/$/, "");
export const APP_NAME = MOBILE_ROLE === "admin" ? "Egonar Admin" : "Egonar Fournisseur";
