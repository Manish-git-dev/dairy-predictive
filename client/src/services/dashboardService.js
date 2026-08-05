import api from './api';

export const dashboardService = {
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },
  getCollectionTrend: async (params) => {
    const response = await api.get('/dashboard/collection-trend', { params });
    return response.data;
  },
  getQualityDistribution: async (params) => {
    const response = await api.get('/dashboard/quality-distribution', { params });
    return response.data;
  },
  getStageMetrics: async () => {
    const response = await api.get('/dashboard/stage-metrics');
    return response.data;
  }
};

export default dashboardService;
