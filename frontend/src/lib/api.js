import axios from 'axios';

export const apiBaseUrl = (import.meta.env.VITE_API_URL || 'https://discipline-zgl3.onrender.com/api').replace(/\/$/, '');
const assetBaseUrl = apiBaseUrl.replace(/\/api$/, '');

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('disciplineos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message
      || (error.message === 'Network Error' ? `Cannot reach API at ${apiBaseUrl}` : error.message)
      || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload).then((response) => response.data),
  login: (payload) => api.post('/auth/login', payload).then((response) => response.data),
  me: () => api.get('/auth/me').then((response) => response.data)
};

export const tasksApi = {
  list: () => api.get('/tasks').then((response) => response.data.tasks),
  create: (payload) => api.post('/tasks', payload).then((response) => response.data.task),
  update: (id, payload) => api.patch(`/tasks/${id}`, payload).then((response) => response.data.task),
  remove: (id) => api.delete(`/tasks/${id}`),
  complete: (id) => api.post(`/tasks/${id}/complete`).then((response) => response.data.task),
  missed: (id) => api.post(`/tasks/${id}/missed`).then((response) => response.data.task),
  snooze: (id, minutes = 10) => api.post(`/tasks/${id}/snooze`, { minutes }).then((response) => response.data.task)
};

export const activitiesApi = {
  list: () => api.get('/activities').then((response) => response.data.activities),
  create: (payload) => api.post('/activities', payload).then((response) => response.data.activity),
  update: (id, payload) => api.patch(`/activities/${id}`, payload).then((response) => response.data.activity),
  remove: (id) => api.delete(`/activities/${id}`)
};

export const analyticsApi = {
  summary: () => api.get('/analytics/summary').then((response) => response.data.summary),
  weekly: () => api.get('/analytics/weekly').then((response) => response.data.trends),
  heatmap: () => api.get('/analytics/heatmap').then((response) => response.data.heatmap)
};

export const notificationsApi = {
  list: () => api.get('/notifications').then((response) => response.data.notifications),
  schedule: (payload) => api.post('/notifications/schedule', payload).then((response) => response.data.notification),
  update: (id, payload) => api.patch(`/notifications/${id}`, payload).then((response) => response.data.notification),
  remove: (id) => api.delete(`/notifications/${id}`),
  snooze: (id, minutes = 10) => api.post(`/notifications/${id}/snooze`, { minutes }).then((response) => response.data.notification),
  acknowledge: (id) => api.post(`/notifications/${id}/acknowledge`).then((response) => response.data.notification),
  processDue: () => api.post('/notifications/process-due').then((response) => response.data)
};

export function resolveAssetUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${assetBaseUrl}${value.startsWith('/') ? value : `/${value}`}`;
}
