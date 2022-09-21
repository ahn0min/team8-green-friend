const jwt = require("jsonwebtoken");
const { accessKey } = require("../config");

module.exports = (req, res, next) => {
  const access_token = req.headers.authorization;
  if (access_token) {
    const decoded = jwt.verify(access_token, accessKey);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
    };
  }
  return next();
};
