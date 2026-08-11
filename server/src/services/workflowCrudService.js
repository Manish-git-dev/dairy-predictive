const Workflow = require('../models/Workflow');
const User = require('../models/User');
const OperationalEvent = require('../models/OperationalEvent');
const ApiError = require('../utils/ApiError');

const STATUSES = ['draft', 'pending', 'in_progress', 'blocked', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const makeWorkflowId = () => `WF-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const assertUsers = async (organizationId, ids = []) => {
  const uniqueIds = [...new Set(ids.filter(Boolean).map(String))];
  if (!uniqueIds.length) return [];
  const users = await User.find({ _id: { $in: uniqueIds }, organization: organizationId, isActive: true }).select('_id firstName lastName email role');
  if (users.length !== uniqueIds.length) throw new ApiError(400, 'One or more assigned users are invalid or inactive');
  return users.map((user) => user._id);
};

const assertOwner = async (organizationId, ownerId) => {
  const owner = await User.findOne({ _id: ownerId, organization: organizationId, isActive: true }).select('_id firstName lastName email role');
  if (!owner) throw new ApiError(400, 'Workflow owner is invalid or inactive');
  return owner;
};

const normalizeDates = (body) => {
  const startTime = body.startTime ? new Date(body.startTime) : undefined;
  const dueTime = body.dueTime ? new Date(body.dueTime) : undefined;
  if (startTime && Number.isNaN(startTime.getTime())) throw new ApiError(400, 'Invalid start time');
  if (dueTime && Number.isNaN(dueTime.getTime())) throw new ApiError(400, 'Invalid due time');
  if (startTime && dueTime && dueTime < startTime) throw new ApiError(400, 'Due time must be after start time');
  return { startTime, dueTime };
};

const buildPayload = async (body, organizationId, isUpdate = false) => {
  const payload = {};
  if (!isUpdate || body.name !== undefined) payload.name = String(body.name || '').trim();
  if (!isUpdate || body.description !== undefined) payload.description = body.description ? String(body.description).trim() : '';
  if (!isUpdate || body.priority !== undefined) payload.priority = body.priority || 'medium';
  if (!isUpdate || body.status !== undefined) payload.status = body.status || 'draft';
  if (!isUpdate || body.owner !== undefined) payload.owner = body.owner;
  if (!isUpdate || body.assignedUsers !== undefined) payload.assignedUsers = await assertUsers(organizationId, body.assignedUsers || []);
  if (!isUpdate || body.relatedOperation !== undefined) payload.relatedOperation = body.relatedOperation ? String(body.relatedOperation).trim() : '';
  if (!isUpdate || body.notes !== undefined) payload.notes = body.notes ? String(body.notes).trim() : '';
  if (!isUpdate || body.startTime !== undefined || body.dueTime !== undefined) Object.assign(payload, normalizeDates(body));

  if (payload.name !== undefined && !payload.name) throw new ApiError(400, 'Workflow name is required');
  if (payload.priority !== undefined && !PRIORITIES.includes(payload.priority)) throw new ApiError(400, 'Invalid priority');
  if (payload.status !== undefined && !STATUSES.includes(payload.status)) throw new ApiError(400, 'Invalid status');
  if (payload.owner !== undefined) await assertOwner(organizationId, payload.owner);

  if (body.slaMinutes !== undefined && body.slaMinutes !== null && body.slaMinutes !== '') {
    const minutes = Number(body.slaMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) throw new ApiError(400, 'SLA must be a positive number of minutes');
    payload.sla = { minutes, breached: false };
  }
  return payload;
};

const populateQuery = (query) => query
  .populate('owner', 'firstName lastName email role')
  .populate('assignedUsers', 'firstName lastName email role')
  .populate('createdBy', 'firstName lastName email role')
  .populate('sla.rule', 'name threshold unit escalationTime');

const recordEvent = async (organizationId, userId, workflow, eventType, description) => {
  // Workflow lifecycle events are not tied to a physical operational stage.
  // OperationalEvent.stage is restricted to WORKFLOW_STAGES (collection, testing,
  // chilling, etc.), so do not write the workflow status `in_progress` here.
  await OperationalEvent.create({
    organization: organizationId,
    eventType,
    description,
    entity: { type: 'workflow', id: workflow._id },
    user: userId
  });
};

const list = async (organizationId, filters = {}) => {
  const { search, status, priority, owner, page = 1, limit = 20 } = filters;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const query = { organization: organizationId };
  if (status && STATUSES.includes(status)) query.status = status;
  if (priority && PRIORITIES.includes(priority)) query.priority = priority;
  if (owner) query.owner = owner;
  if (search && String(search).trim()) {
    const term = String(search).trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { relatedOperation: { $regex: term, $options: 'i' } },
      { workflowId: { $regex: term, $options: 'i' } }
    ];
  }
  const [items, total] = await Promise.all([
    populateQuery(Workflow.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum)),
    Workflow.countDocuments(query)
  ]);
  return { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

const getById = async (organizationId, id) => {
  const workflow = await populateQuery(Workflow.findOne({ _id: id, organization: organizationId }));
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  return workflow;
};

const create = async (organizationId, userId, body) => {
  const payload = await buildPayload(body, organizationId);
  const workflow = await Workflow.create({ ...payload, workflowId: makeWorkflowId(), createdBy: userId, organization: organizationId });
  await recordEvent(organizationId, userId, workflow, 'workflow_created', `Workflow ${workflow.workflowId} created`);
  return getById(organizationId, workflow._id);
};

const update = async (organizationId, userId, id, body) => {
  const workflow = await Workflow.findOne({ _id: id, organization: organizationId });
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  const payload = await buildPayload(body, organizationId, true);
  Object.assign(workflow, payload);
  if (workflow.status === 'completed' || workflow.status === 'cancelled') workflow.sla.breached = false;
  await workflow.save();
  await recordEvent(organizationId, userId, workflow, 'workflow_updated', `Workflow ${workflow.workflowId} updated`);
  return getById(organizationId, workflow._id);
};

const remove = async (organizationId, userId, id) => {
  const workflow = await Workflow.findOneAndDelete({ _id: id, organization: organizationId });
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  await recordEvent(organizationId, userId, workflow, 'workflow_deleted', `Workflow ${workflow.workflowId} deleted`);
  return { id: workflow._id, workflowId: workflow.workflowId };
};

const transition = async (organizationId, userId, id, status) => {
  if (!STATUSES.includes(status)) throw new ApiError(400, 'Invalid workflow status');
  const workflow = await Workflow.findOne({ _id: id, organization: organizationId });
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  const oldStatus = workflow.status;
  workflow.status = status;
  if (status === 'completed' || status === 'cancelled') workflow.sla.breached = false;
  await workflow.save();
  await recordEvent(organizationId, userId, workflow, 'workflow_status_changed', `Workflow ${workflow.workflowId} changed from ${oldStatus} to ${status}`);
  return getById(organizationId, workflow._id);
};

const getUsers = async (organizationId) => User.find({ organization: organizationId, isActive: true }).select('_id firstName lastName email role').sort({ firstName: 1, lastName: 1 });

module.exports = { list, getById, create, update, remove, transition, getUsers };
