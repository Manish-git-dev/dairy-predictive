const KpiSnapshot = require('../models/KpiSnapshot');
const dashboardService = require('./dashboardService');

const kpiService = {
  calculateKpis: async (organizationId, options = {}) => {
    const { startDate, endDate } = options;
    return await dashboardService.getOverview(organizationId, { startDate, endDate });
  },

  captureSnapshot: async (organizationId) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const kpis = await kpiService.calculateKpis(organizationId, { startDate, endDate });

    const snapshot = new KpiSnapshot({
      organization: organizationId,
      date: endDate,
      period: 'daily',
      metrics: kpis
    });

    await snapshot.save();
    return snapshot;
  },

  getSnapshots: async (organizationId, filters = {}) => {
    const { startDate, endDate, period } = filters;
    const query = { organization: organizationId };
    if (period) query.period = period;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    return await KpiSnapshot.find(query).sort({ date: 1 });
  }
};

module.exports = kpiService;
