import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="app-shell">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="main">
        <Topbar />
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
