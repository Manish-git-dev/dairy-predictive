const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Tanker = require('../models/Tanker');
const Batch = require('../models/Batch');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');
const Task = require('../models/Task');
const OperationalEvent = require('../models/OperationalEvent');
const getPagination = require('../utils/pagination');

const workflowService = {
  getQueueByStage: async (organizationId, stage, page = 1, limit = 10) => {
    const { skip, limit: limitNum } = getPagination(page, limit);
    let Model;
    let query = { organization: organizationId };

    switch (stage) {
      case 'collection':
        Model = MilkLot;
        query.status = 'collected';
        break;
      case 'testing':
        Model = MilkLot;
        query.status = 'tested'; // or QualityTest pending logic
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
        throw new Error('Invalid stage');
    }

    const items = await Model.find(query).skip(skip).limit(limitNum);
    const total = await Model.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getAllQueues: async (organizationId) => {
    const [collection, testing, chilling, transport, processing, packaging, distribution, settlement, farmer_support] = await Promise.all([
      MilkLot.countDocuments({ organization: organizationId, status: 'collected' }),
      MilkLot.countDocuments({ organization: organizationId, status: 'tested' }),
      MilkLot.countDocuments({ organization: organizationId, status: 'chilled' }),
      Tanker.countDocuments({ organization: organizationId, status: { $in: ['in_transit', 'loading'] } }),
      Batch.countDocuments({ organization: organizationId, status: 'processing' }),
      Batch.countDocuments({ organization: organizationId, status: 'processed' }),
      Inventory.countDocuments({ organization: organizationId, status: 'in_stock' }),
      Payment.countDocuments({ organization: organizationId, status: { $in: ['pending', 'calculated'] } }),
      Task.countDocuments({ organization: organizationId, stage: 'farmer_support', status: 'open' })
    ]);
    return { collection, testing, chilling, transport, processing, packaging, distribution, settlement, farmer_support };
  },

  transitionStage: async (organizationId, entityType, entityId, newStage, userId) => {
    let Model;
    switch (entityType) {
      case 'milklot': Model = MilkLot; break;
      case 'tanker': Model = Tanker; break;
      case 'batch': Model = Batch; break;
      default: throw new Error('Invalid entity type');
    }

    const doc = await Model.findOne({ _id: entityId, organization: organizationId });
    if (!doc) throw new Error('Entity not found');

    const oldStatus = doc.status;
    doc.status = newStage;
    
    // SLA check (simple dummy implementation, could expand)
    
    // Save doc
    await doc.save();

    // Create OperationalEvent
    const event = new OperationalEvent({
      organization: organizationId,
      entityType,
      entityId,
      oldStatus,
      newStatus: newStage,
      user: userId,
      timestamp: new Date()
    });
    await event.save();
    
    return doc;
  }
};

module.exports = workflowService;
