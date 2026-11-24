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
