const db = require("../apps/api/src/db");
const { getDb } = require("../apps/api/src/firestore");
require("dotenv").config();

const BATCH_SIZE = 400;

function clean(value) {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      out[key] = clean(item);
    }
    return out;
  }
  return value;
}

async function writeCollection(firestore, collection, rows, idField = "id") {
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = firestore.batch();
    const chunk = rows.slice(offset, offset + BATCH_SIZE);
    for (const row of chunk) {
      const id = String(row[idField]);
      const { [idField]: _ignored, ...data } = row;
      batch.set(firestore.collection(collection).doc(id), clean(data), { merge: true });
    }
    await batch.commit();
    console.log(`Migrated ${collection}: ${Math.min(offset + chunk.length, rows.length)}/${rows.length}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquant pour la migration.");
  const firestore = getDb();

  const [
    products,
    customers,
    suppliers,
    admins,
    categories,
    orders,
    orderItems,
    reviews
  ] = await Promise.all([
    db.query("SELECT * FROM products"),
    db.query("SELECT * FROM customers"),
    db.query("SELECT * FROM suppliers"),
    db.query("SELECT * FROM admins"),
    db.query("SELECT * FROM category_catalog"),
    db.query("SELECT * FROM orders"),
    db.query("SELECT * FROM order_items"),
    db.query("SELECT * FROM product_reviews")
  ]);

  await writeCollection(firestore, "products", products.rows);
  await writeCollection(firestore, "customers", customers.rows);
  await writeCollection(firestore, "suppliers", suppliers.rows);
  await writeCollection(firestore, "admins", admins.rows);
  await writeCollection(firestore, "categories", categories.rows);

  const itemsByOrder = new Map();
  for (const item of orderItems.rows) {
    const key = String(item.order_id);
    if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
    itemsByOrder.get(key).push(clean(item));
  }

  const customersById = new Map(customers.rows.map(row => [String(row.id), row]));
  const orderDocs = orders.rows.map(order => {
    const customer = customersById.get(String(order.customer_id));
    return {
      ...order,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || null,
            address: customer.address,
            city: customer.city
          }
        : null,
      items: (itemsByOrder.get(String(order.id)) || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price_fcfa: item.unit_price_fcfa,
        quantity: item.quantity
      }))
    };
  });
  await writeCollection(firestore, "orders", orderDocs);

  const reviewDocs = reviews.rows.map(row => ({
    ...row,
    doc_key: `${row.order_id}_${row.product_id}`
  }));
  await writeCollection(firestore, "reviews", reviewDocs, "doc_key");

  console.log("Migration PostgreSQL → Firestore terminée.");
  console.log(JSON.stringify({
    products: products.rowCount,
    customers: customers.rowCount,
    suppliers: suppliers.rowCount,
    admins: admins.rowCount,
    categories: categories.rowCount,
    orders: orders.rowCount,
    reviews: reviews.rowCount
  }, null, 2));

  await db.pool.end();
}

main().catch(async error => {
  console.error(error?.stack || error);
  try { await db.pool.end(); } catch {}
  process.exit(1);
});
