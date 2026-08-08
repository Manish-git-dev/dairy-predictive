const Task = require('../models/Task');
const User = require('../models/User');
const Alert = require('../models/Alert');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];

const taskService = {
  create: async (data, organizationId, userId) => {
    const taskId = `TSK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const task = new Task({
      ...data,
      taskId,
      organization: organizationId,
      assignedBy: userId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      completedAt: data.status === 'completed' ? new Date() : undefined
    });
    await task.save();
    return taskService.getById(task._id, organizationId);
  },

  getAll: async (organizationId, filters = {}) => {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      stage,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const { skip } = getPagination(page, safeLimit);
    const query = { organization: organizationId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (stage) query.stage = stage;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: regex }, { description: regex }, { taskId: regex }, { type: regex }];
    }

    const allowedSorts = ['createdAt', 'dueDate', 'priority', 'status', 'title'];
    const field = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
    const direction = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'firstName lastName email role isActive')
        .populate('assignedBy', 'firstName lastName email')
        .sort({ [field]: direction })
        .skip(skip)
        .limit(safeLimit),
      Task.countDocuments(query)
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    };
  },

  getAssignees: async (organizationId) => {
    return User.find({ organization: organizationId, isActive: true })
      .select('firstName lastName email role')
      .sort({ firstName: 1, lastName: 1 });
  },

  getById: async (id, organizationId) => {
    const task = await Task.findOne({ _id: id, organization: organizationId })
      .populate('assignedTo', 'firstName lastName email role isActive')
      .populate('assignedBy', 'firstName lastName email')
      .populate('notes.author', 'firstName lastName email')
      .populate('slaRule');
    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  },

  update: async (id, data, organizationId) => {
    const payload = { ...data };
    if (payload.dueDate) payload.dueDate = new Date(payload.dueDate);
    if (payload.status === 'completed') payload.completedAt = new Date();
    if (payload.status && payload.status !== 'completed') payload.completedAt = null;

    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      payload,
      { new: true, runValidators: true }
    );
    if (!task) throw new ApiError(404, 'Task not found');
    return taskService.getById(id, organizationId);
  },

  updateStatus: async (id, status, organizationId) => {
    if (!TASK_STATUSES.includes(status)) throw new ApiError(400, 'Invalid task status');
    const update = { status };
    update.completedAt = status === 'completed' ? new Date() : null;

    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      update,
      { new: true, runValidators: true }
    );
    if (!task) throw new ApiError(404, 'Task not found');
    return taskService.getById(id, organizationId);
  },

  assign: async (id, assigneeId, organizationId) => {
    if (assigneeId) {
      const user = await User.findOne({ _id: assigneeId, organization: organizationId, isActive: true });
      if (!user) throw new ApiError(400, 'Assignee not found in this organization');
    }
    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { assignedTo: assigneeId || null },
      { new: true, runValidators: true }
    );
    if (!task) throw new ApiError(404, 'Task not found');
    return taskService.getById(id, organizationId);
  },

  addNote: async (id, text, userId, organizationId) => {
    const task = await Task.findOne({ _id: id, organization: organizationId });
    if (!task) throw new ApiError(404, 'Task not found');
    task.notes.push({ text, author: userId, createdAt: new Date() });
    await task.save();
    return taskService.getById(id, organizationId);
  },

  delete: async (id, organizationId) => {
    const task = await Task.findOneAndDelete({ _id: id, organization: organizationId });
    if (!task) throw new ApiError(404, 'Task not found');
    return { deleted: true, id: task._id };
  },

  escalate: async (id, body, organizationId) => {
    const { escalatedTo, escalationReason } = body;
    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'blocked', escalatedTo, escalatedAt: new Date(), escalationReason, slaBreached: true },
      { new: true, runValidators: true }
    );
    if (!task) throw new ApiError(404, 'Task not found');

    await Alert.create({
      alertId: `ALT-${Date.now()}`,
      organization: organizationId,
      type: 'sla_breach',
      severity: 'high',
      title: `Task ${task.taskId} escalated`,
      message: `Task ${task.taskId} escalated. Reason: ${escalationReason}`,
      relatedEntity: { type: 'Task', id: task._id }
    });
    return taskService.getById(id, organizationId);
  },

  getMyTasks: async (userId, organizationId, filters = {}) => {
    return taskService.getAll(organizationId, { ...filters, assignedTo: userId });
  },

  checkSlaBreaches: async (organizationId) => {
    const breachedTasks = await Task.find({
      organization: organizationId,
      status: { $in: ['pending', 'in_progress'] },
      dueDate: { $lt: new Date() },
      slaBreached: { $ne: true }
    });

    for (const task of breachedTasks) {
      task.slaBreached = true;
      task.status = 'blocked';
      await task.save();
      await Alert.create({
        alertId: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        organization: organizationId,
        type: 'sla_breach',
        severity: task.priority === 'critical' ? 'critical' : 'high',
        title: `SLA breached for Task ${task.taskId}`,
        message: `SLA breached for Task ${task.taskId}. Due date was ${task.dueDate.toISOString()}.`,
        relatedEntity: { type: 'Task', id: task._id }
      });
    }
    return breachedTasks.length;
  }
};

module.exports = taskService;
