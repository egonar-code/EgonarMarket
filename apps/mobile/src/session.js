import * as SecureStore from "expo-secure-store";

const KEY = "egonar_mobile_session";

export async function saveSession(session) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session || {}));
}

export async function getSession() {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(KEY);
}
