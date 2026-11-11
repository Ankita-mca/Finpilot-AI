import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const orgInitial = (org?.name?.charAt(0) || 'T').toUpperCase();
  const userInitial = (user?.name?.charAt(0) || 'T').toUpperCase();

  const linkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
  });

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span>FinPilot <b>AI</b></span>
      </div>

      {/* Org Switcher */}
      <div className="org-switch">
        <div className="org-avatar" id="sidebarOrgAvatar">{orgInitial}</div>
        <span>
          <strong id="sidebarOrgName">{org?.name || 'Test Org'}</strong>
          <small id="sidebarOrgRole">{org?.role || 'owner account'}</small>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#84908b' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Navigation Section: WORKSPACE */}
      <div className="nav-label">WORKSPACE</div>
      <nav>
        {/* 1. Overview */}
        <NavLink to="/dashboard" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span style={{ textDecoration: 'none' }}>Overview</span>
        </NavLink>

        {/* 2. Invoices */}
        <NavLink to="/invoices" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span style={{ textDecoration: 'none' }}>Invoices</span>
        </NavLink>

        {/* 3. Customers */}
        <NavLink to="/customers" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span style={{ textDecoration: 'none' }}>Customers</span>
        </NavLink>

        {/* 4. Payments */}
        <NavLink to="/payments" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span style={{ textDecoration: 'none' }}>Payments</span>
        </NavLink>

        {/* 5. Aging Report */}
        <NavLink to="/reports" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ textDecoration: 'none' }}>Aging report</span>
        </NavLink>

        {/* 6. Reminders */}
        <NavLink to="/reminders" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span style={{ textDecoration: 'none' }}>Reminders</span>
          <span className="soon">SOON</span>
        </NavLink>



        {/* 9. AI Assistant */}
        <NavLink to="/ai-assistant" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
          </svg>
          <span style={{ textDecoration: 'none' }}>AI Assistant</span>
        </NavLink>
      </nav>

      {/* Navigation Section: ACCOUNT */}
      <div className="sidebar-bottom">
        <div className="nav-label">ACCOUNT</div>
        <nav>
          <NavLink to="/notifications" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ textDecoration: 'none' }}>Notifications</span>
          </NavLink>


          <NavLink to="/settings" style={linkStyle} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span style={{ textDecoration: 'none' }}>Settings</span>
          </NavLink>
        </nav>

        {/* User Profile Card & Sign Out */}
        <div className="profile">
          <div className="avatar" id="sidebarUserAvatar">{userInitial}</div>
          <span>
            <strong id="sidebarUserName">{user?.name || 'Test User'}</strong>
            <small id="sidebarUserEmail">{user?.email || 'test@finpilot.local'}</small>
          </span>
          <button
            onClick={handleSignOut}
            title="Sign out of FinPilot AI"
            style={{ border: 0, background: 'none', color: '#84908b', cursor: 'pointer', padding: '6px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Bottom Full Width Sign Out Button */}
        <button className="logout-row-btn" onClick={handleSignOut} type="button">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
