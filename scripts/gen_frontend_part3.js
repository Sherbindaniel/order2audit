const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../frontend/src');

function writeFile(relPath, content) {
    const fullPath = path.join(BASE, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created frontend file:', relPath);
}

// 1. pages/dashboards/OwnerDashboard.tsx
writeFile('pages/dashboards/OwnerDashboard.tsx', `
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
                    <td><span className={\`badge badge-\${o.status === 'DISPATCHED' ? 'success' : o.status === 'APPROVED' ? 'info' : 'warning'}\`}>{o.status}</span></td>
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
`);

// 2. pages/dashboards/AdminDashboard.tsx
writeFile('pages/dashboards/AdminDashboard.tsx', `
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
`);

// 3. pages/dashboards/SalesmanDashboard.tsx
writeFile('pages/dashboards/SalesmanDashboard.tsx', `
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
                  <td><span className={\`badge badge-\${o.status === 'DISPATCHED' ? 'success' : o.status === 'APPROVED' ? 'info' : 'warning'}\`}>{o.status}</span></td>
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
`);

// 4. pages/dashboards/ProductionDashboard.tsx
writeFile('pages/dashboards/ProductionDashboard.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export const ProductionDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/production')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading production floor dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Production Floor Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Batch tracking, BOM adherence, wastage and yield variance</p>
        </div>
        <Link to="/production/runs/new" className="btn btn-primary">
          <PlusCircle size={18} /> Record Production Run
        </Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">Completed Runs</span>
          <span className="stat-value">{data?.totalRuns || 0}</span>
          <span className="stat-subtitle">Batches executed</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Good Output</span>
          <span className="stat-value">{data?.totalGoodPackets || 0} <span style={{ fontSize: '1rem' }}>pkts</span></span>
          <span className="stat-subtitle">Produced finished goods</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Average Yield</span>
          <span className="stat-value">{data?.avgYield?.toFixed(1) || '0.0'}%</span>
          <span className="stat-subtitle">Target: 100% (Tolerance ±3%)</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>Recent Batch Runs & Variance</h3>
          <Link to="/production" className="btn btn-secondary btn-sm">Full Production Register</Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Run Number</th>
                <th>Product</th>
                <th>Date</th>
                <th>Planned</th>
                <th>Actual Good</th>
                <th>Yield Variance</th>
                <th>Cost/Packet</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentRuns?.length ? data.recentRuns.map((r: any) => (
                <tr key={r.runNumber}>
                  <td style={{ fontWeight: 600 }}>{r.runNumber}</td>
                  <td>{r.productName}</td>
                  <td>{r.productionDate}</td>
                  <td>{r.plannedOutput}</td>
                  <td style={{ fontWeight: 600 }}>{r.actualGoodOutput}</td>
                  <td>
                    <span className={\`badge \${r.yieldVariancePercentage < -3 ? 'badge-danger' : 'badge-success'}\`}>
                      {r.yieldVariancePercentage > 0 ? '+' : ''}{r.yieldVariancePercentage?.toFixed(2)}%
                    </span>
                  </td>
                  <td>₹{r.costPerPacket?.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No production runs recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`);

// 5. pages/dashboards/AccountantDashboard.tsx
writeFile('pages/dashboards/AccountantDashboard.tsx', `
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
`);

// 6. pages/sales/OrdersList.tsx
writeFile('pages/sales/OrdersList.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { SalesOrder } from '../../types';
import { Link } from 'react-router-dom';
import { PlusCircle, CheckCircle, FileText, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { user } = useAuth();

  const loadOrders = () => {
    api.get('/orders')
      .then(res => setOrders(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await api.put(\`/orders/\${id}/approve\`, { approved: true });
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateInvoice = async (orderId: number) => {
    setActionLoading(orderId);
    try {
      const res = await api.post('/invoices', { salesOrderId: orderId });
      alert('Invoice ' + res.data.data.invoiceNumber + ' generated successfully!');
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invoice generation failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Sales Orders</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Order intake, stock verification, admin approvals and invoicing</p>
        </div>
        <Link to="/orders/new" className="btn btn-primary">
          <PlusCircle size={18} /> New Order
        </Link>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Salesman</th>
                <th>Date</th>
                <th>Total Value</th>
                <th>Stock / Shortage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const totalShortage = o.items?.reduce((sum, item) => sum + (item.shortageQuantity || 0), 0) || 0;
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                    <td>{o.customerName}</td>
                    <td>{o.salesmanName}</td>
                    <td>{o.orderDate}</td>
                    <td style={{ fontWeight: 600 }}>₹{o.totalAmount?.toLocaleString()}</td>
                    <td>
                      {totalShortage > 0 ? (
                        <span className="badge badge-danger">Shortage: {totalShortage} pkts</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <span className={\`badge badge-\${
                        o.status === 'DISPATCHED' ? 'success' :
                        o.status === 'INVOICED' ? 'info' :
                        o.status === 'APPROVED' ? 'info' :
                        o.status === 'SUBMITTED' ? 'warning' : 'neutral'
                      }\`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {user?.role !== 'SALESMAN' && o.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleApprove(o.id)}
                            className="btn btn-primary btn-sm"
                            disabled={actionLoading === o.id}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                        )}
                        {user?.role !== 'SALESMAN' && o.status === 'APPROVED' && (
                          <button
                            onClick={() => handleGenerateInvoice(o.id)}
                            className="btn btn-success btn-sm"
                            disabled={actionLoading === o.id || totalShortage > 0}
                            title={totalShortage > 0 ? 'Cannot invoice with shortage' : 'Generate Tax Invoice'}
                          >
                            <FileText size={14} /> Generate Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`);

// 7. pages/sales/CreateOrder.tsx
writeFile('pages/sales/CreateOrder.tsx', `
import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Customer, Product } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

export const CreateOrder: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [items, setItems] = useState<{ productId: number; quantity: number }[]>([
    { productId: 0, quantity: 1 }
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data.data)).catch(console.error);
    api.get('/products').then(res => setProducts(res.data.data)).catch(console.error);
  }, []);

  const addItem = () => {
    setItems([...items, { productId: products[0]?.id || 0, quantity: 1 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: value };
    setItems(copy);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return sum + (p ? p.sellingPrice * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    const validItems = items.filter(i => i.productId > 0 && i.quantity > 0);
    if (!validItems.length) {
      alert('Please add at least one product with quantity');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        customerId: selectedCustomer,
        notes,
        items: validItems
      });
      alert('Order ' + res.data.data.orderNumber + ' booked successfully!');
      navigate('/orders');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Order creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Create Sales Order (Fast Booking)</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Customer / Retailer *</label>
            <select
              className="form-select"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(Number(e.target.value))}
              required
            >
              <option value="">-- Choose Retailer / Distributor --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.state}) {c.gstin ? \`| GSTIN: \${c.gstin}\` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Order Items</h4>
            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
              <Plus size={16} /> Add Product
            </button>
          </div>

          {items.map((item, idx) => {
            const prod = products.find(p => p.id === item.productId);
            return (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div style={{ flex: 3 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Product</label>
                  <select
                    className="form-select"
                    value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', Number(e.target.value))}
                    required
                  >
                    <option value={0}>-- Select Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.sellingPrice}/pkt)
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Quantity (Pkts)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Subtotal</label>
                  <div style={{ padding: '0.5rem', fontWeight: 600 }}>
                    ₹{(prod ? prod.sellingPrice * item.quantity : 0).toLocaleString()}
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="btn btn-danger btn-sm"
                    style={{ marginBottom: '0.25rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Order Total (Before Tax):</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
              ₹{calculateTotal().toLocaleString()}
            </span>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Notes / Instructions</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Urgent delivery requested by retailer"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting Order...' : 'Submit Order'}
          </button>
        </form>
      </div>
    </div>
  );
};
`);

// 8. pages/production/ProductionRuns.tsx
writeFile('pages/production/ProductionRuns.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { ProductionRun } from '../../types';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export const ProductionRuns: React.FC = () => {
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/production/runs')
      .then(res => setRuns(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Production Floor Runs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Planned vs actual consumption, yield variance and batch costing</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/production/boms" className="btn btn-secondary">
            BOM Master
          </Link>
          <Link to="/production/runs/new" className="btn btn-primary">
            <PlusCircle size={18} /> Record New Run
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Run Number</th>
                <th>Product</th>
                <th>Date</th>
                <th>Planned Output</th>
                <th>Actual Good</th>
                <th>Yield Variance</th>
                <th>Total Cost</th>
                <th>Cost/Packet</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.runNumber}</td>
                  <td>{r.productName}</td>
                  <td>{r.productionDate}</td>
                  <td>{r.plannedOutput} pkts</td>
                  <td style={{ fontWeight: 600 }}>{r.actualGoodOutput} pkts</td>
                  <td>
                    <span className={\`badge \${r.yieldVariancePercentage < -3 ? 'badge-danger' : 'badge-success'}\`}>
                      {r.yieldVariancePercentage > 0 ? '+' : ''}{r.yieldVariancePercentage?.toFixed(2)}%
                    </span>
                  </td>
                  <td>₹{r.totalProductionCost?.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₹{r.costPerPacket?.toFixed(2)}</td>
                  <td><span className="badge badge-success">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`);

// 9. pages/production/BomsList.tsx
writeFile('pages/production/BomsList.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Bom } from '../../types';

export const BomsList: React.FC = () => {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/boms')
      .then(res => setBoms(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Bill of Materials (BOM) Master</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Standard batch recipes, expected yields and raw/packaging requirements</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {boms.map(b => (
          <div key={b.id} className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: '1.125rem' }}>{b.productName}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Version {b.version} | Batch Size: {b.batchSize} {b.batchUnit} | Expected: {b.expectedOutput} {b.outputUnit}
                </span>
              </div>
              <span className="badge badge-success">Active</span>
            </div>

            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Material Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {b.items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.inventoryItemName}</td>
                    <td><span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{item.itemType}</span></td>
                    <td style={{ fontWeight: 600 }}>{item.quantity} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};
`);

// 10. pages/inventory/StockSummary.tsx
writeFile('pages/inventory/StockSummary.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { StockBalance } from '../../types';
import { Link } from 'react-router-dom';

export const StockSummary: React.FC = () => {
  const [rawItems, setRawItems] = useState<StockBalance[]>([]);
  const [products, setProducts] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/inventory/stock'),
      api.get('/inventory/stock/products')
    ]).then(([resStock, resProd]) => {
      setRawItems(resStock.data.data);
      setProducts(resProd.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Central Inventory Engine & Stock Valuation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time stock balance calculated strictly from immutable stock ledger movements</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Finished Goods Inventory</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.code}</td>
                  <td>Finished Goods</td>
                  <td style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{p.currentStock}</td>
                  <td>{p.unit}</td>
                  <td>
                    <span className={\`badge \${p.currentStock > 0 ? 'badge-success' : 'badge-danger'}\`}>
                      {p.currentStock > 0 ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Raw Materials & Packaging Materials</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Available Balance</th>
                <th>Unit</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rawItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.code}</td>
                  <td><span className="badge badge-neutral">{item.itemType}</span></td>
                  <td style={{ fontSize: '1rem', fontWeight: 700 }}>{item.currentStock}</td>
                  <td>{item.unit}</td>
                  <td>{item.reorderLevel}</td>
                  <td>
                    {item.lowStock ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">Healthy</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`);

// 11. pages/invoices/InvoicesList.tsx
writeFile('pages/invoices/InvoicesList.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Invoice } from '../../types';
import { Download, Send, Check } from 'lucide-react';

export const InvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dispatching, setDispatching] = useState<number | null>(null);

  const loadInvoices = () => {
    api.get('/invoices')
      .then(res => setInvoices(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDispatch = async (invoiceId: number) => {
    if (!window.confirm('Confirm dispatch? This will atomically reduce finished goods stock.')) return;
    setDispatching(invoiceId);
    try {
      await api.post('/dispatches', { invoiceId });
      alert('Dispatch completed and finished goods stock reduced!');
      loadInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Dispatch failed');
    } finally {
      setDispatching(null);
    }
  };

  const handleDownloadPdf = (id: number) => {
    window.open(\`/api/invoices/\${id}/pdf\`, '_blank');
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>GST Tax Invoices & Dispatch</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Compliant GST invoicing, place-of-supply tax breakup and dispatch fulfillment</p>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Order No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Type</th>
                <th>Taxable Value</th>
                <th>Total Tax</th>
                <th>Invoice Total</th>
                <th>Amount Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                  <td>{inv.orderNumber}</td>
                  <td>{inv.customerName}</td>
                  <td>{inv.invoiceDate}</td>
                  <td>
                    <span className={\`badge badge-\${inv.gstType === 'INTRA_STATE' ? 'info' : 'warning'}\`}>
                      {inv.gstType}
                    </span>
                  </td>
                  <td>₹{inv.subtotal?.toLocaleString()}</td>
                  <td>₹{inv.totalTax?.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString()}</td>
                  <td style={{ color: inv.amountDue > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                    ₹{inv.amountDue?.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => handleDownloadPdf(inv.id)}
                        className="btn btn-secondary btn-sm"
                        title="Download Tax Invoice PDF"
                      >
                        <Download size={14} /> PDF
                      </button>
                      <button
                        onClick={() => handleDispatch(inv.id)}
                        className="btn btn-primary btn-sm"
                        disabled={dispatching === inv.id}
                      >
                        <Send size={14} /> Dispatch
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`);

// 12. pages/costing/CostingReport.tsx
writeFile('pages/costing/CostingReport.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';

export const CostingReport: React.FC = () => {
  const [margins, setMargins] = useState<any[]>([]);

  useEffect(() => {
    api.get('/costing/margins')
      .then(res => setMargins(res.data.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Production Costing & Margins (Weighted-Average Valuation)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Raw material weighted rates + packaging + labour + gas/power overheads</p>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Selling Price (Pre-Tax)</th>
                <th>Production Cost / Packet</th>
                <th>Gross Margin / Packet</th>
                <th>Gross Margin %</th>
              </tr>
            </thead>
            <tbody>
              {margins.map(m => (
                <tr key={m.productId}>
                  <td style={{ fontWeight: 600 }}>{m.productName}</td>
                  <td>₹{m.sellingPrice?.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>₹{m.avgCostPerPacket?.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{m.grossMargin?.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                      {m.marginPercentage?.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
`);

// 13. pages/reports/ReportsCenter.tsx
writeFile('pages/reports/ReportsCenter.tsx', `
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Download, FileSpreadsheet } from 'lucide-react';

export const ReportsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'gst' | 'stock' | 'production'>('sales');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [gstData, setGstData] = useState<any>(null);
  const [stockData, setStockData] = useState<any[]>([]);
  const [prodData, setProdData] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'sales') {
      api.get('/reports/sales-register').then(res => setSalesData(res.data.data)).catch(console.error);
    } else if (activeTab === 'gst') {
      api.get('/reports/gst-summary').then(res => setGstData(res.data.data)).catch(console.error);
    } else if (activeTab === 'stock') {
      api.get('/reports/stock-summary').then(res => setStockData(res.data.data)).catch(console.error);
    } else if (activeTab === 'production') {
      api.get('/reports/production').then(res => setProdData(res.data.data)).catch(console.error);
    }
  }, [activeTab]);

  const exportReport = (format: 'csv' | 'excel') => {
    const reportType = activeTab === 'sales' ? 'sales-register' : activeTab === 'gst' ? 'sales-register' : 'stock-summary';
    window.open(\`/api/reports/export/\${reportType}?format=\${format}\`, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Auditor & Reporting Centre</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Actual database transactions with export to CSV / Excel</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => exportReport('csv')} className="btn btn-secondary btn-sm">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => exportReport('excel')} className="btn btn-primary btn-sm">
            <FileSpreadsheet size={14} /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={\`btn \${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}\`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Register
        </button>
        <button
          className={\`btn \${activeTab === 'gst' ? 'btn-primary' : 'btn-secondary'}\`}
          onClick={() => setActiveTab('gst')}
        >
          GST Outward Supplies (GSTR-1 format)
        </button>
        <button
          className={\`btn \${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}\`}
          onClick={() => setActiveTab('stock')}
        >
          Stock Summary & Movement
        </button>
        <button
          className={\`btn \${activeTab === 'production' ? 'btn-primary' : 'btn-secondary'}\`}
          onClick={() => setActiveTab('production')}
        >
          Production & Yield Report
        </button>
      </div>

      <div className="card">
        {activeTab === 'sales' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>GSTIN</th>
                  <th>Taxable (₹)</th>
                  <th>CGST (₹)</th>
                  <th>SGST (₹)</th>
                  <th>IGST (₹)</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{s.invoiceNumber}</td>
                    <td>{s.invoiceDate}</td>
                    <td>{s.customerName}</td>
                    <td>{s.customerGstin}</td>
                    <td>₹{s.taxableValue?.toLocaleString()}</td>
                    <td>₹{s.cgstAmount?.toFixed(2)}</td>
                    <td>₹{s.sgstAmount?.toFixed(2)}</td>
                    <td>₹{s.igstAmount?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>₹{s.totalAmount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'gst' && (
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total Taxable Value</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalTaxableValue?.toLocaleString() || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total CGST</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalCgst?.toFixed(2) || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total SGST</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalSgst?.toFixed(2) || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total IGST</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalIgst?.toFixed(2) || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total GST Tax</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>₹{gstData?.totalTax?.toFixed(2) || 0}</p>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>GSTIN</th>
                    <th>Type</th>
                    <th>Taxable Value</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData?.entries?.map((e: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{e.invoiceNumber}</td>
                      <td>{e.customerName}</td>
                      <td>{e.customerGstin}</td>
                      <td><span className="badge badge-info">{e.gstType}</span></td>
                      <td>₹{e.taxableValue?.toLocaleString()}</td>
                      <td>₹{e.cgstAmount?.toFixed(2)}</td>
                      <td>₹{e.sgstAmount?.toFixed(2)}</td>
                      <td>₹{e.igstAmount?.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>₹{e.totalAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Opening</th>
                  <th>Receipts (+)</th>
                  <th>Issues (-)</th>
                  <th>Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{s.itemName}</td>
                    <td>{s.code}</td>
                    <td><span className="badge badge-neutral">{s.itemType}</span></td>
                    <td>{s.openingBalance} {s.unit}</td>
                    <td style={{ color: 'var(--success)' }}>+{s.totalReceipts}</td>
                    <td style={{ color: 'var(--danger)' }}>-{s.totalIssues}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.closingBalance} {s.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'production' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run No</th>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Planned</th>
                  <th>Actual Good</th>
                  <th>Yield Var %</th>
                  <th>Production Cost</th>
                  <th>Cost/Packet</th>
                </tr>
              </thead>
              <tbody>
                {prodData.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.runNumber}</td>
                    <td>{p.productName}</td>
                    <td>{p.productionDate}</td>
                    <td>{p.plannedOutput}</td>
                    <td style={{ fontWeight: 600 }}>{p.actualGoodOutput}</td>
                    <td>
                      <span className={\`badge \${p.yieldVariancePercentage < -3 ? 'badge-danger' : 'badge-success'}\`}>
                        {p.yieldVariancePercentage > 0 ? '+' : ''}{p.yieldVariancePercentage?.toFixed(2)}%
                      </span>
                    </td>
                    <td>₹{p.totalProductionCost?.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{p.costPerPacket?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
`);

// 14. App.tsx and main.tsx
writeFile('App.tsx', `
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OwnerDashboard } from './pages/dashboards/OwnerDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { SalesmanDashboard } from './pages/dashboards/SalesmanDashboard';
import { ProductionDashboard } from './pages/dashboards/ProductionDashboard';
import { AccountantDashboard } from './pages/dashboards/AccountantDashboard';
import { OrdersList } from './pages/sales/OrdersList';
import { CreateOrder } from './pages/sales/CreateOrder';
import { ProductionRuns } from './pages/production/ProductionRuns';
import { BomsList } from './pages/production/BomsList';
import { StockSummary } from './pages/inventory/StockSummary';
import { InvoicesList } from './pages/invoices/InvoicesList';
import { CostingReport } from './pages/costing/CostingReport';
import { ReportsCenter } from './pages/reports/ReportsCenter';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard/owner" replace />} />
            <Route path="dashboard/owner" element={<OwnerDashboard />} />
            <Route path="dashboard/admin" element={<AdminDashboard />} />
            <Route path="dashboard/salesman" element={<SalesmanDashboard />} />
            <Route path="dashboard/production" element={<ProductionDashboard />} />
            <Route path="dashboard/accountant" element={<AccountantDashboard />} />

            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/new" element={<CreateOrder />} />

            <Route path="production" element={<ProductionRuns />} />
            <Route path="production/boms" element={<BomsList />} />

            <Route path="inventory" element={<StockSummary />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="costing" element={<CostingReport />} />
            <Route path="reports" element={<ReportsCenter />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
`);

writeFile('main.tsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);

console.log('Frontend Part 3 generated successfully!');

