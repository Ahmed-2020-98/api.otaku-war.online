const { validationResult, matchedData } = require("express-validator");
const Category = require("../../models/Category");
const Question = require("../../models/Question");
const User = require("../../models/User");
const config = require("../../config/config");
const { uploadToCloudinary } = require("../../middleware/cloudinary");

const createQuestion = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        message: result.errors.map((error) => error.msg)[0],
      });
    }
    let media = null;
    let answerMedia = null;
    console.log(req.files);
    if (req.files) {
      if (req.files.media) {
        const result = await uploadToCloudinary(req.files.media[0].buffer);
        media = result.secure_url;
      }
      if (req.files.answerMedia) {
        const result = await uploadToCloudinary(
          req.files.answerMedia[0].buffer
        );
        answerMedia = result.secure_url;
      }
    }
    const { question, difficulty, correctAnswer, score, category } =
      matchedData(req);
    const createdBy = req.user._id;
    const { englishAnswer, range, rangeNumber, englishQuestion } = req.body;

    const newQuestion = await Question.create({
      question,
      difficulty,
      correctAnswer,
      media,
      answerMedia,
      score,
      category,
      createdBy,
      englishAnswer,
      range,
      rangeNumber,
      englishQuestion: englishQuestion || null,
    });

    await Promise.all([
      User.findByIdAndUpdate(createdBy, {
        $push: { questions: newQuestion._id },
      }),
      Category.findByIdAndUpdate(category, {
        $push: { questions: newQuestion._id },
      }),
    ]);

    return res.status(201).json({
      message: "Question created successfully",
      question: newQuestion,
    });
  } catch (error) {
    next(error);
  }
};

const getAllQuestions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const questions = await Question.find()
      .populate("createdBy", "username")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res
      .status(200)
      .json({ message: "Questions fetched successfully", questions });
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        message: result.errors.map((error) => error.msg)[0],
      });
    }
    const { id } = matchedData(req);
    const question = await Question.findById(id)
      .populate("createdBy", "username")
      .populate("category", "name");
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    return res
      .status(200)
      .json({ message: "Question fetched successfully", question });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        message: result.errors.map((error) => error.msg)[0],
      });
    }
    const { id } = matchedData(req);
    const { question, difficulty, correctAnswer, score, category } =
      matchedData(req);
    const { englishAnswer, range, rangeNumber, englishQuestion, forFirstGame } =
      req.body;

    //FIXME: Check if we need to keep track of who updated the question last.
    let media = null;
    let answerMedia = null;
    if (req.files) {
      if (req.files.media) {
        const result = await uploadToCloudinary(req.files.media[0].buffer);
        media = result.secure_url;
      }
      if (req.files.answerMedia) {
        const result = await uploadToCloudinary(
          req.files.answerMedia[0].buffer
        );
        answerMedia = result.secure_url;
      }
    }

    const questionToUpdate = await Question.findById(id);
    if (!questionToUpdate) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update fields
    questionToUpdate.question = question;
    questionToUpdate.difficulty = difficulty;
    questionToUpdate.correctAnswer = correctAnswer;
    questionToUpdate.media = media || questionToUpdate.media;
    questionToUpdate.answerMedia = answerMedia || questionToUpdate.answerMedia;
    // Don't manually set score - let the pre-save hook handle it based on difficulty
    questionToUpdate.category = category;
    questionToUpdate.englishAnswer =
      englishAnswer || questionToUpdate.englishAnswer;
    questionToUpdate.range =
      range !== undefined ? range : questionToUpdate.range;
    questionToUpdate.rangeNumber =
      rangeNumber > 0 ? rangeNumber : questionToUpdate.rangeNumber || 0;
    questionToUpdate.englishQuestion =
      englishQuestion || questionToUpdate.englishQuestion;
    questionToUpdate.forFirstGame =
      forFirstGame !== undefined ? forFirstGame : questionToUpdate.forFirstGame;

    // Save - this triggers the pre-save hook which will update score based on difficulty
    const updatedQuestion = await questionToUpdate.save();

    return res.status(200).json({
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

//FIXME: soft delete or hard delete?
const deleteQuestion = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        message: result.errors.map((error) => error.msg)[0],
      });
    }
    const { id } = matchedData(req);
    const question = await Question.findById(id);
    const { createdBy, category } = question;
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    //delete question from user's questions, category's questions, and delete the question in parallel
    await Promise.all([
      User.findByIdAndUpdate(createdBy, {
        $pull: { questions: id },
      }),
      Category.findByIdAndUpdate(category, {
        $pull: { questions: id },
      }),
      Question.findByIdAndDelete(id),
    ]);

    return res.status(200).json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const approveQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approvedQuestion = await Question.findByIdAndUpdate(
      id,
      {
        status: "approved",
      },
      {
        new: true,
      }
    );
    if (!approvedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }
    return res.status(200).json({
      message: "Question approved successfully",
      question: approvedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

const rejectQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const updateData = {
      status: "rejected",
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const rejectedQuestion = await Question.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!rejectedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }
    return res.status(200).json({
      message: "Question rejected successfully",
      question: rejectedQuestion,
    });
  } catch (error) {
    next(error);
  }
};

const pendingQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pendingQuestion = await Question.findByIdAndUpdate(
      id,
      {
        status: "pending",
      },
      {
        new: true,
      }
    );
    if (!pendingQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }
    return res.status(200).json({
      message: "Question pending successfully",
      question: pendingQuestion,
    });
  } catch (error) {
    next(error);
  }
};

const getQuestionsByCategory = async (req, res, next) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        message: result.errors.map((error) => error.msg)[0],
      });
    }
    const { id } = matchedData(req);
    // if the category is locked and the role is user, don't allow them to get the questions
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (category.locked && req.user.role === "user") {
      return res.status(403).json({
        message: "Unauthorized. Only admins can perform this action",
      });
    }
    const questions = await Question.find({ category: id })
      .populate("createdBy", "username")
      .populate("category", "name");
    return res.status(200).json({
      message: "Questions fetched successfully",
      questions,
    });
  } catch (error) {
    next(error);
  }
};

const getPendingQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const userId = req.query.userId;

    let categoryIds = null;
    if (search) {
      const cats = await Category.find(
        { name: { $regex: search, $options: "i" } },
        { _id: 1 }
      ).lean();
      categoryIds = cats.map((c) => c._id);
      if (categoryIds.length === 0) {
        return res.status(200).json({
          message: "Pending questions fetched successfully",
          questions: [],
          pagination: {
            current: page,
            pages: 0,
            total: 0,
            limit,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    }

    const filter = {
      status: "pending",
      ...(categoryIds ? { category: { $in: categoryIds } } : {}),
      ...(userId ? { createdBy: userId } : {}),
    };

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate("createdBy", "username")
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Question.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Pending questions fetched successfully",
      questions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (e) {
    next(e);
  }
};

const getApprovedQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();

    // When searching by category name we must look up categories first to filter,
    // then sort. Without search, sort happens on bare Question docs (much smaller)
    // and lookups only run on the paginated slice.
    const pipeline = search
      ? [
          { $match: { status: "approved" } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: "$category" },
          { $match: { "category.name": { $regex: search, $options: "i" } } },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              data: [
                { $skip: skip },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                  },
                },
                {
                  $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
        ]
      : [
          { $match: { status: "approved" } },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              data: [
                { $skip: skip },
                { $limit: limit },
                {
                  $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                  },
                },
                { $unwind: "$category" },
                {
                  $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                  },
                },
                {
                  $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
        ];

    const result = await Question.aggregate(pipeline, { allowDiskUse: true });
    const questions = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    return res.status(200).json({
      message: "Approved questions fetched successfully",
      questions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRejectedQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();

    const pipeline = search
      ? [
          { $match: { status: "rejected" } },
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: "$category" },
          { $match: { "category.name": { $regex: search, $options: "i" } } },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              data: [
                { $skip: skip },
                { $limit: limit },
                {
                  $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                  },
                },
                {
                  $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
        ]
      : [
          { $match: { status: "rejected" } },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              data: [
                { $skip: skip },
                { $limit: limit },
                {
                  $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category",
                  },
                },
                { $unwind: "$category" },
                {
                  $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                  },
                },
                {
                  $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
              totalCount: [{ $count: "count" }],
            },
          },
        ];

    const result = await Question.aggregate(pipeline, { allowDiskUse: true });
    const questions = result[0]?.data || [];
    const total = result[0]?.totalCount?.[0]?.count || 0;

    return res.status(200).json({
      message: "Rejected questions fetched successfully",
      questions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  approveQuestion,
  rejectQuestion,
  getQuestionsByCategory,
  getPendingQuestions,
  getApprovedQuestions,
  getRejectedQuestions,
  pendingQuestion,
};
