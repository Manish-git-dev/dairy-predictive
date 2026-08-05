const auditService = require('../services/auditService');

const getAll = async (req, res, next) => {
  try {
    const result = await auditService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getByResource = async (req, res, next) => {
  try {
    const { resourceType, resourceId } = req.params;
    const result = await auditService.getByResource(resourceType, resourceId, req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getByResource
};
