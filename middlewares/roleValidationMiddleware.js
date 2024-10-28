const permissions = require("../utils/permissions");
const User = require("../models/userModel");
const mongoose = require("mongoose");

const canCreateRole = (userRole, targetRole) => {
  const createPermissions = permissions[userRole]?.create || [];
  return createPermissions.includes(targetRole);
};

const canViewRole = async (fromUser, toUser) => {
  const viewPermissions = permissions[fromUser.role]?.view || [];
  if (!viewPermissions.includes(toUser.role)) return false;

  const descendants = await getAllDescendants(fromUser._id);
  return descendants.some(
    (descendant) => String(descendant._id) === String(toUser._id)
  );
};

async function getAllDescendants(userId) {
  const descendants = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $graphLookup: {
        from: "users",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentId",
        as: "descendants",
      },
    },
    { $unwind: "$descendants" },
    { $replaceRoot: { newRoot: "$descendants" } },
  ]);
  return descendants;
}

module.exports = {
  canCreateRole,
  canViewRole,
  getAllDescendants,
};
