const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET_KEY, JWT_REFRESH_SECRET_KEY } = process.env;

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_ACCESS_SECRET_KEY,
    { expiresIn: "5m" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_REFRESH_SECRET_KEY,
    { expiresIn: "1d" },
  );
};

module.exports = { generateAccessToken, generateRefreshToken };