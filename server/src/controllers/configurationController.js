const configurationService = require('../services/configurationService');

const getAll = async (req, res, next) => {
  try {
    const result = await configurationService.getAll(req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const get = async (req, res, next) => {
  try {
    const result = await configurationService.get(req.params.key, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const set = async (req, res, next) => {
  try {
    const { value } = req.body;
    const result = await configurationService.set(req.params.key, value, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteConfig = async (req, res, next) => {
  try {
    const result = await configurationService.delete(req.params.key, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getBulk = async (req, res, next) => {
  try {
    const { keys } = req.body;
    const result = await configurationService.getBulk(keys, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  get,
  set,
  delete: deleteConfig,
  getBulk
};
