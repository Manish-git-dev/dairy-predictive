const AnomalyEvent = require('../models/AnomalyEvent');
const QualityTest = require('../models/QualityTest');
const MilkLot = require('../models/MilkLot');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const finite = (value) => Number.isFinite(Number(value));
const safeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const dayKey = (date) => date.toISOString().slice(0, 10);

function statistics(values) {
  const clean = values.filter(finite).map(Number);
  if (!clean.length) return null;
  const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
  const variance = clean.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / clean.length;
  const std = Math.sqrt(variance);
  const sorted = [...clean].sort((a, b) => a - b);
  const q1 = sorted[Math.floor((sorted.length - 1) * 0.25)];
  const q3 = sorted[Math.floor((sorted.length - 1) * 0.75)];
  return { mean, std, q1, q3, iqr: q3 - q1, count: clean.length };
}

function severityFromDeviation(deviation) {
  if (deviation >= 80) return 'critical';
  if (deviation >= 50) return 'high';
  if (deviation >= 25) return 'medium';
  return 'low';
}

function buildAnomaly({ metric, type, value, expectedMin, expectedMax, expectedLabel, stats, entity, detectedAt, reason, action }) {
  if (!finite(value)) return null;
  const numericValue = Number(value);
  const center = (expectedMin + expectedMax) / 2;
  const halfRange = Math.max((expectedMax - expectedMin) / 2, Math.abs(center) * 0.05, 0.01);
  const thresholdDeviation = numericValue < expectedMin
    ? ((expectedMin - numericValue) / halfRange) * 100
    : numericValue > expectedMax
      ? ((numericValue - expectedMax) / halfRange) * 100
      : 0;
  const z = stats && stats.std > 0 ? Math.abs((numericValue - stats.mean) / stats.std) : 0;
  const iqrOutlier = stats && stats.iqr > 0
    ? numericValue < stats.q1 - (1.5 * stats.iqr) || numericValue > stats.q3 + (1.5 * stats.iqr)
    : false;
  const deviation = round(clamp(Math.max(thresholdDeviation, Math.max(0, z - 2) * 25, iqrOutlier ? 50 : 0)));
  if (deviation <= 0) return null;

  const severity = severityFromDeviation(deviation);
  const safeDetectedAt = safeDate(detectedAt) || new Date();
  const entityId = entity?.id ? String(entity.id) : 'aggregate';
  const anomalyId = `ANM-${metric}-${entityId}-${dayKey(safeDetectedAt)}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  const expected = round((expectedMin + expectedMax) / 2);
  return {
    anomalyId,
    organization: entity.organization,
    type,
    metric,
    severity,
    description: reason,
    detectedAt: safeDetectedAt,
    entity: { type: entity.type, id: entity.id, label: entity.label },
    metrics: { expected, actual: numericValue, deviation },
    actualValue: numericValue,
    expectedRange: { min: expectedMin, max: expectedMax, label: expectedLabel },
    riskScore: round(clamp(deviation)),
    explanation: `${reason} Expected ${expectedLabel}; observed ${numericValue}. Detection uses transparent threshold rules plus ${stats?.count >= 5 ? 'z-score/IQR statistical checks' : 'threshold checks because limited history is available'}.`,
    recommendedAction: action,
    factors: [
      { name: 'deviation', weight: 1, value: deviation },
      ...(stats ? [{ name: 'z_score', weight: 0.5, value: round(z) }] : [])
    ],
    status: 'detected'
  };
}

const anomalyService = {
  detect: async (data = {}, organizationId) => {
    const since = new Date(Date.now() - (Number(data.days) > 0 ? Number(data.days) : 90) * 24 * 60 * 60 * 1000);
    const [lots, tests, inventory, payments] = await Promise.all([
      MilkLot.find({ organization: organizationId, collectionDate: { $gte: since } }).sort({ collectionDate: -1 }).limit(1000).lean(),
      QualityTest.find({ organization: organizationId, testDate: { $gte: since } }).sort({ testDate: -1 }).limit(1000).lean(),
      Inventory.find({ organization: organizationId }).limit(1000).lean(),
      Payment.find({ organization: organizationId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(1000).lean()
    ]);

    const anomalies = [];
    const add = (candidate) => { if (candidate) anomalies.push(candidate); };

    const volumeStats = statistics(lots.map((lot) => lot.quantityLitres));
    const volumeMin = volumeStats ? Math.max(0, volumeStats.mean - Math.max(2 * volumeStats.std, volumeStats.mean * 0.35)) : 0;
    const volumeMax = volumeStats ? volumeStats.mean + Math.max(2 * volumeStats.std, volumeStats.mean * 0.35) : Number.MAX_SAFE_INTEGER;
    lots.forEach((lot) => {
      const date = safeDate(lot.collectionDate || lot.createdAt);
      if (finite(lot.quantityLitres) && date) add(buildAnomaly({
        metric: 'milk_volume', type: 'volume_anomaly', value: lot.quantityLitres,
        expectedMin: round(volumeMin), expectedMax: round(volumeMax), expectedLabel: `${round(volumeMin)}–${round(volumeMax)} L`, stats: volumeStats,
        entity: { type: 'MilkLot', id: lot._id, label: lot.lotId, organization: organizationId }, detectedAt: date,
        reason: `Milk lot ${lot.lotId} volume is outside the observed operating range.`, action: 'Review the collection record and confirm weighing/measurement at the collection centre.'
      }));

      if (finite(lot.temperature) && date) add(buildAnomaly({
        metric: 'temperature', type: 'temperature_alert', value: lot.temperature,
        expectedMin: 2, expectedMax: 8, expectedLabel: '2–8 °C', stats: statistics(lots.map((item) => item.temperature)),
        entity: { type: 'MilkLot', id: lot._id, label: lot.lotId, organization: organizationId }, detectedAt: date,
        reason: `Milk lot ${lot.lotId} temperature is outside the configured cold-chain range.`, action: 'Inspect chilling equipment, transport conditions and temperature logs for this lot.'
      }));
    });

    const fatStats = statistics(tests.map((test) => test.parameters?.fat));
    const snfStats = statistics(tests.map((test) => test.parameters?.snf));
    tests.forEach((test) => {
      const date = safeDate(test.testDate || test.createdAt);
      if (!date) return;
      add(buildAnomaly({ metric: 'fat', type: 'quality_deviation', value: test.parameters?.fat, expectedMin: 2, expectedMax: 7, expectedLabel: '2–7 %', stats: fatStats,
        entity: { type: 'QualityTest', id: test._id, label: test.testId, organization: organizationId }, detectedAt: date,
        reason: `Quality test ${test.testId} has an abnormal fat reading.`, action: 'Review the sample, collection source and calibration of the fat testing equipment.' }));
      add(buildAnomaly({ metric: 'snf', type: 'quality_deviation', value: test.parameters?.snf, expectedMin: 6, expectedMax: 10, expectedLabel: '6–10 %', stats: snfStats,
        entity: { type: 'QualityTest', id: test._id, label: test.testId, organization: organizationId }, detectedAt: date,
        reason: `Quality test ${test.testId} has an abnormal SNF reading.`, action: 'Review the sample and investigate recurring SNF deviations at the source centre.' }));
    });

    const daily = new Map();
    lots.forEach((lot) => {
      const date = safeDate(lot.collectionDate || lot.createdAt);
      if (!date) return;
      const key = dayKey(date);
      const current = daily.get(key) || { total: 0, rejected: 0 };
      current.total += 1;
      if (lot.status === 'rejected' || lot.quality?.grade === 'rejected') current.rejected += 1;
      daily.set(key, current);
    });
    const rejectionRates = [...daily.values()].filter((x) => x.total > 0).map((x) => x.rejected / x.total);
    const rejectionStats = statistics(rejectionRates);
    daily.forEach((entry, key) => {
      const rate = entry.rejected / entry.total;
      const threshold = Math.max(0.2, rejectionStats ? rejectionStats.mean + (2 * rejectionStats.std) : 0.2);
      if (rate > threshold) {
        const date = safeDate(`${key}T23:59:59Z`) || new Date();
        const deviation = round(clamp(((rate - threshold) / Math.max(threshold, 0.01)) * 100));
        add(buildAnomaly({ metric: 'rejection_rate', type: 'rejection_spike', value: round(rate * 100), expectedMin: 0, expectedMax: round(threshold * 100), expectedLabel: `0–${round(threshold * 100)} %`, stats: null,
          entity: { type: 'OperationsDay', label: key, organization: organizationId }, detectedAt: date,
          reason: `Daily rejection rate reached ${round(rate * 100)}% across ${entry.total} milk lots.`, action: 'Review rejected lots, quality-test results and collection-centre patterns for this day.' }));
        const last = anomalies[anomalies.length - 1];
        if (last) { last.metrics.deviation = deviation; last.riskScore = clamp(deviation); last.severity = severityFromDeviation(deviation); }
      }
    });

    inventory.forEach((item) => {
      if (!finite(item.quantity) || !finite(item.minimumStock)) return;
      if (Number(item.quantity) < Number(item.minimumStock)) {
        const date = safeDate(item.updatedAt || item.createdAt) || new Date();
        add(buildAnomaly({ metric: 'inventory', type: 'inventory_anomaly', value: item.quantity, expectedMin: Number(item.minimumStock), expectedMax: Number.MAX_SAFE_INTEGER,
          expectedLabel: `at least ${Number(item.minimumStock)} ${item.unit || 'units'}`, stats: null,
          entity: { type: 'Inventory', id: item._id, label: item.location || 'Inventory item', organization: organizationId }, detectedAt: date,
          reason: `Inventory quantity is below its configured minimum stock level.`, action: 'Review consumption and initiate replenishment according to the reorder policy.' }));
      }
    });

    payments.forEach((payment) => {
      if (!finite(payment.netAmount) || Number(payment.netAmount) < 0) {
        const date = safeDate(payment.createdAt) || new Date();
        add(buildAnomaly({ metric: 'payment', type: 'payment_anomaly', value: Number(payment.netAmount) || 0, expectedMin: 0, expectedMax: Number.MAX_SAFE_INTEGER,
          expectedLabel: 'non-negative net amount', stats: null,
          entity: { type: 'Payment', id: payment._id, label: payment.paymentId, organization: organizationId }, detectedAt: date,
          reason: `Payment ${payment.paymentId} contains an invalid negative or non-numeric net amount.`, action: 'Review the payment calculation and approval trail before disbursement.' }));
      }
    });

    if (!anomalies.length) return { detected: 0, items: [], scanned: { lots: lots.length, qualityTests: tests.length, inventory: inventory.length, payments: payments.length } };

    const saved = [];
    for (const anomaly of anomalies) {
      const result = await AnomalyEvent.findOneAndUpdate(
        { anomalyId: anomaly.anomalyId, organization: organizationId },
        { $set: anomaly },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      saved.push(result);
    }

    return { detected: saved.length, items: saved, scanned: { lots: lots.length, qualityTests: tests.length, inventory: inventory.length, payments: payments.length } };
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 25, status, severity, type, metric, search } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    const query = { organization: organizationId };
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (metric) query.metric = metric;
    if (search) query.$or = [
      { metric: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'entity.label': { $regex: search, $options: 'i' } }
    ];
    const [items, total] = await Promise.all([
      AnomalyEvent.find(query).sort({ detectedAt: -1 }).skip(skip).limit(limitNum).lean(),
      AnomalyEvent.countDocuments(query)
    ]);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const event = await AnomalyEvent.findOne({ _id: id, organization: organizationId }).lean();
    if (!event) throw new ApiError(404, 'Anomaly not found');
    return event;
  },

  updateStatus: async (id, status, resolution, userId, organizationId) => {
    const allowed = ['detected', 'investigating', 'resolved', 'false_positive'];
    if (!allowed.includes(status)) throw new ApiError(400, 'Invalid anomaly status');
    const update = { status };
    if (resolution !== undefined) update.resolution = resolution;
    if (status === 'resolved') {
      update.resolvedBy = userId;
      update.resolvedAt = new Date();
    } else if (status === 'investigating') {
      update.resolvedBy = undefined;
      update.resolvedAt = undefined;
    }
    const event = await AnomalyEvent.findOneAndUpdate({ _id: id, organization: organizationId }, update, { new: true }).lean();
    if (!event) throw new ApiError(404, 'Anomaly not found');
    return event;
  },

  getRiskScores: async (organizationId) => {
    const events = await AnomalyEvent.find({ organization: organizationId, status: { $in: ['detected', 'investigating'] } }).lean();
    const aggregated = { quality_deviation: 0, volume_anomaly: 0, temperature_alert: 0, rejection_spike: 0, inventory_anomaly: 0, payment_anomaly: 0, total: 0 };
    events.forEach((event) => {
      if (aggregated[event.type] !== undefined) aggregated[event.type] += Number(event.riskScore) || 0;
      aggregated.total += Number(event.riskScore) || 0;
    });
    return aggregated;
  },

  explainAnomaly: async (id, organizationId) => {
    const event = await AnomalyEvent.findOne({ _id: id, organization: organizationId }).lean();
    if (!event) throw new ApiError(404, 'Anomaly not found');
    return {
      anomalyId: event.anomalyId,
      metric: event.metric,
      riskScore: event.riskScore,
      explanation: event.explanation || `Detected ${event.metric} anomaly with risk score ${event.riskScore}.`,
      factors: event.factors || [],
      recommendation: event.recommendedAction || `Investigate ${event.metric} for ${event.entity?.label || event.entity?.type || 'the affected entity'}.`
    };
  }
};

module.exports = anomalyService;
