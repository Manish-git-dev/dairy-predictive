// Job that can be called periodically to refresh forecasts
// Designed to be called from a scheduler or API endpoint
const forecastService = require('../services/forecastService');
const Organization = require('../models/Organization');

const runForecastJob = async () => {
  try {
    console.log('[ForecastJob] Starting forecast generation...');
    const orgs = await Organization.find({ isActive: true });
    for (const org of orgs) {
      try {
        await forecastService.generateDemandForecast(org._id, { period: 'daily', horizon: 7 });
        await forecastService.generateWorkloadForecast(org._id, { period: 'daily', horizon: 7 });
        console.log(`[ForecastJob] Completed forecasts for org: ${org.name}`);
      } catch (err) {
        console.error(`[ForecastJob] Error for org ${org.name}:`, err.message);
      }
    }
    console.log('[ForecastJob] Completed.');
  } catch (error) {
    console.error('[ForecastJob] Fatal error:', error.message);
  }
};

module.exports = { runForecastJob };
