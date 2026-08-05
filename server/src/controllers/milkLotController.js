const milkLotService = require('../services/milkLotService');

const create = async (req, res, next) => {
  try {
    const result = await milkLotService.create(req.body, req.organizationId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await milkLotService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await milkLotService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await milkLotService.update(req.params.id, req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const result = await milkLotService.updateStatus(req.params.id, req.body.status, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getByFarmer = async (req, res, next) => {
  try {
    const result = await milkLotService.getByFarmer(req.params.farmerId, req.organizationId, req.query);
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
  updateStatus,
  getByFarmer
};
