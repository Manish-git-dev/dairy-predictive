const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Tanker = require('../models/Tanker');
const Batch = require('../models/Batch');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');
const Task = require('../models/Task');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const workflowService = {
  getQueueByStage: async (stage, organizationId, filters = {}) => {
    const { page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    let Model;
    const query = { organization: organizationId };

    switch (stage) {
      case 'collection':
        Model = MilkLot;
        query.status = 'collected';
        break;
      case 'testing':
        Model = QualityTest;
        break;
      case 'chilling':
        Model = MilkLot;
        query.status = 'chilled';
        break;
      case 'transport':
        Model = Tanker;
        query.status = { $in: ['in_transit', 'loading'] };
        break;
      case 'processing':
        Model = Batch;
        query.status = 'processing';
        break;
      case 'packaging':
        Model = Batch;
        query.status = 'processed';
        break;
      case 'distribution':
        Model = Inventory;
        query.status = 'in_stock';
        break;
      case 'settlement':
        Model = Payment;
        query.status = { $in: ['pending', 'calculated'] };
        break;
      case 'farmer_support':
        Model = Task;
        query.stage = 'farmer_support';
        query.status = 'open';
        break;
      default:
        throw new ApiError(400, 'Invalid stage');
    }

    const items = await Model.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await Model.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getAllQueues: async (organizationId) => {
    const [collection, testing, chilling, transport, processing, packaging, distribution, settlement, farmer_support] = await Promise.all([
      MilkLot.countDocuments({ organization: organizationId, status: 'collected' }),
      QualityTest.countDocuments({ organization: organizationId }),
      MilkLot.countDocuments({ organization: organizationId, status: 'chilled' }),
      Tanker.countDocuments({ organization: organizationId, status: { $in: ['in_transit', 'loading'] } }),
      Batch.countDocuments({ organization: organizationId, status: 'processing' }),
      Batch.countDocuments({ organization: organizationId, status: 'processed' }),
      Inventory.countDocuments({ organization: organizationId, status: 'in_stock' }),
      Payment.countDocuments({ organization: organizationId, status: { $in: ['pending', 'calculated'] } }),
      Task.countDocuments({ organization: organizationId, stage: 'farmer_support', status: 'pending' })
    ]);
    return { collection, testing, chilling, transport, processing, packaging, distribution, settlement, farmer_support };
  },

  transitionStage: async (body, organizationId, userId) => {
    const { entityType, entityId, stage } = body;
    let Model;
    switch (entityType) {
      case 'milklot': Model = MilkLot; break;
      case 'tanker': Model = Tanker; break;
      case 'batch': Model = Batch; break;
      default: throw new ApiError(400, 'Invalid entity type');
    }

    const doc = await Model.findOne({ _id: entityId, organization: organizationId });
    if (!doc) throw new ApiError(404, 'Entity not found');

    const oldStatus = doc.status;
    doc.status = stage;
    await doc.save();

    const event = new OperationalEvent({
      organization: organizationId,
      eventType: 'stage_transition',
      stage,
      description: `${entityType} ${entityId} transitioned from ${oldStatus} to ${stage}`,
      entity: { type: entityType, id: doc._id },
      user: userId
    });
    await event.save();

    return doc;
  }
};

module.exports = workflowService;
