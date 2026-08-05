const workflowService = require('../services/workflowService');

const getAllQueues = async (req, res, next) => {
  try {
    const result = await workflowService.getAllQueues(req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getQueueByStage = async (req, res, next) => {
  try {
    const result = await workflowService.getQueueByStage(req.params.stage, req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const transitionStage = async (req, res, next) => {
  try {
    const result = await workflowService.transitionStage(req.body, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllQueues,
  getQueueByStage,
  transitionStage
};
