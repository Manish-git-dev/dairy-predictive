const Role = require('../models/Role'); // Using model directly per instructions or inline service pattern

const getAll = async (req, res, next) => {
  try {
    const roles = await Role.find({ organization: req.organizationId });
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, organization: req.organizationId });
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const role = await Role.create({ ...req.body, organization: req.organizationId });
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const role = await Role.findOneAndUpdate(
      { _id: req.params.id, organization: req.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findOneAndDelete({ _id: req.params.id, organization: req.organizationId });
    if (!role) {
      const err = new Error('Role not found');
      err.statusCode = 404;
      throw err;
    }
    res.status(200).json({ success: true, data: { message: 'Role deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteRole
};
