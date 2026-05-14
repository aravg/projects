import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const booksAPI = {
  getAll: () => api.get('/books/'),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books/', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

export const borrowersAPI = {
  getAll: () => api.get('/borrowers/'),
  create: (data) => api.post('/borrowers/', data),
  update: (id, data) => api.put(`/borrowers/${id}`, data),
  delete: (id) => api.delete(`/borrowers/${id}`),
};

export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  borrow: (data) => api.post('/borrow', data),
  return: (data) => api.post('/return', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
};

export const searchAPI = {
  search: (params) => api.get('/search', { params }),
};

export default api;
