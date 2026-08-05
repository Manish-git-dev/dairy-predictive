const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Tanker = require('../models/Tanker');
const Batch = require('../models/Batch');
const Payment = require('../models/Payment');

const dashboardService = {
  getOverview: async (organizationId, options = {}) => {
    const { startDate, endDate } = options;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dateQuery = { organization: organizationId, createdAt: { $gte: start, $lte: end } };

    const milkLots = await MilkLot.find(dateQuery);
    let collectionVolume = 0;
    let rejectedCount = 0;
    const activeFarmersSet = new Set();

    milkLots.forEach(lot => {
      collectionVolume += lot.quantityLitres || 0;
      if (lot.status === 'rejected') rejectedCount++;
      if (lot.farmer) activeFarmersSet.add(lot.farmer.toString());
    });

    const rejectionRate = milkLots.length ? (rejectedCount / milkLots.length) * 100 : 0;
    const activeFarmers = activeFarmersSet.size;

    const qualityTests = await QualityTest.find(dateQuery);
    let totalFat = 0, totalSnf = 0;
    qualityTests.forEach(test => {
      totalFat += (test.parameters && test.parameters.fat) || 0;
      totalSnf += (test.parameters && test.parameters.snf) || 0;
    });
    const avgFat = qualityTests.length ? totalFat / qualityTests.length : 0;
    const avgSnf = qualityTests.length ? totalSnf / qualityTests.length : 0;

    const batches = await Batch.find(dateQuery);
    let totalYield = 0, totalWastage = 0, totalBatchVolume = 0;
    batches.forEach(b => {
      totalYield += b.plantYield || 0;
      totalWastage += b.wastage || 0;
      totalBatchVolume += b.totalQuantity || 0;
    });
    const plantYield = batches.length ? totalYield / batches.length : 0;
    const spoilageRate = totalBatchVolume ? (totalWastage / totalBatchVolume) * 100 : 0;

    const tankers = await Tanker.find(dateQuery);
    let onTimeCount = 0;
    let deliveryCount = 0;
    tankers.forEach(t => {
      if (t.route && t.route.actualArrival && t.route.estimatedArrival) {
        deliveryCount++;
        if (t.route.actualArrival <= t.route.estimatedArrival) onTimeCount++;
      }
    });
    const deliverySlaCompliance = deliveryCount ? (onTimeCount / deliveryCount) * 100 : 100;

    const payments = await Payment.find(dateQuery);
    const disputedCount = payments.filter(p => p.status === 'disputed').length;
    const paymentAccuracy = payments.length ? ((payments.length - disputedCount) / payments.length) * 100 : 100;

    return {
      collectionVolume,
      avgFat,
      avgSnf,
      rejectionRate,
      plantYield,
      spoilageRate,
      deliverySlaCompliance,
      paymentAccuracy,
      activeFarmers
    };
  },

  getCollectionTrend: async (organizationId, options = {}) => {
    const { startDate, endDate, period = 'daily' } = options;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const milkLots = await MilkLot.find({
      organization: organizationId,
      createdAt: { $gte: start, $lte: end }
    });

    const trendMap = {};
    milkLots.forEach(lot => {
      const dateKey = new Date(lot.createdAt).toISOString().split('T')[0];
      if (!trendMap[dateKey]) trendMap[dateKey] = { date: dateKey, volume: 0, count: 0 };
      trendMap[dateKey].volume += lot.quantityLitres || 0;
      trendMap[dateKey].count++;
    });

    return Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
  },

  getQualityDistribution: async (organizationId, options = {}) => {
    const { startDate, endDate } = options;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const tests = await QualityTest.find({
      organization: organizationId,
      createdAt: { $gte: start, $lte: end }
    });

    const dist = { A: 0, B: 0, C: 0, rejected: 0 };
    tests.forEach(t => {
      if (dist[t.grade] !== undefined) dist[t.grade]++;
    });
    return dist;
  },

  getStageMetrics: async (organizationId, options = {}) => {
    const [collection, testing, chilling, transport, processing, packaging] = await Promise.all([
      MilkLot.countDocuments({ organization: organizationId, status: 'collected' }),
      MilkLot.countDocuments({ organization: organizationId, status: 'tested' }),
      MilkLot.countDocuments({ organization: organizationId, status: 'chilled' }),
      Tanker.countDocuments({ organization: organizationId, status: { $in: ['loading', 'in_transit'] } }),
      Batch.countDocuments({ organization: organizationId, status: 'processing' }),
      Batch.countDocuments({ organization: organizationId, status: 'processed' })
    ]);
    return { collection, testing, chilling, transport, processing, packaging };
  }
};

module.exports = dashboardService;
