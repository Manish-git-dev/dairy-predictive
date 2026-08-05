const dashboardService = require('../services/dashboardService');

const getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;
    const result = await dashboardService.getOverview(req.organizationId, { startDate, endDate, period });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getCollectionTrend = async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;
    const result = await dashboardService.getCollectionTrend(req.organizationId, { startDate, endDate, period });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getQualityDistribution = async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;
    const result = await dashboardService.getQualityDistribution(req.organizationId, { startDate, endDate, period });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getStageMetrics = async (req, res, next) => {
  try {
    const { startDate, endDate, period } = req.query;
    const result = await dashboardService.getStageMetrics(req.organizationId, { startDate, endDate, period });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getCollectionTrend,
  getQualityDistribution,
  getStageMetrics
};
