
import express from "express";
import pool from "../db.js"; // PostgreSQL pool
const router = express.Router();

router.get("/", async (req, res) => {

  console.log("Session info:", req.session);
  console.log("Logged-in user:", req.user); // 👈 Check this

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM reviews WHERE user_id = $1",
      [ req.user.id]
    );
    console.log("req.user.id" , req.user.id);
    console.log("result" , result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
