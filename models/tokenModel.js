const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accessToken: { type: String, required: true },
  accessTokenExpiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("Token", tokenSchema);
