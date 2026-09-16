import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const colors = { bg: "#f6f8fb", card: "#fff", ink: "#111827", muted: "#6b7280", accent: "#2563eb", border: "#e5e7eb", dark: "#0f172a" };

export const SUPPLIER_SPACES = {
  marketplace: {
    icon: "🛍️", name: "EgonarMarket", title: "Je vends des produits",
    text: "Mode, accessoires, maison, beauté, tech et autres produits.",
    coach: "Je vais vous guider pour créer vos produits, gérer vos prix, votre stock et vos commandes.",
    intro: "Au cœur de l’e-commerce", introText: "Vos produits. Vos clients. Votre activité. Un seul espace pour tout gérer.",
    theme: { bg: "#06152f", glow: "#3b82f6", glow2: "#60a5fa", text: "#dbeafe", line: "#60a5fa", symbols: ["📦", "🏷️", "🛒"] },
    tutorialTitle: "Créer votre premier produit", tutorialIntro: "Dans cette courte visite, vous allez découvrir le parcours complet d’un produit, de sa création à sa publication.",
    steps: ["Ajouter un produit", "Renseigner nom, catégorie et description", "Définir prix et stock", "Ajouter une photo", "Soumettre pour validation Egonar", "Suivre commandes et ventes"]
  },
  food: {
    icon: "🍽️", name: "Saveurs", title: "Je vends des plats / offres culinaires",
    text: "Plats, menus, traiteur, alimentation et services culinaires.",
    coach: "Je vais vous guider pour créer vos plats, menus, disponibilités, commandes et livraisons.",
    intro: "Au cœur des saveurs", introText: "Vos plats. Vos clients. Votre savoir-faire. Une expérience pensée pour votre activité.",
    theme: { bg: "#291207", glow: "#f97316", glow2: "#fb923c", text: "#ffedd5", line: "#fb923c", symbols: ["🍲", "🥘", "✨"] },
    tutorialTitle: "Créer votre premier plat", tutorialIntro: "Apprenez à présenter un plat, définir son prix et sa disponibilité, puis le soumettre à validation.",
    steps: ["Ajouter un plat", "Décrire le plat et ses ingrédients", "Définir prix, portions et disponibilité", "Ajouter une photo", "Créer une formule ou un menu", "Suivre commandes et ventes"]
  },
  travel: {
    icon: "✈️", name: "Évasion", title: "Je propose des services touristiques",
    text: "Hôtels, activités, excursions, transport et expériences.",
    coach: "Je vais vous guider pour créer vos services, tarifs, disponibilités et réservations.",
    intro: "Au cœur des évasions", introText: "Vos expériences. Vos voyageurs. Vos destinations. Un espace pour développer votre activité.",
    theme: { bg: "#071a24", glow: "#06b6d4", glow2: "#22d3ee", text: "#cffafe", line: "#22d3ee", symbols: ["🌍", "📍", "⭐"] },
    tutorialTitle: "Publier votre première expérience", tutorialIntro: "Découvrez comment présenter une expérience touristique, fixer vos tarifs et gérer vos disponibilités.",
    steps: ["Ajouter un service", "Décrire l’expérience et sa localisation", "Définir tarifs et inclusions", "Ajouter des photos", "Définir les disponibilités", "Gérer réservations et activité"]
  }
};

