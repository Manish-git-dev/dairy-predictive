const predictionService = require('../services/predictionService');

const generate = async (req, res, next) => {
  try {
    const data = await predictionService.generate(req.organizationId, req.user?.id || req.user?._id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
};

const list = async (req, res, next) => {
  try {
    const data = await predictionService.list(req.organizationId, req.query);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const data = await predictionService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

module.exports = { generate, list, getById };
