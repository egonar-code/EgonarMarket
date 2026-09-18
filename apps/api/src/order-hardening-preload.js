const express = require("express");

const PAYMENT_METHODS = new Set(["A_PAYER", "LIVRAISON", "WAVE", "ORANGE_MONEY"]);
const DAKAR_ZONES = new Set(["DAKAR", "DAKAR_REGION"]);
const DAKAR_CITY_NAMES = new Set(["dakar", "pikine", "guediawaye", "rufisque", "diamniadio"]);

const deliveryDakar = () => Math.max(0, Number(process.env.DELIVERY_DAKAR_FCFA || 0));
const deliveryOther = () => Math.max(0, Number(process.env.DELIVERY_OTHER_FCFA || 0));

function resolveDelivery(zone, city) {
  const normalizedZone = String(zone || "").trim().toUpperCase();
  if (DAKAR_ZONES.has(normalizedZone)) return deliveryDakar();
  const normalizedCity = String(city || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return DAKAR_CITY_NAMES.has(normalizedCity) ? deliveryDakar() : deliveryOther();
}

const originalPost = express.application.post;
express.application.post = function patchedPost(path, ...handlers) {
  if (path !== "/api/orders") return originalPost.call(this, path, ...handlers);

  const hardenOrder = (req, res, next) => {
    const body = req.body || {};
    const customer = body.customer || {};
    const paymentMethod = String(body.payment_method || "A_PAYER").trim().toUpperCase();
    const deliveryZone = String(body.delivery_zone || customer.delivery_zone || "").trim().toUpperCase();

    if (!PAYMENT_METHODS.has(paymentMethod)) {
      return res.status(400).json({ error: "Mode de paiement invalide." });
    }
    if (!deliveryZone && !String(customer.city || "").trim()) {
      return res.status(400).json({ error: "La zone ou la ville de livraison est obligatoire." });
    }

    // Never trust a delivery amount supplied by the browser: derive it from the zone/city.
    req.body.payment_method = paymentMethod;
    req.body.delivery_fcfa = resolveDelivery(deliveryZone, customer.city);
    return next();
  };

  return originalPost.call(this, path, hardenOrder, ...handlers);
};

module.exports = { resolveDelivery };
