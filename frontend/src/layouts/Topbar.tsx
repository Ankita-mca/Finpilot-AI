import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROUTE_CRUMBS: Record<string, { category: string; page: string }> = {
  '/dashboard': { category: 'FinPilot', page: 'Overview' },
  '/invoices': { category: 'FinPilot', page: 'Invoices' },
  '/customers': { category: 'FinPilot', page: 'Customers' },
  '/payments': { category: 'FinPilot', page: 'Payments' },
  '/reports': { category: 'FinPilot', page: 'Aging Report' },
  '/reminders': { category: 'FinPilot', page: 'Smart Reminders' },
  '/reconciliation': { category: 'FinPilot', page: 'Reconciliation' },
  '/cash-flow': { category: 'FinPilot', page: 'Cash Flow Forecast' },
  '/ai-assistant': { category: 'FinPilot', page: 'AI Assistant' },
  '/notifications': { category: 'FinPilot', page: 'Notifications' },
  '/audit-log': { category: 'FinPilot', page: 'Audit Log' },
  '/settings': { category: 'FinPilot', page: 'Settings' },
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const current = ROUTE_CRUMBS[location.pathname] || { category: 'FinPilot', page: 'Workspace' };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      {/* Breadcrumb Area */}
      <div className="crumb">
        {current.category} <span>/</span> <b>{current.page}</b>
      </div>

      {/* Top Actions: Telemetry Period, Live Status & Sign Out */}
      <div className="top-actions">
        <div className="period">
          <span className="live-dot" />
          <span>Live Sync Active</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="topbar-signout-btn"
          title="Sign out of FinPilot AI"
          aria-label="Sign out"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
};
