import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ekbms_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ekbms_token')
      localStorage.removeItem('ekbms_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
}

export const articlesAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getOne: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  submit: (id) => api.post(`/articles/${id}/submit`),
  bookmark: (id) => api.post(`/articles/${id}/bookmark`),
  getBookmark: (id) => api.get(`/articles/${id}/bookmarks`),
  rate: (id, rating) => api.post(`/articles/${id}/rate`, { rating }),
  getRatings: (id) => api.get(`/articles/${id}/ratings`)
}

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
}

export const tagsAPI = {
  getAll: () => api.get('/tags'),
  create: (data) => api.post('/tags', data),
  delete: (id) => api.delete(`/tags/${id}`)
}

export const searchAPI = {
  search: (params) => api.get('/search', { params })
}

export const commentsAPI = {
  getAll: (articleId) => api.get(`/comments/${articleId}`),
  create: (articleId, data) => api.post(`/comments/${articleId}`, data),
  delete: (id) => api.delete(`/comments/${id}`)
}

export const filesAPI = {
  upload: (articleId, formData) => api.post(`/files/upload/${articleId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (articleId) => api.get(`/files/${articleId}`),
  delete: (id) => api.delete(`/files/${id}`)
}

export const approvalsAPI = {
  getPending: () => api.get('/approvals/pending'),
  approve: (articleId, data) => api.post(`/approvals/${articleId}/approve`, data),
  reject: (articleId, data) => api.post(`/approvals/${articleId}/reject`, data),
  getHistory: () => api.get('/approvals/history')
}

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  updateStatus: (id) => api.put(`/users/${id}/status`),
  delete: (id) => api.delete(`/users/${id}`)
}

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getSearchTrends: () => api.get('/analytics/search-trends'),
  getUserActivity: () => api.get('/analytics/user-activity'),
  getPopularCategories: () => api.get('/analytics/popular-categories')
}

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
}

export default api
