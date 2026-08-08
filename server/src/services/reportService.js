const MilkLot = require('../models/MilkLot');
const QualityTest = require('../models/QualityTest');
const Payment = require('../models/Payment');
const Batch = require('../models/Batch');
const Inventory = require('../models/Inventory');
const AnomalyEvent = require('../models/AnomalyEvent');
const Prediction = require('../models/Prediction');
const AiRun = require('../models/AiRun');
const ReportRun = require('../models/ReportRun');
const ApiError = require('../utils/ApiError');

const MAX_RANGE_DAYS = 366;
const PREVIEW_LIMIT = 100;

const REPORT_TYPES = [
  { id: 'daily_operations', key: 'daily_operations', name: 'Daily Operations Report', description: 'Daily operational volumes, quality checks, production and payments.' },
  { id: 'collection', key: 'collection', name: 'Collection Report', description: 'Milk collection lots, quantities and operational status.' },
  { id: 'quality', key: 'quality', name: 'Quality Report', description: 'Quality tests, grades and recorded results.' },
  { id: 'production', key: 'production', name: 'Production Report', description: 'Production batches, quantities, yields and status.' },
  { id: 'inventory', key: 'inventory', name: 'Inventory Report', description: 'Current inventory levels and stock status.' },
  { id: 'payments', key: 'payments', name: 'Payments Report', description: 'Farmer payment records and amounts.' },
  { id: 'anomalies', key: 'anomalies', name: 'Anomalies Report', description: 'Detected anomalies, severity, risk and status.' },
  { id: 'forecast', key: 'forecast', name: 'Forecast Report', description: 'Generated baseline forecast runs and forecast metadata.' },
  { id: 'prediction', key: 'prediction', name: 'Prediction Report', description: 'Generated predictive risk results and model metadata.' }
];

const TYPE_ALIASES = { payment: 'payments', anomaly: 'anomalies' };

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const formatDate = (value) => value ? new Date(value).toISOString() : '';

const normalizeDates = (filters = {}) => {
  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new ApiError(400, 'Invalid report date range');
  if (start > end) throw new ApiError(400, 'Start date must be before end date');
  const rangeDays = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
  if (rangeDays > MAX_RANGE_DAYS) throw new ApiError(400, `Report date range cannot exceed ${MAX_RANGE_DAYS} days`);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const dateQuery = (organizationId, field, start, end) => ({ organization: organizationId, [field]: { $gte: start, $lte: end } });

const matchesFilters = (query, filters = {}) => {
  if (filters.status) query.status = filters.status;
  if (filters.severity) query.severity = filters.severity;
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    query.$or = [{ title: regex }, { description: regex }, { type: regex }, { status: regex }, { lotId: regex }, { testId: regex }, { batchId: regex }, { paymentId: regex }, { anomalyId: regex }, { predictionType: regex }];
  }
  return query;
};

