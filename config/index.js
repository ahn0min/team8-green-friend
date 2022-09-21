const dotenv = require("dotenv");
dotenv.config();
const mongoURL = process.env.MONGODB_URL;

const accessTokenExpireTime = Number(process.env.access_token_expire_time);

const refreshTokenExpireTime = Number(process.env.refresh_token_expire_time);

const accessKey = process.env.access_key;
const refreshKey = process.env.refresh_key;

module.exports = {
  accessTokenExpireTime,
  refreshTokenExpireTime,
  accessKey,
  refreshKey,
  mongoURL,
};
