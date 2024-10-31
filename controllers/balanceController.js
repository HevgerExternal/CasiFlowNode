const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const permissions = require("../utils/permissions");
const {
  getAllDescendants,
} = require("../middlewares/roleValidationMiddleware");

async function canTransact(fromUser, toUser, action) {
  const { role: fromRole } = fromUser;
  const { role: toRole, parentId } = toUser;

  if (fromRole === "admin") return true;

  const allowedRoles = permissions[fromRole][action] || [];
  const isRoleAllowed = allowedRoles.includes(toRole);
  const isDirectChild = String(parentId) === String(fromUser._id);

  return isRoleAllowed && isDirectChild;
}

exports.deposit = async (req, res, next) => {
  try {
    const { toUserId, amount, note } = req.body;
    const fromUser = req.user;
    const toUser = await User.findById(toUserId);

    if (!toUser || !(await canTransact(fromUser, toUser, "canDeposit"))) {
      return res.status(403).json({
        message: "You do not have permission to deposit to this user.",
      });
    }

    if (fromUser.balance < amount) {
      return res.status(400).json({
        message: "Insufficient funds to complete the deposit.",
      });
    }

    fromUser.balance -= amount;
    await fromUser.save();

    toUser.balance += amount;
    await toUser.save();

    const transaction = new Transaction({
      from: fromUser._id,
      to: toUser._id,
      amount,
      type: "deposit",
      note,
    });
    await transaction.save();

    res.status(200).json({ message: "Deposit successful", transaction });
  } catch (err) {
    next(err);
  }
};

exports.withdraw = async (req, res, next) => {
  try {
    const { toUserId, amount, note } = req.body;
    const fromUser = req.user;
    const toUser = await User.findById(toUserId);

    if (!toUser || !(await canTransact(fromUser, toUser, "canWithdraw"))) {
      return res.status(403).json({
        message: "You do not have permission to withdraw from this user.",
      });
    }

    if (toUser.balance < amount) {
      return res.status(400).json({
        message:
          "Insufficient funds in the target user's balance for withdrawal.",
      });
    }

    toUser.balance -= amount;
    await toUser.save();

    fromUser.balance += amount;
    await fromUser.save();

    const transaction = new Transaction({
      from: toUser._id,
      to: fromUser._id,
      amount,
      type: "withdrawal",
      note,
    });
    await transaction.save();

    res.status(200).json({ message: "Withdrawal successful", transaction });
  } catch (err) {
    next(err);
  }
};

async function getFilteredTransactions(
  query,
  page,
  limit,
  fromDate,
  toDate,
  type = null
) {
  const skip = (page - 1) * limit;

  if (fromDate)
    query.timestamp = { ...query.timestamp, $gte: new Date(fromDate) };
  if (toDate) query.timestamp = { ...query.timestamp, $lte: new Date(toDate) };
  if (type) query.type = type;

  const transactions = await Transaction.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate({ path: "from", select: "username _id" })
    .populate({ path: "to", select: "username _id" });

  const totalTransactions = await Transaction.countDocuments(query);
  return {
    transactions,
    total: totalTransactions,
    page,
    totalPages: Math.ceil(totalTransactions / limit),
  };
}

exports.getTransactionHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, fromDate, toDate } = req.query;

    const targetUser = await User.findById(userId);
    if (!targetUser || !(await canTransact(req.user, targetUser, "view"))) {
      return res.status(403).json({
        message:
          "You do not have permission to view this user’s transaction history.",
      });
    }

    const result = await getFilteredTransactions(
      { $or: [{ from: targetUser._id }, { to: targetUser._id }] },
      page,
      limit,
      fromDate,
      toDate
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getDeposits = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, fromDate, toDate } = req.query;

    const targetUser = await User.findById(userId);
    if (!targetUser || !(await canTransact(req.user, targetUser, "view"))) {
      return res.status(403).json({
        message:
          "You do not have permission to view this user’s deposit history.",
      });
    }

    const result = await getFilteredTransactions(
      { $or: [{ from: targetUser._id }, { to: targetUser._id }] },
      page,
      limit,
      fromDate,
      toDate,
      "deposit"
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getWithdrawals = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, fromDate, toDate } = req.query;

    const targetUser = await User.findById(userId);
    if (!targetUser || !(await canTransact(req.user, targetUser, "view"))) {
      return res.status(403).json({
        message:
          "You do not have permission to view this user’s withdrawal history.",
      });
    }

    const result = await getFilteredTransactions(
      { $or: [{ from: targetUser._id }, { to: targetUser._id }] },
      page,
      limit,
      fromDate,
      toDate,
      "withdrawal"
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAllTransactionHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, fromDate, toDate, type } = req.query;

    const userIdFromToken = req.user._id;
    const descendants = await getAllDescendants(userIdFromToken);
    const descendantIds = descendants.map((user) => user._id);
    const userIds = [userIdFromToken, ...descendantIds];

    const { transactions, total, totalPages } = await getFilteredTransactions(
      { $or: [{ from: { $in: userIds } }, { to: { $in: userIds } }] },
      page,
      limit,
      fromDate,
      toDate,
      type
    );

    res.status(200).json({
      transactions,
      total,
      page: parseInt(page, 10),
      totalPages,
    });
  } catch (err) {
    next(err);
  }
};
