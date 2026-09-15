const bcrypt = require("bcryptjs");
const db = require("./db");
require("dotenv").config();

async function main() {
  const email = process.env.TEST_SUPPLIER_EMAIL || "fournisseur-test@egonarmarket.sn";
  const password = process.env.TEST_SUPPLIER_PASSWORD || "EgonarTest2026!";
  const businessName = process.env.TEST_SUPPLIER_BUSINESS || "Egonar Fournisseur Test";
  const contactName = process.env.TEST_SUPPLIER_CONTACT || "Compte Test";
  const phone = process.env.TEST_SUPPLIER_PHONE || "770000000";

  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO suppliers(business_name,contact_name,phone,email,password_hash,status,verification_level,verified_at)
     VALUES($1,$2,$3,$4,$5,'APPROVED','VERIFIED',NOW())
     ON CONFLICT(email) DO UPDATE SET
       business_name=EXCLUDED.business_name,
       contact_name=EXCLUDED.contact_name,
       phone=EXCLUDED.phone,
       password_hash=EXCLUDED.password_hash,
       status='APPROVED',
       verification_level='VERIFIED',
       verified_at=NOW(),
       updated_at=NOW()
     RETURNING id,email,status`,
    [businessName, contactName, phone, email, hash]
  );

  console.log("Fournisseur test prêt.");
  console.log(`Email: ${email}`);
  console.log(`Mot de passe: ${password}`);
  console.log(`Statut: ${result.rows[0].status}`);
  await db.pool.end();
}

main().catch(async err => {
  console.error(err.message || err);
  await db.pool.end();
  process.exit(1);
});
