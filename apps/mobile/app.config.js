const role = String(process.env.EXPO_PUBLIC_APP_ROLE || "supplier").toLowerCase();
const isAdmin = role === "admin";

module.exports = {
  expo: {
    name: isAdmin ? "Egonar Admin" : "Egonar Fournisseur",
    slug: isAdmin ? "egonar-admin" : "egonar-fournisseur",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: isAdmin ? "egonar-admin" : "egonar-fournisseur",
    ios: {
      supportsTablet: true,
      bundleIdentifier: isAdmin ? "sn.egonarmarket.admin" : "sn.egonarmarket.supplier"
    },
    android: {
      package: isAdmin ? "sn.egonarmarket.admin" : "sn.egonarmarket.supplier"
    },
    extra: {
      appRole: isAdmin ? "admin" : "supplier",
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000"
    }
  }
};
