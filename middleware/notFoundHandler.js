const notFound = (req, res, next) => {
  try {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    return res.status(404).json({ message: error.message });
  } catch (error) {
    next(error);
  }
};

module.exports = { notFound };
