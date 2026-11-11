import { apiClient } from './api';
import { AIMessage, AISession } from '../types';

export const aiService = {
  getSessions: async () => {
    const res = await apiClient<{ success: boolean; data: AISession[] }>('/ai/sessions');
    return res.data;
  },

  createSession: async (title?: string) => {
    const res = await apiClient<{ success: boolean; data: AISession }>('/ai/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'New Conversation' }),
    });
    return res.data;
  },

  getMessages: async (sessionId: string) => {
    const res = await apiClient<{ success: boolean; data: AIMessage[] }>(`/ai/sessions/${sessionId}/messages`);
    return res.data;
  },

  query: async (queryText: string, sessionId?: string) => {
    const res = await apiClient<{ success: boolean; data: { answer: string; structuredData?: any; sessionId: string } }>(
      '/ai/query',
      {
        method: 'POST',
        body: JSON.stringify({ query: queryText, sessionId }),
      }
    );
    return res.data;
  },

  clearSession: async (sessionId: string) => {
    const res = await apiClient<{ success: boolean; message: string }>(`/ai/sessions/${sessionId}/messages`, {
      method: 'DELETE',
    });
    return res;
  },
};

