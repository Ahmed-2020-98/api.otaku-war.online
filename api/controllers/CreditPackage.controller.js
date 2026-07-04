const CreditPackage = require("../../models/CreditPackage");
const { validationResult, matchedData } = require("express-validator");
const User = require("../../models/User");
const { isValidObjectId } = require("mongoose");
const createCreditPackage = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res
        .status(400)
        .json({ message: result.errors.map((error) => error.msg)[0] });
    }
    const { name, description, price, currency, isActive, discount, credits } =
      matchedData(req);
    const creditPackage = await CreditPackage.create({
      name,
      description,
      price,
      currency,
      isActive,
      discount,
      credits,
    });
    res
      .status(201)
      .json({ message: "Credit package created successfully", creditPackage });
  } catch (error) {
    next(error);
  }
};

const getCreditPackages = async (req, res, next) => {
  try {
    const creditPackages = await CreditPackage.find({ isActive: true }).sort({
      credits: 1,
    });
    res.status(200).json({ creditPackages });
  } catch (error) {
    next(error);
  }
};

const updateCreditPackage = async (req, res, next) => {
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
      return res.status(400).json({ message: "Invalid credit package id" });
    }
    // remove undefined values from updatesInput and create updates object with only defined values
    const updates = Object.fromEntries(
      Object.entries(updatesInput).filter(([, v]) => v !== undefined)
    );
    // update credit package with the updates object and return the updated credit package
    const creditPackage = await CreditPackage.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true, context: "query" }
    );
    if (!creditPackage) {
      return res.status(404).json({ message: "Credit package not found" });
    }
    res
      .status(200)
      .json({ message: "Credit package updated successfully", creditPackage });
  } catch (error) {
    next(error);
  }
};

const deleteCreditPackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid credit package id" });
    }
    const deleted = await CreditPackage.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Credit package not found" });
    }
    res.status(200).json({ message: "Credit package deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getUserCredits = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user._id;
    const user = await User.findById(userId).select("credits").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User credits retrieved successfully",
      credits: user.credits,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCreditPackage,
  getCreditPackages,
  updateCreditPackage,
  deleteCreditPackage,
  getUserCredits,
};
