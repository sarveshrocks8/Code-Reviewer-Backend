
import express from "express";

import pool from "../db.js";

import axios from "axios";

import dotenv from "dotenv";
const result = dotenv.config();

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}



const router = express.Router();

console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);


router.post("/", async (req, res) => {

      const reviewerName = "Gemini AI";

  // console.log("User ID:", userId);
  // console.log("User Email:", userEmail);

  const { code } = req.body;
  console.log ({code});





  try {
    //----------------------------------------------------------------------

    const userEmail = req.user?.email || req.user?.emails?.[0]?.value;
    console.log("useremail->",req.user.email);
    //console.log("ttt",req.user.id);
    //---------------------------------------------------------------------------
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [
          {
            parts: [{ text: `Review the following code and provide feedback:\n\n${code}` }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
                //========================================================================
                    //✅ Save to DB
                     
                     
                    await pool.query(
                      "INSERT INTO reviews (user_id, code, feedback, reviewer_name) VALUES ($1, $2, $3, $4)",
                      [req.user.id, code, result, reviewerName]
                    );

                    //-------------------------------------------------------------------------------------------
    res.json({ review: result });
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    console.log(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch review from Gemini API' });
  }
});



export default router;
