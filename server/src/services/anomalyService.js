const AnomalyEvent = require('../models/AnomalyEvent');
const QualityTest = require('../models/QualityTest');
const MilkLot = require('../models/MilkLot');
const AiRun = require('../models/AiRun');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const anomalyService = {
  detect: async (data, organizationId) => {
    const recentTests = await QualityTest.find({ organization: organizationId }).sort({ createdAt: -1 }).limit(100);
    const anomalies = [];

    recentTests.forEach(test => {
      const fat = test.parameters && test.parameters.fat;
      const snf = test.parameters && test.parameters.snf;
      if (fat === undefined || snf === undefined) return;
      if (fat < 2.0 || fat > 7.0 || snf < 6.0 || snf > 10.0) {
        anomalies.push({
          anomalyId: `ANM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          organization: organizationId,
          type: 'quality_deviation',
          severity: fat < 1.5 || snf < 5.5 ? 'critical' : 'high',
          description: `Abnormal quality for test ${test.testId}: fat=${fat}, snf=${snf}`,
          detectedAt: new Date(),
          entity: { type: 'QualityTest', id: test._id },
          metrics: { expected: 4.5, actual: fat, deviation: Math.abs(((4.5 - fat) / 4.5) * 100) },
          riskScore: 80,
          factors: [{ name: 'fat_deviation', weight: 0.6, value: Math.abs(4.5 - fat) }, { name: 'snf_deviation', weight: 0.4, value: Math.abs(8.5 - snf) }],
          status: 'detected',
          explanation: `Fat (${fat}) or SNF (${snf}) outside acceptable range for test ${test.testId}.`
        });
      }
    });

    const lots = await MilkLot.find({ organization: organizationId, status: 'rejected' }).sort({ createdAt: -1 }).limit(50);
    lots.forEach(lot => {
      anomalies.push({
        anomalyId: `ANM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        organization: organizationId,
        type: 'rejection_spike',
        severity: 'medium',
        description: `Rejected milk lot ${lot.lotId}`,
        detectedAt: new Date(),
        entity: { type: 'MilkLot', id: lot._id },
        metrics: { expected: 1, actual: 0, deviation: 100 },
        riskScore: 60,
        factors: [{ name: 'rejection', weight: 1.0, value: 100 }],
        status: 'detected',
        explanation: `Milk lot ${lot.lotId} was rejected: ${lot.rejectionReason || 'quality failure'}.`
      });
    });

    let saved = [];
    if (anomalies.length > 0) {
      saved = await AnomalyEvent.insertMany(anomalies);
      await new AiRun({
        organization: organizationId,
        runId: `AIR-${Date.now()}`,
        type: 'risk_score',
        modelVersion: '1.0.0',
        input: { type: 'anomaly_detection', snapshot: { scanned: recentTests.length + lots.length } },
        output: { result: { anomaliesDetected: saved.length, avgRiskScore: saved.reduce((s, a) => s + a.riskScore, 0) / (saved.length || 1) }, confidence: 0.82, reasoning: 'Statistical threshold analysis on recent quality tests and rejected lots.' },
        status: 'completed'
      }).save();
    }

    return saved;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status, severity, type } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;

    const items = await AnomalyEvent.find(query).sort({ detectedAt: -1 }).skip(skip).limit(limitNum);
    const total = await AnomalyEvent.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const event = await AnomalyEvent.findOne({ _id: id, organization: organizationId });
    if (!event) throw new ApiError(404, 'Anomaly not found');
    return event;
  },

  updateStatus: async (id, status, resolution, userId, organizationId) => {
    const event = await AnomalyEvent.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status, resolution, resolvedBy: status === 'resolved' ? userId : undefined, resolvedAt: status === 'resolved' ? new Date() : undefined },
      { new: true }
    );
    if (!event) throw new ApiError(404, 'Anomaly not found');
    return event;
  },

  getRiskScores: async (organizationId) => {
    const events = await AnomalyEvent.find({ organization: organizationId, status: { $in: ['detected', 'investigating'] } });
    const aggregated = { quality_deviation: 0, volume_anomaly: 0, temperature_alert: 0, adulteration_suspected: 0, rejection_spike: 0, yield_anomaly: 0, spoilage_risk: 0, collection_pattern: 0, total: 0 };
    events.forEach(e => {
      if (aggregated[e.type] !== undefined) aggregated[e.type] += e.riskScore;
      aggregated.total += e.riskScore;
    });
    return aggregated;
  },

  explainAnomaly: async (id, organizationId) => {
    const event = await AnomalyEvent.findOne({ _id: id, organization: organizationId });
    if (!event) throw new ApiError(404, 'Anomaly not found');
    const factorBreakdown = event.factors.map(f => `${f.name} (weight ${f.weight}, value ${f.value})`).join(', ');
    return {
      anomalyId: event.anomalyId,
      type: event.type,
      riskScore: event.riskScore,
      explanation: event.explanation || `Anomaly of type ${event.type} with risk score ${event.riskScore}. Contributing factors: ${factorBreakdown}.`,
      factors: event.factors,
      recommendation: `Investigate ${event.type} for entity ${event.entity && event.entity.type}. Priority based on risk score ${event.riskScore}.`
    };
  }
};

module.exports = anomalyService;
