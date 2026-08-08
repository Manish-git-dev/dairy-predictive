const configurationService = require('../services/configurationService');
const auditService = require('../services/auditService');

const logChange = async (action, resourceId, userId, before, after, req) => {
  try {
    await auditService.log(action, 'settings', resourceId, userId, { before, after }, req, req.organizationId);
  } catch (auditError) {
    console.error('Audit logging failed:', auditError.message);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await configurationService.getAll(req.organizationId, req.query.category);
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
    const { value, category, description } = req.body;
    const before = await configurationService.get(req.params.key, req.organizationId);
    const result = await configurationService.set(
      req.params.key,
      value,
      category,
      description,
      req.user.id,
      req.organizationId
    );

    await logChange(before ? 'update' : 'create', result._id, req.user.id, before ? before.toObject() : null, result.toObject(), req);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteConfig = async (req, res, next) => {
  try {
    const result = await configurationService.delete(req.params.key, req.organizationId);
    if (result) {
      await logChange('delete', result._id, req.user.id, result.toObject(), null, req);
    }
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
