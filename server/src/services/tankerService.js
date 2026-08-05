const Tanker = require('../models/Tanker');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');

const tankerService = {
  create: async (data, organizationId) => {
    const tankerId = `TK-${Date.now()}`;
    const tanker = new Tanker({ ...data, tankerId, organization: organizationId });
    await tanker.save();
    return tanker;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId, isActive: true };
    if (status) query.status = status;

    const items = await Tanker.find(query).skip(skip).limit(limitNum);
    const total = await Tanker.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Tanker.findOne({ _id: id, organization: organizationId });
  },

  update: async (id, data, organizationId) => {
    return await Tanker.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  delete: async (id, organizationId) => {
    return await Tanker.findOneAndUpdate({ _id: id, organization: organizationId }, { isActive: false }, { new: true });
  },

  updateStatus: async (id, status, organizationId, userId) => {
    const tanker = await Tanker.findOne({ _id: id, organization: organizationId });
    if (!tanker) throw new Error('Tanker not found');
    
    const oldStatus = tanker.status;
    tanker.status = status;
    
    const event = new OperationalEvent({
      organization: organizationId,
      entityType: 'tanker',
      entityId: id,
      oldStatus,
      newStatus: status,
      user: userId,
      timestamp: new Date()
    });
    
    await Promise.all([tanker.save(), event.save()]);
    return tanker;
  },

  updateLocation: async (id, lat, lng, organizationId) => {
    return await Tanker.findOneAndUpdate(
      { _id: id, organization: organizationId }, 
      { locationLat: lat, locationLng: lng, lastLocationUpdate: new Date() },
      { new: true }
    );
  },

  getActiveRoutes: async (organizationId) => {
    return await Tanker.find({ 
      organization: organizationId, 
      status: { $in: ['loading', 'in_transit'] },
      isActive: true 
    });
  }
};

module.exports = tankerService;
