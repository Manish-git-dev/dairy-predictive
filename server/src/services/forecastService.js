const MilkLot = require('../models/MilkLot');
const Batch = require('../models/Batch');
const CollectionCentre = require('../models/CollectionCentre');
const AiRun = require('../models/AiRun');
const getPagination = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

const MAX_HISTORY_DAYS = 365;
const MIN_OBSERVATIONS = 3;

const toDayKey = (date) => new Date(date).toISOString().slice(0, 10);

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const addDays = (date, days) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const buildDailySeries = (startDate, endDate) => {
  const series = [];
  for (let cursor = new Date(startDate); cursor <= endDate; cursor = addDays(cursor, 1)) {
    series.push({ date: toDayKey(cursor), actual: 0 });
  }
  return series;
};

const weightedMovingAverage = (values) => {
  if (!values.length) return 0;
  let weightedTotal = 0;
  let weightTotal = 0;
  values.forEach((value, index) => {
    const weight = index + 1;
    weightedTotal += value * weight;
    weightTotal += weight;
  });
  return weightedTotal / weightTotal;
};

const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1);
  return Math.sqrt(Math.max(variance, 0));
};

const getHistory = async (organizationId, metric, historyDays) => {
  const endDate = startOfDay(new Date());
  const startDate = addDays(endDate, -(historyDays - 1));
  const query = { organization: organizationId, createdAt: { $gte: startDate, $lt: addDays(endDate, 1) } };

  if (metric === 'milk_collection') {
    const lots = await MilkLot.find(query).select('quantityLitres createdAt').lean();
    const daily = buildDailySeries(startDate, endDate);
    const byDay = new Map(daily.map((item) => [item.date, item]));
    lots.forEach((lot) => {
      const item = byDay.get(toDayKey(lot.createdAt));
      if (item) item.actual += Number(lot.quantityLitres) || 0;
    });
    return { daily, unit: 'litres', label: 'Milk collection' };
  }

  if (metric === 'operational_volume' || metric === 'demand') {
    const batchQuery = metric === 'demand' ? { ...query, status: 'dispatched' } : query;
    const batches = await Batch.find(batchQuery).select('totalQuantity createdAt').lean();
    const daily = buildDailySeries(startDate, endDate);
    const byDay = new Map(daily.map((item) => [item.date, item]));
    batches.forEach((batch) => {
      const item = byDay.get(toDayKey(batch.createdAt));
      if (item) item.actual += Number(batch.totalQuantity) || 0;
    });
    return {
      daily,
      unit: 'litres',
      label: metric === 'demand' ? 'Demand proxy (dispatched volume)' : 'Operational volume'
    };
  }

  if (metric === 'capacity') {
    const centres = await CollectionCentre.find({ organization: organizationId, isActive: true })
      .select('capacityLitres')
      .lean();
    const capacity = centres.reduce((sum, centre) => sum + (Number(centre.capacityLitres) || 0), 0);
    const milkHistory = await getHistory(organizationId, 'milk_collection', historyDays);
    const daily = milkHistory.daily.map((item) => ({
      date: item.date,
      actual: capacity > 0 ? (item.actual / capacity) * 100 : 0
    }));
    return { daily, unit: '%', label: 'Capacity utilization' };
  }

  throw new ApiError(400, 'Unsupported forecast metric');
};

const generateBaselineForecast = async (organizationId, options = {}) => {
  const metric = options.metric || 'milk_collection';
  const horizon = Math.min(Math.max(Number(options.horizon) || 7, 1), 90);
  const historyDays = Math.min(Math.max(Number(options.historyDays) || 30, 7), MAX_HISTORY_DAYS);
  const history = await getHistory(organizationId, metric, historyDays);

  const observed = history.daily.map((item) => Number(item.actual)).filter(Number.isFinite);
  const nonZeroObservations = observed.filter((value) => value > 0);
  if (nonZeroObservations.length < MIN_OBSERVATIONS) {
    throw new ApiError(
      422,
      `Not enough historical ${history.label.toLowerCase()} data. At least ${MIN_OBSERVATIONS} non-zero daily observations are required.`
    );
  }

  const windowSize = Math.min(7, nonZeroObservations.length);
  const recent = nonZeroObservations.slice(-windowSize);
  const baseline = weightedMovingAverage(recent);

  // Estimate uncertainty from one-step-ahead residuals using the same weighted baseline.
  const residuals = [];
  for (let index = windowSize; index < nonZeroObservations.length; index += 1) {
    const sample = nonZeroObservations.slice(index - windowSize, index);
    const estimate = weightedMovingAverage(sample);
    residuals.push(nonZeroObservations[index] - estimate);
  }
  const errorStd = standardDeviation(residuals);
  const fallbackSpread = Math.max(baseline * 0.05, 1);
  const spread = errorStd > 0 ? errorStd : fallbackSpread;
  const generatedAt = new Date().toISOString();
  const lastHistoryDate = new Date(`${history.daily[history.daily.length - 1].date}T00:00:00.000Z`);
  const forecast = [];

  for (let step = 1; step <= horizon; step += 1) {
    const date = addDays(lastHistoryDate, step);
    const predicted = Math.max(0, baseline);
    const interval = 1.96 * spread * Math.sqrt(step);
    const lower = Math.max(0, predicted - interval);
    const upper = Math.max(lower, predicted + interval);
    const confidence = Math.max(50, Math.min(95, 95 - (step - 1) * (40 / Math.max(horizon - 1, 1))));

    forecast.push({
      date: toDayKey(date),
      predicted: Number(predicted.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      upper: Number(upper.toFixed(2)),
      confidence: Number(confidence.toFixed(1)),
      model: '7-day weighted moving average',
      generatedAt
    });
  }

  const aiRun = new AiRun({
    organization: organizationId,
    runId: `AIR-${Date.now()}`,
    type: 'forecast',
    modelVersion: 'baseline-wma-1.0',
    input: {
      type: metric,
      snapshot: { historyDays, horizon, observations: nonZeroObservations.length }
    },
    output: {
      metric,
      unit: history.unit,
      method: '7-day weighted moving average',
      generatedAt,
      historical: history.daily,
      result: forecast,
      confidence: forecast.length ? forecast[0].confidence / 100 : 0,
      reasoning: 'Forecast is calculated from real organization-scoped historical operational records. Uncertainty is estimated from historical one-step residual variation.'
    },
    status: 'completed'
  });
  await aiRun.save();

  return {
    metric,
    label: history.label,
    unit: history.unit,
    method: '7-day weighted moving average',
    historyDays,
    horizon,
    generatedAt,
    historical: history.daily,
    forecast,
    risk: forecast[0].confidence < 70 ? 'high' : forecast[0].confidence < 85 ? 'medium' : 'low'
  };
};

const forecastService = {
  generateForecast: generateBaselineForecast,

  generateDemandForecast: (organizationId, options = {}) =>
    generateBaselineForecast(organizationId, { ...options, metric: 'demand' }),

  generateWorkloadForecast: (organizationId, options = {}) =>
    generateBaselineForecast(organizationId, { ...options, metric: 'operational_volume' }),

  generateResourceForecast: (organizationId, options = {}) =>
    generateBaselineForecast(organizationId, { ...options, metric: 'capacity' }),

  getForecasts: async (organizationId, filters = {}) => {
    const { type, page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);
    const query = { organization: organizationId, type: 'forecast' };
    if (type) query['input.type'] = type;

    const items = await AiRun.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();
    const total = await AiRun.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }
};

module.exports = forecastService;
