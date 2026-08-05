const taskService = require('../services/taskService');

const create = async (req, res, next) => {
  try {
    const result = await taskService.create(req.body, req.organizationId, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await taskService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await taskService.getById(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await taskService.update(req.params.id, req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const result = await taskService.updateStatus(req.params.id, req.body.status, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const assign = async (req, res, next) => {
  try {
    const result = await taskService.assign(req.params.id, req.body.assigneeId, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const addNote = async (req, res, next) => {
  try {
    const result = await taskService.addNote(req.params.id, req.body.note, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const escalate = async (req, res, next) => {
  try {
    const result = await taskService.escalate(req.params.id, req.body, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getMyTasks = async (req, res, next) => {
  try {
    const result = await taskService.getMyTasks(req.user.id, req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const checkSlaBreaches = async (req, res, next) => {
  try {
    const result = await taskService.checkSlaBreaches(req.organizationId);
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
  updateStatus,
  assign,
  addNote,
  escalate,
  getMyTasks,
  checkSlaBreaches
};
