import api from './api';

export const taskService = {
  getAllTasks: async (params) => (await api.get('/tasks', { params })).data,
  getMyTasks: async (params) => (await api.get('/tasks/my-tasks', { params })).data,
  getAssignees: async () => (await api.get('/tasks/assignees')).data,
  checkSlaBreaches: async () => (await api.get('/tasks/sla-check')).data,
  createTask: async (taskData) => (await api.post('/tasks', taskData)).data,
  getTaskById: async (id) => (await api.get(`/tasks/${id}`)).data,
  updateTask: async (id, taskData) => (await api.put(`/tasks/${id}`, taskData)).data,
  updateTaskStatus: async (id, status) => (await api.patch(`/tasks/${id}/status`, { status })).data,
  assignTask: async (id, assigneeId) => (await api.patch(`/tasks/${id}/assign`, { assigneeId })).data,
  addNote: async (id, text) => (await api.post(`/tasks/${id}/notes`, { text })).data,
  deleteTask: async (id) => (await api.delete(`/tasks/${id}`)).data,
  escalateTask: async (id, escalationData) => (await api.patch(`/tasks/${id}/escalate`, escalationData)).data
};

export default taskService;
