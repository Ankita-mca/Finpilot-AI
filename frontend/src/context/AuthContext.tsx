import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, AuthContextType, AuthResponsePayload } from '../types';
import { authService } from '../services/authService';
import { getStoredToken } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearAuthStorage = () => {
  const keys = [
    'finpilot_token',
    'finpilot_user_email',
    'finpilot_user_name',
    'finpilot_org_name',
    'finpilot_org_role',
    'finpilot_org_id',
  ];
  keys.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

const persistSession = (
  payload: { user: User; organization: Organization | null; token?: string },
  rememberMe = true
) => {
  clearAuthStorage();
  const storage = rememberMe ? localStorage : sessionStorage;
  if (payload.token) {
    storage.setItem('finpilot_token', payload.token);
  }
  storage.setItem('finpilot_user_email', payload.user.email);
  storage.setItem('finpilot_user_name', payload.user.name);
  if (payload.organization) {
    storage.setItem('finpilot_org_id', payload.organization.id);
    storage.setItem('finpilot_org_name', payload.organization.name);
    storage.setItem('finpilot_org_role', `${payload.user.role || 'owner'} account`);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const verifyExistingSession = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          // Even without local token, HTTP-only cookie may exist; probe /auth/me quietly
          const res = await authService.getMe();
          if (!active) return;
          setUser(res.user);
          setOrg(
            res.organization
              ? { ...res.organization, role: `${res.user.role || 'owner'} account` }
              : null
          );
          return;
        }

        const res = await authService.getMe();
        if (!active) return;
        setUser({ ...res.user, token });
        setOrg(
          res.organization
            ? { ...res.organization, role: `${res.user.role || 'owner'} account` }
            : null
        );
      } catch {
        if (!active) return;
        clearAuthStorage();
        setUser(null);
        setOrg(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    verifyExistingSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<AuthResponsePayload> => {
    const res = await authService.login({ email, password, rememberMe });
    persistSession(res, rememberMe);
    setUser({ ...res.user, token: res.token });
    setOrg(
      res.organization
        ? { ...res.organization, role: `${res.user.role || 'owner'} account` }
        : null
    );
    return res;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<AuthResponsePayload> => {
    const res = await authService.register({ name, email, password, confirmPassword });
    persistSession(res, true);
    setUser({ ...res.user, token: res.token });
    setOrg(null);
    return res;
  };

  const setupOrganization = async (
    orgData: Partial<Organization>
  ): Promise<AuthResponsePayload> => {
    const res = await authService.setupOrganization(orgData);
    const useLocal = Boolean(localStorage.getItem('finpilot_token')) || !sessionStorage.getItem('finpilot_token');
    persistSession(res, useLocal);
    setUser({ ...res.user, token: res.token });
    setOrg(
      res.organization
        ? { ...res.organization, role: `${res.user.role || 'owner'} account` }
        : null
    );
    return res;
  };

  const setOrganization = (orgData: Partial<Organization>) => {
    setOrg((prev) => (prev ? { ...prev, ...orgData } : orgData.id && orgData.name ? (orgData as Organization) : prev));
  };

  const logout = async () => {
    clearAuthStorage();
    setUser(null);
    setOrg(null);
    try {
      await authService.logout();
    } catch {
      // Cookie cleanup best-effort if network unavailable
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        isAuthenticated: !!user,
        hasOrg: Boolean(user?.organizationId && org?.id),
        loading,
        login,
        register,
        setupOrganization,
        setOrganization,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
