const CollectionCentre = require('../models/CollectionCentre');
const getPagination = require('../utils/pagination');

const collectionCentreService = {
  create: async (data, organizationId) => {
    const centreId = `CC-${Date.now()}`;
    const centre = new CollectionCentre({ ...data, centreId, organization: organizationId });
    await centre.save();
    return centre;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId, isActive: true };
    const items = await CollectionCentre.find(query).skip(skip).limit(limitNum);
    const total = await CollectionCentre.countDocuments(query);
    
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await CollectionCentre.findOne({ _id: id, organization: organizationId });
  },

  update: async (id, data, organizationId) => {
    return await CollectionCentre.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  delete: async (id, organizationId) => {
    return await CollectionCentre.findOneAndUpdate({ _id: id, organization: organizationId }, { isActive: false }, { new: true });
  },

  getUtilization: async (id, organizationId) => {
    const centre = await CollectionCentre.findOne({ _id: id, organization: organizationId });
    if (!centre) throw new Error('Collection centre not found');
    
    // In a real app, query current inventory or active milk lots assigned to this centre
    const currentVolume = 500; // Mock current volume
    const utilization = centre.capacity ? (currentVolume / centre.capacity) * 100 : 0;
    
    return { currentVolume, capacity: centre.capacity, utilization };
  }
};

module.exports = collectionCentreService;
