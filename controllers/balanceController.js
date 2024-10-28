const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const { canCreateRole } = require('../middlewares/roleValidationMiddleware');

async function canTransact(fromUser, toUser) {
  const allowedRole = canCreateRole(fromUser.role.toLowerCase(), toUser.role.toLowerCase());
  return allowedRole && String(toUser.parentId) === String(fromUser._id);
}

exports.deposit = async (req, res, next) => {
  try {
    const { toUserId, amount, note } = req.body;
    const fromUser = req.user;
    const toUser = await User.findById(toUserId);

    if (!toUser || !(await canTransact(fromUser, toUser))) {
      return res.status(403).json({ message: 'You do not have permission to deposit to this user.' });
    }

    toUser.balance += amount;
    await toUser.save();

    const transaction = new Transaction({
      from: fromUser._id,
      to: toUser._id,
      amount,
      type: 'deposit',
      note,
    });
    await transaction.save();

    res.status(200).json({ message: 'Deposit successful', transaction });
  } catch (err) {
    next(err);
  }
};

exports.withdraw = async (req, res, next) => {
  try {
    const { toUserId, amount, note } = req.body;
    const fromUser = req.user;
    const toUser = await User.findById(toUserId);

    if (!toUser || !(await canTransact(fromUser, toUser))) {
      return res.status(403).json({ message: 'You do not have permission to withdraw from this user.' });
    }

    if (toUser.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance for withdrawal.' });
    }

    toUser.balance -= amount;
    await toUser.save();

    const transaction = new Transaction({
      from: fromUser._id,
      to: toUser._id,
      amount,
      type: 'withdrawal',
      note,
    });
    await transaction.save();

    res.status(200).json({ message: 'Withdrawal successful', transaction });
  } catch (err) {
    next(err);
  }
};

async function getFilteredTransactions(query, page, limit, fromDate, toDate) {
    const skip = (page - 1) * limit;
  
    if (fromDate) query.timestamp = { ...query.timestamp, $gte: new Date(fromDate) };
    if (toDate) query.timestamp = { ...query.timestamp, $lte: new Date(toDate) };
  
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  
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
      const userRole = req.user.role.toLowerCase();
  
      if (!targetUser || !(await canViewRole(req.user, targetUser))) {
        return res.status(403).json({ message: 'You do not have permission to view this user’s transaction history.' });
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
  
      if (!targetUser || !(await canViewRole(req.user, targetUser))) {
        return res.status(403).json({ message: 'You do not have permission to view this user’s deposit history.' });
      }
  
      const result = await getFilteredTransactions(
        { to: targetUser._id, type: 'deposit' },
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
  
  exports.getWithdrawals = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, fromDate, toDate } = req.query;
  
      const targetUser = await User.findById(userId);
  
      if (!targetUser || !(await canViewRole(req.user, targetUser))) {
        return res.status(403).json({ message: 'You do not have permission to view this user’s withdrawal history.' });
      }
  
      const result = await getFilteredTransactions(
        { from: targetUser._id, type: 'withdrawal' },
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
  