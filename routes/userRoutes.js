const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", authMiddleware, userController.createUser);

router.get("/search", authMiddleware, userController.searchUsersByRole);

router.get("/get/:id", authMiddleware, userController.getUserById);

router.get("/byrole/:role", authMiddleware, userController.getUsersByRole);

router.get("/hierarchy", authMiddleware, userController.getUserTree);

router.put(
  "/:id/update-password",
  authMiddleware,
  userController.updatePassword
);

module.exports = router;
