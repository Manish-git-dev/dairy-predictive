const userService = require('../services/userService');

const create = async (req, res, next) => {
  try {
    const result = await userService.create(req.body, req.organizationId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await userService.getAll(req.organizationId, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await userService.getById(req.params.id, req.organizationId);
    if (!result) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await userService.update(req.params.id, req.body, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await userService.deactivate(req.params.id, req.organizationId, req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const result = await userService.activate(req.params.id, req.organizationId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, update, changePassword, deactivate, activate };
