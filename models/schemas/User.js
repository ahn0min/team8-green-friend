const { Schema } = require("mongoose");

const userSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      max: 12,
      min: 4,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    introduce: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImg: {
      type: String,
      default: "/api/images/userProfile/default.png",
    },
    level: {
      type: Number,
      required: true,
      default: 1,
    },
    token: {
      type: String,
      default: "",
    },
    admin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = userSchema;
