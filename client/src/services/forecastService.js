import api from './api';

export const forecastService = {
  generateDemand: async (forecastData) => {
    const response = await api.post('/forecasts/demand', forecastData);
    return response.data;
  },
  generateWorkload: async (forecastData) => {
    const response = await api.post('/forecasts/workload', forecastData);
    return response.data;
  },
  generateResource: async (forecastData) => {
    const response = await api.post('/forecasts/resource', forecastData);
    return response.data;
  },
  getForecasts: async (params) => {
    const response = await api.get('/forecasts', { params });
    return response.data;
  }
};

export default forecastService;
