export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  token?: string;
}

export interface Organization {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  GSTIN?: string;
  currency?: string;
  structure?: string;
  industry?: string;
  size?: string;
  country?: string;
  state?: string;
  city?: string;
  website?: string;
}

export interface AuthResponsePayload {
  user: User;
  organization: Organization | null;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  org: Organization | null;
  isAuthenticated: boolean;
  hasOrg: boolean;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponsePayload>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<AuthResponsePayload>;
  setupOrganization: (orgData: Partial<Organization>) => Promise<AuthResponsePayload>;
  setOrganization: (orgData: Partial<Organization>) => void;
  logout: () => Promise<void>;
}
