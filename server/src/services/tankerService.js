const Tanker = require('../models/Tanker');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const tankerService = {
  create: async (data, organizationId) => {
    const tankerId = `TK-${Date.now()}`;
    const tanker = new Tanker({ ...data, tankerId, organization: organizationId });
    await tanker.save();
    return tanker;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId, isActive: true };
    if (status) query.status = status;

    const items = await Tanker.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await Tanker.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const tanker = await Tanker.findOne({ _id: id, organization: organizationId });
    if (!tanker) throw new ApiError(404, 'Tanker not found');
    return tanker;
  },

  update: async (id, data, organizationId) => {
    const tanker = await Tanker.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
    if (!tanker) throw new ApiError(404, 'Tanker not found');
    return tanker;
  },

  delete: async (id, organizationId) => {
    const tanker = await Tanker.findOneAndDelete({ _id: id, organization: organizationId });
    if (!tanker) throw new ApiError(404, 'Tanker not found');
    return tanker;
  },

  updateStatus: async (id, status, organizationId, userId) => {
    const tanker = await Tanker.findOne({ _id: id, organization: organizationId });
    if (!tanker) throw new ApiError(404, 'Tanker not found');

    const oldStatus = tanker.status;
    tanker.status = status;

    const event = new OperationalEvent({
      organization: organizationId,
      eventType: 'tanker_status_change',
      stage: 'transport',
      description: `Tanker ${tanker.tankerId} status changed from ${oldStatus} to ${status}`,
      entity: { type: 'Tanker', id: tanker._id },
      user: userId
    });

    await Promise.all([tanker.save(), event.save()]);
    return tanker;
  },

  updateLocation: async (id, location, organizationId) => {
    const tanker = await Tanker.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { currentLocation: location },
      { new: true }
    );
    if (!tanker) throw new ApiError(404, 'Tanker not found');
    return tanker;
  },

  getActiveRoutes: async (organizationId) => {
    return await Tanker.find({
      organization: organizationId,
      status: { $in: ['loading', 'in_transit'] }
    });
  }
};

module.exports = tankerService;
