const express = require("express");
const axios = require("axios");

const router = express.Router();

const FLASK_BASE_URL = process.env.FLASK_BASE_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/*
REGISTER USER
Express receives request → forwards to Flask
*/
router.post("/register", async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_BASE_URL}/register`, req.body, {
      headers: {
        "X-Internal-Key": INTERNAL_API_KEY,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Register error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Flask server error during register",
    });
  }
});

/*
LOGIN USER
*/
router.post("/login", async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_BASE_URL}/login`, req.body, {
      headers: {
        "X-Internal-Key": INTERNAL_API_KEY,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Flask server error during login",
    });
  }
});

module.exports = router;
