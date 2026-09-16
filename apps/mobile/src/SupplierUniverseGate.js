import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOBILE_ROLE } from "./config";
import { supplierApi } from "./api";

const KEY = "egonar_supplier_universe";
const colors = { bg: "#f6f8fb", card: "#fff", ink: "#111827", muted: "#6b7280", accent: "#2563eb", border: "#e5e7eb", dark: "#0f172a" };
const spaces = [
  { id: "marketplace", icon: "🛍️", name: "EgonarMarket", title: "Je vends des produits", text: "Mode, accessoires, maison, beauté, tech et autres produits.", coach: "Je vais vous guider pour créer vos produits, gérer vos prix, votre stock et vos commandes.", steps: ["Créer votre premier produit", "Gérer prix et stock", "Traiter vos commandes", "Suivre vos ventes"], video: null },
  { id: "food", icon: "🍽️", name: "Saveurs", title: "Je vends des plats / offres culinaires", text: "Plats, menus, traiteur, alimentation et services culinaires.", coach: "Je vais vous guider pour créer vos plats, menus, disponibilités, commandes et livraisons.", steps: ["Créer votre premier plat", "Créer un menu ou une formule", "Gérer disponibilité et commandes", "Suivre vos ventes"], video: null },
  { id: "travel", icon: "✈️", name: "Évasion", title: "Je propose des services touristiques", text: "Hôtels, activités, excursions, transport et expériences.", coach: "Je vais vous guider pour créer vos services, tarifs, disponibilités et réservations.", steps: ["Créer votre premier service", "Définir tarifs et disponibilités", "Gérer les réservations", "Suivre votre activité"], video: null }
];

