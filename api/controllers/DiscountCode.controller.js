const DiscountCode = require("../../models/DiscountCode");
const DiscountCodeUsage = require("../../models/DiscountCodeUsage");
const User = require("../../models/User");
const { validationResult, matchedData } = require("express-validator");
const { isValidObjectId } = require("mongoose");
const { generateToken } = require("../../utils/mongoUtils");

// Create discount code
const createDiscountCode = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res
        .status(400)
        .json({ message: result.errors.map((error) => error.msg)[0] });
    }

    const {
      code,
      discountType,
      discountValue,
      maxUses,
      validUntil,
      description,
    } = matchedData(req);

    // Check if code already exists
    const existingCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
    });
    if (existingCode) {
      return res.status(400).json({ message: "Discount code already exists" });
    }

    const discountCode = await DiscountCode.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxUses,
      validUntil: new Date(validUntil),
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Discount code created successfully",
      discountCode,
    });
  } catch (error) {
    next(error);
  }
};

// Get all discount codes
const getDiscountCodes = async (req, res, next) => {
  try {
    const discountCodes = await DiscountCode.find()
      .populate("createdBy", "username fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({ discountCodes });
  } catch (error) {
    next(error);
  }
};

// Validate discount code
const validateDiscountCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { packageId } = req.query;
    const userId = req.user._id; // Assuming user is authenticated

    const discountCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!discountCode) {
      return res.status(404).json({ message: "Invalid discount code" });
    }

    // Check if code is still valid
    const now = new Date();
    if (now < discountCode.validFrom || now > discountCode.validUntil) {
      return res.status(400).json({ message: "Discount code has expired" });
    }

    // Check usage limits
    if (
      discountCode.maxUses &&
      discountCode.usedCount >= discountCode.maxUses
    ) {
      return res
        .status(400)
        .json({ message: "Discount code usage limit reached" });
    }

    // Check if user has already used this code
    const existingUsage = await DiscountCodeUsage.findOne({
      userId: userId,
      discountCodeId: discountCode._id,
    });

    if (existingUsage) {
      return res
        .status(400)
        .json({ message: "You have already used this code" });
    }

    // If it's a free credits code, apply it immediately
    if (discountCode.discountType === "free_credits") {
      try {
        // Start a transaction to ensure atomicity
        const session = await User.startSession();
        session.startTransaction();

        // Add credits to user
        await User.findByIdAndUpdate(
          userId,
          { $inc: { credits: discountCode.discountValue } },
          { session }
        );

        // Record the usage
        await DiscountCodeUsage.create(
          [
            {
              userId: userId,
              discountCodeId: discountCode._id,
              creditsAwarded: discountCode.discountValue,
            },
          ],
          { session }
        );

        // Update the discount code usage count
        await DiscountCode.findByIdAndUpdate(
          discountCode._id,
          { $inc: { usedCount: 1 } },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        // Get updated user with all data for new token
        const updatedUser = await User.findById(userId);

        // Generate new token with updated credits
        const newToken = generateToken(updatedUser);

        res.status(200).json({
          message: "Free credits applied successfully",
          discountCode: {
            _id: discountCode._id,
            code: discountCode.code,
            discountType: discountCode.discountType,
            discountValue: discountCode.discountValue,
            description: discountCode.description,
          },
          creditsAwarded: discountCode.discountValue,
          newCreditsBalance: updatedUser.credits,
          token: newToken, // Send new token with updated credits
        });
      } catch (transactionError) {
        await session.abortTransaction();
        session.endSession();
        throw transactionError;
      }
    } else {
      // For regular discount codes, check if package is provided
      if (!packageId) {
        return res.status(400).json({
          message:
            "Package ID is required for discount codes. Please select a package first.",
        });
      }

      // For regular discount codes, just return validation
      res.status(200).json({
        message: "Discount code is valid",
        discountCode: {
          _id: discountCode._id,
          code: discountCode.code,
          discountType: discountCode.discountType,
          discountValue: discountCode.discountValue,
          description: discountCode.description,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Update discount code
const updateDiscountCode = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res
        .status(400)
        .json({ message: result.errors.map((error) => error.msg)[0] });
    }

    const { id } = req.params;
    const updatesInput = matchedData(req, { locations: ["body"] });

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid discount code ID" });
    }

    // Remove undefined values
    const updates = Object.fromEntries(
      Object.entries(updatesInput).filter(([, v]) => v !== undefined)
    );

    // If updating code, check for duplicates
    if (updates.code) {
      const existingCode = await DiscountCode.findOne({
        code: updates.code.toUpperCase(),
        _id: { $ne: id },
      });
      if (existingCode) {
        return res
          .status(400)
          .json({ message: "Discount code already exists" });
      }
      updates.code = updates.code.toUpperCase();
    }

    const discountCode = await DiscountCode.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!discountCode) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    res.status(200).json({
      message: "Discount code updated successfully",
      discountCode,
    });
  } catch (error) {
    next(error);
  }
};

// Delete discount code
const deleteDiscountCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid discount code ID" });
    }

    const deleted = await DiscountCode.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Discount code not found" });
    }

    res.status(200).json({ message: "Discount code deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDiscountCode,
  getDiscountCodes,
  validateDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
};
