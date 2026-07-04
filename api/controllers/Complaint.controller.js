const Complaint = require("../../models/Complaint");

const createComplaint = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      gameId,
      questionId,
      type,
      message,
      fullName,
      email,
      phone,
      country,
    } = req.body;
    const complaint = await Complaint.create({
      userId: user._id,
      gameId,
      questionId,
      type,
      message,
      fullName,
      email,
      phone,
      country,
    });
    res.status(201).json({
      message: "Complaint created successfully",
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

const getComplaints = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find({ type: "reportissue" })
      .populate("userId", "username")
      .populate({
        path: "questionId",
        select: "question category media",
        model: "Question",
        populate: {
          path: "category",
          select: "name",
          model: "Category",
        },
      })
      .skip(skip)
      .limit(limit)
      .lean();
    res.status(200).json(complaints);
  } catch (error) {
    next(error);
  }
};

const getContactUs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const contactUs = await Complaint.find({ type: "contactus" })
      .skip(skip)
      .limit(limit)
      .lean();
    res.status(200).json(contactUs);
  } catch (error) {
    next(error);
  }
};

const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.json(complaint);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaint,
  getContactUs,
};
