const anomalyService = require('../services/anomalyService');

const detect = async (req, res, next) => {
  try {
    const result = await anomalyService.detect(req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await anomalyService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await anomalyService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const result = await anomalyService.updateStatus(req.params.id, req.body.status, req.body.resolution, req.user.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getRiskScores = async (req, res, next) => {
  try {
    const result = await anomalyService.getRiskScores(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const explainAnomaly = async (req, res, next) => {
  try {
    const result = await anomalyService.explainAnomaly(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  detect,
  getAll,
  getById,
  updateStatus,
  getRiskScores,
  explainAnomaly
};
