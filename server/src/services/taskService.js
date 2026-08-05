const Task = require('../models/Task');
const Alert = require('../models/Alert');
const getPagination = require('../utils/pagination');

const taskService = {
  create: async (data, organizationId) => {
    const taskId = `TSK-${Date.now()}`;
    const task = new Task({ ...data, taskId, organization: organizationId });
    await task.save();
    return task;
  },

  getAll: async (organizationId, filters) => {
    const { page = 1, limit = 10, status, priority, stage, assignee } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const query = { organization: organizationId };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (stage) query.stage = stage;
    if (assignee) query.assignee = assignee;

    const items = await Task.find(query).populate('assignee').skip(skip).limit(limitNum);
    const total = await Task.countDocuments(query);
    return { items, total, page, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  },

  getById: async (id, organizationId) => {
    return await Task.findOne({ _id: id, organization: organizationId }).populate('assignee');
  },

  update: async (id, data, organizationId) => {
    return await Task.findOneAndUpdate({ _id: id, organization: organizationId }, data, { new: true });
  },

  updateStatus: async (id, status, userId, organizationId) => {
    return await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status, completedAt: status === 'closed' ? new Date() : undefined },
      { new: true }
    );
  },

  assign: async (id, assignee, assignedBy, organizationId) => {
    return await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { assignee, status: 'in_progress' },
      { new: true }
    );
  },

  addNote: async (id, text, userId, organizationId) => {
    const task = await Task.findOne({ _id: id, organization: organizationId });
    if (!task) throw new Error('Task not found');
    
    if (!task.notes) task.notes = [];
    task.notes.push({ text, author: userId, createdAt: new Date() });
    await task.save();
    return task;
  },

  escalate: async (id, escalatedTo, reason, userId, organizationId) => {
    const task = await Task.findOneAndUpdate(
      { _id: id, organization: organizationId },
      { status: 'escalated', assignee: escalatedTo },
      { new: true }
    );
    
    if (task) {
      const alert = new Alert({
        alertId: `ALT-${Date.now()}`,
        organization: organizationId,
        type: 'escalation',
        severity: 'high',
        message: `Task ${task.taskId} escalated. Reason: ${reason}`,
        relatedEntity: 'Task',
        entityId: task._id
      });
      await alert.save();
    }
    return task;
  },

  getMyTasks: async (userId, organizationId, filters) => {
    return await taskService.getAll(organizationId, { ...filters, assignee: userId });
  },

  checkSlaBreaches: async (organizationId) => {
    const breachedTasks = await Task.find({
      organization: organizationId,
      status: { $in: ['open', 'in_progress'] },
      dueDate: { $lt: new Date() }
    });
    
    for (const task of breachedTasks) {
      task.status = 'escalated';
      await task.save();
      
      const alert = new Alert({
        alertId: `ALT-${Date.now()}`,
        organization: organizationId,
        type: 'sla_breach',
        severity: 'high',
        message: `SLA breached for Task ${task.taskId}`,
        relatedEntity: 'Task',
        entityId: task._id
      });
      await alert.save();
    }
    return breachedTasks.length;
  }
};

module.exports = taskService;
