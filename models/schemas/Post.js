const { Schema } = require("mongoose");
const CommentSchema = require("./Comment");

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    title: {
      type: String,
      require: true,
    },
    contents: {
      type: Array,
      default: [],
    },
    likes: {
      type: Array,
      default: [],
    },
    comments: [CommentSchema],
  },
  { timestamps: true },
);

module.exports = postSchema;
