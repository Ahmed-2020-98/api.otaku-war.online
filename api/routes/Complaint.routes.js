const express = require("express");
const complaintRouter = express.Router();
const {
  createComplaint,
  getComplaints,
  getContactUs,
  updateComplaint,
} = require("../controllers/Complaint.controller");
const passport = require("passport");

complaintRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createComplaint
);
complaintRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getComplaints
);
complaintRouter.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  updateComplaint
);
complaintRouter.get(
  "/contactus",
  passport.authenticate("jwt", { session: false }),
  getContactUs
);

module.exports = complaintRouter;
