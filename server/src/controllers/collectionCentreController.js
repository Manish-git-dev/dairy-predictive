const collectionCentreService = require('../services/collectionCentreService');

const create = async (req, res, next) => {
  try {
    const result = await collectionCentreService.create(req.body, req.organizationId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await collectionCentreService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await collectionCentreService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await collectionCentreService.update(req.params.id, req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deleteCentre = async (req, res, next) => {
  try {
    const result = await collectionCentreService.delete(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getUtilization = async (req, res, next) => {
  try {
    const result = await collectionCentreService.getUtilization(req.params.id, req.organizationId, req.query);
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
  delete: deleteCentre,
  getUtilization
};
