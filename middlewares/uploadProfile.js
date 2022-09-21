const multer = require("multer");
const path = require("path");

const allowedTypeList = ["image/jpeg", "image/heic", "image/png"];
const fileSize = 2 ** 20 * 20;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/userProfile/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize,
  },
  filefilter: (req, file, cb) => {
    if (allowedTypeList.includes(file.mymetype)) {
      return cb(null, true);
    }
    cb("지원하지 않는 확장자");
  },
});

const uploadProfileImage = (req, res, next) => {
  upload.single("profileImage")(req, res, err => {
    if (err) {
      console.log(err);
      return res.json({ isOk: false, message: "프로필 이미지 업로드 실패" });
    }
    return next();
  });
};

module.exports = uploadProfileImage;