export default function SupplierUniverseGate({ children }) {
  const [ready, setReady] = useState(MOBILE_ROLE !== "supplier");
  const [selected, setSelected] = useState(null);
  const [coachOpen, setCoachOpen] = useState(false);

  useEffect(() => {
    if (MOBILE_ROLE !== "supplier") return undefined;
    let active = true;
    const check = async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved && active) { setSelected(saved); setReady(true); setCoachOpen(true); return; }
        await supplierApi.me();
        if (active) setReady(true);
      } catch {
        if (active) setReady(true);
      }
    };
    check();
    return undefined;
  }, []);

  async function choose(id) {
    await AsyncStorage.setItem(KEY, id);
    setSelected(id);
    setCoachOpen(true);
  }

  async function changeUniverse() {
    await AsyncStorage.removeItem(KEY);
    setCoachOpen(false);
    setSelected(null);
  }

  const space = spaces.find(item => item.id === selected) || spaces[0];
  const openVideo = async () => { if (space.video) await Linking.openURL(space.video); };

  if (!ready) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large"/><Text style={styles.muted}>Chargement…</Text></View></SafeAreaView>;
  if (MOBILE_ROLE !== "supplier") return children;
  if (!selected) return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}><Text style={styles.kicker}>EGONAR FOURNISSEUR</Text><Text style={styles.title}>Que souhaitez-vous vendre sur Egonar ?</Text><Text style={styles.subtitle}>Votre réponse détermine votre espace professionnel de vente.</Text>{spaces.map(item => <Pressable key={item.id} onPress={() => choose(item.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><Text style={styles.icon}>{item.icon}</Text><View style={styles.main}><Text style={styles.name}>{item.name}</Text><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.text}>{item.text}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}</ScrollView></SafeAreaView>;

  return <View style={styles.wrapper}>{children}<View style={styles.switchBar}><View><Text style={styles.switchLabel}>Espace actuel</Text><Text style={styles.currentSpace}>{space.icon} {space.name}</Text></View><Pressable onPress={() => setCoachOpen(true)} style={({ pressed }) => [styles.aiButton, pressed && styles.pressed]}><Text style={styles.aiButtonText}>🤖 Egonar AI</Text></Pressable><Pressable onPress={changeUniverse} style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}><Text style={styles.switchText}>Changer d’espace</Text></Pressable></View><Modal visible={coachOpen} transparent animationType="fade" onRequestClose={() => setCoachOpen(false)}><View style={styles.modalBackdrop}><View style={styles.coach}><View style={styles.coachHeader}><View style={styles.robot}><Text style={styles.robotText}>🤖</Text></View><View style={styles.coachTitleWrap}><Text style={styles.coachKicker}>{space.name} AI</Text><Text style={styles.coachTitle}>Bienvenue dans votre espace</Text></View><Pressable onPress={() => setCoachOpen(false)}><Text style={styles.close}>×</Text></Pressable></View><Text style={styles.coachText}>{space.coach}</Text><View style={styles.videoCard}><View style={styles.videoPreview}><Text style={styles.play}>▶</Text><Text style={styles.videoLabel}>TUTORIEL VIDÉO</Text></View><View style={styles.videoInfo}><Text style={styles.videoTitle}>Créer et gérer votre espace</Text><Text style={styles.videoText}>{space.video ? "Un tutoriel guidé est disponible." : "Le tutoriel vidéo sera ajouté ici. L’emplacement est déjà prévu pour votre vidéo officielle."}</Text><Pressable disabled={!space.video} onPress={openVideo} style={[styles.videoButton, !space.video && styles.videoDisabled]}><Text style={styles.videoButtonText}>{space.video ? "▶ Voir le tutoriel" : "Tutoriel vidéo à venir"}</Text></Pressable></View></View><Text style={styles.helpTitle}>Ce que vous allez apprendre</Text>{space.steps.map((step, index) => <View key={step} style={styles.step}><Text style={styles.stepNumber}>{index + 1}</Text><Text style={styles.stepText}>{step}</Text></View>)}<Pressable onPress={() => setCoachOpen(false)} style={styles.continue}><Text style={styles.continueText}>Commencer mon activité</Text></Pressable></View></View></Modal></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, wrapper: { flex: 1, backgroundColor: colors.bg }, page: { flexGrow: 1, justifyContent: "center", padding: 22 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }, muted: { color: colors.muted }, kicker: { color: colors.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2, marginBottom: 10 }, title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: "900" }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 18 }, card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 17, marginTop: 12, flexDirection: "row", alignItems: "center" }, pressed: { transform: [{ scale: 0.985 }] }, icon: { fontSize: 34, marginRight: 14 }, main: { flex: 1 }, name: { color: colors.ink, fontSize: 19, fontWeight: "900" }, cardTitle: { color: colors.accent, fontSize: 14, fontWeight: "800", marginTop: 3 }, text: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 5 }, arrow: { color: colors.accent, fontSize: 34, marginLeft: 8 }, switchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }, switchLabel: { color: colors.muted, fontSize: 11 }, currentSpace: { color: colors.ink, fontWeight: "800", fontSize: 12, marginTop: 2 }, aiButton: { marginLeft: "auto", backgroundColor: colors.dark, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, aiButtonText: { color: "#fff", fontWeight: "800", fontSize: 12 }, switchButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, switchText: { color: colors.accent, fontWeight: "800", fontSize: 12 }, modalBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", padding: 18 }, coach: { backgroundColor: colors.card, borderRadius: 24, padding: 20, maxHeight: "90%" }, coachHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 }, robot: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaf2ff", alignItems: "center", justifyContent: "center", marginRight: 12 }, robotText: { fontSize: 25 }, coachTitleWrap: { flex: 1 }, coachKicker: { color: colors.accent, fontWeight: "900", fontSize: 12 }, coachTitle: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 2 }, close: { color: colors.muted, fontSize: 30, lineHeight: 30, paddingLeft: 8 }, coachText: { color: colors.muted, lineHeight: 21, marginBottom: 15 }, videoCard: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: "hidden" }, videoPreview: { height: 125, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" }, play: { fontSize: 34, color: colors.accent }, videoLabel: { marginTop: 5, fontSize: 10, fontWeight: "900", color: colors.accent, letterSpacing: 1.5 }, videoInfo: { padding: 14 }, videoTitle: { color: colors.ink, fontWeight: "900", fontSize: 16 }, videoText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, videoButton: { backgroundColor: colors.accent, paddingVertical: 11, borderRadius: 10, alignItems: "center", marginTop: 10 }, videoDisabled: { opacity: 0.5 }, videoButtonText: { color: "#fff", fontWeight: "800" }, helpTitle: { color: colors.ink, fontSize: 15, fontWeight: "900", marginTop: 16, marginBottom: 8 }, step: { flexDirection: "row", alignItems: "center", marginBottom: 7 }, stepNumber: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#eaf2ff", color: colors.accent, textAlign: "center", paddingTop: 4, fontWeight: "900", marginRight: 9 }, stepText: { color: colors.ink, fontSize: 13, flex: 1 }, continue: { backgroundColor: colors.dark, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 14 }, continueText: { color: "#fff", fontWeight: "900" } });
