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
      await api.put(`/orders/${id}/approve`, { approved: true });
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
                      <span className={`badge badge-${
                        o.status === 'DISPATCHED' ? 'success' :
                        o.status === 'INVOICED' ? 'info' :
                        o.status === 'APPROVED' ? 'info' :
                        o.status === 'SUBMITTED' ? 'warning' : 'neutral'
                      }`}>
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
