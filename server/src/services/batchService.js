const Batch = require('../models/Batch');
const MilkLot = require('../models/MilkLot');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const batchService = {
  create: async (data, organizationId) => {
    const batchId = `BCH-${Date.now()}`;
    let totalQuantity = 0;
    let avgFat = 0, avgSnf = 0;

    if (data.milkLots && data.milkLots.length > 0) {
      const lots = await MilkLot.find({ _id: { $in: data.milkLots }, organization: organizationId });
      totalQuantity = lots.reduce((sum, lot) => sum + (lot.quantityLitres || 0), 0);
      avgFat = lots.length ? lots.reduce((s, l) => s + (l.quality && l.quality.fat ? l.quality.fat : 0), 0) / lots.length : 0;
      avgSnf = lots.length ? lots.reduce((s, l) => s + (l.quality && l.quality.snf ? l.quality.snf : 0), 0) / lots.length : 0;

      await MilkLot.updateMany(
        { _id: { $in: data.milkLots }, organization: organizationId },
        { status: 'processed' }
      );
    }

    const batch = new Batch({
      ...data,
      batchId,
      totalQuantity: parseFloat(totalQuantity.toFixed(2)),
      averageFat: parseFloat(avgFat.toFixed(2)),
      averageSnf: parseFloat(avgSnf.toFixed(2)),
      organization: organizationId
    });
    await batch.save();
    return batch;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (status) query.status = status;

    const items = await Batch.find(query).populate('milkLots product').skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await Batch.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const batch = await Batch.findOne({ _id: id, organization: organizationId }).populate('milkLots product');
    if (!batch) throw new ApiError(404, 'Batch not found');
    return batch;
  },

  update: async (id, data, organizationId) => {
    const batch = await Batch.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
    if (!batch) throw new ApiError(404, 'Batch not found');
    return batch;
  },

  updateStatus: async (id, status, organizationId, userId) => {
    const batch = await Batch.findOne({ _id: id, organization: organizationId });
    if (!batch) throw new ApiError(404, 'Batch not found');

    const oldStatus = batch.status;
    batch.status = status;

    const event = new OperationalEvent({
      organization: organizationId,
      eventType: 'batch_status_change',
      stage: 'processing',
      description: `Batch ${batch.batchId} status changed from ${oldStatus} to ${status}`,
      entity: { type: 'Batch', id: batch._id },
      user: userId
    });

    await Promise.all([batch.save(), event.save()]);

    if ((status === 'processed' || status === 'packaged') && batch.milkLots && batch.milkLots.length > 0) {
      await MilkLot.updateMany(
        { _id: { $in: batch.milkLots }, organization: organizationId },
        { status: 'processed', batch: batch._id }
      );
    }

    return batch;
  },

  recordYield: async (id, body, organizationId) => {
    const { plantYield, wastage } = body;
    const batch = await Batch.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { plantYield, wastage },
      { new: true }
    );
    if (!batch) throw new ApiError(404, 'Batch not found');
    return batch;
  }
};

module.exports = batchService;
