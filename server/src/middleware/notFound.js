const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, 'API route not found'));
};

module.exports = { notFound };
