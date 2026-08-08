const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Tanker = require('../models/Tanker');
const Batch = require('../models/Batch');
const Payment = require('../models/Payment');
const Farmer = require('../models/Farmer');
const CollectionCentre = require('../models/CollectionCentre');
const Task = require('../models/Task');
const Alert = require('../models/Alert');
const AnomalyEvent = require('../models/AnomalyEvent');
const OperationalEvent = require('../models/OperationalEvent');

const DAY_MS = 24 * 60 * 60 * 1000;

const toValidDate = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const getRange = (options = {}) => {
  const end = toValidDate(options.endDate, new Date());
  const periodDays = { '7d': 7, '30d': 30, '90d': 90 }[options.period];
  const defaultDays = periodDays || 30;
  const defaultStart = new Date(end.getTime() - (defaultDays - 1) * DAY_MS);
  const start = toValidDate(options.startDate, defaultStart);
  return start <= end ? { start, end } : { start: defaultStart, end };
};

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

const buildDailyTrend = (milkLots, start, end) => {
  const map = new Map();
  for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + DAY_MS)) {
    map.set(dayKey(cursor), { date: dayKey(cursor), volume: 0, count: 0 });
  }

  milkLots.forEach((lot) => {
    const date = new Date(lot.createdAt || lot.collectionDate);
    if (Number.isNaN(date.getTime())) return;
    const key = dayKey(date);
    if (!map.has(key)) return;
    const point = map.get(key);
    point.volume += Number(lot.quantityLitres) || 0;
    point.count += 1;
  });

  return Array.from(map.values());
};

