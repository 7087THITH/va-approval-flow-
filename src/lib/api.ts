/**
 * API Service Layer — Production Mode
 * 
 * This module provides the interface between the React frontend and the backend API.
 * Backend: Node.js + Express + PostgreSQL
 * Host: 192.168.213.207:3001 (API) / 192.168.213.207:5432 (PostgreSQL)
 */

// Configuration - Change these when connecting to real backend
const API_BASE_URL = 'http://192.168.213.207:3001/api';
const USE_API = true; // Production mode — connected to backend API

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    nameTh?: string;
    role: string;
    department: string;
    departmentTh?: string;
    plant?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('va_auth_token', token);
  } else {
    localStorage.removeItem('va_auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('va_auth_token');
  }
  return authToken;
}

// Base fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// ─────────────────────────────────────
// Auth API
// ─────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (): Promise<void> => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setAuthToken(null);
  },

  getProfile: async () => {
    return apiFetch('/auth/profile');
  },
};

// ─────────────────────────────────────
// Proposals API
// ─────────────────────────────────────

export const proposalsApi = {
  getAll: async (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return apiFetch(`/proposals?${query.toString()}`);
  },

  getById: async (id: string) => {
    return apiFetch(`/proposals/${id}`);
  },

  create: async (data: any) => {
    return apiFetch('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiFetch(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiFetch(`/proposals/${id}`, {
      method: 'DELETE',
    });
  },

  approve: async (id: string, judgement: string, comment?: string) => {
    return apiFetch(`/proposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ judgement, comment }),
    });
  },
};

// ─────────────────────────────────────
// Users API
// ─────────────────────────────────────

export const usersApi = {
  getAll: async () => {
    return apiFetch('/users');
  },

  create: async (data: any) => {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  changePassword: async (id: string, newPassword: string) => {
    return apiFetch(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  },

  bulkImport: async (users: any[]) => {
    return apiFetch('/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
  },
};

// ─────────────────────────────────────
// Departments API
// ─────────────────────────────────────

export const departmentsApi = {
  getAll: async () => {
    return apiFetch('/departments');
  },

  getTree: async () => {
    return apiFetch('/departments/tree');
  },
};

// ─────────────────────────────────────
// VA Calculate API
// ─────────────────────────────────────

export const vaCalculateApi = {
  // Settings (FY configuration)
  getSettings: async () => {
    return apiFetch('/va-calculate/settings');
  },

  getSettingById: async (id: string) => {
    return apiFetch(`/va-calculate/settings/${id}`);
  },

  createSetting: async (data: {
    fiscalYear: string;
    cdGoal: number;
    exchangeRate: number;
    cifPercent: number;
    fobPercent: number;
    currency: string;
    startDate: string;
    endDate: string;
  }) => {
    return apiFetch('/va-calculate/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSetting: async (id: string, data: any) => {
    return apiFetch(`/va-calculate/settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSetting: async (id: string) => {
    return apiFetch(`/va-calculate/settings/${id}`, {
      method: 'DELETE',
    });
  },

  // Monthly data
  getMonthlySummary: async (fiscalYear: string) => {
    return apiFetch(`/va-calculate/monthly?fy=${fiscalYear}`);
  },

  updateMonthlyTarget: async (settingId: string, monthIndex: number, data: any) => {
    return apiFetch(`/va-calculate/monthly-targets/${settingId}/${monthIndex}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Credit Notes
  getCreditNotes: async (params?: { fiscalYear?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.fiscalYear) query.set('fy', params.fiscalYear);
    if (params?.status) query.set('status', params.status);
    return apiFetch(`/va-calculate/credit-notes?${query.toString()}`);
  },

  createCreditNote: async (data: any) => {
    return apiFetch('/va-calculate/credit-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCreditNote: async (id: string, data: any) => {
    return apiFetch(`/va-calculate/credit-notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Calculation Items
  getCalculationItems: async (params?: { fiscalYear?: string; month?: string }) => {
    const query = new URLSearchParams();
    if (params?.fiscalYear) query.set('fy', params.fiscalYear);
    if (params?.month) query.set('month', params.month);
    return apiFetch(`/va-calculate/items?${query.toString()}`);
  },

  // Recalculate monthly results
  recalculate: async (settingId: string) => {
    return apiFetch(`/va-calculate/recalculate/${settingId}`, {
      method: 'POST',
    });
  },
};
