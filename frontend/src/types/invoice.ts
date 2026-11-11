export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number; // e.g. 18% GST
  lineTotal: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  organizationId: string;
  customerId: string | { _id: string; companyName: string; email: string; phone?: string };
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  discount?: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  paymentTerms?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceSummary {
  totalReceivables: number;
  overdueAmount: number;
  dueSoonAmount: number;
  paidAmount: number;
  totalCount: number;
  overdueCount: number;
  paidCount: number;
  customersCount?: number;
}

