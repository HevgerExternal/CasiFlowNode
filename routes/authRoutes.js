const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.get("/validate-token", authController.validateToken);
router.post("/logout", authController.logout);

module.exports = router;
