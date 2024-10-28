const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      minlength: [4, "Username must be at least 4 characters long"],
      set: (v) => v.toLowerCase(),
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: [
        "admin",
        "manager",
        "citymanager",
        "superagent",
        "agent",
        "player",
      ],
      default: "player",
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    balance: { type: Number, default: 0 },
    lastAccess: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
