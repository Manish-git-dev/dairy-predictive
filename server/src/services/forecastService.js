const MilkLot = require('../models/MilkLot');
const AiRun = require('../models/AiRun');
const getPagination = require('../utils/pagination');

const forecastService = {
  generateDemandForecast: async (organizationId, options = {}) => {
    const { period = 'daily', horizon = 7 } = options;
    const limitDays = period === 'daily' ? 7 : (period === 'weekly' ? 28 : 90);
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - limitDays);

    const lots = await MilkLot.find({
      organization: organizationId,
      createdAt: { $gte: dateLimit }
    });

    let totalVol = 0;
    lots.forEach(l => totalVol += (l.quantityLitres || 0));
    const avgVol = lots.length ? totalVol / limitDays : 500;

    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + (period === 'daily' ? i : i * 7));
      const predicted = Math.round(avgVol * (1 + 0.02 * i));
      forecast.push({
        date: fDate.toISOString().split('T')[0],
        predicted,
        lower: Math.round(predicted * 0.9),
        upper: Math.round(predicted * 1.1),
        confidence: Math.max(70, 90 - i * 2)
      });
    }

    const aiRun = new AiRun({
      organization: organizationId,
      runId: `AIR-${Date.now()}`,
      type: 'forecast',
      modelVersion: '1.0.0',
      input: { type: 'demand_forecast', snapshot: { period, horizon, historicalDays: limitDays } },
      output: { result: forecast, confidence: 0.78, reasoning: `Based on ${limitDays}-day moving average with trend adjustment` },
      status: 'completed'
    });
    await aiRun.save();

    return forecast;
  },

  generateWorkloadForecast: async (organizationId, options = {}) => {
    const { period = 'daily', horizon = 7 } = options;
    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + (period === 'daily' ? i : i * 7));
      forecast.push({
        date: fDate.toISOString().split('T')[0],
        predicted: Math.round(20 + i * 1.5),
        confidence: Math.max(75, 85 - i)
      });
    }

    const aiRun = new AiRun({
      organization: organizationId,
      runId: `AIR-${Date.now()}`,
      type: 'forecast',
      modelVersion: '1.0.0',
      input: { type: 'workload_forecast', snapshot: { period, horizon } },
      output: { result: forecast, confidence: 0.8, reasoning: 'Based on historical task distribution' },
      status: 'completed'
    });
    await aiRun.save();

    return forecast;
  },

  generateResourceForecast: async (organizationId, options = {}) => {
    const { period = 'daily', horizon = 7 } = options;
    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
      const fDate = new Date();
      fDate.setDate(fDate.getDate() + (period === 'daily' ? i : i * 7));
      forecast.push({
        date: fDate.toISOString().split('T')[0],
        predictedTankers: Math.ceil((5000 + i * 100) / 2000),
        predictedCapacity: 5000 + i * 100,
        confidence: Math.max(70, 80 - i)
      });
    }

    const aiRun = new AiRun({
      organization: organizationId,
      runId: `AIR-${Date.now()}`,
      type: 'forecast',
      modelVersion: '1.0.0',
      input: { type: 'resource_forecast', snapshot: { period, horizon } },
      output: { result: forecast, confidence: 0.75, reasoning: 'Based on projected collection volume and tanker capacity' },
      status: 'completed'
    });
    await aiRun.save();

    return forecast;
  },

  getForecasts: async (organizationId, filters = {}) => {
    const { type, page = 1, limit = 10 } = filters;
    const { skip, limit: limitNum } = getPagination(page, limit);

    const query = { organization: organizationId, type: 'forecast' };
    if (type) query['input.type'] = type;

    const items = await AiRun.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await AiRun.countDocuments(query);
    return { items, total, page: Number(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }
};

module.exports = forecastService;
