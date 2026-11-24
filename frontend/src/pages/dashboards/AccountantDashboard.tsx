import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Link } from 'react-router-dom';

export const AccountantDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/accountant')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading auditor financial dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Auditor & Accounting Portal</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Read-only audit trail, GST reconciliation and stock ledger verification</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">Monthly Sales Turnover</span>
          <span className="stat-value">₹{data?.monthlySales?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">Current month tax invoices</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">GST Collected</span>
          <span className="stat-value">₹{data?.totalTaxCollected?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">CGST + SGST + IGST</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Payments Collected</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>₹{data?.totalPaymentsReceived?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">Realized bank/cash receipts</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Outstanding Due</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>₹{data?.totalOutstanding?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">Pending customer balances</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>Quick Audit & Export Centre</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link to="/reports" className="btn btn-secondary" style={{ padding: '1rem', justifyContent: 'center' }}>
            GST Summary Report
          </Link>
          <Link to="/inventory/ledger" className="btn btn-secondary" style={{ padding: '1rem', justifyContent: 'center' }}>
            Complete Stock Movement Ledger
          </Link>
          <Link to="/costing" className="btn btn-secondary" style={{ padding: '1rem', justifyContent: 'center' }}>
            Production Costing & Margins
          </Link>
          <Link to="/reports" className="btn btn-secondary" style={{ padding: '1rem', justifyContent: 'center' }}>
            Sales & Purchase Registers
          </Link>
        </div>
      </div>
    </div>
  );
};
