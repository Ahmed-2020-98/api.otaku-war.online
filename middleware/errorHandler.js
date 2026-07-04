//error handler
const errorHandler = (err, req, res, next) => {
  try {
    const statusCode = res.statusCode ? res.statusCode : 500;
    return res.status(statusCode).json({
      message: err.message,
      stack: err.stack,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { errorHandler };
