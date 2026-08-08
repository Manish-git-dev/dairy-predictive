const User = require("../models/User");
const Role = require("../models/Role");
const getPagination = require("../utils/pagination");
const ApiError = require("../utils/ApiError");

const USER_ROLES = ['ops_admin', 'manager', 'analyst', 'field_staff'];

const userService = {
  create: async (data, organizationId) => {
    const { role, email } = data;
    if (!USER_ROLES.includes(role)) throw new ApiError(400, 'Invalid user role');

    const roleRecord = await Role.findOne({ name: role, organization: organizationId }).select('_id');
    if (!roleRecord) throw new ApiError(400, 'The selected role is not configured for this organization');

    const existing = await User.findOne({ email: email.toLowerCase(), organization: organizationId }).select('_id');
    if (existing) throw new ApiError(409, 'A user with this email already exists in this organization');

    const user = new User({ ...data, email: email.toLowerCase(), organization: organizationId });
    await user.save();
    return user;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, role, isActive, search } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(escaped, 'i');
      query.$or = [{ firstName: pattern }, { lastName: pattern }, { email: pattern }];
    }

    const items = await User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await User.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await User.findOne({ _id: id, organization: organizationId }).select("-password -refreshToken");
  },

  update: async (id, data, organizationId, actorId) => {
    const user = await User.findOne({ _id: id, organization: organizationId });
    if (!user) throw new ApiError(404, 'User not found');

    if (data.role && !USER_ROLES.includes(data.role)) throw new ApiError(400, 'Invalid user role');
    if (data.role) {
      const roleRecord = await Role.findOne({ name: data.role, organization: organizationId }).select('_id');
      if (!roleRecord) throw new ApiError(400, 'The selected role is not configured for this organization');
    }
    if (data.email) {
      const normalizedEmail = data.email.toLowerCase();
      const duplicate = await User.findOne({ email: normalizedEmail, organization: organizationId, _id: { $ne: id } }).select('_id');
      if (duplicate) throw new ApiError(409, 'A user with this email already exists in this organization');
      data.email = normalizedEmail;
    }

    if (data.isActive === false && String(id) === String(actorId)) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }

    const update = { ...data };
    delete update.password;
    delete update.organization;
    delete update.refreshToken;

    Object.assign(user, update);
    await user.save();
    return user;
  },

  changePassword: async (id, currentPassword, newPassword) => {
    const user = await User.findById(id).select("+password");
    if (!user) throw new ApiError(404, "User not found");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, "Invalid current password");
    user.password = newPassword;
    await user.save();
    return true;
  },

  deactivate: async (id, organizationId, actorId) => {
    if (String(id) === String(actorId)) throw new ApiError(400, 'You cannot deactivate your own account');
    const user = await User.findOne({ _id: id, organization: organizationId });
    if (!user) throw new ApiError(404, 'User not found');

    if (user.role === 'ops_admin') {
      const activeAdmins = await User.countDocuments({ organization: organizationId, role: 'ops_admin', isActive: true });
      if (activeAdmins <= 1) throw new ApiError(400, 'The last active operations admin cannot be deactivated');
    }

    user.isActive = false;
    await user.save();
    return user;
  },

  activate: async (id, organizationId) => {
    const user = await User.findOne({ _id: id, organization: organizationId });
    if (!user) throw new ApiError(404, 'User not found');
    user.isActive = true;
    await user.save();
    return user;
  },
};

module.exports = userService;
