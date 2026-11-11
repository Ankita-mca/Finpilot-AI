export type RiskRating = 'Low' | 'Medium' | 'High';

export interface Customer {
  _id: string;
  organizationId?: string;
  customerName?: string;
  companyName: string;
  tradeName?: string;
  gstin?: string;
  GSTIN?: string;
  pan?: string;
  contactPerson?: string;
  email: string;
  phone: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  creditLimit?: number;
  paymentTerms?: string; // e.g. Net 15, Net 30, Net 45, Net 60
  riskRating?: RiskRating;
  outstandingBalance?: number;
  overdueAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerFormData {
  companyName: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  contactPerson?: string;
  email: string;
  phone: string;
  creditLimit?: number;
  paymentTerms?: string;
  riskRating?: RiskRating;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

