const crypto = require('crypto');

const requestContext = (req, res, next) => {
  const requestId = req.get('X-Request-Id') || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestContext;
