const approvalService = require('../services/approvalService');

const getAll = async (req, res, next) => {
  try {
    const result = await approvalService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await approvalService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPending = async (req, res, next) => {
  try {
    const result = await approvalService.getPending(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const review = async (req, res, next) => {
  try {
    const { status, comments } = req.body;
    const result = await approvalService.review(req.params.id, req.body, req.user.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getMyApprovals = async (req, res, next) => {
  try {
    const result = await approvalService.getMyApprovals(req.user.id, req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getPending,
  review,
  getMyApprovals
};
