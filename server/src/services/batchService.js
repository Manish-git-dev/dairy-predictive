const Batch = require('../models/Batch');
const MilkLot = require('../models/MilkLot');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');

const batchService = {
  create: async (data, organizationId) => {
    const batchId = `BCH-${Date.now()}`;
    
    // Aggregate milk lot quantities and qualities
    let totalQuantity = 0;
    
    if (data.milkLots && data.milkLots.length > 0) {
       const lots = await MilkLot.find({ _id: { $in: data.milkLots }, organization: organizationId });
       lots.forEach(lot => {
          totalQuantity += lot.quantityLitres || 0;
       });
       
       // Update lot statuses
       await MilkLot.updateMany(
         { _id: { $in: data.milkLots }, organization: organizationId },
         { status: 'processing' }
       );
    }

    const batch = new Batch({ 
      ...data, 
      batchId, 
      totalQuantity,
      organization: organizationId 
    });
    await batch.save();
    return batch;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (status) query.status = status;

    const items = await Batch.find(query).skip(skip).limit(limitNum);
    const total = await Batch.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Batch.findOne({ _id: id, organization: organizationId }).populate('milkLots product');
  },

  update: async (id, data, organizationId) => {
    return await Batch.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  updateStatus: async (id, status, organizationId, userId) => {
    const batch = await Batch.findOne({ _id: id, organization: organizationId });
    if (!batch) throw new Error('Batch not found');
    
    const oldStatus = batch.status;
    batch.status = status;
    
    const event = new OperationalEvent({
      organization: organizationId,
      entityType: 'batch',
      entityId: id,
      oldStatus,
      newStatus: status,
      user: userId,
      timestamp: new Date()
    });
    
    await Promise.all([batch.save(), event.save()]);
    
    // If processed, update milklots to 'processed'
    if (status === 'processed' && batch.milkLots && batch.milkLots.length > 0) {
        await MilkLot.updateMany(
           { _id: { $in: batch.milkLots }, organization: organizationId },
           { status: 'processed' }
        );
    }
    
    return batch;
  },

  recordYield: async (id, plantYield, wastage, organizationId) => {
    return await Batch.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { plantYield, wastage },
      { new: true }
    );
  }
};

module.exports = batchService;
