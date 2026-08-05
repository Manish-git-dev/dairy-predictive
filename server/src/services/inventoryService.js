const Inventory = require('../models/Inventory');
const getPagination = require('../utils/pagination');

const inventoryService = {
  create: async (data, organizationId) => {
    const item = new Inventory({ ...data, organization: organizationId });
    await item.save();
    return item;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (status) query.status = status;

    const items = await Inventory.find(query).populate('product batch').skip(skip).limit(limitNum);
    const total = await Inventory.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Inventory.findOne({ _id: id, organization: organizationId }).populate('product batch');
  },

  update: async (id, data, organizationId) => {
    return await Inventory.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  adjustStock: async (id, quantity, organizationId) => {
    return await Inventory.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { $inc: { quantity: quantity } },
      { new: true }
    );
  },

  getLowStock: async (organizationId) => {
    return await Inventory.find({ 
      organization: organizationId,
      $expr: { $lte: ['$quantity', '$reorderPoint'] }
    }).populate('product');
  },

  getExpiringSoon: async (organizationId, days = 7) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    return await Inventory.find({
      organization: organizationId,
      expiryDate: { $lte: expiryDate, $gt: new Date() }
    }).populate('product batch');
  }
};

module.exports = inventoryService;
