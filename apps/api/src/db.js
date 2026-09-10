const { Pool } = require("pg");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL || "postgresql://egonar:egonar_password@localhost:5432/egonarmarket";

const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
