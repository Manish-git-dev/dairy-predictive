import api from './api';

const unwrap = response => response.data;

export const preventiveRuleService = {
  getAll: async params => unwrap(await api.get('/preventive-rules', { params })),
  getById: async id => unwrap(await api.get(`/preventive-rules/${id}`)),
  create: async data => unwrap(await api.post('/preventive-rules', data)),
  update: async (id, data) => unwrap(await api.put(`/preventive-rules/${id}`, data)),
  remove: async id => unwrap(await api.delete(`/preventive-rules/${id}`)),
  setEnabled: async (id, enabled) => unwrap(await api.patch(`/preventive-rules/${id}/enabled`, { enabled })),
  test: async id => unwrap(await api.post(`/preventive-rules/${id}/test`)),
  trigger: async id => unwrap(await api.post(`/preventive-rules/${id}/trigger`)),
  history: async id => unwrap(await api.get(`/preventive-rules/${id}/history`))
};

export default preventiveRuleService;
