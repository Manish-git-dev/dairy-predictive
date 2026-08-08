const PreventiveRule = require('../models/PreventiveRule');
const Approval = require('../models/Approval');
const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');
const Tanker = require('../models/Tanker');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const METRICS = {
  rejection_rate: 'Rejected milk lots as a percentage of all lots in the evaluation window',
  collection_volume: 'Total milk collection volume in litres in the evaluation window',
  average_fat: 'Average fat percentage from quality tests in the evaluation window',
  average_snf: 'Average SNF percentage from quality tests in the evaluation window',
  temperature: 'Average milk temperature in °C in the evaluation window',
  inventory_quantity: 'Total inventory quantity recorded in the evaluation window',
  payment_total: 'Total net payment amount in the evaluation window',
  capacity_utilization: 'Average tanker load divided by tanker capacity, expressed as a percentage'
};

const compare = (value, operator, threshold) => {
  switch (operator) {
    case '>': return value > threshold;
    case '>=': return value >= threshold;
    case '<': return value < threshold;
    case '<=': return value <= threshold;
    case '=': return value === threshold;
    case '!=': return value !== threshold;
    default: return false;
  }
};

const finiteAverage = values => {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
};

const getMetricValue = async (metric, organizationId, windowHours = 24) => {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  switch (metric) {
    case 'rejection_rate': {
      const [total, rejected] = await Promise.all([
        MilkLot.countDocuments({ organization: organizationId, createdAt: { $gte: since } }),
        MilkLot.countDocuments({ organization: organizationId, createdAt: { $gte: since }, status: 'rejected' })
      ]);
      return { value: total ? (rejected / total) * 100 : null, unit: '%', sampleSize: total };
    }
    case 'collection_volume': {
      const rows = await MilkLot.find({ organization: organizationId, createdAt: { $gte: since } }).select('quantityLitres').lean();
      const value = rows.reduce((sum, row) => sum + (Number.isFinite(row.quantityLitres) ? row.quantityLitres : 0), 0);
      return { value: rows.length ? value : null, unit: 'L', sampleSize: rows.length };
    }
    case 'average_fat':
    case 'average_snf': {
      const rows = await QualityTest.find({ organization: organizationId, createdAt: { $gte: since } }).select('parameters').lean();
      const key = metric === 'average_fat' ? 'fat' : 'snf';
      const value = finiteAverage(rows.map(row => Number(row.parameters && row.parameters[key])));
      return { value, unit: '%', sampleSize: rows.length };
    }
    case 'temperature': {
      const rows = await MilkLot.find({ organization: organizationId, createdAt: { $gte: since } }).select('temperature').lean();
      const value = finiteAverage(rows.map(row => Number(row.temperature)));
      return { value, unit: '°C', sampleSize: rows.length };
    }
    case 'inventory_quantity': {
      const rows = await Inventory.find({ organization: organizationId }).select('quantity').lean();
      const clean = rows.map(row => Number(row.quantity)).filter(Number.isFinite);
      return { value: clean.length ? clean.reduce((sum, value) => sum + value, 0) : null, unit: 'units', sampleSize: clean.length };
    }
    case 'payment_total': {
      const rows = await Payment.find({ organization: organizationId, createdAt: { $gte: since } }).select('netAmount').lean();
      const clean = rows.map(row => Number(row.netAmount)).filter(Number.isFinite);
      return { value: clean.length ? clean.reduce((sum, value) => sum + value, 0) : null, unit: 'currency', sampleSize: clean.length };
    }
    case 'capacity_utilization': {
      const rows = await Tanker.find({ organization: organizationId }).select('capacityLitres currentLoad').lean();
      const values = rows
        .map(row => Number(row.capacityLitres) > 0 ? (Number(row.currentLoad) / Number(row.capacityLitres)) * 100 : null)
        .filter(Number.isFinite);
      return { value: finiteAverage(values), unit: '%', sampleSize: values.length };
    }
    default:
      throw new ApiError(400, `Unsupported metric: ${metric}`);
  }
};

const validateRuleInput = async (data, organizationId) => {
  const allowed = ['rejection_rate', 'collection_volume', 'average_fat', 'average_snf', 'temperature', 'inventory_quantity', 'payment_total', 'capacity_utilization'];
  if (!data.name || !data.metric || !data.operator || !data.action) throw new ApiError(400, 'Name, metric, operator and action are required');
  if (!allowed.includes(data.metric)) throw new ApiError(400, 'Unsupported metric');
  if (!['>', '>=', '<', '<=', '=', '!='].includes(data.operator)) throw new ApiError(400, 'Unsupported operator');
  if (!Number.isFinite(Number(data.threshold))) throw new ApiError(400, 'Threshold must be a finite number');
  if (data.owner) {
    const owner = await User.findOne({ _id: data.owner, organization: organizationId, isActive: true }).select('_id').lean();
    if (!owner) throw new ApiError(400, 'Owner is not an active user in this organization');
  }
};

const populateRule = query => query.populate('owner', 'firstName lastName email role').populate('createdBy', 'firstName lastName email role');