const definitions = (organizationId, start, end, filters) => ({
  collection: {
    model: MilkLot, query: matchesFilters(dateQuery(organizationId, 'collectionDate', start, end), filters), sort: { collectionDate: -1 },
    columns: ['Lot ID', 'Quantity (L)', 'Status', 'Collection Date'], transform: (r) => [r.lotId, r.quantityLitres, r.status, formatDate(r.collectionDate || r.createdAt)]
  },
  quality: {
    model: QualityTest, query: matchesFilters(dateQuery(organizationId, 'testDate', start, end), filters), sort: { testDate: -1 },
    columns: ['Test ID', 'Milk Lot ID', 'Grade', 'Result', 'Test Date'], transform: (r) => [r.testId, r.milkLot?.lotId || r.milkLot || '', r.grade || r.qualityGrade || '', r.result || '', formatDate(r.testDate || r.createdAt)]
  },
  production: {
    model: Batch, query: matchesFilters(dateQuery(organizationId, 'createdAt', start, end), filters), sort: { createdAt: -1 },
    columns: ['Batch ID', 'Product ID', 'Quantity', 'Yield', 'Status', 'Created At'], transform: (r) => [r.batchId, r.product?.name || r.product || '', r.totalQuantity, r.plantYield, r.status, formatDate(r.createdAt)]
  },
  inventory: {
    model: Inventory, query: matchesFilters(dateQuery(organizationId, 'updatedAt', start, end), filters), sort: { updatedAt: -1 },
    columns: ['Location', 'Product ID', 'Quantity', 'Minimum Stock', 'Unit', 'Status', 'Updated At'], transform: (r) => [r.location || '', r.product?.name || r.product || '', r.quantity, r.minimumStock, r.unit || '', r.status || (Number(r.quantity) < Number(r.minimumStock) ? 'low_stock' : 'ok'), formatDate(r.updatedAt || r.createdAt)]
  },
  payments: {
    model: Payment, query: matchesFilters(dateQuery(organizationId, 'createdAt', start, end), filters), sort: { createdAt: -1 },
    columns: ['Payment ID', 'Farmer ID', 'Amount', 'Status', 'Created At'], transform: (r) => [r.paymentId, r.farmer?.name || r.farmer || '', r.netAmount, r.status, formatDate(r.createdAt)]
  },
  anomalies: {
    model: AnomalyEvent, query: matchesFilters(dateQuery(organizationId, 'detectedAt', start, end), filters), sort: { detectedAt: -1 },
    columns: ['Anomaly ID', 'Type', 'Severity', 'Risk Score', 'Status', 'Detected At'], transform: (r) => [r.anomalyId, r.type, r.severity, r.riskScore, r.status, formatDate(r.detectedAt || r.createdAt)]
  },
  prediction: {
    model: Prediction, query: matchesFilters(dateQuery(organizationId, 'createdAt', start, end), filters), sort: { createdAt: -1 },
    columns: ['Prediction Type', 'Entity', 'Prediction', 'Confidence', 'Risk Level', 'Model Version', 'Created At'], transform: (r) => [r.predictionType, r.entity?.type || '', r.prediction, r.confidence, r.riskLevel, r.modelVersion, formatDate(r.createdAt)]
  },
  forecast: {
    model: AiRun, query: { ...dateQuery(organizationId, 'createdAt', start, end), type: 'forecast' }, sort: { createdAt: -1 },
    columns: ['Run ID', 'Metric', 'Method', 'Status', 'Generated At', 'Forecast Points'], transform: (r) => [r.runId, r.output?.metric || r.input?.type || '', r.output?.method || '', r.status, formatDate(r.createdAt), Array.isArray(r.output?.result) ? r.output.result.length : 0]
  }
});

