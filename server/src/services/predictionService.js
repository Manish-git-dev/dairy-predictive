const Prediction = require('../models/Prediction');
const QualityTest = require('../models/QualityTest');
const MilkLot = require('../models/MilkLot');
const CollectionCentre = require('../models/CollectionCentre');
const ApiError = require('../utils/ApiError');
const getPagination = require('../utils/pagination');

const MODEL_VERSION = 'transparent-baseline-1.0';
const DEFAULT_DAYS = 30;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const riskLevel = (p) => p >= 0.8 ? 'critical' : p >= 0.6 ? 'high' : p >= 0.35 ? 'medium' : 'low';
const confidenceFromSample = (n, max = 0.95) => clamp(0.55 + Math.min(n, 100) / 100 * 0.4, 0.55, max);

const buildPeriod = (days) => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { start, end, days };
};

const buildPrediction = ({ type, probability, confidence, period, features, explanation, action, entity = { type: 'Organization', id: null } }) => ({
  predictionType: type,
  entity,
  inputPeriod: period,
  prediction: clamp(probability),
  confidence: clamp(confidence),
  riskLevel: riskLevel(clamp(probability)),
  modelVersion: MODEL_VERSION,
  method: 'Transparent statistical baseline using observed rates and operational thresholds',
  explanation,
  recommendedAction: action,
  features
});

const generate = async (organizationId, userId, options = {}) => {
  const days = Math.min(Math.max(Number(options.days || DEFAULT_DAYS), 7), 90);
  const period = buildPeriod(days);
  const [tests, lots, centres] = await Promise.all([
    QualityTest.find({ organization: organizationId, createdAt: { $gte: period.start, $lte: period.end } }).lean(),
    MilkLot.find({ organization: organizationId, createdAt: { $gte: period.start, $lte: period.end } }).lean(),
    CollectionCentre.find({ organization: organizationId, isActive: true }).lean()
  ]);

  if (tests.length === 0 && lots.length === 0 && centres.length === 0) {
    throw new ApiError(422, 'Not enough operational data to generate predictions');
  }

  const failedTests = tests.filter(t => t.result === 'fail' || t.grade === 'rejected').length;
  const borderlineTests = tests.filter(t => t.result === 'borderline').length;
  const rejectedLots = lots.filter(l => l.status === 'rejected' || l.quality?.grade === 'rejected').length;
  const totalLots = lots.length;
  const rejectionRate = totalLots ? rejectedLots / totalLots : (tests.length ? failedTests / tests.length : 0);
  const qualityDeviationRate = tests.length ? (failedTests + borderlineTests * 0.5) / tests.length : rejectionRate;
  const temperatureIssues = lots.filter(l => Number.isFinite(l.temperature) && (l.temperature < 0 || l.temperature > 8)).length;
  const adulterationIssues = lots.filter(l => l.quality?.adulteration === true).length;
  const spoilageProbability = clamp(
    rejectionRate * 0.55 + (temperatureIssues / Math.max(totalLots, 1)) * 0.3 + (adulterationIssues / Math.max(totalLots, 1)) * 0.15
  );
  const avgUtilization = centres.length ? centres.reduce((sum, c) => sum + clamp((c.currentUtilization || 0) / 100), 0) / centres.length : 0;
  const highUtilizationCentres = centres.filter(c => Number(c.currentUtilization || 0) >= 85).length;
  const capacityProbability = centres.length ? clamp(avgUtilization * 0.7 + (highUtilizationCentres / centres.length) * 0.3) : 0;

  const definitions = [
    buildPrediction({
      type: 'quality_risk', probability: qualityDeviationRate, confidence: confidenceFromSample(tests.length), period,
      features: { qualityTests: tests.length, failedTests, borderlineTests },
      explanation: `${failedTests} of ${tests.length} quality tests failed and ${borderlineTests} were borderline during the selected period. The baseline treats failed tests as full risk and borderline tests as half risk.`,
      action: qualityDeviationRate >= 0.6 ? 'Investigate collection-centre quality controls and review recent failed tests.' : 'Continue routine quality monitoring and review borderline tests.'
    }),
    buildPrediction({
      type: 'rejection_probability', probability: rejectionRate, confidence: confidenceFromSample(totalLots || tests.length), period,
      features: { milkLots: totalLots, rejectedLots, rejectionRate },
      explanation: `${rejectedLots} of ${totalLots} milk lots were rejected during the selected period. The probability is the observed rejection rate, not an AI-generated score.`,
      action: rejectionRate >= 0.6 ? 'Review rejection reasons and isolate recurring quality problems.' : 'Monitor rejection reasons and intervene if the rate increases.'
    }),
    buildPrediction({
      type: 'spoilage_risk', probability: spoilageProbability, confidence: confidenceFromSample(totalLots), period,
      features: { milkLots: totalLots, temperatureIssues, adulterationIssues, rejectionRate },
      explanation: `Baseline spoilage risk combines observed rejection rate, out-of-range recorded milk temperatures, and recorded adulteration flags. It is a risk proxy, not a trained spoilage classifier.`,
      action: spoilageProbability >= 0.6 ? 'Inspect chilling temperatures, transport handling, and affected lots immediately.' : 'Maintain chilling and transport monitoring.'
    }),
    buildPrediction({
      type: 'capacity_risk', probability: capacityProbability, confidence: confidenceFromSample(centres.length), period,
      features: { activeCentres: centres.length, averageUtilization: avgUtilization, highUtilizationCentres },
      explanation: `Capacity risk is based on active collection-centre utilization. Average utilization is ${(avgUtilization * 100).toFixed(1)}%, with ${highUtilizationCentres} centre(s) at or above 85%.`,
      action: capacityProbability >= 0.6 ? 'Review centre capacity and plan load balancing or additional chilling capacity.' : 'Continue monitoring centre utilization.'
    })
  ];

  const saved = await Prediction.insertMany(definitions.map(p => ({ ...p, organization: organizationId, generatedBy: userId })));
  return saved;
};

const list = async (organizationId, filters = {}) => {
  const { page = 1, limit = 20, type } = filters;
  const { skip, limit: limitNum } = getPagination(page, limit);
  const query = { organization: organizationId };
  if (type) query.predictionType = type;
  const [items, total] = await Promise.all([
    Prediction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Prediction.countDocuments(query)
  ]);
  return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

const getById = async (id, organizationId) => {
  const prediction = await Prediction.findOne({ _id: id, organization: organizationId }).lean();
  if (!prediction) throw new ApiError(404, 'Prediction not found');
  return prediction;
};

module.exports = { generate, list, getById, MODEL_VERSION };
