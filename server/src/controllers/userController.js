const userService = require('../services/userService');
const auditService = require('../services/auditService');

const safeUser = (user) => {
  if (!user) return null;
  const value = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete value.password;
  delete value.refreshToken;
  return value;
};

const writeAudit = async (action, userId, actorId, before, after, req) => {
  try {
    await auditService.log(action, 'users', userId, actorId, { before, after }, req, req.organizationId);
  } catch (auditError) {
    console.error('Audit logging failed:', auditError.message);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await userService.create(req.body, req.organizationId);
    await writeAudit('create', result._id, req.user.id, null, safeUser(result), req);
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
    const before = await userService.getById(req.params.id, req.organizationId);
    const result = await userService.update(req.params.id, req.body, req.organizationId, req.user.id);
    await writeAudit('update', result._id, req.user.id, safeUser(before), safeUser(result), req);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
    await writeAudit('change_password', req.user.id, req.user.id, null, { changed: true }, req);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const before = await userService.getById(req.params.id, req.organizationId);
    const result = await userService.deactivate(req.params.id, req.organizationId, req.user.id);
    await writeAudit('deactivate', result._id, req.user.id, safeUser(before), safeUser(result), req);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const activate = async (req, res, next) => {
  try {
    const before = await userService.getById(req.params.id, req.organizationId);
    const result = await userService.activate(req.params.id, req.organizationId);
    await writeAudit('activate', result._id, req.user.id, safeUser(before), safeUser(result), req);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getById, update, changePassword, deactivate, activate };