const list = async (organizationId, filters = {}) => {
  const query = { organization: organizationId };
  if (filters.enabled !== undefined && filters.enabled !== '') query.enabled = filters.enabled === 'true' || filters.enabled === true;
  if (filters.metric) query.metric = filters.metric;
  const rules = await populateRule(PreventiveRule.find(query).sort({ updatedAt: -1 }));
  return { items: rules, total: rules.length, metrics: METRICS };
};

const getById = async (id, organizationId) => {
  const rule = await populateRule(PreventiveRule.findOne({ _id: id, organization: organizationId }));
  if (!rule) throw new ApiError(404, 'Preventive rule not found');
  return rule;
};

const create = async (data, userId, organizationId) => {
  await validateRuleInput(data, organizationId);
  const rule = await PreventiveRule.create({ ...data, threshold: Number(data.threshold), evaluationWindowHours: Number(data.evaluationWindowHours || 24), createdBy: userId, organization: organizationId });
  return getById(rule._id, organizationId);
};

const update = async (id, data, userId, organizationId) => {
  const rule = await PreventiveRule.findOne({ _id: id, organization: organizationId });
  if (!rule) throw new ApiError(404, 'Preventive rule not found');
  await validateRuleInput({ ...rule.toObject(), ...data }, organizationId);
  Object.assign(rule, data);
  if (data.threshold !== undefined) rule.threshold = Number(data.threshold);
  if (data.evaluationWindowHours !== undefined) rule.evaluationWindowHours = Number(data.evaluationWindowHours);
  await rule.save();
  return getById(rule._id, organizationId);
};

const remove = async (id, organizationId) => {
  const deleted = await PreventiveRule.findOneAndDelete({ _id: id, organization: organizationId });
  if (!deleted) throw new ApiError(404, 'Preventive rule not found');
  return { id, deleted: true };
};

const setEnabled = async (id, enabled, organizationId) => {
  const rule = await PreventiveRule.findOneAndUpdate({ _id: id, organization: organizationId }, { enabled: Boolean(enabled) }, { new: true });
  if (!rule) throw new ApiError(404, 'Preventive rule not found');
  return getById(rule._id, organizationId);
};

const evaluate = async (rule, organizationId) => {
  const metric = await getMetricValue(rule.metric, organizationId, rule.evaluationWindowHours);
  const matched = Number.isFinite(metric.value) && compare(metric.value, rule.operator, Number(rule.threshold));
  return { metric: rule.metric, description: METRICS[rule.metric], value: metric.value, unit: metric.unit, sampleSize: metric.sampleSize, threshold: Number(rule.threshold), operator: rule.operator, matched, evaluatedAt: new Date(), evaluationWindowHours: rule.evaluationWindowHours };
};

const test = async (id, organizationId) => {
  const rule = await PreventiveRule.findOne({ _id: id, organization: organizationId });
  if (!rule) throw new ApiError(404, 'Preventive rule not found');
  return evaluate(rule, organizationId);
};

const trigger = async (id, requesterId, organizationId) => {
  const rule = await PreventiveRule.findOne({ _id: id, organization: organizationId });
  if (!rule) throw new ApiError(404, 'Preventive rule not found');
  if (!rule.enabled) throw new ApiError(409, 'Rule is disabled');

  const result = await evaluate(rule, organizationId);
  if (!result.matched) return { triggered: false, result, message: 'Condition is not currently met; no action was created.' };

  const approval = await Approval.create({
    approvalId: `APR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'anomaly_action',
    title: `Preventive action approval: ${rule.name}`,
    description: `Rule condition ${rule.metric} ${rule.operator} ${rule.threshold} was met. Review the recommended action before execution.`,
    requester: requesterId,
    status: 'pending',
    aiRecommendation: { action: rule.action, confidence: 1, reasoning: `${rule.metric} evaluated at ${result.value}${result.unit} against ${rule.operator} ${rule.threshold}.`, modelVersion: 'rule-engine-1.0.0' },
    relatedEntity: { type: 'PreventiveRule', id: rule._id },
    organization: organizationId
  });

  const historyEntry = { triggeredAt: new Date(), value: result.value, threshold: rule.threshold, operator: rule.operator, matched: true, action: rule.action, approvalId: approval.approvalId, approvalStatus: 'pending', evaluationWindowHours: rule.evaluationWindowHours };
  rule.lastTriggered = new Date();
  rule.triggerHistory = [historyEntry, ...(rule.triggerHistory || [])].slice(0, 50);
  await rule.save();

  return { triggered: true, result, approval, message: 'Condition met. An approval request was created; no operational action was executed automatically.' };
};

const history = async (id, organizationId) => {
  const rule = await PreventiveRule.findOne({ _id: id, organization: organizationId }).select('name triggerHistory lastTriggered');
  if (!rule) throw new ApiError(404, 'Preventive rule not found');
  return { name: rule.name, lastTriggered: rule.lastTriggered, items: rule.triggerHistory || [] };
};

module.exports = { list, getById, create, update, remove, setEnabled, test, trigger, history, METRICS };
