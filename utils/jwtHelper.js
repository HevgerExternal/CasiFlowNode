const jwt = require("jsonwebtoken");
const moment = require("moment");
const permissions = require("../utils/permissions");

const generateAccessToken = (user) => {
  const userPermissions = {
    create: permissions[user.role]?.create || [],
    view: permissions[user.role]?.view || [],
    updatePassword: permissions[user.role]?.updatePassword || [],
  };

  return jwt.sign(
    { id: user._id, role: user.role, permissions: userPermissions },
    process.env.JWT_SECRET,
    {
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN, 10),
    }
  );
};

const getAccessTokenExpirationDate = () => {
  return moment()
    .add(parseInt(process.env.JWT_EXPIRES_IN, 10), "seconds")
    .toDate();
};

module.exports = {
  generateAccessToken,
  getAccessTokenExpirationDate,
};
