import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, MOBILE_ROLE, SUPPLIER_API_BASE_URL } from "./config";

const TOKEN_KEY = `egonar_${MOBILE_ROLE}_token`;
let sessionToken = null;
let sessionReady = false;
const sessionReadyPromise = SecureStore.getItemAsync(TOKEN_KEY).then(token => { sessionToken = token || null; sessionReady = true; return sessionToken; }).catch(() => { sessionReady = true; return null; });

export async function initSession() {
  await sessionReadyPromise;
  return sessionToken;
}

export async function setSessionToken(token) {
  await sessionReadyPromise;
  sessionToken = token || null;
  if (sessionToken) await SecureStore.setItemAsync(TOKEN_KEY, sessionToken);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function clearSession() {
  await sessionReadyPromise;
  sessionToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function api(path, options = {}, baseUrl = API_BASE_URL) {
  await sessionReadyPromise;
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: "include" });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(data?.error || `Erreur API (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const supplierApi = {
  login: async (email, password) => {
    const data = await api("/api/supplier/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await setSessionToken(data.token);
    return data;
  },
  me: () => api("/api/supplier/me"),
  stats: () => api("/api/supplier/stats"),
  products: () => api("/api/supplier/products"),
  createProduct: product => api("/api/supplier/products", { method: "POST", body: JSON.stringify(product) }),
  updateProduct: (id, patch) => api(`/api/supplier/products/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deactivateProduct: id => api(`/api/supplier/products/${id}`, { method: "DELETE" }),
  logout: async () => { try { return await api("/api/supplier/logout", { method: "POST" }); } finally { await clearSession(); } }
};

export const adminApi = {
  login: async (email, password) => {
    const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await setSessionToken(data.token);
    return data;
  },
  me: () => api("/api/admin/me"),
  suppliers: () => api("/api/supplier/admin/suppliers", {}, SUPPLIER_API_BASE_URL),
  pendingProducts: () => api("/api/supplier/admin/products?status=PENDING", {}, SUPPLIER_API_BASE_URL),
  updateSupplierStatus: (id, status) => api(`/api/supplier/admin/suppliers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, SUPPLIER_API_BASE_URL),
  approveProduct: (id, approval_status) => api(`/api/supplier/admin/products/${id}/approval`, { method: "PATCH", body: JSON.stringify({ approval_status }) }, SUPPLIER_API_BASE_URL),
  logout: async () => { try { return await api("/api/admin/logout", { method: "POST" }); } finally { await clearSession(); } }
};
