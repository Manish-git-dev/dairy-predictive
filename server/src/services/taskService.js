const Task = require('../models/Task');
const Alert = require('../models/Alert');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const taskService = {
  create: async (data, organizationId, userId) => {
    const taskId = `TSK-${Date.now()}`;
    const task = new Task({
      ...data,
      taskId,
      organization: organizationId,
      assignedBy: userId
    });
    await task.save();
    return task;
  },

  getAll: async (organizationId, filters = {}) => {
    const { page = 1, limit = 10, status, priority, stage, assignedTo } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (stage) query.stage = stage;
    if (assignedTo) query.assignedTo = assignedTo;

    const items = await Task.find(query).populate('assignedTo assignedBy').skip(skip).limit(limitNum).sort({ createdAt: -1 });
    const total = await Task.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    const task = await Task.findOne({ _id: id, organization: organizationId }).populate('assignedTo assignedBy slaRule');
    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  },

  update: async (id, data, organizationId) => {
    const task = await Task.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  },

  updateStatus: async (id, status, organizationId) => {
    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status, completedAt: status === 'completed' ? new Date() : undefined },
      { new: true }
    );
    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  },

  assign: async (id, assigneeId, organizationId) => {
    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { assignedTo: assigneeId, status: 'assigned' },
      { new: true }
    );
    if (!task) throw new ApiError(404, 'Task not found');
    return task;
  },

  addNote: async (id, text, userId, organizationId) => {
    const task = await Task.findOne({ _id: id, organization: organizationId });
    if (!task) throw new ApiError(404, 'Task not found');

    task.notes.push({ text, author: userId, createdAt: new Date() });
    await task.save();
    return task;
  },

  escalate: async (id, body, organizationId) => {
    const { escalatedTo, escalationReason } = body;
    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'escalated', escalatedTo, escalatedAt: new Date(), escalationReason },
      { new: true }
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

    return task;
  },

  getMyTasks: async (userId, organizationId, filters = {}) => {
    return await taskService.getAll(organizationId, { ...filters, assignedTo: userId });
  },

  checkSlaBreaches: async (organizationId) => {
    const breachedTasks = await Task.find({
      organization: organizationId,
      status: { $in: ['pending', 'assigned', 'in_progress'] },
      dueDate: { $lt: new Date() },
      slaBreached: { $ne: true }
    });

    for (const task of breachedTasks) {
      task.slaBreached = true;
      task.status = 'escalated';
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
