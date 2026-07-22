import api from './api';

export const dashboardService = {
  getStats() {
    return api.get('/dashboard/stats');
  },

  getRecentReadings(params) {
    return api.get('/dashboard/recent-readings', { params });
  },

  getUsageTrend(params) {
    return api.get('/dashboard/usage-trend', { params });
  },
};
