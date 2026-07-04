const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const { fromAuthHeaderAsBearerToken } = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcrypt");
const User = require("../models/User");
const config = require("../config/config");
const { userCache } = require("../utils/cacheService");

const localStrategy = new LocalStrategy(
  {
    usernameField: "username",
    passwordField: "password",
  },
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        return done(null, false, { message: "Invalid username or password!" });
      }

      // Check if user is active (not deleted)
      if (!user.isActive) {
        return done(null, false, { message: "This account has been deactivated. Please contact support." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: "Invalid username or password!" });
      }
      return done(null, user);
    } catch (error) {
      done(error);
    }
  }
);

const jwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret,
  },
  async (payload, done) => {
    try {
      const cacheKey = `user:${payload.id}`;

      // Try cache first (avoids DB query on every request!)
      let user = userCache.get(cacheKey);

      if (!user) {
        // Cache miss - fetch from database
        user = await User.findById(payload.id).select("-password").lean();
        if (!user) {
          return done(null, false, { message: "Invalid token!" });
        }

        // Store in cache for 1 hour
        userCache.set(cacheKey, user);
      }

      // Check if user is active (not deleted)
      if (!user.isActive) {
        return done(null, false, { message: "This account has been deactivated. Please contact support." });
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  }
);

module.exports = { localStrategy, jwtStrategy };
