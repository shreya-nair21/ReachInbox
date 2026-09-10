import axios from 'axios';
import { ComposeEmailPayload, DashboardStats, EmailSchedule, Pagination, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reachinbox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  async googleLogin(credential: string, userInfo?: any) {
    const res = await api.post<{ success: boolean; data: { token: string; user: User } }>(
      '/auth/google',
      { credential, userInfo }
    );
    return res.data;
  },

  async demoLogin(email?: string, name?: string) {
    const res = await api.post<{ success: boolean; data: { token: string; user: User } }>(
      '/auth/demo',
      { email, name }
    );
    return res.data;
  },

  async signup(email: string, password?: string, name?: string) {
    const res = await api.post<{ success: boolean; data: { token: string; user: User } }>(
      '/auth/signup',
      { email, password, name }
    );
    return res.data;
  },

  async login(email: string, password?: string) {
    const res = await api.post<{ success: boolean; data: { token: string; user: User } }>(
      '/auth/login',
      { email, password }
    );
    return res.data;
  },

  async getMe() {
    const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data;
  },
};

export const emailApi = {
  async schedule(payload: ComposeEmailPayload) {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: {
        batchId: string;
        totalScheduled: number;
        firstSendAt: string;
        lastSendAt: string;
        emails: EmailSchedule[];
      };
    }>('/emails/schedule', payload);
    return res.data;
  },

  async getScheduled(page = 1, limit = 20) {
    const res = await api.get<{
      success: boolean;
      data: { emails: EmailSchedule[]; pagination: Pagination };
    }>(`/emails/scheduled?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getSent(page = 1, limit = 20) {
    const res = await api.get<{
      success: boolean;
      data: { emails: EmailSchedule[]; pagination: Pagination };
    }>(`/emails/sent?page=${page}&limit=${limit}`);
    return res.data;
  },

  async search(query: string, status?: string) {
    const res = await api.get<{
      success: boolean;
      data: { total: number; emails: EmailSchedule[]; source: string };
    }>(`/emails/search?q=${encodeURIComponent(query)}${status ? `&status=${status}` : ''}`);
    return res.data;
  },

  async cancel(emailId: string) {
    const res = await api.post<{ success: boolean; message: string; data: EmailSchedule }>(
      `/emails/${emailId}/cancel`
    );
    return res.data;
  },

  async getStats() {
    const res = await api.get<{ success: boolean; data: DashboardStats }>('/emails/stats');
    return res.data;
  },
};

export const slackApi = {
  async getAuthUrl() {
    const res = await api.get<{ success: boolean; data: { url: string } }>('/slack/auth-url');
    return res.data;
  },

  async getStatus() {
    const res = await api.get<{
      success: boolean;
      data: {
        connected: boolean;
        integration?: { id: string; teamName: string; channel: string; createdAt: string };
      };
    }>('/slack/status');
    return res.data;
  },

  async setWebhook(webhookUrl: string, channel?: string) {
    const res = await api.post<{ success: boolean; message: string }>('/slack/webhook', {
      webhookUrl,
      channel,
    });
    return res.data;
  },

  async disconnect() {
    const res = await api.post<{ success: boolean; message: string }>('/slack/disconnect');
    return res.data;
  },

  async testNotification() {
    const res = await api.post<{ success: boolean; message: string }>('/slack/test');
    return res.data;
  },
};

export default api;
