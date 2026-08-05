const QualityTest = require('../models/QualityTest');
const MilkLot = require('../models/MilkLot');
const AiRun = require('../models/AiRun');
const getPagination = require('../utils/pagination');
const mongoose = require('mongoose');

// Mock Anomaly Event Model just for reference - since schema is missing, use a generic collection or assume one exists.
// Based on typical patterns, let's create a dynamic collection or use a generic one if needed.
// For now, I'll return the object in a structure.
const AnomalyEvent = mongoose.models.AnomalyEvent || mongoose.model('AnomalyEvent', new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  type: String,
  description: String,
  riskScore: Number,
  entityId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'open' },
  resolvedAt: Date
}, { timestamps: true }));


const anomalyService = {
  detectAnomalies: async (organizationId) => {
    const recentTests = await QualityTest.find({ organization: organizationId }).sort({ createdAt: -1 }).limit(100);
    const anomalies = [];
    
    // Quality anomalies logic (simplified mock)
    recentTests.forEach(test => {
      if (test.fat < 2.0 || test.fat > 7.0 || test.snf < 6.0 || test.snf > 10.0) {
        anomalies.push({
          type: 'quality',
          description: `Abnormal quality for test ${test.testId}`,
          riskScore: 80,
          entityId: test._id
        });
      }
    });

    const savedAnomalies = await AnomalyEvent.insertMany(
      anomalies.map(a => ({ ...a, organization: organizationId }))
    );

    if (savedAnomalies.length > 0) {
       await new AiRun({
         organization: organizationId,
         type: 'anomaly_detection',
         output: savedAnomalies
       }).save();
    }

    return savedAnomalies;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    const items = await AnomalyEvent.find({ organization: organizationId }).skip(skip).limit(limitNum);
    const total = await AnomalyEvent.countDocuments({ organization: organizationId });
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await AnomalyEvent.findOne({ _id: id, organization: organizationId });
  },

  updateStatus: async (id, status, resolution, userId, organizationId) => {
    return await AnomalyEvent.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status, resolution, resolvedAt: status === 'resolved' ? new Date() : undefined },
      { new: true }
    );
  },

  getRiskScores: async (organizationId) => {
    const events = await AnomalyEvent.find({ organization: organizationId, status: 'open' });
    const aggregated = events.reduce((acc, curr) => {
       acc[curr.type] = (acc[curr.type] || 0) + curr.riskScore;
       return acc;
    }, {});
    return aggregated;
  },

  explainAnomaly: async (id, organizationId) => {
    const event = await AnomalyEvent.findOne({ _id: id, organization: organizationId });
    if (!event) throw new Error('Anomaly not found');
    return `Anomaly ${event._id} of type ${event.type} indicates a risk score of ${event.riskScore} due to ${event.description}.`;
  }
};

module.exports = anomalyService;
