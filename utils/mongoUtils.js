const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const findUserByUsername = async (username) => {
  const user = await User.findOne({ username });
  return user;
};

const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

const generateToken = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    username: user.username,
    fullName: user.fullName || null,
    isVerified: user.isVerified || false,
    profilePicture: user.profilePicture || "profile-1",
    credits: user.credits || 0,
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

module.exports = { findUserByUsername, hashPassword, generateToken };
