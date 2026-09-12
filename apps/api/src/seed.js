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
      `INSERT INTO products(name,slug,category,description,price_fcfa,stock,image_url,verified_level,verification_score,rating_average,rating_count,delivery_min_minutes,delivery_max_minutes,delivery_city,verified_at)
       VALUES
       ('T-shirt Premium','t-shirt-premium','MODE','T-shirt qualité premium.',10000,20,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80','VERIFIED',92,4.8,37,45,90,'Dakar',NOW()),
       ('Sac Élégance','sac-elegance','ACCESSOIRES','Sac moderne et élégant.',18000,12,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80','PREMIUM',97,4.9,61,30,75,'Dakar',NOW()),
       ('Montre Classique','montre-classique','MODE','Montre au design intemporel.',25000,8,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80','VERIFIED',89,4.7,24,60,120,'Dakar',NOW())`
    );
  }

  await db.query(
    `UPDATE products SET verified_level='VERIFIED', verification_score=92, rating_average=4.8, rating_count=37, delivery_min_minutes=45, delivery_max_minutes=90, delivery_city='Dakar', verified_at=COALESCE(verified_at,NOW()) WHERE slug='t-shirt-premium'`);
  await db.query(
    `UPDATE products SET verified_level='PREMIUM', verification_score=97, rating_average=4.9, rating_count=61, delivery_min_minutes=30, delivery_max_minutes=75, delivery_city='Dakar', verified_at=COALESCE(verified_at,NOW()) WHERE slug='sac-elegance'`);
  await db.query(
    `UPDATE products SET verified_level='VERIFIED', verification_score=89, rating_average=4.7, rating_count=24, delivery_min_minutes=60, delivery_max_minutes=120, delivery_city='Dakar', verified_at=COALESCE(verified_at,NOW()) WHERE slug='montre-classique'`);

  console.log("Base EgonarMarket initialisée.");
  await db.pool.end();
}

main().catch(async err => {
  console.error(err.message || err);
  await db.pool.end();
  process.exit(1);
});
