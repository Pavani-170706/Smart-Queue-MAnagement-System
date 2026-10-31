import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  createStaff: (data) => api.post('/api/auth/admin/staff', data),
};

// ── Doctor API ───────────────────────────────────────────────
export const doctorAPI = {
  list: () => api.get('/api/doctors'),
  get: (userId) => api.get(`/api/doctors/${userId}`),
  specializations: () => api.get('/api/doctors/specializations'),
  departments: () => api.get('/api/doctors/departments'),
};

// ── PatientAPI ──────────────────────────────────────────
export const patientAPI = {
  get: (patientId) =>
    api.get(`/api/users/${patientId}`),

  getRecords: (patientId) =>
    api.get(`/api/medical-records/patient/${patientId}`)
};

export const userAPI = {
  get: (id) => api.get(`/api/users/${id}`),
};

// ── Appointment API ──────────────────────────────────────────
export const appointmentAPI = {
  book: (data) => api.post('/api/appointments', data),
  getMy: (customerId) => api.get(`/api/appointments/my/${customerId}`),
  get: (id) => api.get(`/api/appointments/${id}`),
  cancel: (id) => api.put(`/api/appointments/${id}/cancel`),
  getSlots: (doctorId, date) => api.get(`/api/appointments/slots?doctorId=${doctorId}&date=${date}`),
  getDoctorAppointments: (doctorId, date) => api.get(`/api/appointments/doctor/${doctorId}${date ? '?date=' + date : ''}`),
  getAllDoctorAppointments: (doctorId) => api.get(`/api/appointments/doctor/${doctorId}/all`),
  getAll: () => api.get('/api/appointments/all'),
};

// ── Queue API ────────────────────────────────────────────────
export const queueAPI = {
  getQueue: (doctorId, date) => api.get(`/api/queue/${doctorId}${date ? '?date=' + date : ''}`),
  getCustomerTokens: (customerId) => api.get(`/api/queue/customer/${customerId}`),
  getTokenStatus: (appointmentId) => api.get(`/api/queue/status/${appointmentId}`),
  checkIn: (tokenId) => api.post('/api/queue/check-in', { tokenId }),
  startConsultation: (tokenId) => api.post(`/api/queue/${tokenId}/start`),
  complete: (tokenId) => api.post(`/api/queue/${tokenId}/complete`),
  cancelToken: (tokenId) => api.post(`/api/queue/${tokenId}/cancel`),
  skipToken: (tokenId) => api.post(`/api/queue/${tokenId}/skip`),
};

// ── Medical Record API ───────────────────────────────────────
export const medicalAPI = {
  create: (data) => api.post('/api/medical-records', data),
  getPatientRecords: (patientId) => api.get(`/api/medical-records/patient/${patientId}`),
  getDoctorRecords: (doctorId) => api.get(`/api/medical-records/doctor/${doctorId}`),
  getByAppointment: (appointmentId) => api.get(`/api/medical-records/appointment/${appointmentId}`),
};

// ── Notification API ─────────────────────────────────────────
export const notificationAPI = {
  getMy: (userId) =>
    api.get(`/api/notifications/${userId}`),

  getUnreadCount: (userId) =>
    api.get(`/api/notifications/${userId}/unread-count`),

  markAsRead: (notificationId, userId) =>
    api.put(
      `/api/notifications/${notificationId}/read?userId=${userId}`
    ),

  markAllAsRead: (userId) =>
    api.put(`/api/notifications/${userId}/read-all`),
};

// ── Admin API ────────────────────────────────────────────────
export const adminAPI = {
  getCustomers: () => api.get('/api/admin/customers'),
  getStaff: () => api.get('/api/admin/staff'),
  createStaff: (data) => api.post('/api/auth/admin/staff', data),
  updateStaff: (id, data) => api.put(`/api/admin/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/api/admin/staff/${id}`),
  createDoctorProfile: (data) => api.post('/api/admin/doctors', data),
  importDoctorsCsv: (formData) => api.post('/api/admin/doctors/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateDoctorProfile: (id, data) => api.put(`/api/admin/doctors/${id}`, data),
  deactivateCustomer: (id) => api.put(`/api/admin/customers/${id}/deactivate`),
};

export default api;
