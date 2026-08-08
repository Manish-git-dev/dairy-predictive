const Role = require('../models/Role');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/auditService');

const writeAudit = async (action, roleId, actorId, before, after, req) => {
  try {
    await auditService.log(action, 'roles', roleId, actorId, { before, after }, req, req.organizationId);
  } catch (auditError) {
    console.error('Audit logging failed:', auditError.message);
  }
};

const getAll = async (req, res, next) => {
  try {
    const roles = await Role.find({ organization: req.organizationId }).sort({ name: 1 });
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!role) throw new ApiError(404, 'Role not found');
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const existing = await Role.findOne({ name: req.body.name, organization: req.organizationId }).select('_id');
    if (existing) throw new ApiError(409, 'A role with this name already exists in this organization');

    const role = await Role.create({ ...req.body, organization: req.organizationId, isSystem: false });
    await writeAudit('create', role._id, req.user.id, null, role.toObject(), req);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!role) throw new ApiError(404, 'Role not found');
    if (role.isSystem) throw new ApiError(403, 'System roles cannot be modified');

    if (req.body.name || req.body.organization || req.body.isSystem) {
      throw new ApiError(400, 'Role identity and system status cannot be changed');
    }

    const before = role.toObject();
    Object.assign(role, req.body);
    await role.save();
    await writeAudit('update', role._id, req.user.id, before, role.toObject(), req);
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!role) throw new ApiError(404, 'Role not found');
    if (role.isSystem) throw new ApiError(403, 'System roles cannot be deleted');

    const assignedUsers = await User.countDocuments({
      organization: req.organizationId,
      role: role.name
    });
    if (assignedUsers > 0) throw new ApiError(409, 'Role cannot be deleted while users are assigned to it');

    const before = role.toObject();
    await role.deleteOne();
    await writeAudit('delete', role._id, req.user.id, before, null, req);
    res.status(200).json({ success: true, data: { message: 'Role deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, delete: deleteRole };
