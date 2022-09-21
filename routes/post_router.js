const express = require("express");
const router = express.Router();
const { auth, verifyToken, uploadImage } = require("../middlewares/");
const { Post, Comment, User } = require("../models/index");
const changeTimeFormat = require("../util/changeTimeFormat");
const timeFormatForComment = require("../util/timeFormatForComment");

router.get("/", verifyToken, async function (req, res) {
  try {
    const postId = req.query.postId;
    const post = await Post.findOne({ _id: postId }).populate(
      "author",
      "name profileImg _id",
    );
    const processedData = {
      id: post.id,
      author: post.author,
      title: post.title,
      contents: post.contents,
      likes: post.likes.length,
      liked: false,
      createdAt: changeTimeFormat(post.createdAt),
    };

    if (req.user && post.likes.includes(req.user.id)) {
      processedData.liked = true;
    }

    return res.status(200).json({ isOk: true, post: processedData });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ isOk: false, message: "게시글을 불러오기 실패" });
  }
});

// 페이지네이션 && 검색
router.get("/page", verifyToken, async function (req, res) {
  try {
    const postsCount = 12;
    const page = req.query.page || 1;
    const keyword = req.query.keyword || "";
    const userId = req.query.userId;
    const [total, posts] = await Promise.all([
      Post.countDocuments({ title: { $regex: keyword } }),
      Post.find({ title: { $regex: keyword } })
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

router.get("/popularity", verifyToken, async function (req, res) {
  try {
    const current = Date.now();
    const monthToSecond = 30 * 24 * 3600000;
    const posts = await Post.find({
      createdAt: {
        $lte: new Date(current),
        $gt: new Date(current - monthToSecond),
      },
    })
      .sort({ likes: -1 })
      .populate("author", "name profileImg _id");

    posts.sort((a, b) => {
      return b.likes.length - a.likes.length;
    });
    posts.splice(3);
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

    return res.status(200).json({ isOk: true, posts: newPosts });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ isOk: false, message: "게시글 불러오기 실패" });
  }
});

// Create
router.post("/", auth, uploadImage, async function (req, res) {
  try {
    const id = req.user.id;
    const { title, contents, img } = req.body;
    const pictures = req.files;
    if (!title || !contents || !pictures) {
      throw new Error("wrong format");
    }
    const contentList = contents.map((content, idx) => {
      if (!img[idx]) {
        return {
          content,
          imgUrl: pictures[idx].path.replace("public", "/api"),
        };
      }
    });

    const postData = { author: id, title, contents: contentList };
    const post = new Post(postData);
    const newPost = await post.save();
    res.status(201).json({
      isOk: true,
      message: "Post 생성 완료",
      postId: newPost._id,
    });
  } catch (err) {
    const message = err.message;
    console.log(err);

    if (message === "wrong format") {
      return res
        .status(400)
        .json({ isOk: false, message: "잘못된 포스팅 양식" });
    }

    return res.status(500).json({ isOk: false, message: "Post 생성 실패" });
  }
});

// Update
router.put("/:postId", auth, uploadImage, async function (req, res) {
  try {
    const id = req.user.id;
    const { postId } = req.params;
    const { title, contents, img } = req.body;
    const pictures = req.files;
    if (!title || !contents || !pictures) {
      throw new Error("wrong format");
    }
    const contentList = contents.map((content, idx) => {
      if (!img[idx]) {
        return {
          content,
          imgUrl: pictures[idx].path.replace("public", "/api"),
        };
      }
      return {
        content,
        imgUrl: img[idx],
      };
    });

    const post = await Post.findOne({ _id: postId }).populate("author");

    if (!post) {
      throw new Error("no exist");
    }
    if (post.author.id !== id) {
      throw new Error("unauthorized");
    }

    await post.updateOne({
      $set: {
        title,
        contents: contentList,
      },
    });

    return res.status(201).json({ isOk: true, message: "수정 완료" });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "no exist") {
      return res
        .status(400)
        .json({ isOk: false, message: "존재하지 않는 포스터" });
    }

    if (message === "wrong format") {
      return res
        .status(400)
        .json({ isOk: false, message: "잘못된 포스팅 양식" });
    }

    if (message === "unauthorized") {
      return res.status(401).json({ isOk: false, message: "권한 없음" });
    }

    return res.status(500).json({ isOk: false, message: "수정 실패", err });
  }
});

// Delete
router.delete("/:postId", auth, async function (req, res) {
  const post = await Post.findOne({ _id: req.params.postId });
  try {
    await Post.deleteOne({ _id: req.params.postId });
    return res.status(204).json({ isOk: true, message: "post 삭제 완료" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ isOk: false, message: "post 삭제 실패", err });
  }
});

//likes
router.put("/:postId/like", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { id } = req.user;
    const post = await Post.findOne({ _id: postId });

    if (!post) {
      throw new Error("no exist");
    }
    let count = post.likes.length;
    if (post.likes.includes(id)) {
      await post.updateOne({ $pull: { likes: id } });
      count -= 1;
    } else {
      await post.updateOne({ $push: { likes: id } });
      count += 1;
    }

    return res
      .status(200)
      .json({ isOk: true, likes: count, message: "요청 성공" });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "no exist") {
      return res
        .status(400)
        .json({ isOk: false, message: "존재하지 않는 포스트" });
    }
    return res.status(500).json({ isOk: false });
  }
});

// comment-router
// 댓글 조회
router.get("/:postId/comment", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId });
    const comments = await User.populate(post.comments, {
      path: "author",
      select: "name profileImg _id",
    });

    if (!comments) {
      throw new Error("no content");
    }

    const translatedComment = comments.map(comment => {
      const timeFormat = timeFormatForComment(comment.createdAt);
      return {
        author: comment.author,
        content: comment.content,
        id: comment.id,
        createdAt: timeFormat,
      };
    });

    return res.status(200).json({ isok: true, comments: translatedComment });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "no content") {
      return res.status(204).json({ isOk: true, message: "댓글이 없습니다." });
    }

    return res.status(400).json({ isOk: false, message: "댓글조회 실패" });
  }
});

// 댓글작성
router.post("/:postId/comment", auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ postId });
    if (!post) throw new Error("no exist");

    const { content } = req.body;
    const author = req.user.id;
    const createdAt = new Date();

    const comment = await new Comment({ author, content, createdAt });
    comment.save();
    await Post.findOneAndUpdate(
      { _id: postId },
      { $push: { comments: comment } },
    );

    return res.status(201).json({ isOk: true, message: "댓글작성 완료" });
  } catch (err) {
    console.log(err);
    const message = err.message;

    if (message === "no exist") {
      return res
        .status(400)
        .json({ isOk: false, message: "존재하지 않는 포스트입니다." });
    }

    return res.status(500).json({ isOk: false, message: "댓글작성 실패" });
  }
});

// 댓글삭제
router.delete("/:postId/comment/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    await Post.findOneAndUpdate(
      { _id: postId },
      {
        // $pull: 조건에 만족하는 특정한 요소를 꺼낸다.(즉 제거)
        $pull: {
          comments: { _id: commentId },
        },
      },
    );

    return res
      .status(204)
      .json({ isOk: true, message: "댓글이 삭제되었습니다." });
  } catch (err) {
    return res.status(400).json({ isOk: false, message: "댓글 삭제 실패" });
  }
});

module.exports = router;
