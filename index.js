import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import pool from "./db.js";
import usersRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";

import reviewRoute from "./routes/review.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import historyRouter from "./routes/historypage.js";




import pg from "pg";

const frontendurl = process.env.FRONTEND_URL;
const port = process.env.PORT || 3000;

const router = express.Router();



//const express = require("express");
//const cors = require("cors");


const app = express();


//enabling cors

//-------------------------------------
//app.use(cors());

//const cors = require("cors");


app.use(cors({
  origin:  "https://code-reviewer-frontend-woad.vercel.app", // frontend origin
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
console.log("✅ Frontend URL (CORS):", frontendurl);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    //path:'/historypage',
    httpOnly: true,
    secure: true, // set to true in production with HTTPS
    //   //  maxAge: 1000 * 60 * 60 * 24 // 1 day
    sameSite: "none",
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `https://code-reviewer-backend-aqi6.onrender.com/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  //--------------------------------------------------------------------------------------------
  const { id: googleId, displayName, emails, photos } = profile;
  const email = emails[0].value;
  const picture = photos[0].value;

  try {
    // Check if user already exists by google_id
    const existingUser = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);

    if (existingUser.rows.length > 0) {
      return done(null, existingUser.rows[0]);
    }

    // Else insert new user
    const newUser = await pool.query(
      "INSERT INTO users (google_id, name, email, picture, auth_provider) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [googleId, displayName, email, picture, 'google']
    );


    done(null, newUser.rows[0]);
  } catch (err) {
    done(err, null);
  }

  // return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user.id); //hhhhh
});

passport.deserializeUser(async (id, done) => {

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]); // OR google_id
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }

  //done(null, user);
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    // successRedirect: `${frontendurl}/review` // your frontend
  }),
  (req, res) => {
    // ✅ Manually set session.user here
    req.session.user = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name

    };

    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error:", err);
        return res.redirect(`${frontendurl}/login`);
      }
    
    console.log("✅ Session saved, redirecting to frontend...");

    console.log("✅ Session set after Google login:", req.session.user);
    

    res.redirect(`${frontendurl}/review`);
  });
}
);

// console.log ("session check krna hai :>",req.user.email  );

app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) { return next(err); }
    res.redirect(`${frontendurl}/login`); // frontend login
  });
});

console.log("CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);


//-------------------------------------------------------

app.use(express.json());
//Users API Routes
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/review", reviewRoute);  // 👈 now POST to /api/review
app.use("/api/historypage", historyRouter);
app.get("/historypage", (req, res) => {
  res.send("historypage");
});
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

