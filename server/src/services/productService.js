const Product = require('../models/Product');
const getPagination = require('../utils/pagination');

const productService = {
  create: async (data, organizationId) => {
    const product = new Product({ ...data, organization: organizationId });
    await product.save();
    return product;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId, isActive: true };
    const items = await Product.find(query).skip(skip).limit(limitNum);
    const total = await Product.countDocuments(query);
    
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Product.findOne({ _id: id, organization: organizationId });
  },

  update: async (id, data, organizationId) => {
    return await Product.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  delete: async (id, organizationId) => {
    return await Product.findOneAndUpdate({ _id: id, organization: organizationId }, { isActive: false }, { new: true });
  }
};

module.exports = productService;
