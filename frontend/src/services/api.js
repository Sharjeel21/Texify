// frontend/src/services/api.js
import axios from 'axios';

const getAPIBaseURL = () => {
  const hostname = window.location.hostname;

  // 3️⃣ Localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // 4️⃣ Fallback for LAN IP access (e.g. 192.168.x.x)
  return `http://${hostname}:5000/api`;
};

// ✅ Base URL
const API_URL = getAPIBaseURL();
console.log('API Base URL:', API_URL);

// ✅ Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// ============================================
// Request Interceptor - Add Auth Token
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor - Handle Auth Errors
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// Authentication APIs
// ============================================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  verifyToken: (token) => api.post('/auth/verify-token', { token }),
};

// ============================================
// Company Settings APIs
// ============================================
export const companySettingsAPI = {
  get: () => api.get('/company-settings'),
  initCaptcha: () => api.get('/company-settings/gst/init-captcha'),
  verifyGST: (data) => api.post('/company-settings/gst/verify', data),
  createOrUpdate: (data) => api.post('/company-settings', data),
  update: (data) => api.patch('/company-settings', data),
  delete: () => api.delete('/company-settings'),
  
  // Number Series Management
  getNextNumbers: () => api.get('/company-settings/next-numbers'),
  generateInvoiceNumber: () => api.post('/company-settings/generate-invoice-number'),
  generateChallanNumber: () => api.post('/company-settings/generate-challan-number'),
  generatePurchaseNumber: () => api.post('/company-settings/generate-purchase-number'),
  resetNumberSeries: (type) => api.post('/company-settings/reset-number-series', { type }),
  
  // Financial Year Info
  getFinancialYear: () => api.get('/company-settings/financial-year'),
};

// ============================================
// Quality APIs
// ============================================
export const qualityAPI = {
  getAll: () => api.get('/qualities'),
  create: (data) => api.post('/qualities', data),
  update: (id, data) => api.put(`/qualities/${id}`, data),
  delete: (id) => api.delete(`/qualities/${id}`),
};

// ============================================
// Party APIs
// ============================================
export const partyAPI = {
  getAll: (params) => api.get('/parties', { params }),
  initCaptcha: () => api.get('/parties/gst/init-captcha'),
  verifyGST: (data) => api.post('/parties/gst/verify', data),
  create: (data) => api.post('/parties', data),
  update: (id, data) => api.put(`/parties/${id}`, data),
  delete: (id) => api.delete(`/parties/${id}`),
};

// ============================================
// Delivery Challan APIs
// ============================================
export const deliveryChallanAPI = {
  getAll: () => api.get('/delivery-challans'),
  getById: (id) => api.get(`/delivery-challans/${id}`),
  getByQuality: (qualityId) => api.get(`/delivery-challans/by-quality/${qualityId}`),
  getIncomplete: (qualityId) => api.get(`/delivery-challans/incomplete/${qualityId}`),
  getAvailable: (qualityId) => api.get(`/delivery-challans/available/${qualityId}`),
  create: (data) => api.post('/delivery-challans', data),
  addBales: (id, data) => api.post(`/delivery-challans/${id}/add-bales`, data),
  updateBale: (challanId, baleId, data) => api.put(`/delivery-challans/${challanId}/bales/${baleId}`, data),
  deleteBale: (challanId, baleId) => api.delete(`/delivery-challans/${challanId}/bales/${baleId}`),
  markComplete: (id) => api.patch(`/delivery-challans/${id}/mark-complete`),
  delete: (id) => api.delete(`/delivery-challans/${id}`),
};

// ============================================
// Stock APIs
// ============================================
export const stockAPI = {
  getByQuality: (qualityId) => api.get(`/stock/${qualityId}`),
};

// ============================================
// Tax Invoice APIs
// ============================================
export const taxInvoiceAPI = {
  getAll: () => api.get('/tax-invoices'),
  getById: (id) => api.get(`/tax-invoices/${id}`),
  getNextBillNumber: () => api.get('/tax-invoices/next-bill-number'),
  create: (data) => api.post('/tax-invoices', data),
  delete: (id) => api.delete(`/tax-invoices/${id}`),
};

// ============================================
// Deal APIs
// ============================================
export const dealAPI = {
  getAll: (params) => api.get('/deals', { params }),
  getActive: () => api.get('/deals/active'),
  getById: (id) => api.get(`/deals/${id}`),
  getNextDealNumber: () => api.get('/deals/next-deal-number'),
  getAvailableChallans: (id) => api.get(`/deals/${id}/available-challans`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  linkChallan: (id, challanId) => api.post(`/deals/${id}/link-challan`, { challanId }),
  delete: (id) => api.delete(`/deals/${id}`),
};

// ============================================
// Yarn Type APIs
// ============================================
export const yarnTypeAPI = {
  getAll: (params) => api.get('/yarn-types', { params }),
  getById: (id) => api.get(`/yarn-types/${id}`),
  create: (data) => api.post('/yarn-types', data),
  update: (id, data) => api.put(`/yarn-types/${id}`, data),
  delete: (id) => api.delete(`/yarn-types/${id}`),
};

// ============================================
// Purchase APIs
// ============================================
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  getByStatus: (status) => api.get(`/purchases/by-status/${status}`),
  getDeliveries: (id) => api.get(`/purchases/${id}/deliveries`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  complete: (id, data) => api.post(`/purchases/${id}/complete`, data),
  reopen: (id) => api.post(`/purchases/${id}/reopen`),
  delete: (id) => api.delete(`/purchases/${id}`),
  
  // Enhanced Purchase Management System
  getAllNew: (params) => api.get('/purchase', { params }),
  getByIdNew: (id) => api.get(`/purchase/${id}`),
  createNew: (data) => api.post('/purchase', data),
  updateNew: (id, data) => api.put(`/purchase/${id}`, data),
  deleteNew: (id) => api.delete(`/purchase/${id}`),
  
  // Delivery Management
  addDelivery: (purchaseId, data) => api.post(`/purchase/${purchaseId}/delivery`, data),
  getDeliveriesNew: (purchaseId) => api.get(`/purchase/${purchaseId}/deliveries`),
  
  // Payment Management
  recordPayment: (purchaseId, data) => api.post(`/purchase/${purchaseId}/payment`, data),
  getPayments: (purchaseId) => api.get(`/purchase/${purchaseId}/payments`),
  
  // Reports
  getPaymentDueReport: () => api.get('/purchase/reports/payment-due'),
};

// ============================================
// Purchase Delivery APIs
// ============================================
export const purchaseDeliveryAPI = {
  getAll: () => api.get('/purchase-deliveries'),
  getById: (id) => api.get(`/purchase-deliveries/${id}`),
  getByPaymentStatus: (status) => api.get(`/purchase-deliveries/by-payment-status/${status}`),
  getByPurchase: (purchaseId) => api.get(`/purchase-deliveries/by-purchase/${purchaseId}`),
  create: (data) => api.post('/purchase-deliveries', data),
  update: (id, data) => api.put(`/purchase-deliveries/${id}`, data),
  updatePayment: (id, data) => api.put(`/purchase-deliveries/${id}/payment`, data),
  delete: (id) => api.delete(`/purchase-deliveries/${id}`),
};

// ============================================
// Payment APIs
// ============================================
export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  getByPurchase: (purchaseId) => api.get(`/payments/by-purchase/${purchaseId}`),
  getByDelivery: (deliveryId) => api.get(`/payments/by-delivery/${deliveryId}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

export default api;