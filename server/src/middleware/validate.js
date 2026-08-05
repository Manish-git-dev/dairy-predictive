const ApiError = require('../utils/ApiError');

const validate = (schema, options = { source: 'body' }) => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[options.source];
      const parsedData = schema.parse(dataToValidate);
      req[options.source] = parsedData;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new ApiError(400, `Validation Error: ${message}`));
      }
      next(error);
    }
  };
};

module.exports = validate;
