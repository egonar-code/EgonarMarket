export const MOBILE_ROLE = String(process.env.EXPO_PUBLIC_APP_ROLE || "supplier").toLowerCase() === "admin" ? "admin" : "supplier";
export const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
export const APP_NAME = MOBILE_ROLE === "admin" ? "Egonar Admin" : "Egonar Fournisseur";
