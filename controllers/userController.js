const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const {
  canCreateRole,
  canViewRole,
  getAllDescendants,
} = require("../middlewares/roleValidationMiddleware");
const permissions = require("../utils/permissions");

exports.createUser = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    const parentRole = req.user.role.toLowerCase();
    const normalizedRole = role.toLowerCase();

    if (!canCreateRole(parentRole, normalizedRole)) {
      return res.status(403).json({
        message: `You do not have permission to create a ${normalizedRole}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Validation Error",
        errors: {
          password: {
            message: "Password must be at least 6 characters long",
          },
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role: normalizedRole,
      parentId: req.user._id,
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", newUser });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Username already exists",
        errors: { username: "This username is already taken" },
      });
    }
    next(err);
  }
};

exports.getUsersByRole = async (req, res, next) => {
  try {
    const role = req.params.role.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const descendants = await getAllDescendants(req.user._id);
    const filteredUsers = descendants
      .filter((descendant) => descendant.role === role)
      .map(async (user) => {
        const parent = user.parentId
          ? await User.findById(user.parentId).select("username _id")
          : null;
        const subnetBalance = await calculateSubnetBalance(user._id);
        return {
          id: user._id,
          username: user.username,
          role: user.role,
          parent: parent ? { id: parent._id, name: parent.username } : null,
          balance: user.balance,
          subnet: role !== "player" && role !== "admin" ? subnetBalance : null,
          lastAccess: user.lastAccess || "No record",
        };
      });

    const paginatedUsers = (await Promise.all(filteredUsers)).slice(
      skip,
      skip + limit
    );
    res.json({
      total: filteredUsers.length,
      page,
      totalPages: Math.ceil(filteredUsers.length / limit),
      users: paginatedUsers,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const parent = user.parentId
      ? await User.findById(user.parentId).select("username _id")
      : null;
    const subnetBalance = await calculateSubnetBalance(user._id);

    const userData = {
      username: user.username,
      role: user.role,
      parent: parent ? { id: parent._id, name: parent.username } : null,
      balance: user.balance,
      subnet:
        user.role !== "player" && user.role !== "admin" ? subnetBalance : null,
      lastAccess: user.lastAccess || "No record",
    };

    res.json(userData);
  } catch (err) {
    next(err);
  }
};

async function calculateSubnetBalance(userId) {
  const descendants = await getAllDescendants(userId);
  return descendants.reduce((acc, descendant) => acc + descendant.balance, 0);
}

exports.searchUsersByRole = async (req, res, next) => {
  try {
    const role = req.query.role ? req.query.role.toLowerCase() : null;
    const username = req.query.username
      ? req.query.username.toLowerCase()
      : null;
    const userRole = req.user.role.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!role) {
      return res.status(400).json({ message: "Role parameter is required" });
    }

    if (!canViewRole(userRole, role)) {
      return res.status(403).json({
        message: `You do not have permission to view users with role ${role}`,
      });
    }

    const descendants = await getAllDescendants(req.user._id);

    const filteredUsers = descendants.filter((descendant) => {
      const matchesRole = descendant.role === role;
      const matchesUsername = username
        ? descendant.username.includes(username)
        : true;
      return matchesRole && matchesUsername;
    });

    const paginatedUsers = filteredUsers.slice(skip, skip + limit);
    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      total: totalUsers,
      page,
      totalPages,
      users: paginatedUsers,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;
    const currentUser = req.user;

    if (!userId || !newPassword) {
      return res
        .status(400)
        .json({ message: "User ID and new password are required" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    const allowedRolesToUpdate =
      permissions[currentUser.role]?.updatePassword || [];
    if (!allowedRolesToUpdate.includes(targetUser.role)) {
      return res.status(403).json({
        message: `You do not have permission to update the password for ${targetUser.role}`,
      });
    }

    if (currentUser.role !== "admin") {
      const descendants = await getAllDescendants(currentUser._id);
      const isDescendant = descendants.some(
        (descendant) => String(descendant._id) === String(targetUser._id)
      );
      if (!isDescendant) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this user's password" });
      }
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Validation Error",
        errors: {
          newPassword: {
            message: "Password must be at least 6 characters long",
          },
        },
      });
    }

    targetUser.password = await bcrypt.hash(newPassword, 10);
    await targetUser.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};
