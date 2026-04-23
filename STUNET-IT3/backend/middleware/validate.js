// middleware/validate.js — express-validator error handler

const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(422).json({
      success: false,
      message: first.msg,
      errors: errors.array(),
    });
  }
  next();
};