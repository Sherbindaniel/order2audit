import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User as UserIcon } from 'lucide-react';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--slate)' }}>
          <UserIcon size={18} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.fullName}</span>
        </div>
      </div>
    </header>
  );
};
