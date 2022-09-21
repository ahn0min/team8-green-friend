const mongoose = require("mongoose");

const CommentSchema = require("./schemas/Comment");
const PostSchema = require("./schemas/Post");
const UserSchema = require("./schemas/User");
const TodayArticleSchema = require("./schemas/TodayArticle");
const PlantSchema = require("./schemas/Plant");

exports.Comment = mongoose.model("Comment", CommentSchema);
exports.Post = mongoose.model("Post", PostSchema);
exports.User = mongoose.model("User", UserSchema);
exports.TodayArticle = mongoose.model("TodayArticle", TodayArticleSchema);
exports.Plant = mongoose.model("Plant", PlantSchema);
