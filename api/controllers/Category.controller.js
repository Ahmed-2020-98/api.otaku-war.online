const { validationResult, matchedData } = require("express-validator");
const Category = require("../../models/Category");
const User = require("../../models/User");
const config = require("../../config/config");
const {
  categoryCache,
  getOrSet,
  invalidate,
} = require("../../utils/cacheService");
const { uploadToCloudinary } = require("../../middleware/cloudinary");

const createCategory = async (req, res, next) => {
  try {
    //validate request body
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res
        .status(400)
        .json({ message: result.errors.map((error) => error.msg)[0] });
    }

    const { name, description } = matchedData(req);
    let media = null;
    let logo = null;
    console.log(req.files);
    if (req.files) {
      if (req.files.media) {
        const result = await uploadToCloudinary(req.files.media[0].buffer);
        media = result.secure_url;
      }
      if (req.files.logo) {
        const result = await uploadToCloudinary(req.files.logo[0].buffer);
        logo = result.secure_url;
      }
    }

    const { user } = req;
    if (!name || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //create category
    const category = await Category.create({
      name,
      media,
      description,
      createdBy: user._id,
      logo,
    });

    //update user categories
    await User.findByIdAndUpdate(user._id, {
      $push: { categories: category._id },
    });

    // Invalidate category cache
    invalidate.allCategories();

    return res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    next(error);
  }
};

const getAllCategories = async (req, res, next) => {
  try {
    const user = req.user; // Get user from auth middleware

    // Use cache with 30-minute TTL
    // Different cache keys for different user roles:
    // - users: personalized (their assigned categories)
    // - admins: all categories
    // - gamers: only locked categories
    const cacheKey =
      user && user.role === "user"
        ? `categories:user:${user._id}`
        : user.role === "admin"
          ? "categories:all"
          : "categories:locked";

    const categories = await getOrSet(categoryCache, cacheKey, async () => {
      let query = {
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      };

      // Only retrieve locked categories for gamers
      // Admins and users see all (users see their assigned ones)
      if (user.role === "gamer") {
        query.locked = true;
      }

      // If user is a regular user (not admin), only show assigned categories
      if (user && user.role === "user") {
        const userData = await User.findById(user._id).select("categories");
        if (
          !userData ||
          !userData.categories ||
          userData.categories.length === 0
        ) {
          return []; // Return empty array if no categories assigned
        }
        query._id = { $in: userData.categories };
      }

      return await Category.find(query)
        .select("name media description logo locked")
        .sort({ name: 1 })
        .lean();
    });

    return res
      .status(200)
      .json({ message: "Categories fetched successfully", categories });
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const { id } = matchedData(req);
    const category = await getOrSet(
      categoryCache,
      `category:${id}`,
      async () => await Category.findById(id).lean(),
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res
      .status(200)
      .json({ message: "Category fetched successfully", category });
  } catch (error) {
    next(error);
  }
};
const updateCategory = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res
        .status(400)
        .json({ message: result.errors.map((error) => error.msg)[0] });
    }
    const { id } = matchedData(req);
    const categoryFound = await Category.findById(id);
    if (!categoryFound) {
      return res.status(404).json({ message: "Category not found" });
    }
    const { name, description } = matchedData(req);
    let media = categoryFound.media;
    let logo = categoryFound.logo;
    if (req.files) {
      if (req.files.media) {
        const result = await uploadToCloudinary(req.files.media[0].buffer);
        media = result.secure_url;
      }
      if (req.files.logo) {
        const result = await uploadToCloudinary(req.files.logo[0].buffer);
        logo = result.secure_url;
      }
    }
    const { user } = req;
    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        media,
        description,
        updatedBy: user._id,
        logo,
      },
      {
        new: true,
      },
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Invalidate cache for this category
    invalidate.category(id);

    return res
      .status(200)
      .json({ message: "Category updated successfully", category });
  } catch (error) {
    next(error);
  }
};

const lockCategory = async (req, res, next) => {
  try {
    const { id, locked } = matchedData(req);

    const category = await Category.findByIdAndUpdate(
      id,
      { locked },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Invalidate cache for this category
    invalidate.category(id);

    return res.status(200).json({
      message: `Category ${locked ? "locked" : "unlocked"} successfully.`,
      category,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Invalidate cache for this category
    invalidate.category(id);

    return res.status(200).json({
      message: "Category deleted successfully.",
      category,
    });
  } catch (error) {
    next(error);
  }
};

const restoreCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
      },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Invalidate cache for this category
    invalidate.category(id);

    return res.status(200).json({
      message: "Category restored successfully.",
      category,
    });
  } catch (error) {
    next(error);
  }
};

const getDeletedCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isDeleted: true })
      .select("name media description logo locked deletedAt")
      .sort({ deletedAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Deleted categories fetched successfully",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  lockCategory,
  getCategoryById,
  deleteCategory,
  restoreCategory,
  getDeletedCategories,
};
