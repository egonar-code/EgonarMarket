import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const colors = { bg: "#f6f8fb", card: "#fff", ink: "#111827", muted: "#6b7280", accent: "#2563eb", border: "#e5e7eb", dark: "#0f172a" };

export const SUPPLIER_SPACES = {
  marketplace: { icon: "🛍️", name: "EgonarMarket", title: "Je vends des produits", text: "Mode, accessoires, maison, beauté, tech et autres produits.", coach: "Je vais vous guider pour créer vos produits, gérer vos prix, votre stock et vos commandes.", intro: "Au cœur de l’e-commerce", introText: "Vos produits. Vos clients. Votre activité. Un seul espace pour tout gérer.", tutorialTitle: "Créer votre premier produit", tutorialIntro: "Dans cette courte visite, vous allez découvrir le parcours complet d’un produit, de sa création à sa publication.", steps: ["Ajouter un produit", "Renseigner nom, catégorie et description", "Définir prix et stock", "Ajouter une photo", "Soumettre pour validation Egonar", "Suivre commandes et ventes"] },
  food: { icon: "🍽️", name: "Saveurs", title: "Je vends des plats / offres culinaires", text: "Plats, menus, traiteur, alimentation et services culinaires.", coach: "Je vais vous guider pour créer vos plats, menus, disponibilités, commandes et livraisons.", intro: "Au cœur des saveurs", introText: "Vos plats. Vos clients. Votre savoir-faire. Une expérience pensée pour votre activité.", tutorialTitle: "Créer votre premier plat", tutorialIntro: "Apprenez à présenter un plat, définir son prix et sa disponibilité, puis le soumettre à validation.", steps: ["Ajouter un plat", "Décrire le plat et ses ingrédients", "Définir prix, portions et disponibilité", "Ajouter une photo", "Créer une formule ou un menu", "Suivre commandes et ventes"] },
  travel: { icon: "✈️", name: "Évasion", title: "Je propose des services touristiques", text: "Hôtels, activités, excursions, transport et expériences.", coach: "Je vais vous guider pour créer vos services, tarifs, disponibilités et réservations.", intro: "Au cœur des évasions", introText: "Vos expériences. Vos voyageurs. Vos destinations. Un espace pour développer votre activité.", tutorialTitle: "Publier votre première expérience", tutorialIntro: "Découvrez comment présenter une expérience touristique, fixer vos tarifs et gérer vos disponibilités.", steps: ["Ajouter un service", "Décrire l’expérience et sa localisation", "Définir tarifs et inclusions", "Ajouter des photos", "Définir les disponibilités", "Gérer réservations et activité"] }
};

const seenKey = universe => `egonar_supplier_coach_seen_${universe}`;

