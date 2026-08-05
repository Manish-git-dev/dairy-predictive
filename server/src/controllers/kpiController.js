const kpiService = require('../services/kpiService');

const captureSnapshot = async (req, res, next) => {
  try {
    const result = await kpiService.captureSnapshot(req.organizationId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getSnapshots = async (req, res, next) => {
  try {
    const result = await kpiService.getSnapshots(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const calculateKpis = async (req, res, next) => {
  try {
    const result = await kpiService.calculateKpis(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  captureSnapshot,
  getSnapshots,
  calculateKpis
};
