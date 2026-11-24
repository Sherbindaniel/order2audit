import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading admin dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Factory Admin Operations</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Approval queue, billing dispatches and receivables</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">Pending Approvals</span>
          <span className="stat-value" style={{ color: data?.pendingOrdersApproval > 0 ? 'var(--warning)' : 'var(--navy)' }}>
            {data?.pendingOrdersApproval || 0}
          </span>
          <span className="stat-subtitle">Awaiting stock verification</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Invoices Generated Today</span>
          <span className="stat-value">{data?.todayInvoicesCount || 0}</span>
          <span className="stat-subtitle">Today's billing</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Outstanding</span>
          <span className="stat-value">₹{data?.totalOutstanding?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">Unpaid balance across customers</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>Orders Awaiting Approval & Verification</h3>
          <Link to="/orders" className="btn btn-primary btn-sm">Process Orders</Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.pendingOrders?.length ? data.pendingOrders.map((o: any) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>{o.customerName}</td>
                  <td>{o.orderDate}</td>
                  <td>₹{o.totalAmount?.toLocaleString()}</td>
                  <td><span className="badge badge-warning">{o.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders currently pending approval</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
