const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, Post } = require("../models");
const auth = require("../middlewares/auth");
const uploadProfileImage = require("../middlewares/uploadProfile");
const {
  accessTokenExpireTime,
  refreshTokenExpireTime,
  accessKey,
  refreshKey,
} = require("../config");

//유저 정보 조회
router.get("/auth", auth, (req, res) => {
  res.status(200).json({
    isOk: true,
    isAuthorize: true,
    email: req.user.email,
    id: req.user.id,
    name: req.user.name,
    profileImg: req.user.profileImg,
  });
});

// 회원가입
router.post("/register", uploadProfileImage, async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const picture = req.file;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userData = {
      email,
      name,
      password: hashedPassword,
    };
    if (picture) userData.profileImg = picture.path.replace("public", "/api");

    const user = new User(userData);
    await user.save();
    return res
      .status(200)
      .json({ isOk: true, isAuthorize: false, message: "회원가입 성공" });
  } catch (err) {
    if (err.code === 11000) {
      const keyPattern = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        isOk: false,
        isAuthorize: false,
        message: "중복",
        error: { code: err.code, keyPattern },
      });
    }
    return res.status(500).json({
      isOk: false,
      message: "회원가입 실패",
    });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("no exist");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("wrong password");
    }
    const accessTokenExpires = Date.now() + accessTokenExpireTime * 3600000;
    const access_token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        exp: accessTokenExpires,
      },
      accessKey,
    );

    const refreshTokenExpires = Date.now() + refreshTokenExpireTime * 3600000;
    const refresh_token = jwt.sign(
      { id: user.id, exp: refreshTokenExpires },
      refreshKey,
    );
    await user.updateOne({ token: refresh_token });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      expires: new Date(refreshTokenExpires),
    });

    res.status(200).json({
      isOk: true,
      access_token,
      exp: accessTokenExpires,
      message: "로그인 성공",
    });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "no exist") {
      return res.status(400).json({
        isOk: false,
        message: "존재하지 않는 유저입니다.",
      });
    }

    if (message === "wrong password") {
      return res.status(400).json({
        isOk: false,
        message: "잘못된 비밀번호입니다.",
      });
    }

    return res.status(500).json({
      isOk: false,
      message: "로그인 실패",
    });
  }
});

// 로그아웃
router.get("/logout", auth, async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findOne({ _id: id });
    await user.updateOne({ token: "" });
    res.clearCookie("refresh_token");
    return res.status(200).json({
      isOk: true,
      message: "로그아웃 성공",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      isOk: false,
      message: "로그아웃 실패",
    });
  }
});

//silent refresh
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.cookies;

  try {
    if (refresh_token) {
      const { id } = jwt.verify(refresh_token, refreshKey);
      const user = await User.findOne({ _id: id });

      if (user.token !== refresh_token) throw new Error("wrong access");

      const accessTokenExpires = Date.now() + accessTokenExpireTime * 3600000;
      const access_token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          exp: accessTokenExpires,
        },
        accessKey,
      );

      res.status(200).json({
        isOk: true,
        access_token,
        exp: accessTokenExpires,
        message: "access token 재발급",
      });
    }
    throw new Error("wrong access");
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "jwt expired") {
      return res.status(401).json({
        isOk: false,
        isAuthorize: false,
        message: "access token 재발급 실패",
      });
    }

    if (message === "wrong access") {
      return res.status(401).json({
        isOk: false,
        isAuthorize: false,
        message: "잘못된 접근입니다.",
      });
    }

    return res.status(500).json({ isOk: false, message: "실패" });
  }
});

router.get("/post", auth, async function (req, res) {
  try {
    const postsCount = 12;
    const page = req.query.page || 1;
    const userId = req.user.id;
    const [total, posts] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Post.find({ author: userId })
        .sort({ createdAt: -1 })
        .skip(postsCount * (page - 1))
        .limit(postsCount)
        .populate("author", "name profileImg _id"),
    ]);

    if (!posts) {
      throw new Error("no content");
    }
    const newPosts = posts.map(post => {
      const userInformation = {
        id: post.id,
        author: post.author,
        title: post.title,
        imgUrl: post.contents[0].imgUrl,
        likes: post.likes.length,
        liked: false,
        createdAt: changeTimeFormat(post.createdAt),
      };

      if (req.user && post.likes.includes(req.user.id)) {
        userInformation.liked = true;
      }
      return userInformation;
    });
    return res.status(200).json({ isOk: true, total, posts: newPosts });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "no content") {
      return res.status(204).json({
        isOk: true,
        error: "글이 존재하지 않습니다.",
      });
    }

    return res.status(500).json({ isOk: false, message: "불러오기 실패" });
  }
});

router.get("/post/like", auth, async function (req, res) {
  try {
    const postsCount = 12;
    const page = req.query.page || 1;
    const userId = req.user.id;
    const [total, posts] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Post.find({ likes: { $in: userId } })
        .sort({ createdAt: -1 })
        .skip(postsCount * (page - 1))
        .limit(postsCount)
        .populate("author", "name profileImg _id"),
    ]);

    if (!posts) {
      throw new Error("no content");
    }
    const newPosts = posts.map(post => {
      const userInformation = {
        id: post.id,
        author: post.author,
        title: post.title,
        imgUrl: post.contents[0].imgUrl,
        likes: post.likes.length,
        liked: false,
        createdAt: changeTimeFormat(post.createdAt),
      };

      if (req.user && post.likes.includes(req.user.id)) {
        userInformation.liked = true;
      }
      return userInformation;
    });
    return res.status(200).json({ isOk: true, total, posts: newPosts });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "no content") {
      return res.status(204).json({
        isOk: true,
        error: "글이 존재하지 않습니다.",
      });
    }

    return res.status(500).json({ isOk: false, message: "불러오기 실패" });
  }
});

module.exports = router;
