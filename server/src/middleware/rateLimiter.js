const ApiError = require('../utils/ApiError');

const requests = new Map();

const rateLimiter = (maxOrOptions, windowMinutes) => {
  let max, windowMs, message;
  if (typeof maxOrOptions === 'object' && maxOrOptions !== null) {
    max = maxOrOptions.max || 100;
    windowMs = maxOrOptions.windowMs || 15 * 60 * 1000;
    message = maxOrOptions.message || 'Too many requests from this IP, please try again later.';
  } else {
    max = maxOrOptions || 100;
    windowMs = (windowMinutes || 15) * 60 * 1000;
    message = 'Too many requests from this IP, please try again later.';
  }

  return (req, res, next) => {
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const requestInfo = requests.get(ip);

    if (now > requestInfo.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    requestInfo.count++;

    if (requestInfo.count > max) {
      const error = new ApiError(429, message);
      error.retryAfterSeconds = Math.ceil((requestInfo.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(error.retryAfterSeconds));
      return next(error);
    }

    next();
  };
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of requests.entries()) {
    if (now > info.resetTime) {
      requests.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

module.exports = { rateLimiter };
