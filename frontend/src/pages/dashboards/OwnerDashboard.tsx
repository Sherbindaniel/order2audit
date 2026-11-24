import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { ShoppingCart, DollarSign, Package, AlertTriangle, Factory, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OwnerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/owner')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading executive dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Executive Business Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time operations, inventory valuation and sales pipeline</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">Total Sales Invoiced</span>
          <span className="stat-value">₹{data?.totalSalesAmount?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">All-time revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Outstanding Receivables</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>₹{data?.totalOutstandingDues?.toLocaleString() || '0'}</span>
          <span className="stat-subtitle">Pending collections</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Finished Goods Stock</span>
          <span className="stat-value">{data?.totalFgStockPackets || '0'} <span style={{ fontSize: '1rem', fontWeight: 500 }}>pkts</span></span>
          <span className="stat-subtitle">Ready for dispatch</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Average Cost / Packet</span>
          <span className="stat-value">₹{data?.avgCostPerPacket?.toFixed(2) || '0.00'}</span>
          <span className="stat-subtitle">Production unit cost</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>Recent Sales Orders</h3>
            <Link to="/orders" className="btn btn-secondary btn-sm">View All Orders</Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders?.length ? data.recentOrders.map((o: any) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                    <td>{o.customerName}</td>
                    <td>₹{o.totalAmount?.toLocaleString()}</td>
                    <td><span className={`badge badge-${o.status === 'DISPATCHED' ? 'success' : o.status === 'APPROVED' ? 'info' : 'warning'}`}>{o.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Operational Health</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--slate)' }}>Total Production Runs</span>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>{data?.totalProductionRuns || 0}</p>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--slate)' }}>Raw Material Items</span>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>{data?.totalRawMaterialsCount || 0}</p>
            </div>
            <div style={{ padding: '1rem', background: data?.lowStockAlertsCount > 0 ? 'var(--warning-bg)' : '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.875rem', color: data?.lowStockAlertsCount > 0 ? 'var(--warning)' : 'var(--slate)' }}>Low Stock Items</span>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: data?.lowStockAlertsCount > 0 ? 'var(--warning)' : 'var(--navy)' }}>{data?.lowStockAlertsCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
