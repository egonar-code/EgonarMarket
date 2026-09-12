import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { APP_NAME, MOBILE_ROLE } from "./config";
import { adminApi, supplierApi } from "./api";

const colors = { bg: "#f6f8fb", card: "#ffffff", ink: "#111827", muted: "#6b7280", primary: "#111827", accent: "#2563eb", danger: "#b42318", border: "#e5e7eb", ok: "#067647", warn: "#9a6700" };

function Button({ title, onPress, secondary = false, danger = false, disabled = false }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, danger && styles.buttonDanger, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}><Text style={[styles.buttonText, secondary && styles.buttonTextSecondary, danger && styles.buttonTextDanger]}>{title}</Text></Pressable>;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true); setError("");
    try {
      if (MOBILE_ROLE === "admin") await adminApi.login(email, password);
      else await supplierApi.login(email, password);
      await onLogin();
    } catch (e) {
      setError(e.message || "Connexion impossible.");
    } finally { setBusy(false); }
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.loginWrap}><View style={styles.brand}><Text style={styles.brandKicker}>EGONARMARKET</Text><Text style={styles.brandTitle}>{APP_NAME}</Text><Text style={styles.brandSub}>{MOBILE_ROLE === "admin" ? "Pilotage sécurisé de la plateforme" : "Votre espace professionnel fournisseur"}</Text></View><View style={styles.card}><Text style={styles.cardTitle}>Connexion</Text><TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} style={styles.input}/><TextInput secureTextEntry placeholder="Mot de passe" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} style={styles.input}/>{error ? <Text style={styles.error}>{error}</Text> : null}<Button title={busy ? "Connexion…" : "Se connecter"} onPress={submit} disabled={busy || !email || !password}/></View></ScrollView></SafeAreaView>;
}

function AdminHome({ onLogout }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const load = async () => { setBusy(true); try { const [s,p] = await Promise.all([adminApi.suppliers(), adminApi.pendingProducts()]); setSuppliers(s || []); setProducts(p || []); setMessage(""); } catch (e) { setMessage(e.message || "Impossible de charger le tableau de bord."); } finally { setBusy(false); } };
  useEffect(() => { load(); }, []);
  const pending = suppliers.filter(x => x.status === "PENDING").length;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}><Header title="Egonar Admin" subtitle="Vue globale" onLogout={onLogout}/><View style={styles.statGrid}><Stat label="Fournisseurs" value={suppliers.length}/><Stat label="À valider" value={pending}/><Stat label="Produits en attente" value={products.length}/></View><Text style={styles.sectionTitle}>Produits à valider</Text>{message ? <Text style={styles.error}>{message}</Text> : null}{busy ? <ActivityIndicator /> : products.slice(0, 8).map(p => <View style={styles.row} key={p.id}><View style={styles.rowMain}><Text style={styles.rowTitle}>{p.name}</Text><Text style={styles.rowMeta}>{p.business_name || "Fournisseur"} · {p.price_fcfa} FCFA · stock {p.stock}</Text></View><View style={styles.rowActions}><Button title="Approuver" onPress={async () => { await adminApi.approveProduct(p.id, "APPROVED"); load(); }} /><Button title="Refuser" secondary onPress={async () => { await adminApi.approveProduct(p.id, "REJECTED"); load(); }} /></View></View>)}<Text style={styles.sectionTitle}>Fournisseurs</Text>{suppliers.slice(0, 12).map(s => <View style={styles.row} key={s.id}><View style={styles.rowMain}><Text style={styles.rowTitle}>{s.business_name}</Text><Text style={styles.rowMeta}>{s.contact_name} · {s.email}</Text></View><View style={styles.rowActions}><Text style={[styles.status, s.status === "SUSPENDED" && { color: colors.danger }]}>{s.status}</Text>{s.status === "PENDING" ? <Button title="Valider" onPress={async () => { await adminApi.updateSupplierStatus(s.id, "APPROVED"); load(); }} /> : null}{s.status === "APPROVED" ? <Button title="Suspendre" secondary onPress={async () => { await adminApi.updateSupplierStatus(s.id, "SUSPENDED"); load(); }} /> : null}</View></View>)}<Button title="Actualiser" secondary onPress={load}/></ScrollView></SafeAreaView>;
}

