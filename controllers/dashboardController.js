const User = require("../models/userModel");
const permissions = require("../utils/permissions");
const {
  getAllDescendants,
} = require("../middlewares/roleValidationMiddleware");

exports.getUserStats = async (req, res, next) => {
  try {
    const userRole = req.user.role.toLowerCase();
    const visibleRoles = permissions[userRole]?.view || [];

    const allRoles = new Set([...visibleRoles, "admin"]);
    const userStats = Array.from(allRoles).reduce((acc, role) => {
      acc[role] = 0;
      return acc;
    }, {});

    let users = [];
    if (userRole === "admin") {
      users = await User.find({});
    } else {
      const descendants = await getAllDescendants(req.user._id);
      users = descendants.filter((descendant) =>
        visibleRoles.includes(descendant.role)
      );
    }

    users.forEach((user) => {
      userStats[user.role] += 1;
    });

    const formattedStats = Object.keys(userStats).map((role) => ({
      role,
      count: userStats[role] !== undefined ? userStats[role] : 0,
    }));

    res.status(200).json({
      message: "User statistics by role",
      data: formattedStats,
    });
  } catch (error) {
    next(error);
  }
};
