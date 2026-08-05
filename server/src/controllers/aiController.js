const aiService = require('../services/aiService');

const getExplanation = async (req, res, next) => {
  try {
    const { entityType, entityId, context } = req.body;
    const result = await aiService.getExplanation(entityType, entityId, context, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getRecommendation = async (req, res, next) => {
  try {
    const result = await aiService.getRecommendation(req.body, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAiRuns = async (req, res, next) => {
  try {
    const result = await aiService.getAiRuns(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAiRunById = async (req, res, next) => {
  try {
    const result = await aiService.getAiRunById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExplanation,
  getRecommendation,
  getAiRuns,
  getAiRunById
};
