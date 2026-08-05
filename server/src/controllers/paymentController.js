const paymentService = require('../services/paymentService');

const calculate = async (req, res, next) => {
  try {
    const result = await paymentService.calculate(req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await paymentService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await paymentService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const result = await paymentService.approve(req.params.id, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const disburse = async (req, res, next) => {
  try {
    const result = await paymentService.disburse(req.params.id, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const dispute = async (req, res, next) => {
  try {
    const result = await paymentService.dispute(req.params.id, req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getByFarmer = async (req, res, next) => {
  try {
    const result = await paymentService.getByFarmer(req.params.farmerId, req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculate,
  getAll,
  getById,
  approve,
  disburse,
  dispute,
  getByFarmer
};
