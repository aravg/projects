import api from '../api'

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary'),
  getCategoryDistribution: () => api.get('/analytics/category-distribution'),
  getPriorityDistribution: () => api.get('/analytics/priority-distribution'),
  getDepartmentCounts: () => api.get('/analytics/department-counts'),
  getResolutionTrends: () => api.get('/analytics/resolution-trends'),
  getDatasetInfo: () => api.get('/etl/dataset-info'),
  runEtl: () => api.post('/etl/run'),
}
