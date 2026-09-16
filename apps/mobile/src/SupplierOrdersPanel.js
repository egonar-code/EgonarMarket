import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supplierApi } from "./api";

const colors = { card: "#fff", ink: "#111827", muted: "#6b7280", accent: "#2563eb", border: "#e5e7eb", dark: "#0f172a", warn: "#9a6700", danger: "#b42318", ok: "#067647" };

const statusLabel = status => ({ CONFIRMEE: "CONFIRMÉE", EN_PREPARATION: "EN PRÉPARATION", PRETE: "PRÊTE", EN_LIVRAISON: "EN LIVRAISON", LIVREE: "LIVRÉE", ANNULEE: "ANNULÉE", ANNULEE_CLIENT: "ANNULÉE" }[status] || status || "—");
const statusColor = status => status === "LIVREE" ? colors.ok : status === "ANNULEE" || status === "ANNULEE_CLIENT" ? colors.danger : status === "CONFIRMEE" ? colors.accent : colors.warn;

export default function SupplierOrdersPanel({ visible, onClose }) {
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setBusy(true); setError("");
    Promise.all([supplierApi.orders(), supplierApi.salesStats()]).then(([o, s]) => {
      if (active) { setOrders(Array.isArray(o) ? o : []); setSales(s || null); }
    }).catch(e => { if (active) setError(e.message || "Impossible de charger les commandes."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [visible]);

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <View style={styles.safe}>
      <View style={styles.header}><View><Text style={styles.kicker}>EGONAR FOURNISSEUR</Text><Text style={styles.title}>Commandes & ventes</Text></View><Pressable onPress={onClose} hitSlop={10}><Text style={styles.close}>×</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.page}>
        {sales ? <View style={styles.grid}><Stat label="Commandes" value={sales.orders_count ?? 0}/><Stat label="Unités vendues" value={sales.units_sold ?? 0}/><Stat label="Ventes" value={`${Number(sales.gross_sales_fcfa || 0).toLocaleString("fr-FR")} FCFA`}/><Stat label="Commission estimée" value={`${Number(sales.estimated_commission_fcfa || 0).toLocaleString("fr-FR")} FCFA`}/></View> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.section}>Dernières commandes</Text>
        {busy ? <ActivityIndicator size="large"/> : orders.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Aucune commande pour le moment</Text><Text style={styles.emptyText}>Les nouvelles commandes contenant vos produits apparaîtront ici.</Text></View> : orders.map(order => <View key={order.id} style={styles.order}><View style={styles.orderTop}><View style={styles.orderMain}><Text style={styles.number}>#{order.order_number}</Text><Text style={styles.customer}>{order.customer_name} · {order.customer_city}</Text></View><Text style={[styles.status, { color: statusColor(order.status) }]}>{statusLabel(order.status)}</Text></View><Text style={styles.meta}>{order.supplier_units} article(s) · {Number(order.supplier_total_fcfa || 0).toLocaleString("fr-FR")} FCFA</Text>{Array.isArray(order.items) ? order.items.map((item, i) => <View key={`${order.id}-${i}`} style={styles.item}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemMeta}>× {item.quantity} · {Number(item.unit_price_fcfa || 0).toLocaleString("fr-FR")} FCFA</Text></View>) : null}<Text style={styles.date}>{order.created_at ? new Date(order.created_at).toLocaleString("fr-FR") : ""}</Text></View>)}
      </ScrollView>
      <Pressable onPress={onClose} style={styles.bottom}><Text style={styles.bottomText}>Retour à mon espace</Text></Pressable>
    </View>
  </Modal>;
}

function Stat({ label, value }) { return <View style={styles.stat}><Text style={styles.statValue}>{String(value)}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#f6f8fb" }, page: { padding: 18, paddingBottom: 40 }, header: { padding: 18, paddingTop: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center" }, kicker: { color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { color: colors.ink, fontSize: 25, fontWeight: "900", marginTop: 3 }, close: { marginLeft: "auto", color: colors.muted, fontSize: 32, lineHeight: 32 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 22 }, stat: { width: "48%", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 }, statValue: { color: colors.ink, fontSize: 19, fontWeight: "900" }, statLabel: { color: colors.muted, fontSize: 11, marginTop: 4 }, error: { color: colors.danger, backgroundColor: "#fff1f0", padding: 11, borderRadius: 10, marginBottom: 14 }, section: { color: colors.ink, fontSize: 19, fontWeight: "900", marginBottom: 10 }, order: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 15, marginBottom: 11 }, orderTop: { flexDirection: "row", alignItems: "flex-start" }, orderMain: { flex: 1 }, number: { color: colors.ink, fontSize: 16, fontWeight: "900" }, customer: { color: colors.muted, fontSize: 12, marginTop: 3 }, status: { fontSize: 10, fontWeight: "900", marginLeft: 8 }, meta: { color: colors.accent, fontWeight: "800", fontSize: 12, marginTop: 10 }, item: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8, marginTop: 8 }, itemName: { color: colors.ink, fontSize: 12, flex: 1 }, itemMeta: { color: colors.muted, fontSize: 11 }, date: { color: colors.muted, fontSize: 10, marginTop: 10 }, empty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 24, alignItems: "center" }, emptyTitle: { color: colors.ink, fontWeight: "900", fontSize: 16 }, emptyText: { color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 19 }, bottom: { margin: 14, backgroundColor: colors.dark, borderRadius: 13, paddingVertical: 14, alignItems: "center" }, bottomText: { color: "#fff", fontWeight: "900" } });
