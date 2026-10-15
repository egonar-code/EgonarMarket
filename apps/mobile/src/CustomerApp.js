import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { API_BASE_URL } from "./config";
import { api } from "./api";

const C = { bg: "#f6f8fb", card: "#fff", ink: "#111827", muted: "#667085", accent: "#1746a2", border: "#e5e7eb", danger: "#b42318", ok: "#067647" };
const universes = [{ key: "MARKET", label: "Market" }, { key: "SAVEURS", label: "Saveurs" }, { key: "EVASION", label: "Évasion" }];
const money = value => new Intl.NumberFormat("fr-FR").format(Number(value || 0)) + " FCFA";

function Action({ title, onPress, secondary = false, disabled = false }) {
  return <Pressable onPress={onPress} disabled={disabled} style={[s.button, secondary && s.secondary, disabled && { opacity: 0.45 }]}><Text style={[s.buttonText, secondary && { color: C.ink }]}>{title}</Text></Pressable>;
}
function Field({ value, onChangeText, placeholder, keyboardType = "default", multiline = false }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#98a2b3" keyboardType={keyboardType} multiline={multiline} style={[s.input, multiline && { height: 86, textAlignVertical: "top", paddingTop: 12 }]} />;
}

export default function CustomerApp() {
  const [universe, setUniverse] = useState("MARKET");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState("catalogue");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", city: "Dakar" });
  const [payment, setPayment] = useState("A_PAYER");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [trackNumber, setTrackNumber] = useState("");
  const [tracking, setTracking] = useState(null);
  const [trackingBusy, setTrackingBusy] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await api("/api/products?universe=" + universe); setProducts(Array.isArray(data) ? data : []); }
    catch (e) { setError(e.message || "Le catalogue est indisponible."); }
    finally { setLoading(false); }
  }, [universe]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const cartItems = useMemo(() => products.filter(p => Number(cart[p.id] || 0) > 0).map(p => ({ ...p, quantity: Number(cart[p.id]) })), [products, cart]);
  const total = cartItems.reduce((sum, p) => sum + Number(p.price_fcfa || 0) * p.quantity, 0);
  const count = Object.values(cart).reduce((sum, n) => sum + Number(n || 0), 0);
  const add = id => setCart(prev => ({ ...prev, [id]: Math.min(99, Number(prev[id] || 0) + 1) }));
  const remove = id => setCart(prev => { const next = { ...prev }; const n = Number(next[id] || 0) - 1; if (n > 0) next[id] = n; else delete next[id]; return next; });

  async function submitOrder() {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim() || !cartItems.length) { setError("Renseignez votre nom, téléphone, adresse et ajoutez un produit au panier."); return; }
    setSubmitting(true); setError("");
    try {
      const result = await api("/api/orders", { method: "POST", body: JSON.stringify({ customer, items: cartItems.map(p => ({ product_id: String(p.id), quantity: p.quantity })), payment_method: payment, delivery_fcfa: 0 }) });
      setOrder(result); setTrackNumber(result.order_number); setTracking(null); setCart({}); setScreen("confirmation");
    } catch (e) { setError(e.message || "La commande n'a pas pu être créée."); }
    finally { setSubmitting(false); }
  }

  async function trackOrder(number = trackNumber) {
    if (!String(number || "").trim()) { setError("Saisissez le numéro de commande."); return; }
    setTrackingBusy(true); setError("");
    try { const result = await api("/api/orders/" + encodeURIComponent(String(number).trim())); setTracking(result); setScreen("suivi"); }
    catch (e) { setTracking(null); setError(e.message || "Commande introuvable."); }
    finally { setTrackingBusy(false); }
  }

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <View style={s.brand}><Text style={s.kicker}>EGONARMARKET</Text><Text style={s.brandTitle}>Tout près de vous.</Text><Text style={s.muted}>Market · Saveurs · Évasion</Text></View>
    <View style={s.nav}><Action title="Catalogue" secondary={screen !== "catalogue"} onPress={() => setScreen("catalogue")} /><Action title={`Panier (${count})`} secondary={screen !== "panier"} onPress={() => setScreen("panier")} /><Action title="Suivi" secondary={screen !== "suivi"} onPress={() => { setError(""); setScreen("suivi"); }} /></View>
    {error ? <Text style={s.error}>{error}</Text> : null}
    {screen === "catalogue" ? <>
      <Text style={s.heading}>Découvrez nos univers</Text>
      <View style={s.tabs}>{universes.map(u => <Pressable key={u.key} onPress={() => setUniverse(u.key)} style={[s.tab, universe === u.key && s.tabActive]}><Text style={[s.tabText, universe === u.key && s.tabTextActive]}>{u.label}</Text></Pressable>)}</View>
      {loading ? <ActivityIndicator size="large" color={C.accent} /> : products.length ? products.map(p => <View style={s.product} key={p.id}><View style={{ flex: 1 }}><Text style={s.productTitle}>{p.name}</Text><Text style={s.muted}>{p.category || uLabel(p.universe)}{p.stock != null ? ` · Stock ${p.stock}` : ""}</Text><Text style={s.price}>{money(p.price_fcfa)}</Text>{p.description ? <Text style={s.description}>{p.description}</Text> : null}</View><View style={s.counter}><Action title="+" onPress={() => add(p.id)} /><Text style={s.qty}>{Number(cart[p.id] || 0)}</Text><Action title="−" secondary disabled={!cart[p.id]} onPress={() => remove(p.id)} /></View></View>) : <Text style={s.muted}>Aucun produit disponible dans cet univers pour le moment.</Text>}
      <Action title="Actualiser le catalogue" secondary onPress={loadProducts} />
    </> : null}
    {screen === "panier" ? <>
      <Text style={s.heading}>Votre panier</Text>
      {!cartItems.length ? <Text style={s.muted}>Votre panier est vide. Ajoutez des produits depuis le catalogue.</Text> : cartItems.map(p => <View style={s.cartRow} key={p.id}><View style={{ flex: 1 }}><Text style={s.productTitle}>{p.name}</Text><Text style={s.muted}>{money(p.price_fcfa)} × {p.quantity}</Text></View><View style={s.counter}><Action title="+" onPress={() => add(p.id)} /><Action title="−" secondary onPress={() => remove(p.id)} /></View></View>)}
      <View style={s.totalRow}><Text style={s.totalLabel}>Sous-total (hors livraison)</Text><Text style={s.total}>{money(total)}</Text></View>
      {cartItems.length ? <><Text style={s.heading}>Informations de livraison</Text><Field value={customer.name} onChangeText={v => setCustomer({ ...customer, name: v })} placeholder="Nom complet *" /><Field value={customer.phone} onChangeText={v => setCustomer({ ...customer, phone: v })} placeholder="Téléphone *" keyboardType="phone-pad" /><Field value={customer.email} onChangeText={v => setCustomer({ ...customer, email: v })} placeholder="Email (facultatif)" keyboardType="email-address" /><Field value={customer.address} onChangeText={v => setCustomer({ ...customer, address: v })} placeholder="Adresse de livraison *" multiline /><Field value={customer.city} onChangeText={v => setCustomer({ ...customer, city: v })} placeholder="Ville" /><Text style={s.label}>Mode de paiement</Text>{[{key:"A_PAYER",label:"À confirmer avec le service client"},{key:"LIVRAISON",label:"Paiement à la livraison"},{key:"WAVE",label:"Wave"},{key:"ORANGE_MONEY",label:"Orange Money"}].map(p => <Pressable key={p.key} onPress={() => setPayment(p.key)} style={s.radioRow}><Text style={s.radio}>{payment === p.key ? "●" : "○"}</Text><Text style={s.radioText}>{p.label}</Text></Pressable>)}<Text style={s.note}>Les frais de livraison seront confirmés par le service client. Le choix Wave ou Orange Money ne constitue pas une preuve de paiement.</Text><Action title={submitting ? "Envoi de la commande…" : "Confirmer ma commande"} disabled={submitting} onPress={submitOrder} /></> : null}
    </> : null}
    {screen === "confirmation" && order ? <View style={s.card}><Text style={s.heading}>Commande enregistrée</Text><Text style={s.muted}>Votre numéro de commande</Text><Text selectable style={s.orderNumber}>{order.order_number}</Text><Text style={s.body}>Statut : {statusLabel(order.status)}</Text><Text style={s.body}>Total produits : {money(order.subtotal_fcfa)}</Text><Text style={s.body}>Livraison : à confirmer</Text><Text style={s.body}>Total actuel : {money(order.total_fcfa)}</Text><Action title="Suivre cette commande" onPress={() => trackOrder(order.order_number)} /></View> : null}
    {screen === "suivi" ? <><Text style={s.heading}>Suivre une commande</Text><Field value={trackNumber} onChangeText={setTrackNumber} placeholder="Numéro (ex. EG-20261015-ABC123)" /><Action title={trackingBusy ? "Recherche…" : "Consulter le suivi"} disabled={trackingBusy} onPress={() => trackOrder()} />{tracking ? <View style={s.card}><Text style={s.productTitle}>Commande {tracking.order_number}</Text><Text style={s.status}>{statusLabel(tracking.status)}</Text><Text style={s.body}>Paiement : {tracking.payment_status || "À confirmer"}</Text><Text style={s.body}>Total : {money(tracking.total_fcfa)}</Text><Text style={s.body}>Destinataire : {tracking.name}</Text><Text style={s.body}>Adresse : {[tracking.address, tracking.city].filter(Boolean).join(", ")}</Text><Text style={s.label}>Historique</Text>{(tracking.status_history || []).map((h, i) => <View key={i} style={s.history}><Text style={s.historyTitle}>{h.label || statusLabel(h.to)}</Text><Text style={s.muted}>{h.at ? new Date(h.at).toLocaleString("fr-FR") : ""}</Text></View>)}</View> : null}</> : null}
    <Text style={s.footer}>EgonarMarket · Vos achats, vos saveurs, vos évasions.</Text>
  </ScrollView></SafeAreaView>;
}
function uLabel(value) { return ({ MARKET: "Market", SAVEURS: "Saveurs", EVASION: "Évasion" })[value] || "EgonarMarket"; }
function statusLabel(value) { return ({ EN_ATTENTE_SERVICE_CLIENT: "En attente de confirmation", EN_ATTENTE_DE_PAIEMENT: "En attente de paiement", CONFIRMEE: "Commande confirmée", EN_PREPARATION: "En préparation", EXPEDIEE: "Expédiée", EN_LIVRAISON: "En livraison", LIVREE: "Livrée", ANNULEE: "Annulée" })[value] || String(value || "Statut en cours"); }

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},page:{padding:18,paddingBottom:40},brand:{paddingVertical:18},kicker:{fontSize:12,fontWeight:"900",letterSpacing:2,color:C.accent},brandTitle:{fontSize:30,fontWeight:"900",color:C.ink,marginTop:6},muted:{color:C.muted,fontSize:13,marginTop:5},nav:{flexDirection:"row",gap:7,flexWrap:"wrap",marginBottom:20},button:{backgroundColor:C.accent,paddingHorizontal:14,minHeight:42,borderRadius:12,alignItems:"center",justifyContent:"center",marginTop:5},secondary:{backgroundColor:"#fff",borderWidth:1,borderColor:C.border},buttonText:{color:"#fff",fontWeight:"800"},heading:{fontSize:21,fontWeight:"900",color:C.ink,marginTop:10,marginBottom:12},tabs:{flexDirection:"row",gap:8,marginBottom:14},tab:{flex:1,paddingVertical:12,borderRadius:12,alignItems:"center",backgroundColor:"#fff",borderWidth:1,borderColor:C.border},tabActive:{backgroundColor:C.accent,borderColor:C.accent},tabText:{fontWeight:"700",color:C.ink},tabTextActive:{color:"#fff"},product:{flexDirection:"row",gap:12,backgroundColor:C.card,padding:14,borderRadius:16,borderWidth:1,borderColor:C.border,marginBottom:10},productTitle:{fontSize:16,fontWeight:"800",color:C.ink},price:{fontSize:16,fontWeight:"900",color:C.accent,marginTop:7},description:{color:C.muted,fontSize:13,marginTop:5,lineHeight:19},counter:{alignItems:"center",justifyContent:"center",gap:2},qty:{fontWeight:"900",color:C.ink,padding:3},cartRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:C.card,padding:14,borderRadius:14,borderWidth:1,borderColor:C.border,marginBottom:8},totalRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:16},totalLabel:{fontWeight:"800",color:C.ink},total:{fontWeight:"900",fontSize:18,color:C.accent},input:{backgroundColor:"#fff",borderWidth:1,borderColor:C.border,borderRadius:12,minHeight:48,paddingHorizontal:13,color:C.ink,marginBottom:9},label:{fontWeight:"800",color:C.ink,marginTop:8,marginBottom:7},radioRow:{flexDirection:"row",alignItems:"center",gap:10,paddingVertical:9},radio:{color:C.accent,fontSize:19},radioText:{color:C.ink,flex:1},note:{fontSize:12,color:C.muted,lineHeight:18,marginVertical:8},card:{backgroundColor:"#fff",padding:18,borderRadius:16,borderWidth:1,borderColor:C.border,marginTop:12},orderNumber:{fontSize:21,fontWeight:"900",color:C.accent,marginVertical:8},body:{color:C.ink,marginTop:8},status:{fontSize:16,fontWeight:"900",color:C.ok,marginTop:8},history:{borderLeftWidth:2,borderLeftColor:C.accent,paddingLeft:12,marginTop:12},historyTitle:{fontWeight:"700",color:C.ink},error:{color:C.danger,backgroundColor:"#fff1f0",padding:12,borderRadius:12,marginBottom:12},footer:{textAlign:"center",color:C.muted,fontSize:11,marginTop:30}
});
