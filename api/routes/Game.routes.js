const express = require("express");
const gameRouter = express.Router();
const {
  createGame,
  getGameById,
  getUserGames,
} = require("../controllers/Game.controller");
const passport = require("passport");
const { body, param } = require("express-validator");

// Create Game
gameRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  [
    body("gameName")
      .notEmpty()
      .withMessage("Game name is required")
      .isLength({ min: 1, max: 100 })
      .withMessage("Game name must be between 1 and 100 characters"),
    body("team1Name")
      .notEmpty()
      .withMessage("Team 1 name is required")
      .isLength({ min: 1, max: 50 })
      .withMessage("Team 1 name must be between 1 and 50 characters"),
    body("team2Name")
      .notEmpty()
      .withMessage("Team 2 name is required")
      .isLength({ min: 1, max: 50 })
      .withMessage("Team 2 name must be between 1 and 50 characters"),
    body("categoryIds")
      .isArray({ min: 6, max: 6 })
      .withMessage("Exactly 6 categories must be provided")
      .custom((value) => {
        if (!value.every((id) => /^[0-9a-fA-F]{24}$/.test(id))) {
          throw new Error("All category IDs must be valid MongoDB ObjectIds");
        }
        return true;
      }),
  ],
  createGame
);

// Get Game By Id
gameRouter.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid Game ID")],
  passport.authenticate("jwt", { session: false }),
  getGameById
);

// Get User's Games
gameRouter.get(
  "/user/games",
  passport.authenticate("jwt", { session: false }),
  getUserGames
);

module.exports = gameRouter;
