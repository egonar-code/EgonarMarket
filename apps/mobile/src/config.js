import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || {};
const role = extra.appRole === "admin" ? "admin" : "supplier";

export const MOBILE_ROLE = role;
export const API_BASE_URL = String(extra.apiBaseUrl || "http://localhost:3000").replace(/\/$/, "");
export const APP_NAME = role === "admin" ? "Egonar Admin" : "Egonar Fournisseur";
