const workflowCrudService = require('../services/workflowCrudService');

const list = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await workflowCrudService.list(req.organizationId, req.query) }); }
  catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await workflowCrudService.getById(req.organizationId, req.params.id) }); }
  catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await workflowCrudService.create(req.organizationId, req.user.id, req.body) }); }
  catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await workflowCrudService.update(req.organizationId, req.user.id, req.params.id, req.body) }); }
  catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await workflowCrudService.remove(req.organizationId, req.user.id, req.params.id) }); }
  catch (error) { next(error); }
};

const transition = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await workflowCrudService.transition(req.organizationId, req.user.id, req.params.id, req.body.status) }); }
  catch (error) { next(error); }
};

const getUsers = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await workflowCrudService.getUsers(req.organizationId) }); }
  catch (error) { next(error); }
};

module.exports = { list, getById, create, update, remove, transition, getUsers };
