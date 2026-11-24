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
    window.open(`/api/invoices/${id}/pdf`, '_blank');
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
                    <span className={`badge badge-${inv.gstType === 'INTRA_STATE' ? 'info' : 'warning'}`}>
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
