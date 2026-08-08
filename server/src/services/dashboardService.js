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
    const date = new Date(lot._id?.date || lot.date);
    if (Number.isNaN(date.getTime())) return;
    const key = dayKey(date);
    if (!map.has(key)) return;
    const point = map.get(key);
    point.volume += Number(lot.volume) || 0;
    point.count += Number(lot.count) || 0;
  });

  return Array.from(map.values());
};

const dashboardService = {
  getOverview: async (organizationId, options = {}) => {
    const { start, end } = getRange(options);
    const dateQuery = { organization: organizationId, createdAt: { $gte: start, $lte: end } };

    // Aggregate large operational collections in MongoDB instead of loading
    // every document into Node.js memory. This keeps dashboard latency and
    // server memory usage predictable as the organization grows.
    const [
      milkMetrics,
      qualityMetrics,
      batchMetrics,
      tankerMetrics,
      paymentMetrics,
      activeFarmers,
      activeCollectionCentres,
      pendingTasks,
      criticalAlerts,
      anomalies,
      collectionCentres,
      escalatedTasks,
      recentActivity,
    ] = await Promise.all([
      MilkLot.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            collectionVolume: { $sum: { $convert: { input: '$quantityLitres', to: 'double', onError: 0, onNull: 0 } } },
            totalLots: { $sum: 1 },
            rejectedLots: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          },
        },
      ]),
      QualityTest.aggregate([
        { $match: dateQuery },
        {
          $project: {
            fat: { $convert: { input: '$parameters.fat', to: 'double', onError: null, onNull: null } },
            snf: { $convert: { input: '$parameters.snf', to: 'double', onError: null, onNull: null } },
            result: 1,
            grade: 1,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            fatSum: { $sum: { $cond: [{ $ne: ['$fat', null] }, '$fat', 0] } },
            fatCount: { $sum: { $cond: [{ $ne: ['$fat', null] }, 1, 0] } },
            snfSum: { $sum: { $cond: [{ $ne: ['$snf', null] }, '$snf', 0] } },
            snfCount: { $sum: { $cond: [{ $ne: ['$snf', null] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$result', 'fail'] }, 1, 0] } },
            borderline: { $sum: { $cond: [{ $eq: ['$result', 'borderline'] }, 1, 0] } },
          },
        },
      ]),
      Batch.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalYield: { $sum: { $convert: { input: '$plantYield', to: 'double', onError: 0, onNull: 0 } } },
            totalWastage: { $sum: { $convert: { input: '$wastage', to: 'double', onError: 0, onNull: 0 } } },
            totalQuantity: { $sum: { $convert: { input: '$totalQuantity', to: 'double', onError: 0, onNull: 0 } } },
          },
        },
      ]),
      Tanker.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            active: { $sum: { $cond: [{ $in: ['$status', ['loading', 'in_transit', 'unloading']] }, 1, 0] } },
            deliveryEvents: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ['$route.actualArrival', null] }, { $ne: ['$route.estimatedArrival', null] }] },
                  1,
                  0,
                ],
              },
            },
            onTime: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$route.actualArrival', null] },
                      { $ne: ['$route.estimatedArrival', null] },
                      { $lte: ['$route.actualArrival', '$route.estimatedArrival'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Payment.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            disputed: { $sum: { $cond: [{ $eq: ['$status', 'disputed'] }, 1, 0] } },
          },
        },
      ]),
      Farmer.countDocuments({ organization: organizationId, isActive: true }),
      CollectionCentre.countDocuments({ organization: organizationId, isActive: true }),
      Task.countDocuments({ organization: organizationId, status: { $in: ['pending', 'assigned', 'in_progress', 'escalated'] } }),
      Alert.countDocuments({ organization: organizationId, severity: 'critical', acknowledged: false, resolvedAt: null }),
      AnomalyEvent.countDocuments({ organization: organizationId, status: { $in: ['detected', 'investigating'] } }),
      CollectionCentre.find({ organization: organizationId, isActive: true }).select('name capacityLitres currentUtilization').lean(),
      Task.countDocuments({ organization: organizationId, status: 'escalated' }),
      OperationalEvent.find(dateQuery).sort({ createdAt: -1 }).limit(8).select('eventType stage description user createdAt').populate('user', 'firstName lastName').lean(),
    ]);

    const milk = milkMetrics[0] || { collectionVolume: 0, totalLots: 0, rejectedLots: 0 };
    const quality = qualityMetrics[0] || { total: 0, fatSum: 0, fatCount: 0, snfSum: 0, snfCount: 0, failed: 0, borderline: 0 };
    const batch = batchMetrics[0] || { count: 0, totalYield: 0, totalWastage: 0, totalQuantity: 0 };
    const tanker = tankerMetrics[0] || { active: 0, deliveryEvents: 0, onTime: 0 };
    const payment = paymentMetrics[0] || { total: 0, disputed: 0 };

    const rejectionRate = milk.totalLots ? (milk.rejectedLots / milk.totalLots) * 100 : 0;
    const avgFat = quality.fatCount ? quality.fatSum / quality.fatCount : null;
    const avgSnf = quality.snfCount ? quality.snfSum / quality.snfCount : null;
    const plantYield = batch.count ? batch.totalYield / batch.count : null;
    const spoilageRate = batch.totalQuantity ? (batch.totalWastage / batch.totalQuantity) * 100 : 0;
    const deliverySlaCompliance = tanker.deliveryEvents ? (tanker.onTime / tanker.deliveryEvents) * 100 : null;
    const paymentAccuracy = payment.total ? ((payment.total - payment.disputed) / payment.total) * 100 : null;

    const highCapacityCentres = collectionCentres.filter((centre) => Number(centre.currentUtilization) >= 85).length;
    const qualityRiskRate = quality.total ? ((quality.failed + quality.borderline) / quality.total) * 100 : 0;
    const operationalRisk = escalatedTasks + anomalies;

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      collectionVolume: Number.isFinite(milk.collectionVolume) ? milk.collectionVolume : 0,
      avgFat: Number.isFinite(avgFat) ? avgFat : null,
      avgSnf: Number.isFinite(avgSnf) ? avgSnf : null,
      rejectionRate: Number.isFinite(rejectionRate) ? rejectionRate : 0,
      activeFarmers,
      activeCollectionCentres,
      pendingTasks,
      criticalAlerts,
      plantYield: Number.isFinite(plantYield) ? plantYield : null,
      spoilageRate: Number.isFinite(spoilageRate) ? spoilageRate : 0,
      deliverySlaCompliance: Number.isFinite(deliverySlaCompliance) ? deliverySlaCompliance : null,
      paymentAccuracy: Number.isFinite(paymentAccuracy) ? paymentAccuracy : null,
      risks: {
        anomalies,
        criticalAlerts,
        capacityRisk: highCapacityCentres,
        qualityRisk: { rate: qualityRiskRate, failed: quality.failed, borderline: quality.borderline },
        operationalRisk: { count: operationalRisk, escalatedTasks, activeTankers: tanker.active },
      },
      recentActivity: recentActivity.map((event) => ({
        id: event._id,
        type: event.eventType || 'operation',
        stage: event.stage || null,
        description: event.description || 'Operational event recorded',
        user: event.user ? [event.user.firstName, event.user.lastName].filter(Boolean).join(' ') : null,
        createdAt: event.createdAt,
      })),
    };
  },

  getCollectionTrend: async (organizationId, options = {}) => {
    const { start, end } = getRange(options);
    const rows = await MilkLot.aggregate([
      { $match: { organization: organizationId, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          volume: { $sum: { $convert: { input: '$quantityLitres', to: 'double', onError: 0, onNull: 0 } } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return buildDailyTrend(rows, start, end);
  },

  getQualityDistribution: async (organizationId, options = {}) => {
    const { start, end } = getRange(options);
    const rows = await QualityTest.aggregate([
      { $match: { organization: organizationId, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { result: '$result', grade: '$grade' }, count: { $sum: 1 } } },
    ]);

    const result = { accepted: 0, rejected: 0, borderline: 0, grades: { A: 0, B: 0, C: 0, rejected: 0 } };
    rows.forEach((row) => {
      if (row._id.result === 'pass') result.accepted += row.count;
      if (row._id.result === 'fail') result.rejected += row.count;
      if (row._id.result === 'borderline') result.borderline += row.count;
      if (Object.prototype.hasOwnProperty.call(result.grades, row._id.grade)) result.grades[row._id.grade] += row.count;
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
      Batch.countDocuments({ organization: organizationId, status: { $in: ['processed', 'packaged'] } }),
    ]);
    return { collection, testing, chilling, transport, processing, packaging };
  },
};

module.exports = dashboardService;