function SupplierHome({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", description: "", price_fcfa: "", stock: "", image_url: "" });
  const [saving, setSaving] = useState(false);
  const load = async () => { try { const [m,s,p] = await Promise.all([supplierApi.me(), supplierApi.stats(), supplierApi.products()]); setMe(m); setStats(s); setProducts(p || []); setError(""); } catch (e) { setError(e.message || "Impossible de charger votre espace."); } };
  useEffect(() => { load(); }, []);
  const submitProduct = async () => { setSaving(true); setError(""); try { await supplierApi.createProduct({ ...form, price_fcfa: Number(form.price_fcfa), stock: Number(form.stock || 0) }); setForm({ name: "", category: "", description: "", price_fcfa: "", stock: "", image_url: "" }); setShowAdd(false); await load(); } catch (e) { setError(e.message || "Impossible de soumettre le produit."); } finally { setSaving(false); } };
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}><Header title={me?.business_name || "Espace fournisseur"} subtitle="Mon activité" onLogout={onLogout}/><View style={styles.statGrid}><Stat label="Produits actifs" value={stats?.active_products ?? "—"}/><Stat label="En validation" value={stats?.pending_products ?? "—"}/><Stat label="Stock total" value={stats?.total_stock ?? "—"}/></View>{error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.toolbar}><Text style={styles.sectionTitle}>Mes produits</Text><Button title={showAdd ? "Fermer" : "+ Ajouter"} secondary onPress={() => setShowAdd(v => !v)}/></View>{showAdd ? <View style={styles.card}><Text style={styles.cardTitle}>Nouveau produit</Text><TextInput placeholder="Nom" placeholderTextColor="#9ca3af" value={form.name} onChangeText={v => setForm({ ...form, name: v })} style={styles.input}/><TextInput placeholder="Catégorie" placeholderTextColor="#9ca3af" value={form.category} onChangeText={v => setForm({ ...form, category: v })} style={styles.input}/><TextInput placeholder="Description" placeholderTextColor="#9ca3af" value={form.description} onChangeText={v => setForm({ ...form, description: v })} style={[styles.input, styles.textarea]} multiline/><TextInput placeholder="Prix en FCFA" placeholderTextColor="#9ca3af" keyboardType="numeric" value={form.price_fcfa} onChangeText={v => setForm({ ...form, price_fcfa: v })} style={styles.input}/><TextInput placeholder="Stock" placeholderTextColor="#9ca3af" keyboardType="numeric" value={form.stock} onChangeText={v => setForm({ ...form, stock: v })} style={styles.input}/><TextInput placeholder="URL de l'image" placeholderTextColor="#9ca3af" autoCapitalize="none" value={form.image_url} onChangeText={v => setForm({ ...form, image_url: v })} style={styles.input}/><Button title={saving ? "Envoi…" : "Soumettre à Egonar"} onPress={submitProduct} disabled={saving || !form.name || !form.category || !form.price_fcfa}/></View> : null}{products.slice(0, 20).map(p => <View style={styles.row} key={p.id}><View style={styles.rowMain}><Text style={styles.rowTitle}>{p.name}</Text><Text style={styles.rowMeta}>{p.price_fcfa} FCFA · stock {p.stock} · {p.approval_status}</Text></View><Text style={[styles.status, !p.active && { color: colors.danger }]}>{p.active ? "ACTIF" : "INACTIF"}</Text></View>)}<Button title="Actualiser" secondary onPress={load}/></ScrollView></SafeAreaView>;
}

function Header({ title, subtitle, onLogout }) { return <View style={styles.header}><View><Text style={styles.headerTitle}>{title}</Text><Text style={styles.headerSub}>{subtitle}</Text></View><Pressable onPress={onLogout}><Text style={styles.logout}>Déconnexion</Text></Pressable></View>; }
function Stat({ label, value }) { return <View style={styles.stat}><Text style={styles.statValue}>{String(value)}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

export default function App() {
  const [session, setSession] = useState(false);
  const [checking, setChecking] = useState(true);
  async function checkSession() { try { MOBILE_ROLE === "admin" ? await adminApi.me() : await supplierApi.me(); setSession(true); } catch { setSession(false); } finally { setChecking(false); } }
  useEffect(() => { checkSession(); }, []);
  if (checking) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large"/><Text style={styles.muted}>Chargement…</Text></View></SafeAreaView>;
  if (!session) return <Login onLogin={checkSession}/>;
  const logout = async () => { try { MOBILE_ROLE === "admin" ? await adminApi.logout() : await supplierApi.logout(); } finally { setSession(false); } };
  return MOBILE_ROLE === "admin" ? <AdminHome onLogout={logout}/> : <SupplierHome onLogout={logout}/>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, page: { padding: 20, paddingBottom: 48 }, loginWrap: { flexGrow: 1, justifyContent: "center", padding: 24 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }, muted: { color: colors.muted }, brand: { marginBottom: 28 }, brandKicker: { fontSize: 12, fontWeight: "800", letterSpacing: 2, color: colors.accent }, brandTitle: { fontSize: 36, fontWeight: "900", color: colors.ink, marginTop: 8 }, brandSub: { fontSize: 15, color: colors.muted, marginTop: 8, lineHeight: 22 }, card: { backgroundColor: colors.card, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 12 }, cardTitle: { fontSize: 24, fontWeight: "800", color: colors.ink, marginBottom: 4 }, input: { height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 15, color: colors.ink, backgroundColor: "#fff", marginBottom: 10 }, textarea: { height: 100, paddingTop: 14, textAlignVertical: "top" }, button: { backgroundColor: colors.primary, minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 6 }, buttonSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border }, buttonDanger: { backgroundColor: "#fff1f0", borderWidth: 1, borderColor: "#f5c2c0" }, buttonDisabled: { opacity: 0.45 }, buttonPressed: { transform: [{ scale: 0.98 }] }, buttonText: { color: "#fff", fontWeight: "800" }, buttonTextSecondary: { color: colors.ink }, buttonTextDanger: { color: colors.danger }, error: { color: colors.danger, backgroundColor: "#fff1f0", borderWidth: 1, borderColor: "#f5c2c0", padding: 12, borderRadius: 12, marginBottom: 12 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }, headerTitle: { fontSize: 28, fontWeight: "900", color: colors.ink }, headerSub: { color: colors.muted, marginTop: 4 }, logout: { color: colors.accent, fontWeight: "800" }, statGrid: { flexDirection: "row", gap: 10, marginBottom: 24 }, stat: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }, statValue: { fontSize: 26, fontWeight: "900", color: colors.ink }, statLabel: { color: colors.muted, marginTop: 4, fontSize: 12 }, toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }, sectionTitle: { fontSize: 20, fontWeight: "800", color: colors.ink, marginTop: 8, marginBottom: 12 }, row: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", gap: 12 }, rowMain: { flex: 1 }, rowTitle: { fontWeight: "800", color: colors.ink }, rowMeta: { color: colors.muted, fontSize: 12, marginTop: 5, lineHeight: 18 }, rowActions: { minWidth: 105, gap: 4 }, status: { color: colors.ok, fontWeight: "800", fontSize: 11 }
});
