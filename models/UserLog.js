const mongoose = require("mongoose");

const userLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: { type: String, required: true },
  action: { type: String, enum: ["logout"], required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserLog", userLogSchema);
