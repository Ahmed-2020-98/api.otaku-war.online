const checkAdmin = (req, res, next) => {
  const { user } = req;
  if (user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Unauthorized. Only admins can perform this action" });
  }
  next();
};

module.exports = checkAdmin;
