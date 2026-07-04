const { validationResult, matchedData } = require("express-validator");
const User = require("../../models/User");
const {
  findUserByUsername,
  hashPassword,
  generateToken,
} = require("../../utils/mongoUtils");
const { sendEmailAsync } = require("../../utils/emailUtils");
const { generateOTPWithExpiry } = require("../../utils/otpUtils");
const {
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  RESET_PASSWORD_EMAIL_TEMPLATE,
} = require("../../utils/emailTemplates");
const { handleValidationErrors } = require("../../utils/validationUtils");
const { invalidate } = require("../../utils/cacheService");
const { categoryCache } = require("../../utils/cacheService");

// Constants
const EMAIL_SUBJECTS = {
  VERIFICATION: "تأكيد البريد الإلكتروني - حرب الأوتاكو",
  WELCOME: "مرحبا بك في حرب الأوتاكو",
  RESET_PASSWORD: "طلب إعادة تعيين كلمة المرور - حرب الأوتاكو",
  NEW_EMAIL_VERIFICATION: "تأكيد البريد الإلكتروني الجديد - حرب الأوتاكو",
};

const ERROR_MESSAGES = {
  INVALID_OTP: "Invalid or expired OTP",
  USER_NOT_FOUND: "User not found",
  USER_EXISTS: "User already exists",
  EMAIL_EXISTS: "Email already exists",
  VALIDATION_ERROR: "Validation error",
};

// Helper functions
const findUserByValidOTP = async (otp) => {
  return await User.findOne({ otp, otpExpiry: { $gt: Date.now() } });
};

