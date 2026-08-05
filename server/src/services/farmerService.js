const Farmer = require('../models/Farmer');
const MilkLot = require('../models/MilkLot');
const getPagination = require('../utils/pagination');

const farmerService = {
  create: async (data, organizationId) => {
    const farmerId = `F-${Date.now()}`;
    const farmer = new Farmer({ ...data, farmerId, organization: organizationId });
    await farmer.save();
    return farmer;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, search } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId, isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Farmer.find(query).skip(skip).limit(limitNum);
    const total = await Farmer.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Farmer.findOne({ _id: id, organization: organizationId });
  },

  update: async (id, data, organizationId) => {
    return await Farmer.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  delete: async (id, organizationId) => {
    return await Farmer.findOneAndUpdate({ _id: id, organization: organizationId }, { isActive: false }, { new: true });
  },

  getPerformance: async (id, organizationId) => {
    const lots = await MilkLot.find({ farmer: id, organization: organizationId });
    let totalVolume = 0;
    let avgFat = 0, totalFat = 0;
    let rejectedCount = 0;

    lots.forEach(lot => {
      totalVolume += lot.quantityLitres || 0;
      if (lot.quality && lot.quality.fat) totalFat += lot.quality.fat;
      if (lot.status === 'rejected') rejectedCount++;
    });

    if (lots.length > 0) avgFat = totalFat / lots.length;

    return {
      totalVolume,
      avgFat,
      rejectedCount,
      totalLots: lots.length
    };
  }
};

module.exports = farmerService;
