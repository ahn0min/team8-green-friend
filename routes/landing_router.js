const express = require("express");
const router = express.Router();
const { User, TodayArticle } = require("../models");
const auth = require("../middlewares/auth");

router.get("/", (req, res) => {
  res.send("indexRouter.js");
});

router.post("/todays/article", auth, async (req, res) => {
  try {
    const id = req.user.id;
    const { postId, imgUrl, content } = req.body;
    const user = await User.findOne({ _id: id });
    if (!user.admin) {
      throw new Error("Admin Error");
    }

    const article = { postId, imgUrl, content };
    const todayArticle = new TodayArticle(article);
    todayArticle.save();
    res.status(201).json({ isOk: true, message: "성공" });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "Admin Error") {
      return res.status(401).json({ isOk: false });
    }

    return res.status(500).json({ isOk: false });
  }
});

router.get("/todays/article", async (req, res) => {
  try {
    const article = await TodayArticle.find({})
      .sort({ createdAt: -1 })
      .limit(1);

    const { postId, imgUrl, content } = article[0];
    res.status(200).json({
      isOk: true,
      postId,
      imgUrl,
      content,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ isOk: false });
  }
});

module.exports = router;