export default function SupplierAiCoach({ universe, children }) {
  const space = SUPPLIER_SPACES[universe] || SUPPLIER_SPACES.marketplace;
  const [open, setOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  const iconScale = useRef(new Animated.Value(0.45)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const ambient = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    setOpen(false);
    setIntroOpen(true);
    fade.stopAnimation();
    scale.stopAnimation();
    iconScale.stopAnimation();
    ring.stopAnimation();
    ambient.stopAnimation();
    orbit.stopAnimation();
    fade.setValue(0);
    scale.setValue(0.72);
    iconScale.setValue(0.45);
    ring.setValue(0);
    ambient.setValue(0);
    orbit.setValue(0);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 52, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1, duration: 1300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(ambient, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    ]).start();

    Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    const timer = setTimeout(() => {
      if (active) {
        setIntroOpen(false);
        setOpen(true);
      }
    }, 2600);

    return () => {
      active = false;
      clearTimeout(timer);
      orbit.stopAnimation();
    };
  }, [universe]);

  function dismiss() {
    setOpen(false);
    setIntroOpen(false);
  }

  const rotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const reverseRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });

  return (
    <View style={styles.wrapper}>
      {children}

      <Modal visible={introOpen} transparent animationType="none" onRequestClose={() => setIntroOpen(false)}>
        <View style={[styles.introBackdrop, { backgroundColor: space.theme.bg }]}>
          <Animated.View style={[styles.ambientGlow, { backgroundColor: space.theme.glow, opacity: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] }), transform: [{ scale: ambient.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.45] }) }] }]} />
          <Animated.View style={[styles.orbit, { borderColor: `${space.theme.glow2}55`, transform: [{ rotate: rotation }] }]}>
            <Text style={[styles.orbitSymbol, { color: space.theme.text }]}>{space.theme.symbols[0]}</Text>
          </Animated.View>
          <Animated.View style={[styles.orbitSmall, { borderColor: `${space.theme.glow2}33`, transform: [{ rotate: reverseRotation }] }]}>
            <Text style={[styles.orbitSymbolSmall, { color: space.theme.text }]}>{space.theme.symbols[1]}</Text>
          </Animated.View>

          <Animated.View style={[styles.introContent, { opacity: fade, transform: [{ scale }] }]}>
            <Animated.View style={[styles.ring, { borderColor: space.theme.line, opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.35] }) }] }]} />
            <Animated.View style={[styles.introIcon, { borderColor: `${space.theme.glow2}88`, backgroundColor: `${space.theme.glow}26`, transform: [{ scale: iconScale }] }]}>
              <Text style={styles.introEmoji}>{space.icon}</Text>
            </Animated.View>
            <Text style={[styles.introBrand, { color: space.theme.text }]}>EGONAR</Text>
            <Text style={styles.introTitle}>{space.intro}</Text>
            <Text style={[styles.introSpace, { color: space.theme.glow2 }]}>{space.name}</Text>
            <Text style={styles.introText}>{space.introText}</Text>
            <View style={[styles.introLine, { backgroundColor: space.theme.line }]} />
            <View style={styles.aiRow}><Text style={[styles.introAi, { color: space.theme.text }]}>✦ EGONAR AI</Text><Text style={[styles.introPulse, { color: space.theme.glow2 }]}>●</Text></View>
            <Text style={styles.enterText}>Votre espace professionnel se prépare…</Text>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={open} transparent animationType="fade" onRequestClose={dismiss}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.robot}><Text style={styles.robotText}>🤖</Text></View>
              <View style={styles.headerText}><Text style={[styles.kicker, { color: space.theme.glow }]}>{space.name} AI</Text><Text style={styles.title}>Bienvenue dans votre espace</Text></View>
              <Pressable onPress={dismiss} hitSlop={12}><Text style={styles.close}>×</Text></Pressable>
            </View>
            <Text style={styles.coach}>{space.coach}</Text>
            <View style={styles.video}>
              <View style={[styles.videoPreview, { backgroundColor: `${space.theme.glow}18` }]}><View style={[styles.play, { backgroundColor: space.theme.glow }]}><Text style={styles.playText}>▶</Text></View><Text style={[styles.videoLabel, { color: space.theme.glow }]}>TUTORIEL EGONAR AI</Text></View>
              <View style={styles.videoBody}><Text style={styles.videoTitle}>{space.tutorialTitle}</Text><Text style={styles.videoIntro}>{space.tutorialIntro}</Text><View style={[styles.coming, { backgroundColor: `${space.theme.glow}12` }]}><Text style={[styles.comingText, { color: space.theme.glow }]}>🎬 Vidéo officielle en préparation</Text></View></View>
            </View>
            <Text style={styles.learn}>Vous allez apprendre</Text>
            <ScrollView style={styles.steps} showsVerticalScrollIndicator={false}>{space.steps.map((step, index) => <View key={step} style={styles.step}><Text style={[styles.number, { backgroundColor: `${space.theme.glow}16`, color: space.theme.glow }]}>{index + 1}</Text><Text style={styles.stepText}>{step}</Text></View>)}</ScrollView>
            <Pressable onPress={dismiss} style={[styles.start, { backgroundColor: space.theme.bg }]}><Text style={styles.startText}>Commencer mon activité</Text></Pressable>
            <Pressable onPress={dismiss} style={styles.later}><Text style={styles.laterText}>Voir plus tard</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  introBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, overflow: "hidden" },
  introContent: { alignItems: "center", width: "100%", zIndex: 5 },
  ambientGlow: { position: "absolute", width: 230, height: 230, borderRadius: 115 },
  orbit: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  orbitSmall: { position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1, alignItems: "flex-start", justifyContent: "center", paddingLeft: 4 },
  orbitSymbol: { fontSize: 24, position: "absolute", top: 10 },
  orbitSymbolSmall: { fontSize: 20, position: "absolute", left: -8 },
  ring: { position: "absolute", width: 108, height: 108, borderRadius: 54, borderWidth: 2 },
  introIcon: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  introEmoji: { fontSize: 48 },
  introBrand: { fontSize: 12, fontWeight: "900", letterSpacing: 5 },
  introTitle: { color: "#fff", fontSize: 30, lineHeight: 36, textAlign: "center", fontWeight: "900", marginTop: 13 },
  introSpace: { fontSize: 19, fontWeight: "900", marginTop: 6 },
  introText: { color: "rgba(255,255,255,0.76)", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 18, maxWidth: 340 },
  introLine: { width: 54, height: 2, marginVertical: 22 },
  aiRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  introAi: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  introPulse: { fontSize: 9 },
  enterText: { color: "rgba(255,255,255,0.48)", fontSize: 11, marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.58)", justifyContent: "center", padding: 18 },
  card: { backgroundColor: colors.card, borderRadius: 24, padding: 20, maxHeight: "90%" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  robot: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eaf2ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  robotText: { fontSize: 25 },
  headerText: { flex: 1 },
  kicker: { fontWeight: "900", fontSize: 12 },
  title: { color: colors.ink, fontSize: 19, fontWeight: "900", marginTop: 2 },
  close: { color: colors.muted, fontSize: 30, lineHeight: 30 },
  coach: { color: colors.muted, lineHeight: 21, marginBottom: 14 },
  video: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: "hidden" },
  videoPreview: { height: 120, alignItems: "center", justifyContent: "center" },
  play: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  playText: { color: "#fff", fontSize: 19, marginLeft: 2 },
  videoLabel: { marginTop: 8, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  videoBody: { padding: 14 },
  videoTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  videoIntro: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  coming: { borderRadius: 9, padding: 9, marginTop: 10 },
  comingText: { fontSize: 11, fontWeight: "800", textAlign: "center" },
  learn: { color: colors.ink, fontSize: 15, fontWeight: "900", marginTop: 16, marginBottom: 8 },
  steps: { maxHeight: 150 },
  step: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  number: { width: 25, height: 25, borderRadius: 13, textAlign: "center", paddingTop: 4, fontWeight: "900", marginRight: 9 },
  stepText: { color: colors.ink, fontSize: 13, flex: 1 },
  start: { borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 13 },
  startText: { color: "#fff", fontWeight: "900" },
  later: { paddingVertical: 10, alignItems: "center" },
  laterText: { color: colors.muted, fontWeight: "700", fontSize: 12 }
});