const sendEmailSafely = async (email, subject, template, userId = null) => {
  try {
    await sendEmailAsync(email, subject, template, userId);
    console.log(`Email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`Email sending failed for ${email}:`, error.message);
    // Don't throw error - email failure shouldn't break the main flow
  }
};

//Register User
const registerUser = async (req, res, next) => {
  try {
    // Validate request body
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { username, password, role } = matchedData(req);

    // Find user by username
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: ERROR_MESSAGES.USER_EXISTS });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Extra info
    const { fullName, country } = req.body;

    // Generate OTP
    const { otp, otpExpiry } = generateOTPWithExpiry();

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      fullName,
      country,
      otp,
      otpExpiry,
    });

    // Send verification email for gamers (non-blocking)
    if (role === "gamer") {
      const emailTemplate = VERIFICATION_EMAIL_TEMPLATE(otp);
      await sendEmailSafely(
        username,
        EMAIL_SUBJECTS.VERIFICATION,
        emailTemplate,
        user._id
      );
    }

    // Generate token
    const token = generateToken(user);
    return res
      .status(201)
      .json({ message: "User registered successfully", user, token });
  } catch (error) {
    console.error("Registration error:", error);
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { otp, password = false } = req.body;
    const user = await findUserByValidOTP(otp);

    if (!user) {
      return res.status(400).json({ message: ERROR_MESSAGES.INVALID_OTP });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send welcome email if not a password reset flow
    if (!password) {
      const emailTemplate = WELCOME_EMAIL_TEMPLATE(user.fullName);
      await sendEmailSafely(
        user.username,
        EMAIL_SUBJECTS.WELCOME,
        emailTemplate,
        user._id
      );
    }

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    next(error);
  }
};

const resendVerificationOTP = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // if (user.isVerified) {
    //   return res.status(400).json({ message: "Email already verified" });
    // }

    const { otp, otpExpiry } = generateOTPWithExpiry();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send verification email
    const emailTemplate = VERIFICATION_EMAIL_TEMPLATE(otp);
    await sendEmailSafely(
      user.username,
      EMAIL_SUBJECTS.VERIFICATION,
      emailTemplate,
      user._id
    );

    return res
      .status(200)
      .json({ message: "Verification OTP resent successfully" });
  } catch (error) {
    console.error("Resend verification OTP error:", error);
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    const { otp, otpExpiry } = generateOTPWithExpiry();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send password reset email
    const emailTemplate = RESET_PASSWORD_EMAIL_TEMPLATE(otp, user.fullName);
    await sendEmailSafely(
      user.username,
      EMAIL_SUBJECTS.RESET_PASSWORD,
      emailTemplate,
      user._id
    );

    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    next(error);
  }
};

const validatePasswordResetOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await findUserByValidOTP(otp);

    if (!user) {
      return res.status(400).json({ message: ERROR_MESSAGES.INVALID_OTP });
    }

    // OTP is valid, but don't clear it yet - it will be cleared when password is reset
    return res.status(200).json({ message: "OTP is valid" });
  } catch (error) {
    console.error("OTP validation error:", error);
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password, otp } = req.body;
    const user = await findUserByValidOTP(otp);

    if (!user) {
      return res.status(400).json({ message: ERROR_MESSAGES.INVALID_OTP });
    }

    user.password = await hashPassword(password);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    next(error);
  }
};

const findUserById = async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { id } = matchedData(req);
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Find user by ID error:", error);
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { user } = req;
    const token = generateToken(user);
    return res
      .status(200)
      .json({ message: "User logged in successfully", user, token });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

const getAllAdmins = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [admins, totalAdmins] = await Promise.all([
      User.find({ role: "admin", isActive: true })
        .select("-password")
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "admin", isActive: true }),
    ]);

    return res.status(200).json({
      message: "Admins fetched successfully",
      admins,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalAdmins / limit),
        totalAdmins,
        hasNextPage: page < Math.ceil(totalAdmins / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find({ role: "user", isActive: true })
        .select("-password")
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "user", isActive: true }),
    ]);

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    next(error);
  }
};

const getAllGamers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [gamers, totalGamers] = await Promise.all([
      User.find({ role: "gamer", isActive: true })
        .select("-password")
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: "gamer", isActive: true }),
    ]);

    return res.status(200).json({
      message: "Gamers fetched successfully",
      gamers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalGamers / limit),
        totalGamers,
        hasNextPage: page < Math.ceil(totalGamers / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get all gamers error:", error);
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const hashedPassword = await hashPassword(password);
    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // Invalidate user cache
    invalidate.user(id);

    return res
      .status(200)
      .json({ message: "Password updated successfully", user });
  } catch (error) {
    console.error("Update password error:", error);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { user } = req;
    const userData = await User.findById(user._id).select("-password");
    return res
      .status(200)
      .json({ message: "User fetched successfully", userData });
  } catch (error) {
    console.error("Get me error:", error);
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { user } = req;
    const { username, fullName, country, profilePicture } = req.body;

    // Validate request body
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    // Check if new email/username is already taken (if provided)
    if (username && username !== user.username) {
      const existingUser = await findUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: ERROR_MESSAGES.EMAIL_EXISTS });
      }
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (country) updateData.country = country;
    if (profilePicture) updateData.profilePicture = profilePicture;
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // If email was updated, send verification email for new email
    if (username && username !== user.username) {
      const { otp, otpExpiry } = generateOTPWithExpiry();

      // Update user with new OTP and mark as unverified
      await User.findByIdAndUpdate(user._id, {
        otp,
        otpExpiry,
        isVerified: false,
      });

      // Send verification email to new email address (non-blocking)
      const emailTemplate = VERIFICATION_EMAIL_TEMPLATE(otp);
      await sendEmailSafely(
        username,
        EMAIL_SUBJECTS.NEW_EMAIL_VERIFICATION,
        emailTemplate,
        user._id
      );
    }

    const token = generateToken(updatedUser);

    // Invalidate user cache after all updates (including OTP update above)
    invalidate.user(user._id);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
      ...(username &&
        username !== user.username && {
          emailVerificationSent: true,
          note: "Please verify your new email address",
        }),
      newToken: token,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    next(error);
  }
};

const getAvailableProfilePictures = async (req, res, next) => {
  try {
    // Return the list of available profile pictures
    const profilePictures = [
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
    ];

    // Generate full URLs for each profile picture
    const profilePictureUrls = profilePictures.map((picture) => ({
      id: picture,
      url: `${process.env.SPACE_CDN_NAME}/avatars/${picture}.png`,
    }));

    return res.status(200).json({
      message: "Profile pictures fetched successfully",
      profilePictures: profilePictureUrls,
    });
  } catch (error) {
    console.error("Get profile pictures error:", error);
    next(error);
  }
};

const addCredits = async (req, res, next) => {
  try {
    // Validate request body
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { id } = req.params;
    const { credits } = req.body;

    // Find user and verify they are a gamer
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    if (user.role !== "gamer") {
      return res
        .status(400)
        .json({ message: "Credits can only be added to gamers" });
    }

    // Add credits to user's current credits
    user.credits = (user.credits || 0) + credits;
    await user.save();

    // Invalidate user cache
    invalidate.user(id);

    return res.status(200).json({
      message: "Credits added successfully",
      user: {
        _id: user._id,
        username: user.username,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("Add credits error:", error);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    // Invalidate user cache
    invalidate.user(id);

    return res.status(200).json({
      message: "User deleted successfully",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    next(error);
  }
};

const restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // Restore by setting isActive to true
    user.isActive = true;
    await user.save();

    // Invalidate user cache
    invalidate.user(id);

    return res.status(200).json({
      message: "User restored successfully",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Restore user error:", error);
    next(error);
  }
};

const getDeletedUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find({ isActive: false })
        .select("-password")
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ isActive: false }),
    ]);

    return res.status(200).json({
      message: "Deleted users fetched successfully",
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get deleted users error:", error);
    next(error);
  }
};

const assignCategory = async (req, res, next) => {
  try {
    const { userId, categoryId } = req.body;

    if (!userId || !categoryId) {
      return res
        .status(400)
        .json({ message: "User ID and Category ID are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    if (user.role !== "user") {
      return res.status(400).json({
        message: "Categories can only be assigned to users with role 'user'",
      });
    }

    // Check if category is already assigned
    if (user.categories && user.categories.includes(categoryId)) {
      return res
        .status(400)
        .json({ message: "Category already assigned to this user" });
    }

    // Add category to user's categories array
    user.categories = user.categories || [];
    user.categories.push(categoryId);
    await user.save();

    // Invalidate user cache and category cache for this user
    invalidate.user(userId);
    // Import categoryCache from cacheService
    categoryCache.del(`categories:user:${userId}`);

    return res.status(200).json({
      message: "Category assigned successfully",
      user: {
        _id: user._id,
        username: user.username,
        categories: user.categories,
      },
    });
  } catch (error) {
    console.error("Assign category error:", error);
    next(error);
  }
};

const unassignCategory = async (req, res, next) => {
  try {
    const { userId, categoryId } = req.body;

    if (!userId || !categoryId) {
      return res
        .status(400)
        .json({ message: "User ID and Category ID are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // Remove category from user's categories array
    console.log("user.categories", user.categories);
    user.categories = user.categories.filter(
      (cat) => cat._id.toString() !== categoryId.toString()
    );
    await user.save();

    // Invalidate user cache and category cache for this user
    invalidate.user(userId);
    categoryCache.del(`categories:user:${userId}`);

    return res.status(200).json({
      message: "Category unassigned successfully",
      user: {
        _id: user._id,
        username: user.username,
        categories: user.categories,
      },
    });
  } catch (error) {
    console.error("Unassign category error:", error);
    next(error);
  }
};

module.exports = {
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
};
