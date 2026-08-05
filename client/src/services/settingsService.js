import api from './api';

export const settingsService = {
  getAllSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  getSetting: async (key) => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },
  setSetting: async (key, configData) => {
    const response = await api.put(`/settings/${key}`, configData);
    return response.data;
  },
  deleteSetting: async (key) => {
    const response = await api.delete(`/settings/${key}`);
    return response.data;
  },
  getBulkSettings: async (keys) => {
    const response = await api.post('/settings/bulk', { keys });
    return response.data;
  }
};

export default settingsService;