export default function SupplierAiCoach({ universe, children }) {
  const space = SUPPLIER_SPACES[universe] || SUPPLIER_SPACES.marketplace;
  const [open, setOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const iconScale = useRef(new Animated.Value(0.65)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(seenKey(universe)).then(value => {
      if (active && value !== "1") {
        setIntroOpen(true);
        fade.setValue(0); scale.setValue(0.82); iconScale.setValue(0.65); ring.setValue(0);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
          Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 55, useNativeDriver: true }),
          Animated.timing(ring, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        ]).start();
        setTimeout(() => { if (active) { setIntroOpen(false); setOpen(true); } }, 2300);
      }
    }).catch(() => { if (active) setOpen(true); });
    return () => { active = false; };
  }, [universe]);

  async function dismiss() {
    await AsyncStorage.setItem(seenKey(universe), "1");
    setOpen(false);
    setIntroOpen(false);
  }

  return (
    <View style={styles.wrapper}>
      {children}
      <Modal visible={introOpen} transparent animationType="none" onRequestClose={() => setIntroOpen(false)}>
        <View style={styles.introBackdrop}>
          <Animated.View style={[styles.introContent, { opacity: fade, transform: [{ scale }] }]}>
            <Animated.View style={[styles.glow, { opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.7] }) }] }]} />
            <Animated.View style={[styles.introIcon, { transform: [{ scale: iconScale }] }]}><Text style={styles.introEmoji}>{space.icon}</Text></Animated.View>
            <Text style={styles.introBrand}>EGONAR</Text>
            <Text style={styles.introTitle}>{space.intro}</Text>
            <Text style={styles.introSpace}>{space.name}</Text>
            <Text style={styles.introText}>{space.introText}</Text>
            <View style={styles.introLine} />
            <Text style={styles.introAi}>✦ Votre espace professionnel commence ici</Text>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={open} transparent animationType="fade" onRequestClose={dismiss}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.robot}><Text style={styles.robotText}>🤖</Text></View>
              <View style={styles.headerText}><Text style={styles.kicker}>{space.name} AI</Text><Text style={styles.title}>Bienvenue dans votre espace</Text></View>
              <Pressable onPress={dismiss} hitSlop={12}><Text style={styles.close}>×</Text></Pressable>
            </View>
            <Text style={styles.coach}>{space.coach}</Text>
            <View style={styles.video}>
              <View style={styles.videoPreview}><View style={styles.play}><Text style={styles.playText}>▶</Text></View><Text style={styles.videoLabel}>TUTORIEL EGONAR AI</Text></View>
              <View style={styles.videoBody}><Text style={styles.videoTitle}>{space.tutorialTitle}</Text><Text style={styles.videoIntro}>{space.tutorialIntro}</Text><View style={styles.coming}><Text style={styles.comingText}>🎬 Vidéo officielle en préparation</Text></View></View>
            </View>
            <Text style={styles.learn}>Vous allez apprendre</Text>
            <ScrollView style={styles.steps} showsVerticalScrollIndicator={false}>{space.steps.map((step, index) => <View key={step} style={styles.step}><Text style={styles.number}>{index + 1}</Text><Text style={styles.stepText}>{step}</Text></View>)}</ScrollView>
            <Pressable onPress={dismiss} style={styles.start}><Text style={styles.startText}>Commencer mon activité</Text></Pressable>
            <Pressable onPress={dismiss} style={styles.later}><Text style={styles.laterText}>Voir plus tard</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  introBackdrop: { flex: 1, backgroundColor: "#061225", alignItems: "center", justifyContent: "center", padding: 28 },
  introContent: { alignItems: "center", width: "100%" },
  glow: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#60a5fa" },
  introIcon: { width: 94, height: 94, borderRadius: 47, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  introEmoji: { fontSize: 48 },
  introBrand: { color: "#93c5fd", fontSize: 12, fontWeight: "900", letterSpacing: 5 },
  introTitle: { color: "#fff", fontSize: 30, lineHeight: 36, textAlign: "center", fontWeight: "900", marginTop: 13 },
  introSpace: { color: "#bfdbfe", fontSize: 18, fontWeight: "800", marginTop: 5 },
  introText: { color: "rgba(255,255,255,0.76)", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 18, maxWidth: 340 },
  introLine: { width: 54, height: 2, backgroundColor: "#60a5fa", marginVertical: 22 },
  introAi: { color: "#dbeafe", fontSize: 12, fontWeight: "800", textAlign: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.58)", justifyContent: "center", padding: 18 },
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 20, maxHeight: "90%" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  robot: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaf2ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  robotText: { fontSize: 25 },
  headerText: { flex: 1 },
  kicker: { color: colors.accent, fontWeight: "900", fontSize: 12 },
  title: { color: colors.ink, fontSize: 19, fontWeight: "900", marginTop: 2 },
  close: { color: colors.muted, fontSize: 30, lineHeight: 30 },
  coach: { color: colors.muted, lineHeight: 21, marginBottom: 14 },
  video: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: "hidden" },
  videoPreview: { height: 120, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  play: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  playText: { color: "#fff", fontSize: 19, marginLeft: 2 },
  videoLabel: { marginTop: 8, color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  videoBody: { padding: 14 },
  videoTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  videoIntro: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  coming: { backgroundColor: "#eef2ff", borderRadius: 9, padding: 9, marginTop: 10 },
  comingText: { color: colors.accent, fontSize: 11, fontWeight: "800", textAlign: "center" },
  learn: { color: colors.ink, fontSize: 15, fontWeight: "900", marginTop: 16, marginBottom: 8 },
  steps: { maxHeight: 150 },
  step: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  number: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#eaf2ff", color: colors.accent, textAlign: "center", paddingTop: 4, fontWeight: "900", marginRight: 9 },
  stepText: { color: colors.ink, fontSize: 13, flex: 1 },
  start: { backgroundColor: colors.dark, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 13 },
  startText: { color: "#fff", fontWeight: "900" },
  later: { paddingVertical: 10, alignItems: "center" },
  laterText: { color: colors.muted, fontWeight: "700", fontSize: 12 }
});
