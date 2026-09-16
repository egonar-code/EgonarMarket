import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOBILE_ROLE } from "./config";
import { supplierApi } from "./api";

const KEY = "egonar_supplier_universe";
const colors = { bg: "#f6f8fb", card: "#fff", ink: "#111827", muted: "#6b7280", accent: "#2563eb", border: "#e5e7eb" };
const spaces = [
  { id: "marketplace", icon: "🛍️", name: "EgonarMarket", title: "Je vends des produits", text: "Mode, accessoires, maison, beauté, tech et autres produits." },
  { id: "food", icon: "🍽️", name: "Saveurs", title: "Je vends des plats / offres culinaires", text: "Plats, menus, traiteur, alimentation et services culinaires." },
  { id: "travel", icon: "✈️", name: "Évasion", title: "Je propose des services touristiques", text: "Hôtels, activités, excursions, transport et expériences." }
];

export default function SupplierUniverseGate({ children }) {
  const [ready, setReady] = useState(MOBILE_ROLE !== "supplier");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (MOBILE_ROLE !== "supplier") return undefined;
    let active = true;
    const check = async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved && active) { setSelected(saved); setReady(true); return true; }
        await supplierApi.me();
        if (active) setReady(true);
        return true;
      } catch {
        if (active) setReady(true);
        return false;
      }
    };
    check();
    return undefined;
  }, []);

  async function choose(id) {
    await AsyncStorage.setItem(KEY, id);
    setSelected(id);
  }

  async function changeUniverse() {
    await AsyncStorage.removeItem(KEY);
    setSelected(null);
  }

  if (!ready) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large"/><Text style={styles.muted}>Chargement…</Text></View></SafeAreaView>;
  if (MOBILE_ROLE !== "supplier") return children;
  if (!selected) return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}><Text style={styles.kicker}>EGONAR FOURNISSEUR</Text><Text style={styles.title}>Que souhaitez-vous vendre sur Egonar ?</Text><Text style={styles.subtitle}>Votre réponse détermine votre espace professionnel de vente.</Text>{spaces.map(space => <Pressable key={space.id} onPress={() => choose(space.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><Text style={styles.icon}>{space.icon}</Text><View style={styles.main}><Text style={styles.name}>{space.name}</Text><Text style={styles.cardTitle}>{space.title}</Text><Text style={styles.text}>{space.text}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}</ScrollView></SafeAreaView>;

  return <View style={styles.wrapper}>{children}<View style={styles.switchBar}><Text style={styles.switchLabel}>Espace actuel</Text><Pressable onPress={changeUniverse} style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}><Text style={styles.switchText}>Changer d’espace</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, wrapper: { flex: 1, backgroundColor: colors.bg }, page: { flexGrow: 1, justifyContent: "center", padding: 22 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }, muted: { color: colors.muted }, kicker: { color: colors.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2, marginBottom: 10 }, title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: "900" }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 18 }, card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 17, marginTop: 12, flexDirection: "row", alignItems: "center" }, pressed: { transform: [{ scale: 0.985 }] }, icon: { fontSize: 34, marginRight: 14 }, main: { flex: 1 }, name: { color: colors.ink, fontSize: 19, fontWeight: "900" }, cardTitle: { color: colors.accent, fontSize: 14, fontWeight: "800", marginTop: 3 }, text: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 5 }, arrow: { color: colors.accent, fontSize: 34, marginLeft: 8 }, switchBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }, switchLabel: { color: colors.muted, fontSize: 12 }, switchButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }, switchText: { color: colors.accent, fontWeight: "800" } });
