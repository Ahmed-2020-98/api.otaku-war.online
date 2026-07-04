const express = require("express");
const userRouter = express.Router();
const {
  registerUser,
  findUserById,
  loginUser,
  getAllAdmins,
  getAllUsers,
  getAllGamers,
  updatePassword,
  getMe,
  verifyEmail,
  resendVerificationOTP,
  forgotPassword,
  validatePasswordResetOTP,
  resetPassword,
  updateProfile,
  getAvailableProfilePictures,
  addCredits,
  deleteUser,
  restoreUser,
  getDeletedUsers,
  assignCategory,
  unassignCategory,
} = require("../controllers/User.controller");
const passport = require("passport");
const { body, param, validationResult } = require("express-validator");
const checkAdmin = require("../../middleware/CheckAdmin");

userRouter.post(
  "/register",
  [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .escape()
      .trim()
      .toLowerCase()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .escape()
      .trim(),
    body("role").notEmpty().withMessage("Role is required").escape().trim(),
  ],
  registerUser
);
userRouter.post(
  "/login",
  [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .escape()
      .trim()
      .toLowerCase()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .escape()
      .trim(),
  ],
  (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res
        .status(400)
        .json({ message: result.errors.map((error) => error.msg)[0] });
    }
    next();
  },
  passport.authenticate("local", { session: false }),
  loginUser
);
userRouter.get("/admins", getAllAdmins);
userRouter.get("/users", getAllUsers);
userRouter.get("/gamers", getAllGamers);
userRouter.put(
  "/updatepassword/:id",
  [
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  updatePassword
);
userRouter.put(
  "/addcredits/:id",
  [
    body("credits")
      .notEmpty()
      .withMessage("Credits is required")
      .isNumeric()
      .withMessage("Credits must be a number")
      .isInt({ min: 1 })
      .withMessage("Credits must be a positive integer"),
  ],
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  addCredits
);
userRouter.get("/me", passport.authenticate("jwt", { session: false }), getMe);

userRouter.put(
  "/profile",
  [
    body("username")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail()
      .trim(),
    body("fullName")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("Full name must be between 2 and 50 characters")
      .trim()
      .escape(),
    body("country")
      .optional()
      .isIn(["KW", "KSA", "UAE", "OM", "QA", "BH"])
      .withMessage("Country must be one of: KW, KSA, UAE, OM, QA, BH"),
    body("profilePicture")
      .optional()
      .isIn([
        "profile-1",
        "profile-2",
        "profile-3",
        "profile-4",
        "profile-5",
        "profile-6",
        "profile-7",
        "profile-8",
        "profile-9",
        "profile-10",
        "profile-11",
        "profile-12",
        "profile-13",
        "profile-14",
        "profile-15",
        "profile-16",
        "profile-17",
        "profile-18",
      ])
      .withMessage(
        "Profile picture must be one of the available profile pictures"
      ),
  ],
  passport.authenticate("jwt", { session: false }),
  updateProfile
);

userRouter.get("/profile-pictures", getAvailableProfilePictures);

userRouter.post("/verify-email", verifyEmail);
userRouter.post("/resend-verification-otp", resendVerificationOTP);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post(
  "/validate-password-reset-otp",
  [
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be exactly 6 digits")
      .isNumeric()
      .withMessage("OTP must contain only numbers"),
  ],
  validatePasswordResetOTP
);
userRouter.post(
  "/reset-password",
  [
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .trim(),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be exactly 6 digits")
      .isNumeric()
      .withMessage("OTP must contain only numbers"),
  ],
  resetPassword
);

// Delete user route (soft delete)
userRouter.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  deleteUser
);

// Restore user route
userRouter.put(
  "/restore/:id",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  restoreUser
);

// Get deleted users route
userRouter.get(
  "/deleted/all",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  getDeletedUsers
);

// Assign category to user
userRouter.post(
  "/assign-category",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  assignCategory
);

// Unassign category from user
userRouter.post(
  "/unassign-category",
  passport.authenticate("jwt", { session: false }),
  checkAdmin,
  unassignCategory
);

module.exports = userRouter;
