import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export const SalesmanDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/salesman')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading field dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Field Salesman Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fast mobile order booking and customer order status</p>
        </div>
        <Link to="/orders/new" className="btn btn-primary">
          <PlusCircle size={18} /> Book New Order
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">My Total Orders</span>
          <span className="stat-value">{data?.myOrdersCount || 0}</span>
          <span className="stat-subtitle">Lifetime orders booked</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">My Assigned Retailers</span>
          <span className="stat-value">{data?.myCustomersCount || 0}</span>
          <span className="stat-subtitle">Active accounts</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">This Month Sales</span>
          <span className="stat-value">₹{data?.thisMonthSales?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">Achieved turnover</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>My Recent Orders</h3>
          <Link to="/orders" className="btn btn-secondary btn-sm">All My Orders</Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.length ? data.recentOrders.map((o: any) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                  <td>{o.customerName}</td>
                  <td>{o.orderDate}</td>
                  <td>₹{o.totalAmount?.toLocaleString()}</td>
                  <td><span className={`badge badge-${o.status === 'DISPATCHED' ? 'success' : o.status === 'APPROVED' ? 'info' : 'warning'}`}>{o.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders placed yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
