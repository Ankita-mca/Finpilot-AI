import { apiClient } from './api';
import { AuthResponsePayload, Organization, User } from '../types';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  async register(payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthResponsePayload> {
    const res = await apiClient<ApiEnvelope<AuthResponsePayload>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async login(payload: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<AuthResponsePayload> {
    const res = await apiClient<ApiEnvelope<AuthResponsePayload>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async setupOrganization(payload: Partial<Organization>): Promise<AuthResponsePayload> {
    const res = await apiClient<ApiEnvelope<AuthResponsePayload>>('/auth/organization', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async getMe(): Promise<{ user: User; organization: Organization | null }> {
    const res = await apiClient<ApiEnvelope<{ user: User; organization: Organization | null }>>(
      '/auth/me'
    );
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient<ApiEnvelope<Record<string, never>>>('/auth/logout', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await apiClient<ApiEnvelope<Record<string, never>>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return res.message;
  },
};

