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
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'address.village': { $regex: search, $options: 'i' } },
        { 'address.district': { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Farmer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    const total = await Farmer.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Farmer.findOne({ _id: id, organization: organizationId });
  },

  update: async (id, data, organizationId) => {
    return await Farmer.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true, runValidators: true });
  },

  delete: async (id, organizationId) => {
    return await Farmer.findOneAndUpdate({ _id: id, organization: organizationId }, { isActive: false }, { new: true, runValidators: true });
  },

  getPerformance: async (id, organizationId) => {
    const [result] = await MilkLot.aggregate([
      { $match: { farmer: id, organization: organizationId } },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: { $ifNull: ['$quantityLitres', 0] } },
          avgFat: { $avg: '$quality.fat' },
          rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          totalLots: { $sum: 1 }
        }
      }
    ]);

    return {
      totalVolume: Number(result?.totalVolume || 0),
      avgFat: Number(result?.avgFat || 0),
      rejectedCount: Number(result?.rejectedCount || 0),
      totalLots: Number(result?.totalLots || 0)
    };
  }
};

module.exports = farmerService;
