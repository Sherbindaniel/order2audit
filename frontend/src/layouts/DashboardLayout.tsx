import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const DashboardLayout: React.FC<{ title?: string }> = ({ title = 'Dashboard' }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <Header title={title} />
        <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--bg-main)', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
