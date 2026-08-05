const pagination = async (model, query = {}, page = 1, limit = 10, sort = { createdAt: -1 }) => {
  const skip = (page - 1) * limit;

  const [data, totalCount] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit),
    model.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages,
      totalCount
    }
  };
};

module.exports = pagination;
