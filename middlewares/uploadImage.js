const multer = require("multer");
const path = require("path");

const allowedTypeList = [
  "image/gif",
  "image/jpeg",
  "image/heic",
  "image/png",
  "multipart/form-data",
];
const fileSize = 2 ** 20 * 20;
const maxCount = 5;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/uploads/");
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
  fileFilter: (req, file, cb) => {
    if (allowedTypeList.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("지원하지 않는 확장자"));
  },
});

const uploadImage = (req, res, next) => {
  upload.array("userfiles", maxCount)(req, res, err => {
    if (err) {
      console.log(err);
      return res.json({
        isOk: false,
        message: "이미지 업로드 실패",
        err: "extension",
      });
    }
    return next();
  });
};

module.exports = uploadImage;
