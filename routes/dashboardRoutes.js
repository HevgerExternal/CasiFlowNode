const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/userstats", authMiddleware, dashboardController.getUserStats);

module.exports = router;
