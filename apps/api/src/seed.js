const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./db");
require("dotenv").config();

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, "../../../db/schema.sql"), "utf8");
  await db.query(schema);

  const email = process.env.ADMIN_EMAIL || "admin@egonarmarket.sn";
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password === "replace-this-password") {
    throw new Error("ADMIN_PASSWORD doit être défini dans .env avant db:init.");
  }

  const hash = await bcrypt.hash(String(password), 12);
  await db.query(
    `INSERT INTO admins(email,password_hash) VALUES($1,$2)
     ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash`,
    [email, hash]
  );

  const count = await db.query("SELECT COUNT(*)::int AS n FROM products");
  if (count.rows[0].n === 0) {
    await db.query(
      `INSERT INTO products(name,slug,category,description,price_fcfa,stock,image_url)
       VALUES
       ('T-shirt Premium','t-shirt-premium','MODE','T-shirt qualité premium.',10000,20,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
       ('Sac Élégance','sac-elegance','ACCESSOIRES','Sac moderne et élégant.',18000,12,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80'),
       ('Montre Classique','montre-classique','MODE','Montre au design intemporel.',25000,8,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80')`
    );
  }

  console.log("Base EgonarMarket initialisée.");
  await db.pool.end();
}

main().catch(async err => {
  console.error(err.message || err);
  await db.pool.end();
  process.exit(1);
});
