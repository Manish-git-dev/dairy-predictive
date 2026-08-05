const KpiSnapshot = require('../models/KpiSnapshot');
const dashboardService = require('./dashboardService');

const kpiService = {
  calculateKpis: async (organizationId, startDate, endDate) => {
    return await dashboardService.getOverviewKpis(organizationId, startDate, endDate);
  },

  captureSnapshot: async (organizationId) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Yesterday

    const kpis = await kpiService.calculateKpis(organizationId, startDate, endDate);
    
    const snapshot = new KpiSnapshot({
      organization: organizationId,
      date: endDate,
      metrics: kpis
    });
    
    await snapshot.save();
    return snapshot;
  },

  getSnapshots: async (organizationId, startDate, endDate, period) => {
    // Simplify for daily snapshots
    return await KpiSnapshot.find({
      organization: organizationId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).sort({ date: 1 });
  }
};

module.exports = kpiService;
