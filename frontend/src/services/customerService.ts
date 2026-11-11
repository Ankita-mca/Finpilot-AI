import { apiClient } from './api';
import { Customer, CustomerFormData } from '../types';

export const customerService = {
  getAll: async (params?: { search?: string; riskRating?: string; limit?: number; page?: number }): Promise<Customer[]> => {
    const res = await apiClient<{
      success: boolean;
      data: { customers?: Customer[]; pagination?: any } | Customer[];
      total?: number;
    }>('/customers', {
      params,
    });

    if (res && res.data) {
      if (Array.isArray(res.data)) {
        return res.data;
      }
      if (Array.isArray((res.data as any).customers)) {
        return (res.data as any).customers;
      }
    }
    return [];
  },

  getById: async (id: string): Promise<Customer> => {
    const res = await apiClient<{ success: boolean; data: Customer | { customer?: Customer } }>(`/customers/${id}`);
    if (res && res.data) {
      if ('customer' in (res.data as any) && (res.data as any).customer) {
        return (res.data as any).customer;
      }
      return res.data as Customer;
    }
    throw new Error('Customer not found');
  },

  create: async (payload: CustomerFormData): Promise<Customer> => {
    const res = await apiClient<{ success: boolean; data: Customer | { customer?: Customer } }>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res && res.data) {
      if ('customer' in (res.data as any) && (res.data as any).customer) {
        return (res.data as any).customer;
      }
      return res.data as Customer;
    }
    return res as unknown as Customer;
  },

  update: async (id: string, payload: Partial<CustomerFormData>): Promise<Customer> => {
    const res = await apiClient<{ success: boolean; data: Customer | { customer?: Customer } }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res && res.data) {
      if ('customer' in (res.data as any) && (res.data as any).customer) {
        return (res.data as any).customer;
      }
      return res.data as Customer;
    }
    return res as unknown as Customer;
  },

  delete: async (id: string) => {
    const res = await apiClient<{ success: boolean; message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};