const buildDailyOperations = async (organizationId, start, end) => {
  const [collection, quality, production, payments] = await Promise.all([
    MilkLot.aggregate([{ $match: dateQuery(organizationId, 'collectionDate', start, end) }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectionDate' } }, litres: { $sum: { $ifNull: ['$quantityLitres', 0] } }, lots: { $sum: 1 }, rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } } } }, { $sort: { _id: -1 } }]),
    QualityTest.aggregate([{ $match: dateQuery(organizationId, 'testDate', start, end) }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$testDate' } }, tests: { $sum: 1 } } }]),
    Batch.aggregate([{ $match: dateQuery(organizationId, 'createdAt', start, end) }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, productionQuantity: { $sum: { $ifNull: ['$totalQuantity', 0] } }, batches: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: dateQuery(organizationId, 'createdAt', start, end) }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, payments: { $sum: 1 }, paidAmount: { $sum: { $ifNull: ['$netAmount', 0] } } } }])
  ]);
  const map = new Map();
  const ensure = (day) => { if (!map.has(day)) map.set(day, { date: day, collectedLitres: 0, collectionLots: 0, rejectedLots: 0, qualityTests: 0, productionQuantity: 0, productionBatches: 0, payments: 0, paidAmount: 0 }); return map.get(day); };
  collection.forEach((r) => { const x = ensure(r._id); x.collectedLitres = r.litres; x.collectionLots = r.lots; x.rejectedLots = r.rejected; });
  quality.forEach((r) => { ensure(r._id).qualityTests = r.tests; });
  production.forEach((r) => { const x = ensure(r._id); x.productionQuantity = r.productionQuantity; x.productionBatches = r.batches; });
  payments.forEach((r) => { const x = ensure(r._id); x.payments = r.payments; x.paidAmount = r.paidAmount; });
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
};

const reportService = {
  getReportTypes: () => REPORT_TYPES,

  generateReport: async (organizationId, requestedBy, options = {}) => {
    const type = TYPE_ALIASES[options.type] || options.type;
    const filters = { ...(options.filters || {}), startDate: options.startDate || options.filters?.startDate, endDate: options.endDate || options.filters?.endDate };
    const { start, end } = normalizeDates(filters);
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || PREVIEW_LIMIT, 1), PREVIEW_LIMIT);
    const reportRun = await ReportRun.create({ organization: organizationId, requestedBy, type, format: 'preview', filters: { ...filters, page, limit }, metadata: { title: REPORT_TYPES.find((r) => r.id === type)?.name || type, startDate: start, endDate: end, generatedAt: new Date() } });
    try {
      if (type === 'daily_operations') {
        const rows = await buildDailyOperations(organizationId, start, end);
        reportRun.metadata.recordCount = rows.length; reportRun.metadata.previewCount = Math.min(rows.length, limit); reportRun.status = 'completed'; reportRun.metadata.completedAt = new Date(); await reportRun.save();
        return { reportId: reportRun._id, metadata: reportRun.metadata, columns: ['Date', 'Collected (L)', 'Lots', 'Rejected Lots', 'Quality Tests', 'Production Qty', 'Production Batches', 'Payments', 'Paid Amount'], data: rows.slice((page - 1) * limit, page * limit).map((r) => [r.date, r.collectedLitres, r.collectionLots, r.rejectedLots, r.qualityTests, r.productionQuantity, r.productionBatches, r.payments, r.paidAmount]), total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit) };
      }
      const definition = definitions(organizationId, start, end, filters)[type];
      if (!definition) throw new ApiError(400, 'Invalid report type');
      const total = await definition.model.countDocuments(definition.query);
      const rows = await definition.model.find(definition.query).sort(definition.sort).skip((page - 1) * limit).limit(limit).lean();
      reportRun.metadata.recordCount = total; reportRun.metadata.previewCount = rows.length; reportRun.status = 'completed'; reportRun.metadata.completedAt = new Date(); await reportRun.save();
      return { reportId: reportRun._id, metadata: reportRun.metadata, columns: definition.columns, data: rows.map(definition.transform), total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      reportRun.status = 'failed'; reportRun.error = error.message; reportRun.metadata.completedAt = new Date(); await reportRun.save(); throw error;
    }
  },

  streamCsv: async (organizationId, requestedBy, options, res) => {
    const type = TYPE_ALIASES[options.type] || options.type;
    const filters = { ...(options.filters || {}), startDate: options.startDate || options.filters?.startDate, endDate: options.endDate || options.filters?.endDate };
    const { start, end } = normalizeDates(filters);
    const reportRun = await ReportRun.create({ organization: organizationId, requestedBy, type, format: 'csv', filters, metadata: { title: REPORT_TYPES.find((r) => r.id === type)?.name || type, startDate: start, endDate: end, generatedAt: new Date() } });
    try {
      let columns; let total; let writeRow; let cursor;
      if (type === 'daily_operations') {
        const rows = await buildDailyOperations(organizationId, start, end); total = rows.length; columns = ['Date', 'Collected (L)', 'Lots', 'Rejected Lots', 'Quality Tests', 'Production Qty', 'Production Batches', 'Payments', 'Paid Amount']; writeRow = (r) => [r.date, r.collectedLitres, r.collectionLots, r.rejectedLots, r.qualityTests, r.productionQuantity, r.productionBatches, r.payments, r.paidAmount]; cursor = rows;
      } else {
        const definition = definitions(organizationId, start, end, filters)[type]; if (!definition) throw new ApiError(400, 'Invalid report type');
        total = await definition.model.countDocuments(definition.query); columns = definition.columns; writeRow = definition.transform; cursor = definition.model.find(definition.query).sort(definition.sort).lean().cursor();
      }
      const csvValue = (value) => `"${value == null ? '' : String(value).replace(/"/g, '""')}"`;
      const filename = `${type}-report-${start.toISOString().slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.write(`${columns.map(csvValue).join(',')}\n`);
      if (Array.isArray(cursor)) {
        for (const row of cursor) res.write(`${writeRow(row).map(csvValue).join(',')}\n`);
      } else {
        for await (const row of cursor) { if (!res.write(`${writeRow(row).map(csvValue).join(',')}\n`)) await new Promise((resolve) => res.once('drain', resolve)); }
      }
      reportRun.status = 'completed'; reportRun.metadata.recordCount = total; reportRun.metadata.completedAt = new Date(); await reportRun.save(); res.end();
    } catch (error) {
      reportRun.status = 'failed'; reportRun.error = error.message; reportRun.metadata.completedAt = new Date(); await reportRun.save(); if (!res.headersSent) throw error; res.end();
    }
  },

  getHistory: async (organizationId, filters = {}) => {
    const page = Math.max(Number(filters.page) || 1, 1); const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 50); const query = { organization: organizationId };
    if (filters.type) query.type = TYPE_ALIASES[filters.type] || filters.type; if (filters.status) query.status = filters.status;
    const [items, total] = await Promise.all([ReportRun.find(query).populate('requestedBy', 'firstName lastName email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), ReportRun.countDocuments(query)]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
};

module.exports = reportService;
