const Token = require("../models/tokenModel");
const jwt = require("jsonwebtoken");

const validateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenRecord = await Token.findOne({
      userId: decoded.userId,
      accessToken: token,
    });
    if (!tokenRecord || tokenRecord.accessTokenExpiresAt < new Date()) {
      return res
        .status(401)
        .json({ message: "Token has been invalidated or expired" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = validateToken;
