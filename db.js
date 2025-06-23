import pg from "pg";
const {Pool} =pg;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "code_reviewer",
    password: "sarveshdbms",
    port: 5432, // Default PostgreSQL port
});

pool.connect()
    .then(() => console.log("✅ PostgreSQL connected..."))
    .catch((err) => console.error("❌ Database connection failed:", err));

export default pool;
