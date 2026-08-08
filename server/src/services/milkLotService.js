const MilkLot = require('../models/MilkLot');
const Farmer = require('../models/Farmer');
const Tanker = require('../models/Tanker');
const Batch = require('../models/Batch');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const { assertOrganizationReference } = require('../utils/organizationReferences');

const validateReferences = async (data, organizationId) => {
  await assertOrganizationReference(Farmer, data.farmer, organizationId, 'Farmer');
  await assertOrganizationReference(Tanker, data.tanker, organizationId, 'Tanker');
  await assertOrganizationReference(Batch, data.batch, organizationId, 'Batch');
};

const milkLotService = {
  create: async (data, organizationId) => {
    await validateReferences(data, organizationId);

    const lotId = `ML-${Date.now()}`;
    let pricePerLitre = 0;
    let totalAmount = 0;

    if (data.quality && data.quality.fat) {
      pricePerLitre = 35 + (data.quality.fat - 3.5) * 0.5;
      if (data.quality.snf) pricePerLitre += (data.quality.snf - 8.0) * 0.3;
      pricePerLitre = parseFloat(pricePerLitre.toFixed(2));
    }
    if (data.quantityLitres) {
      totalAmount = parseFloat((pricePerLitre * data.quantityLitres).toFixed(2));
    }

    const lot = new MilkLot({ ...data, lotId, pricePerLitre, totalAmount, organization: organizationId });
    await lot.save();
    return lot;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status, farmer, shift, startDate, endDate, search } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (status) query.status = status;
    if (farmer) query.farmer = farmer;
    if (shift) query.shift = shift;
    if (search) query.lotId = { $regex: search, $options: 'i' };
    if (startDate && endDate) {
      query.collectionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const items = await MilkLot.find(query).populate('farmer tanker').skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await MilkLot.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const lot = await MilkLot.findOne({ _id: id, organization: organizationId }).populate('farmer tanker batch');
    if (!lot) throw new ApiError(404, 'Milk lot not found');
    return lot;
  },

  update: async (id, data, organizationId) => {
    await validateReferences(data, organizationId);
    const lot = await MilkLot.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
    if (!lot) throw new ApiError(404, 'Milk lot not found');
    return lot;
  },

  updateStatus: async (id, status, organizationId, userId) => {
    const lot = await MilkLot.findOne({ _id: id, organization: organizationId });
    if (!lot) throw new ApiError(404, 'Milk lot not found');

    const oldStatus = lot.status;
    lot.status = status;

    const event = new OperationalEvent({
      organization: organizationId,
      eventType: 'status_change',
      stage: status,
      description: `Milk lot ${lot.lotId} status changed from ${oldStatus} to ${status}`,
      entity: { type: 'MilkLot', id: lot._id },
      user: userId
    });

    await Promise.all([lot.save(), event.save()]);
    return lot;
  },

  getByFarmer: async (farmerId, organizationId, filters = {}) => {
    await assertOrganizationReference(Farmer, farmerId, organizationId, 'Farmer');
    const { limit = 50 } = filters;
    return await MilkLot.find({ farmer: farmerId, organization: organizationId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
  }
};

module.exports = milkLotService;
