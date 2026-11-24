const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../frontend/src');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created frontend file:', relPath);
}

// 1. components/Sidebar.tsx
writeFile('components/Sidebar.tsx', `
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Factory, 
  Boxes, 
  FileText, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  LogOut 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'OWNER': return '/dashboard/owner';
      case 'ADMIN': return '/dashboard/admin';
      case 'SALESMAN': return '/dashboard/salesman';
      case 'PRODUCTION_SUPERVISOR': return '/dashboard/production';
      case 'ACCOUNTANT': return '/dashboard/accountant';
      default: return '/';
    }
  };

  const navItems = [
    { label: 'Dashboard', path: getDashboardPath(), icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'SALESMAN', 'PRODUCTION_SUPERVISOR', 'ACCOUNTANT'] },
    { label: 'Sales Orders', path: '/orders', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'SALESMAN'] },
    { label: 'Production', path: '/production', icon: Factory, roles: ['OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'] },
    { label: 'Inventory', path: '/inventory', icon: Boxes, roles: ['OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR', 'ACCOUNTANT'] },
    { label: 'Invoices', path: '/invoices', icon: FileText, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
    { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
    { label: 'Costing', path: '/costing', icon: DollarSign, roles: ['OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR', 'ACCOUNTANT'] },
    { label: 'Reports & Audit', path: '/reports', icon: BarChart3, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--navy)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--navy-light)' }}>
        <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 'bold' }}>Sri Balaji Snacks</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--slate-light)', marginTop: '0.25rem' }}>Order-to-Audit ERP</p>
      </div>

      <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {navItems.filter(item => user && item.roles.includes(user.role)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#ffffff' : 'var(--slate-light)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--navy-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>{user?.fullName}</p>
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{user?.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
};
`);

// 2. components/Header.tsx
writeFile('components/Header.tsx', `
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
`);

// 3. layouts/DashboardLayout.tsx
writeFile('layouts/DashboardLayout.tsx', `
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const DashboardLayout: React.FC<{ title?: string }> = ({ title = 'Dashboard' }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title={title} />
        <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--bg-main)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
`);

// 4. pages/Login.tsx
writeFile('pages/Login.tsx', `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Lock, User } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('owner123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const data = res.data.data;
      login({
        id: data.id,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        token: data.token
      }, data.token);

      // Redirect by role
      switch (data.role) {
        case 'OWNER': navigate('/dashboard/owner'); break;
        case 'ADMIN': navigate('/dashboard/admin'); break;
        case 'SALESMAN': navigate('/dashboard/salesman'); break;
        case 'PRODUCTION_SUPERVISOR': navigate('/dashboard/production'); break;
        case 'ACCOUNTANT': navigate('/dashboard/accountant'); break;
        default: navigate('/dashboard/owner');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--navy)',
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--navy)' }}>Sri Balaji Snacks</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Order-to-Audit Manufacturing System
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--slate-light)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--slate-light)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
            QUICK LOGIN DEMO ACCOUNTS:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoUser('owner', 'owner123')}>Owner</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoUser('admin', 'admin123')}>Admin</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoUser('salesman_a', 'sales123')}>Salesman A</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoUser('supervisor', 'super123')}>Supervisor</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDemoUser('auditor', 'audit123')}>Auditor</button>
          </div>
        </div>
      </div>
    </div>
  );
};
`);

console.log('Frontend Part 2 generated successfully!');

