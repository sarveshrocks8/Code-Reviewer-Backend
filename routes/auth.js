import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";  // PostgreSQL connection import

const router = express.Router();

// 🔹 Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 🔹 Database se user find karo
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const user = userResult.rows[0];

        // 🔹 Password Match karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.json({ message: "Login successful", user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

export default router;
