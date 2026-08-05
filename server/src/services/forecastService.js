const MilkLot = require('../models/MilkLot');
const AiRun = require('../models/AiRun');
const Task = require('../models/Task');

const forecastService = {
  generateDemandForecast: async (organizationId, period, horizon) => {
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
    const trend = 10; // Mock trend

    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
       const fDate = new Date();
       fDate.setDate(fDate.getDate() + (period === 'daily' ? i : i * 7));
       const predicted = avgVol + (trend * i);
       forecast.push({
         date: fDate.toISOString().split('T')[0],
         predicted,
         lower: predicted * 0.9,
         upper: predicted * 1.1,
         confidence: 90
       });
    }

    const aiRun = new AiRun({
      organization: organizationId,
      type: 'forecast',
      input: { period, horizon },
      output: forecast
    });
    await aiRun.save();

    return forecast;
  },

  generateWorkloadForecast: async (organizationId, period, horizon) => {
    // Mock implementation for tasks
    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
       const fDate = new Date();
       fDate.setDate(fDate.getDate() + i);
       forecast.push({
         date: fDate.toISOString().split('T')[0],
         predicted: 20 + i,
         confidence: 85
       });
    }
    return forecast;
  },

  generateResourceForecast: async (organizationId, period, horizon) => {
    const forecast = [];
    for (let i = 1; i <= horizon; i++) {
       const fDate = new Date();
       fDate.setDate(fDate.getDate() + i);
       forecast.push({
         date: fDate.toISOString().split('T')[0],
         predictedTankers: Math.ceil((5000 + i*100) / 2000), // mock calculation
         confidence: 80
       });
    }
    return forecast;
  },

  getForecasts: async (organizationId, type, filters) => {
    return await AiRun.find({ organization: organizationId, type }).sort({ createdAt: -1 }).limit(10);
  }
};

module.exports = forecastService;
