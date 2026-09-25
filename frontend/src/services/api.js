import { handleMockRequest } from './mockStorage';

const API_BASE = '/api';

const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('github.io') ||
  window.location.protocol === 'file:'
);

class ApiService {
  constructor() {
    this.token = localStorage.getItem('gympulse_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('gympulse_token', token);
    } else {
      localStorage.removeItem('gympulse_token');
    }
  }

  getHeaders(isJson = true) {
    const headers = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    // If running on static host (e.g. GitHub Pages or file://), immediately execute via in-memory mock engine with zero network latency
    if (isStaticHost) {
      return handleMockRequest(endpoint, options);
    }

    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(options.body && typeof options.body === 'string'), ...options.headers };

    // Prevent UI hanging on sleeping/cold backend containers with 3.5s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      
      // If 404 on API endpoint (running on static host without Python backend)
      if (response.status === 404) {
        return handleMockRequest(endpoint, options);
      }

      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Fallback to standalone device session rather than prematurely logging out
        console.warn(`Server returned 401 on ${endpoint}. Attempting fallback to persistent device session.`);
        try {
          return handleMockRequest(endpoint, options);
        } catch (mockErr) {
          throw new Error('Unauthorized or session expired.');
        }
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || data.message || 'API request failed');
        }
        return data;
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || 'API request failed');
        }
        return text;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`API network unavailable on ${endpoint}. Falling back to standalone mobile engine.`);
      return handleMockRequest(endpoint, options);
    }
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  registerGym(data) {
    return this.request('/auth/register-gym', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  submitPaymentRef(data) {
    return this.request('/auth/submit-payment', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword })
    });
  }

  getUsers() {
    return this.request('/auth/users');
  }

  createUser(userData) {
    return this.request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  updateUser(id, userData) {
    return this.request(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Dashboard
  getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Members
  getMembers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status_filter) query.append('status_filter', params.status_filter);
    if (params.expiring_soon) query.append('expiring_soon', 'true');
    if (params.trainer_id) query.append('trainer_id', params.trainer_id);
    const qs = query.toString();
    return this.request(`/members${qs ? `?${qs}` : ''}`);
  }

  getMemberDetail(id) {
    return this.request(`/members/${id}`);
  }

  createMember(data) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateMember(id, data) {
    return this.request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteMember(id) {
    return this.request(`/members/${id}`, {
      method: 'DELETE'
    });
  }

  seedTestMembers() {
    return this.request('/members/seed-test-members', {
      method: 'POST'
    });
  }

  // Plans
  getPlans() {
    return this.request('/plans');
  }

  createPlan(data) {
    return this.request('/plans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updatePlan(id, data) {
    return this.request(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deletePlan(id) {
    return this.request(`/plans/${id}`, {
      method: 'DELETE'
    });
  }

  // Memberships
  assignMembership(memberId, data) {
    return this.request(`/memberships/assign/${memberId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  cancelMembership(id) {
    return this.request(`/memberships/${id}/cancel`, {
      method: 'PATCH'
    });
  }

  // Attendance
  getTodayAttendance() {
    return this.request('/attendance/today');
  }

  checkIn(memberId, method = 'manual', notes = '') {
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId, method, notes })
    });
  }

  checkOut(attendanceId) {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ attendance_id: attendanceId })
    });
  }

  getAttendanceHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return this.request(`/attendance/history${qs ? `?${qs}` : ''}`);
  }

  // Payments
  getPayments(params = {}) {
    const query = new URLSearchParams();
    if (params.status_filter) query.append('status_filter', params.status_filter);
    if (params.member_id) query.append('member_id', params.member_id);
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return this.request(`/payments${qs ? `?${qs}` : ''}`);
  }

  recordPayment(data) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getPayment(paymentId) {
    return this.request(`/payments/${paymentId}`);
  }

  getReceiptHtml(paymentId) {
    return `${API_BASE}/payments/${paymentId}/receipt`;
  }

  // Trainers
  getTrainers() {
    return this.request('/trainers');
  }

  createTrainer(data) {
    return this.request('/trainers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTrainer(id, data) {
    return this.request(`/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  getTrainerMembers(trainerId) {
    return this.request(`/trainers/${trainerId}/members`);
  }

  // Reports
  getReportsSummary() {
    return this.request('/reports/summary');
  }

  getRevenueReport(startDate, endDate) {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    const qs = query.toString();
    return this.request(`/reports/revenue${qs ? `?${qs}` : ''}`);
  }

  exportRevenueCsvUrl(startDate, endDate) {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    const qs = query.toString();
    return `${API_BASE}/reports/revenue/export${qs ? `?${qs}` : ''}`;
  }

  exportMembersCsvUrl(statusFilter) {
    const query = new URLSearchParams();
    if (statusFilter) query.append('status_filter', statusFilter);
    const qs = query.toString();
    return `${API_BASE}/reports/members/export${qs ? `?${qs}` : ''}`;
  }

  exportAttendanceCsvUrl(startDate, endDate) {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    const qs = query.toString();
    return `${API_BASE}/reports/attendance/export${qs ? `?${qs}` : ''}`;
  }

  // AI Assistant
  queryAi(query) {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/ai/speech-to-text`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return res.json();
  }

  // Settings & Billing
  getGymSettings() {
    return this.request('/settings/config');
  }

  updateGymSettings(data) {
    return this.request('/settings/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  getGymProfile() {
    return this.request('/settings/gym');
  }

  updateGymProfile(data) {
    return this.request('/settings/gym', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  getNetworkInfo() {
    return this.request('/settings/network-info');
  }

  getBillingStatus() {
    return this.request('/billing/status');
  }

  upgradePlan(targetTier) {
    return this.request('/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ target_tier: targetTier })
    });
  }

  // ----------------- Platform Super Admin (Platform Owner) -----------------
  getPlatformMetrics() {
    return this.request('/platform/metrics');
  }

  getPlatformGyms() {
    return this.request('/platform/gyms');
  }

  approveGym(gymId) {
    return this.request(`/platform/gyms/${gymId}/approve`, {
      method: 'POST'
    });
  }

  approveAllGyms() {
    return this.request('/platform/gyms/approve-all', {
      method: 'POST'
    });
  }

  approveUpgrade(gymId) {
    return this.request(`/platform/gyms/${gymId}/approve-upgrade`, {
      method: 'POST'
    });
  }

  rejectGym(gymId, notes = '') {
    return this.request(`/platform/gyms/${gymId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', notes })
    });
  }

  deletePlatformGym(gymId) {
    return this.request(`/platform/gyms/${gymId}`, {
      method: 'DELETE'
    });
  }

  removeAllActiveGyms() {
    return this.request('/platform/gyms/remove-all-active', {
      method: 'POST'
    });
  }

  removeAllGyms() {
    return this.request('/platform/gyms/remove-all', {
      method: 'POST'
    });
  }

  getPlatformPaymentSettings() {
    return this.request('/platform/payment-settings');
  }

  updatePlatformPaymentSettings(data) {
    return this.request('/platform/payment-settings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ----------------- Public Website & Inquiry Generator -----------------
  getPublicFacility(slug) {
    return this.request(`/public/facility/${slug}`);
  }

  submitPublicInquiry(slug, data) {
    return this.request(`/public/facility/${slug}/inquire`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  getGymWebsite() {
    return this.request('/gym/website');
  }

  updateGymWebsite(data) {
    return this.request('/gym/website', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  decommissionGym(data) {
    return this.request('/gym/decommission', {
      method: 'DELETE',
      body: JSON.stringify(data)
    });
  }

  getGymInquiries() {
    return this.request('/gym/inquiries');
  }

  updateGymInquiry(id, status) {
    return this.request(`/gym/inquiries/${id}?status_val=${encodeURIComponent(status)}`, {
      method: 'PATCH'
    });
  }

  // ----------------- Network & 24/7 Cloud Hosting Info -----------------
  getNetworkInfo() {
    return this.request('/settings/network-info');
  }

  updateCloudUrl(cloud_url) {
    return this.request('/settings/cloud-url', {
      method: 'POST',
      body: JSON.stringify({ cloud_url })
    });
  }
}

export const api = new ApiService();

