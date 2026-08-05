const getPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum };
};

module.exports = getPagination;
