const requests = new Map();

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const message = options.message || 'Too many requests from this IP, please try again later.';

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
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
      return res.status(429).json({
        success: false,
        error: {
          message,
          code: 429
        }
      });
    }
    
    next();
  };
};

// Cleanup routine
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of requests.entries()) {
    if (now > info.resetTime) {
      requests.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = rateLimiter;
