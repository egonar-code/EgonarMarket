import AsyncStorage from "@react-native-async-storage/async-storage";

const SNAPSHOT_KEY = "egonar_supplier_workspace_snapshot_v1";

export async function saveSupplierWorkspace(data) {
  try {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
  } catch {}
}

export async function loadSupplierWorkspace() {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearSupplierWorkspace() {
  try { await AsyncStorage.removeItem(SNAPSHOT_KEY); } catch {}
}
