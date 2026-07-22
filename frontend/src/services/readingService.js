import api from './api';

export const readingService = {
  getAll(params) {
    return api.get('/readings', { params });
  },

  getByMeter(meterId, params) {
    return api.get(`/readings/meter/${meterId}`, { params });
  },

  create(data) {
    return api.post('/readings', data);
  },

  getStats(meterId, params) {
    return api.get(`/readings/meter/${meterId}/stats`, { params });
  },
};
