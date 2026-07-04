const { validationResult } = require("express-validator");

const handleValidationErrors = (req, res) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      message: result.errors.map((error) => error.msg)[0],
    });
  }
};

module.exports = {
  handleValidationErrors,
};
