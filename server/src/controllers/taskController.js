const taskService = require('../services/taskService');

const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await taskService.create(req.body, req.organizationId, req.user.id) }); } catch (error) { next(error); }
};
const getAll = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.getAll(req.organizationId, req.query) }); } catch (error) { next(error); }
};
const getById = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.getById(req.params.id, req.organizationId) }); } catch (error) { next(error); }
};
const update = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.update(req.params.id, req.body, req.organizationId) }); } catch (error) { next(error); }
};
const updateStatus = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.updateStatus(req.params.id, req.body.status, req.organizationId) }); } catch (error) { next(error); }
};
const assign = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.assign(req.params.id, req.body.assigneeId, req.organizationId) }); } catch (error) { next(error); }
};
const addNote = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.addNote(req.params.id, req.body.text, req.user.id, req.organizationId) }); } catch (error) { next(error); }
};
const remove = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.delete(req.params.id, req.organizationId) }); } catch (error) { next(error); }
};
const getAssignees = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.getAssignees(req.organizationId) }); } catch (error) { next(error); }
};
const escalate = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.escalate(req.params.id, req.body, req.organizationId) }); } catch (error) { next(error); }
};
const getMyTasks = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.getMyTasks(req.user.id, req.organizationId, req.query) }); } catch (error) { next(error); }
};
const checkSlaBreaches = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await taskService.checkSlaBreaches(req.organizationId) }); } catch (error) { next(error); }
};

module.exports = { create, getAll, getById, update, updateStatus, assign, addNote, remove, getAssignees, escalate, getMyTasks, checkSlaBreaches };
