import express from "express";
//import { que from "../db.js";  // PostgreSQL connection import
import pool from "../db.js";  // `.js` extension add karo

import bcrypt from "bcryptjs";  // 🔹 bcrypt.js import karo

const router = express.Router();

// 🔹 GET All Users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 🔹 POST Add a New User
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 🔹 Password Hashing (Encrypt)
    const salt = await bcrypt.genSalt(10);   // Random Salt Generate karo
    const hashedPassword = await bcrypt.hash(password, salt);  // Password Encrypt karo
    console.log("Hashed Password:", hashedPassword); // 🔹 Debugging ke liye
    // 🔹 Database me hashed password store karo
    
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


export default router;
