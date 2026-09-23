const crypto = require("crypto");
const { getDb, docToData } = require("./firestore");

const firestore = getDb();

const NEXT_ROLE_BY_STATUS = {
  EN_ATTENTE_PAIEMENT: "PAYMENT",
  CONFIRMEE: "SUPPLIER",
  EXPEDIEE: "LOGISTICS",
  EN_LIVRAISON: "COURIER"
};

const ROLE_LABELS = {
  CUSTOMER_SERVICE: "Service client",
  PAYMENT: "Paiement",
  SUPPLIER: "Fournisseur",
  LOGISTICS: "Logistique",
  COURIER: "Livreur"
};

function notificationMessage(status, order) {
  const number = order?.order_number || "commande";
  switch (status) {
    case "EN_ATTENTE_PAIEMENT": return { title: "Paiement à vérifier", body: `La commande ${number} attend une confirmation de paiement.` };
    case "CONFIRMEE": return { title: "Commande à préparer", body: `La commande ${number} est confirmée et doit être prise en charge par le fournisseur.` };
    case "EXPEDIEE": return { title: "Commande à prendre en charge", body: `La commande ${number} a été expédiée et attend la logistique.` };
    case "EN_LIVRAISON": return { title: "Livraison à effectuer", body: `La commande ${number} est prête pour le livreur.` };
    case "LIVREE": return { title: "Commande livrée", body: `La commande ${number} est indiquée comme livrée.` };
    default: return { title: "Mise à jour de commande", body: `La commande ${number} est passée à l'étape ${status}.` };
  }
}

async function createNotification(payload) {
  const id = crypto.randomUUID();
  const now = new Date();
  const row = {
    id,
    recipient_type: payload.recipient_type || "ADMIN",
    recipient_id: payload.recipient_id || null,
    role: payload.role || null,
    order_id: payload.order_id || null,
    order_number: payload.order_number || null,
    title: String(payload.title || "").slice(0, 180),
    body: String(payload.body || "").slice(0, 500),
    level: payload.level || "INFO",
    read: false,
    created_at: now,
    updated_at: now
  };
  await firestore.collection("notifications").doc(id).set(row);
  return row;
}

async function notifyWorkflowAdvance(order, nextStatus) {
  try {
    if (!order?.id || !nextStatus) return;
    const message = notificationMessage(nextStatus, order);
    await createNotification({
      recipient_type: "ADMIN",
      recipient_id: "admin",
      order_id: order.id,
      order_number: order.order_number,
      title: message.title,
      body: message.body,
      level: nextStatus === "LIVREE" ? "SUCCESS" : "INFO"
    });

    const role = NEXT_ROLE_BY_STATUS[nextStatus];
    if (!role) return;

    if (role === "SUPPLIER") {
      const ids = new Set();
      for (const item of Array.isArray(order.items) ? order.items : []) {
        const snap = await firestore.collection("products").doc(String(item.product_id)).get();
        if (snap.exists && snap.data()?.supplier_id) ids.add(String(snap.data().supplier_id));
      }
      for (const supplierId of ids) {
        await createNotification({
          recipient_type: "SUPPLIER",
          recipient_id: supplierId,
          role,
          order_id: order.id,
          order_number: order.order_number,
          title: message.title,
          body: message.body
        });
      }
      return;
    }

    const usersSnap = await firestore.collection("service_users").where("role", "==", role).get();
    for (const doc of usersSnap.docs) {
      const user = docToData(doc);
      if (user.active === false) continue;
      await createNotification({
        recipient_type: "SERVICE",
        recipient_id: user.id,
        role,
        order_id: order.id,
        order_number: order.order_number,
        title: message.title,
        body: message.body
      });
    }
  } catch (error) {
    console.error("Notification workflow error:", error?.stack || error);
  }
}

module.exports = {
  createNotification,
  notifyWorkflowAdvance,
  ROLE_LABELS
};
