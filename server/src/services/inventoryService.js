const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const { assertOrganizationReference } = require('../utils/organizationReferences');

const validateReferences = async (data, organizationId) => {
  await assertOrganizationReference(Product, data.product, organizationId, 'Product');
  await assertOrganizationReference(Batch, data.batch, organizationId, 'Batch');
};

const inventoryService = {
  create: async (data, organizationId) => {
    await validateReferences(data, organizationId);
    const item = new Inventory({ ...data, organization: organizationId });
    await item.save();
    return item;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (status) query.status = status;

    const items = await Inventory.find(query).populate('product batch').skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await Inventory.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const item = await Inventory.findOne({ _id: id, organization: organizationId }).populate('product batch');
    if (!item) throw new ApiError(404, 'Inventory item not found');
    return item;
  },

  update: async (id, data, organizationId) => {
    await validateReferences(data, organizationId);
    const item = await Inventory.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
    if (!item) throw new ApiError(404, 'Inventory item not found');
    return item;
  },

  adjustStock: async (id, body, organizationId) => {
    const quantity = body.quantity || body.adjustment || 0;
    const item = await Inventory.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { $inc: { quantity } },
      { new: true }
    );
    if (!item) throw new ApiError(404, 'Inventory item not found');
    return item;
  },

  getLowStock: async (organizationId) => {
    return await Inventory.find({
      organization: organizationId,
      $expr: { $lte: ['$quantity', '$reorderPoint'] }
    }).populate('product');
  },

  getExpiringSoon: async (organizationId, filters = {}) => {
    const { days = 7 } = filters;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days));

    return await Inventory.find({
      organization: organizationId,
      expiryDate: { $lte: expiryDate, $gt: new Date() }
    }).populate('product batch');
  }
};

module.exports = inventoryService;
