const express = require("express");
const balanceController = require("../controllers/balanceController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/deposit", authMiddleware, balanceController.deposit);

router.post("/withdraw", authMiddleware, balanceController.withdraw);

router.get("/all", authMiddleware, balanceController.getAllTransactionHistory);

router.get(
  "/:userId/history",
  authMiddleware,
  balanceController.getTransactionHistory
);

router.get("/:userId/deposits", authMiddleware, balanceController.getDeposits);

router.get(
  "/:userId/withdrawals",
  authMiddleware,
  balanceController.getWithdrawals
);

module.exports = router;
