import express from "express";
import cors from "cors";
import pool from "./db.js";
import usersRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import dotenv from 'dotenv';
import reviewRoute from "./routes/review.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import historyRouter from "./routes/historypage.js";


dotenv.config();

import pg from "pg";


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
  origin: "http://localhost:5173", // frontend origin
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    //path:'/historypage',
    httpOnly: true,
    secure: false, // set to true in production with HTTPS
    //   //  maxAge: 1000 * 60 * 60 * 24 // 1 day
    sameSite: "lax",
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/callback"
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
    successRedirect: "http://localhost:5173/review" // your frontend
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/review")
  }
);

app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) { return next(err); }
    res.redirect("http://localhost:5173/login"); // frontend login
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

