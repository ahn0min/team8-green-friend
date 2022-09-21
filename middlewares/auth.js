const { User } = require("../models");
const jwt = require("jsonwebtoken");
const { accessKey } = require("../config");

module.exports = async (req, res, next) => {
  const { refresh_token } = req.cookies;
  const access_token = req.headers.authorization;
  try {
    if (access_token) {
      const decoded = jwt.verify(access_token, accessKey);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };

      const user = await User.findOne({ _id: req.user.id });
      req.user.profileImg = user.profileImg;
      if (!refresh_token || refresh_token !== user.token) {
        throw new Error("unauthorize");
      }
      return next();
    }
    throw new Error("wrong access");
  } catch (err) {
    const message = err.message;

    if (message === "jwt expired") {
      res.clearCookie("refresh_token");
      return res.status(401).json({
        isOk: false,
        isAuthorize: false,
        message: "인증이 만료되었습니다.",
      });
    }

    if (message === "unauthorize") {
      return res.status(401).json({
        isOk: false,
        isAuthorize: false,
        message: "인증이 만료되었습니다.",
      });
    }

    return res.status(500).json({ isOk: true });
  }
};
