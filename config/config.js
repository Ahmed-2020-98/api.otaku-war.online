const dotenv = require("dotenv");

const env = process.env.NODE_ENV || "development";
if (env === "development") {
  // Only load .env file in development
  console.log("Loading .env.dev file for local development");
  dotenv.config({ path: ".env.dev", override: true });
} else if (env === "test") {
  console.log("Loading .env.test file for test environment");
  dotenv.config({ path: ".env.test", override: true });
} else {
  dotenv.config({ path: ".env" });
  console.log("Using environment variables from platform");
}

const config = {
  env,
  port: process.env.PORT || 5050,
  mongoURI: process.env.MONGO_URI || process.env.MONGODB_URI,
  // Fallback so the server can boot even if JWT_SECRET isn't set yet
  // (passport-jwt throws at load without a secret). This generates an
  // ephemeral random secret at startup — set JWT_SECRET in the environment
  // for a stable secret (tokens otherwise invalidate on each restart).
  jwtSecret:
    process.env.JWT_SECRET || require("crypto").randomBytes(48).toString("hex"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  spaceEndpoint: process.env.SPACE_ENDPOINT,
  spaceAccessKey: process.env.SPACE_ACCESS_KEY,
  spaceSecretKey: process.env.SPACE_SECRET_KEY,
  spaceName: process.env.SPACE_NAME,
};

module.exports = config;
