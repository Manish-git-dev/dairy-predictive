const alertService = require('../services/alertService');

const create = async (req, res, next) => {
  try {
    const result = await alertService.create(req.body, req.organizationId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await alertService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await alertService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const acknowledge = async (req, res, next) => {
  try {
    const result = await alertService.acknowledge(req.params.id, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const resolve = async (req, res, next) => {
  try {
    const result = await alertService.resolve(req.params.id, req.body, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getActiveAlerts = async (req, res, next) => {
  try {
    const result = await alertService.getActiveAlerts(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAlertCounts = async (req, res, next) => {
  try {
    const result = await alertService.getAlertCounts(req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  acknowledge,
  resolve,
  getActiveAlerts,
  getAlertCounts
};
