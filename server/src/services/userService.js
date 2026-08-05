const User = require("../models/User");
const Organization = require("../models/Organization");
const getPagination = require("../utils/pagination");
const ApiError = require("../utils/ApiError");

const userService = {
  create: async (data, organizationId) => {
    const user = new User({ ...data, organization: organizationId });
    await user.save();
    return user;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, role, isActive } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const items = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limitNum);
    const total = await User.countDocuments(query);
    return {
      items,
      total,
      page,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  getById: async (id, organizationId) => {
    return await User.findOne({ _id: id, organization: organizationId }).select(
      "-password",
    );
  },

  update: async (id, data, organizationId) => {
    // Prevent password update via this generic method
    delete data.password;
    return await User.findOneAndUpdate(
      { _id: id, organization: organizationId },
      data,
      { new: true },
    ).select("-password");
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

  deactivate: async (id, organizationId) => {
    return await User.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { isActive: false },
      { new: true },
    ).select("-password");
  },

  activate: async (id, organizationId) => {
    return await User.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { isActive: true },
      { new: true },
    ).select("-password");
  },
};

module.exports = userService;
