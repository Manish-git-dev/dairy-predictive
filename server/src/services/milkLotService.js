const MilkLot = require('../models/MilkLot');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');

const milkLotService = {
  create: async (data, organizationId) => {
    const lotId = `ML-${Date.now()}`;
    let basePrice = 0;
    // Simple mock logic for price calculation if quality data is provided initially
    if (data.quality && data.quality.fat) {
        basePrice = data.quantityLitres * (data.quality.fat * 1.5); 
    }

    const lot = new MilkLot({ ...data, lotId, basePrice, organization: organizationId });
    await lot.save();
    return lot;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, status, farmer, startDate, endDate, shift } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (status) query.status = status;
    if (farmer) query.farmer = farmer;
    if (shift) query.shift = shift;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const items = await MilkLot.find(query).populate('farmer collectionCentre').skip(skip).limit(limitNum);
    const total = await MilkLot.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await MilkLot.findOne({ _id: id, organization: organizationId }).populate('farmer collectionCentre quality');
  },

  update: async (id, data, organizationId) => {
    return await MilkLot.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  updateStatus: async (id, status, organizationId, userId) => {
    const lot = await MilkLot.findOne({ _id: id, organization: organizationId });
    if (!lot) throw new Error('Milk Lot not found');
    
    const oldStatus = lot.status;
    lot.status = status;
    
    const event = new OperationalEvent({
      organization: organizationId,
      entityType: 'milklot',
      entityId: id,
      oldStatus,
      newStatus: status,
      user: userId,
      timestamp: new Date()
    });
    
    await Promise.all([lot.save(), event.save()]);
    return lot;
  },

  getByFarmer: async (farmerId, organizationId, filters) => {
    const query = { farmer: farmerId, organization: organizationId };
    return await MilkLot.find(query).sort({ createdAt: -1 }).limit(filters.limit || 50);
  }
};

module.exports = milkLotService;
