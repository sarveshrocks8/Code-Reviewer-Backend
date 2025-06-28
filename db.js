import dotenv from 'dotenv';
dotenv.config();

import pg from "pg";
const {Pool} =pg;

// const pool = new Pool({
//     user: "postgres",
//     host: "localhost",
//     database: "code_reviewer",
//     password: "sarveshdbms",
//     port: 5432, // Default PostgreSQL port
// });
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL); 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
pool.connect()
    .then(() => console.log("✅ PostgreSQL connected..."))
    .catch((err) => console.error("❌ Database connection failed:", err));

export default pool;
