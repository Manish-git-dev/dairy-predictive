const forecastService = require('../services/forecastService');

const generateForecast = async (req, res, next) => {
  try {
    const result = await forecastService.generateForecast(req.organizationId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const generateDemandForecast = async (req, res, next) => {
  try {
    const result = await forecastService.generateDemandForecast(req.organizationId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const generateWorkloadForecast = async (req, res, next) => {
  try {
    const result = await forecastService.generateWorkloadForecast(req.organizationId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const generateResourceForecast = async (req, res, next) => {
  try {
    const result = await forecastService.generateResourceForecast(req.organizationId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getForecasts = async (req, res, next) => {
  try {
    const { type, page, limit } = req.query;
    const result = await forecastService.getForecasts(req.organizationId, { type, page, limit });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateForecast,
  generateDemandForecast,
  generateWorkloadForecast,
  generateResourceForecast,
  getForecasts
};
