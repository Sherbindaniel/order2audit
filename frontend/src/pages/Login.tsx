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
