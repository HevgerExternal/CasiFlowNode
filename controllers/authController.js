const User = require("../models/userModel");
const Token = require("../models/tokenModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const validate = require("../utils/validator");
const { loginSchema, signupSchema } = require("../validations/authValidation");
const {
  generateAccessToken,
  getAccessTokenExpirationDate,
} = require("../utils/jwtHelper");

exports.login = async (req, res, next) => {
  try {
    const { username, password } = validate(loginSchema, req.body);

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastAccess = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);

    await Token.create({
      userId: user._id,
      accessToken,
      accessTokenExpiresAt: getAccessTokenExpirationDate(),
    });

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (!accessToken) {
      return res
        .status(401)
        .json({ message: "Access token is required for logout" });
    }

    try {
      jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const deletedToken = await Token.findOneAndDelete({ accessToken });

    if (!deletedToken) {
      return res
        .status(404)
        .json({ message: "Token not found or already invalidated" });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.signup = async (req, res, next) => {
  try {
    const isSignupEnabled = process.env.SIGNUP_ENABLED === "true";

    if (!isSignupEnabled) {
      return res.status(403).json({ message: "Signup is currently disabled" });
    }

    const { username, password } = validate(signupSchema, req.body);
    const normalizedUsername = username.toLowerCase();

    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: normalizedUsername,
      password: hashedPassword,
      role: "player",
    });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.validateToken = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tokenInDb = await Token.findOne({ accessToken: token });

    if (!tokenInDb) {
      return res.status(401).json({ message: "Token not found in database" });
    }

    res.status(200).json({ message: "Token is valid", user: decoded });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
