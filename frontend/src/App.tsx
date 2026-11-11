import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { OrgSetupPage } from './pages/auth/OrgSetupPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { CashFlowPage } from './pages/cashflow/CashFlowPage';
import { RemindersPage } from './pages/reminders/RemindersPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { ReconciliationPage } from './pages/reconciliation/ReconciliationPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth & Onboarding Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/org-setup" element={<OrgSetupPage />} />

          {/* Protected Workspace Layout Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/reconciliation" element={<ReconciliationPage />} />
              <Route path="/cash-flow" element={<CashFlowPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

