const express = require("express");
const axios = require("axios");

const router = express.Router();

const FLASK_BASE_URL = process.env.FLASK_BASE_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/*
GET USER PROFILE
*/
router.get("/profile/:username", async (req, res) => {
  try {
    const response = await axios.get(
      `${FLASK_BASE_URL}/profile/${req.params.username}`,
      {
        headers: {
          "X-Internal-Key": INTERNAL_API_KEY,
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error("Profile error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Flask server error",
    });
  }
});

module.exports = router;
