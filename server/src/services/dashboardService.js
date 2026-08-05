const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Tanker = require('../models/Tanker');
const Batch = require('../models/Batch');
const Payment = require('../models/Payment');
const KpiSnapshot = require('../models/KpiSnapshot');

const dashboardService = {
  getOverviewKpis: async (organizationId, startDate, endDate) => {
    const dateQuery = { organization: organizationId, createdAt: { $gte: startDate, $lte: endDate } };
    
    // Collection Volume & Rejection Rate
    const milkLots = await MilkLot.find(dateQuery);
    let collectionVolume = 0;
    let rejectedCount = 0;
    let totalChillingTime = 0;
    let chilledCount = 0;
    const activeFarmersSet = new Set();
    
    milkLots.forEach(lot => {
      collectionVolume += lot.quantityLitres || 0;
      if (lot.status === 'rejected') rejectedCount++;
      if (lot.farmer) activeFarmersSet.add(lot.farmer.toString());
      
      // Calculate avg chilling time if we have events for collection and chilled
      if (lot.events) {
         const collEvent = lot.events.find(e => e.status === 'collected');
         const chillEvent = lot.events.find(e => e.status === 'chilled');
         if (collEvent && chillEvent) {
             totalChillingTime += (chillEvent.timestamp - collEvent.timestamp);
             chilledCount++;
         }
      }
    });

    const rejectionRate = milkLots.length ? (rejectedCount / milkLots.length) : 0;
    const avgChillingTime = chilledCount ? (totalChillingTime / chilledCount) : 0;
    const activeFarmers = activeFarmersSet.size;

    // Quality Tests
    const qualityTests = await QualityTest.find(dateQuery);
    let totalFat = 0, totalSnf = 0;
    qualityTests.forEach(test => {
      totalFat += test.fat || 0;
      totalSnf += test.snf || 0;
    });
    const avgFat = qualityTests.length ? (totalFat / qualityTests.length) : 0;
    const avgSnf = qualityTests.length ? (totalSnf / qualityTests.length) : 0;

    // Batches
    const batches = await Batch.find(dateQuery);
    let totalYield = 0, totalWastage = 0, totalBatchVolume = 0;
    batches.forEach(b => {
      totalYield += b.plantYield || 0;
      totalWastage += b.wastage || 0;
      totalBatchVolume += b.totalQuantity || 0;
    });
    const plantYield = batches.length ? (totalYield / batches.length) : 0;
    const spoilageRate = totalBatchVolume ? (totalWastage / totalBatchVolume) : 0;

    // Tankers
    const tankers = await Tanker.find(dateQuery);
    let onTimeCount = 0;
    let deliveryCount = 0;
    tankers.forEach(t => {
      if (t.actualArrival && t.estimatedArrival) {
         deliveryCount++;
         if (t.actualArrival <= t.estimatedArrival) onTimeCount++;
      }
    });
    const deliverySlaCompliance = deliveryCount ? (onTimeCount / deliveryCount) : 0;

    // Payments
    const payments = await Payment.find(dateQuery);
    const disputedCount = payments.filter(p => p.status === 'disputed').length;
    const paymentAccuracy = payments.length ? ((payments.length - disputedCount) / payments.length) : 0;

    return {
      collectionVolume,
      avgFat,
      avgSnf,
      rejectionRate,
      avgChillingTime,
      plantYield,
      spoilageRate,
      deliverySlaCompliance,
      paymentAccuracy,
      activeFarmers
    };
  },

  getCollectionTrend: async (organizationId, startDate, endDate, period) => {
    // Grouping logic depends on period (daily, weekly, monthly). Doing daily for simplicity here.
    const milkLots = await MilkLot.find({
      organization: organizationId,
      createdAt: { $gte: startDate, $lte: endDate }
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

  getQualityDistribution: async (organizationId, startDate, endDate) => {
    const tests = await QualityTest.find({
      organization: organizationId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const dist = { A: 0, B: 0, C: 0, rejected: 0 };
    tests.forEach(t => {
      if (dist[t.grade] !== undefined) dist[t.grade]++;
    });
    return dist;
  },

  getStageMetrics: async (organizationId) => {
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
