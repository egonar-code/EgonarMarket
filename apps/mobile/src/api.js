import { API_BASE_URL } from "./config";

let sessionToken = null;

export function setSessionToken(token) {
  sessionToken = token || null;
}

export async function api(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: "include" });
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
  login: (email, password) => api("/api/supplier/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/api/supplier/me"),
  stats: () => api("/api/supplier/stats"),
  products: () => api("/api/supplier/products"),
  createProduct: product => api("/api/supplier/products", { method: "POST", body: JSON.stringify(product) }),
  updateProduct: (id, patch) => api(`/api/supplier/products/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deactivateProduct: id => api(`/api/supplier/products/${id}`, { method: "DELETE" }),
  logout: () => api("/api/supplier/logout", { method: "POST" })
};

export const adminApi = {
  login: (email, password) => api("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/api/admin/me"),
  suppliers: () => api("/api/supplier/admin/suppliers"),
  pendingProducts: () => api("/api/supplier/admin/products?status=PENDING"),
  updateSupplierStatus: (id, status) => api(`/api/supplier/admin/suppliers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  approveProduct: (id, approval_status) => api(`/api/supplier/admin/products/${id}/approval`, { method: "PATCH", body: JSON.stringify({ approval_status }) }),
  logout: () => api("/api/admin/logout", { method: "POST" })
};
