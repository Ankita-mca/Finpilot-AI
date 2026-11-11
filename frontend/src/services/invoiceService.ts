import { apiClient } from './api';
import { Invoice, InvoiceSummary } from '../types';

export const invoiceService = {
  getAll: async (params?: { status?: string; customerId?: string; limit?: number; page?: number }): Promise<Invoice[]> => {
    const res = await apiClient<{
      success: boolean;
      data: { invoices?: Invoice[]; pagination?: any } | Invoice[];
      total?: number;
    }>('/invoices', {
      params,
    });

    if (res && res.data) {
      if (Array.isArray(res.data)) {
        return res.data;
      }
      if (Array.isArray((res.data as any).invoices)) {
        return (res.data as any).invoices;
      }
    }
    return [];
  },

  getSummary: async (): Promise<any> => {
    const res = await apiClient<{ success: boolean; data: any }>('/invoices/summary');
    return res.data;
  },

  getNextNumber: async (): Promise<string> => {
    const res = await apiClient<{ success: boolean; data: { nextInvoiceNumber: string } }>('/invoices/next-number');
    return res.data?.nextInvoiceNumber || `INV-${Date.now().toString().slice(-4)}`;
  },

  getById: async (id: string): Promise<Invoice> => {
    const res = await apiClient<{ success: boolean; data: Invoice }>(`/invoices/${id}`);
    return res.data;
  },

  create: async (payload: Partial<Invoice>): Promise<Invoice> => {
    const res = await apiClient<{ success: boolean; data: Invoice }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: Partial<Invoice>): Promise<Invoice> => {
    const res = await apiClient<{ success: boolean; data: Invoice }>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient<{ success: boolean; message: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};
