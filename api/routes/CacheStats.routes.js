const express = require("express");
const router = express.Router();
const { getCacheStats } = require("../controllers/CacheStats.controller");
const passport = require("passport");
const checkAdmin = require("../../middleware/CheckAdmin");

// Only admins can view cache stats
router.get(
  "/stats",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  getCacheStats
);

module.exports = router;