const dashboardService = {
  getOverview: async (organizationId, options = {}) => {
    const { start, end } = getRange(options);
    const dateQuery = { organization: organizationId, createdAt: { $gte: start, $lte: end } };

    const [milkLots, qualityTests, batches, tankers, payments, activeFarmers, activeCollectionCentres, pendingTasks, criticalAlerts, anomalies, collectionCentres, escalatedTasks, recentActivity] = await Promise.all([
      MilkLot.find(dateQuery).select('quantityLitres status farmer createdAt').lean(),
      QualityTest.find(dateQuery).select('parameters fat snf result grade createdAt').lean(),
      Batch.find(dateQuery).select('plantYield wastage totalQuantity status createdAt').lean(),
      Tanker.find(dateQuery).select('status route currentLoad capacityLitres createdAt').lean(),
      Payment.find(dateQuery).select('status createdAt').lean(),
      Farmer.countDocuments({ organization: organizationId, isActive: true }),
      CollectionCentre.countDocuments({ organization: organizationId, isActive: true }),
      Task.countDocuments({ organization: organizationId, status: { $in: ['pending', 'assigned', 'in_progress', 'escalated'] } }),
      Alert.countDocuments({ organization: organizationId, severity: 'critical', acknowledged: false, resolvedAt: null }),
      AnomalyEvent.countDocuments({ organization: organizationId, status: { $in: ['detected', 'investigating'] } }),
      CollectionCentre.find({ organization: organizationId, isActive: true }).select('name capacityLitres currentUtilization').lean(),
      Task.countDocuments({ organization: organizationId, status: 'escalated' }),
      OperationalEvent.find(dateQuery).sort({ createdAt: -1 }).limit(8).select('eventType stage description user createdAt').populate('user', 'firstName lastName').lean()
    ]);

    const collectionVolume = milkLots.reduce((sum, lot) => sum + (Number(lot.quantityLitres) || 0), 0);
    const rejectedCount = milkLots.filter((lot) => lot.status === 'rejected').length;
    const rejectionRate = milkLots.length ? (rejectedCount / milkLots.length) * 100 : 0;

    const fatValues = qualityTests.map((test) => Number(test.parameters?.fat)).filter(Number.isFinite);
    const snfValues = qualityTests.map((test) => Number(test.parameters?.snf)).filter(Number.isFinite);
    const avgFat = fatValues.length ? fatValues.reduce((sum, value) => sum + value, 0) / fatValues.length : null;
    const avgSnf = snfValues.length ? snfValues.reduce((sum, value) => sum + value, 0) / snfValues.length : null;

    const totalYield = batches.reduce((sum, batch) => sum + (Number(batch.plantYield) || 0), 0);
    const totalWastage = batches.reduce((sum, batch) => sum + (Number(batch.wastage) || 0), 0);
    const totalBatchVolume = batches.reduce((sum, batch) => sum + (Number(batch.totalQuantity) || 0), 0);
    const plantYield = batches.length ? totalYield / batches.length : null;
    const spoilageRate = totalBatchVolume ? (totalWastage / totalBatchVolume) * 100 : 0;

    const deliveryEvents = tankers.filter((tanker) => tanker.route?.actualArrival && tanker.route?.estimatedArrival);
    const onTimeCount = deliveryEvents.filter((tanker) => new Date(tanker.route.actualArrival) <= new Date(tanker.route.estimatedArrival)).length;
    const deliverySlaCompliance = deliveryEvents.length ? (onTimeCount / deliveryEvents.length) * 100 : null;

    const disputedCount = payments.filter((payment) => payment.status === 'disputed').length;
    const paymentAccuracy = payments.length ? ((payments.length - disputedCount) / payments.length) * 100 : null;

    const highCapacityCentres = collectionCentres.filter((centre) => Number(centre.currentUtilization) >= 85).length;
    const failedQuality = qualityTests.filter((test) => test.result === 'fail').length;
    const borderlineQuality = qualityTests.filter((test) => test.result === 'borderline').length;
    const qualityRiskRate = qualityTests.length ? ((failedQuality + borderlineQuality) / qualityTests.length) * 100 : 0;

    const activeTankerCount = tankers.filter((tanker) => ['loading', 'in_transit', 'unloading'].includes(tanker.status)).length;
    const operationalRisk = escalatedTasks + anomalies;

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      collectionVolume,
      avgFat,
      avgSnf,
      rejectionRate,
      activeFarmers,
      activeCollectionCentres,
      pendingTasks,
      criticalAlerts,
      plantYield,
      spoilageRate,
      deliverySlaCompliance,
      paymentAccuracy,
      risks: {
        anomalies,
        criticalAlerts,
        capacityRisk: highCapacityCentres,
        qualityRisk: { rate: qualityRiskRate, failed: failedQuality, borderline: borderlineQuality },
        operationalRisk: { count: operationalRisk, escalatedTasks, activeTankers: activeTankerCount }
      },
      recentActivity: recentActivity.map((event) => ({
        id: event._id,
        type: event.eventType || 'operation',
        stage: event.stage || null,
        description: event.description || 'Operational event recorded',
        user: event.user ? [event.user.firstName, event.user.lastName].filter(Boolean).join(' ') : null,
        createdAt: event.createdAt
      }))
    };
  },

  getCollectionTrend: async (organizationId, options = {}) => {
    const { start, end } = getRange(options);
    const milkLots = await MilkLot.find({ organization: organizationId, createdAt: { $gte: start, $lte: end } })
      .select('quantityLitres createdAt collectionDate')
      .lean();
    return buildDailyTrend(milkLots, start, end);
  },

  getQualityDistribution: async (organizationId, options = {}) => {
    const { start, end } = getRange(options);
    const tests = await QualityTest.find({ organization: organizationId, createdAt: { $gte: start, $lte: end } })
      .select('result grade')
      .lean();

    const result = { accepted: 0, rejected: 0, borderline: 0, grades: { A: 0, B: 0, C: 0, rejected: 0 } };
    tests.forEach((test) => {
      if (test.result === 'pass') result.accepted += 1;
      if (test.result === 'fail') result.rejected += 1;
      if (test.result === 'borderline') result.borderline += 1;
      if (Object.prototype.hasOwnProperty.call(result.grades, test.grade)) result.grades[test.grade] += 1;
    });
    return result;
  },

  getStageMetrics: async (organizationId) => {
    const [collection, testing, chilling, transport, processing, packaging] = await Promise.all([
      MilkLot.countDocuments({ organization: organizationId, status: 'collected' }),
      MilkLot.countDocuments({ organization: organizationId, status: 'tested' }),
      MilkLot.countDocuments({ organization: organizationId, status: 'chilled' }),
      Tanker.countDocuments({ organization: organizationId, status: { $in: ['loading', 'in_transit', 'unloading'] } }),
      Batch.countDocuments({ organization: organizationId, status: 'processing' }),
      Batch.countDocuments({ organization: organizationId, status: { $in: ['processed', 'packaged'] } })
    ]);
    return { collection, testing, chilling, transport, processing, packaging };
  }
};

module.exports = dashboardService;
