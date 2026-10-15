const role = String(process.env.EXPO_PUBLIC_APP_ROLE || "supplier").toLowerCase();
const isAdmin = role === "admin";
const isCustomer = role === "customer";
const appName = isAdmin ? "Egonar Admin" : isCustomer ? "EgonarMarket" : "Egonar Fournisseur";
const appSlug = isAdmin ? "egonar-admin" : isCustomer ? "egonarmarket-client" : "egonar-fournisseur";
const appScheme = isAdmin ? "egonar-admin" : isCustomer ? "egonarmarket" : "egonar-fournisseur";

module.exports = {
  expo: {
    name: appName,
    slug: appSlug,
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: appScheme,
    ios: {
      supportsTablet: true,
      bundleIdentifier: isAdmin ? "sn.egonarmarket.admin" : isCustomer ? "sn.egonarmarket.client" : "sn.egonarmarket.supplier"
    },
    android: {
      package: isAdmin ? "sn.egonarmarket.admin" : isCustomer ? "sn.egonarmarket.client" : "sn.egonarmarket.supplier"
    },
    extra: {
      appRole: isAdmin ? "admin" : isCustomer ? "customer" : "supplier",
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || ""
    }
  }
};
