const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
require("dotenv").config();

function getServiceAccount() {
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON manquant.");
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON invalide: JSON attendu.");
  }
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON incomplet.");
  }
  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: String(parsed.private_key).replace(/\\n/g, "\n")
  };
}

function getApp() {
  const apps = getApps();
  if (apps.length) return apps[0];
  const serviceAccount = getServiceAccount();
  return initializeApp({ credential: cert(serviceAccount) });
}

function getDb() {
  return getFirestore(getApp());
}

function now() {
  return Timestamp.now();
}

function serializeValue(value) {
  if (value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = serializeValue(item);
    return out;
  }
  return value;
}

function docToData(doc) {
  return { id: doc.id, ...serializeValue(doc.data() || {}) };
}

module.exports = {
  getDb,
  now,
  FieldValue,
  docToData,
  serializeValue
};
