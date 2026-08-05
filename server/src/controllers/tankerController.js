const tankerService = require('../services/tankerService');

const create = async (req, res, next) => {
  try {
    const result = await tankerService.create(req.body, req.organizationId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await tankerService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await tankerService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await tankerService.update(req.params.id, req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteTanker = async (req, res, next) => {
  try {
    const result = await tankerService.delete(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const result = await tankerService.updateStatus(req.params.id, req.body.status, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const result = await tankerService.updateLocation(req.params.id, req.body.location, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getActiveRoutes = async (req, res, next) => {
  try {
    const result = await tankerService.getActiveRoutes(req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteTanker,
  updateStatus,
  updateLocation,
  getActiveRoutes
};
