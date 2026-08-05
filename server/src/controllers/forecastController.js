const forecastService = require('../services/forecastService');

const generateDemandForecast = async (req, res, next) => {
  try {
    const { period, horizon } = req.body;
    const result = await forecastService.generateDemandForecast(req.organizationId, { period, horizon });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const generateWorkloadForecast = async (req, res, next) => {
  try {
    const { period, horizon } = req.body;
    const result = await forecastService.generateWorkloadForecast(req.organizationId, { period, horizon });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const generateResourceForecast = async (req, res, next) => {
  try {
    const { period, horizon } = req.body;
    const result = await forecastService.generateResourceForecast(req.organizationId, { period, horizon });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getForecasts = async (req, res, next) => {
  try {
    const { type } = req.query;
    const result = await forecastService.getForecasts(req.organizationId, { type });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateDemandForecast,
  generateWorkloadForecast,
  generateResourceForecast,
  getForecasts
};
