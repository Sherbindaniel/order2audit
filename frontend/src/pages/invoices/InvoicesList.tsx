import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Invoice } from '../../types';
import { Download, Send, Check, MessageCircle, DollarSign, Search, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dispatching, setDispatching] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadInvoices = () => {
    setLoading(true);
    api.get('/invoices')
      .then(res => setInvoices(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDispatch = async (invoiceId: number) => {
    if (!window.confirm('Confirm dispatch? This will atomically reduce finished goods stock in the ledger.')) return;
    setDispatching(invoiceId);
    try {
      await api.post('/dispatches', { invoiceId });
      alert('Dispatch completed! Finished goods stock reduced atomically.');
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

  const shareWhatsAppInvoice = (inv: Invoice) => {
    const text = encodeURIComponent(
      `*GST TAX INVOICE — Sri Balaji Snacks*\nInvoice No: ${inv.invoiceNumber}\nDate: ${inv.invoiceDate}\nCustomer: ${inv.customerName}\nSubtotal: ₹${inv.subtotal?.toFixed(2)}\nTotal Tax: ₹${inv.totalTax?.toFixed(2)} (${inv.gstType})\n*Invoice Total: ₹${inv.totalAmount?.toFixed(2)}*\nAmount Paid: ₹${inv.amountPaid?.toFixed(2)}\n*Balance Due: ₹${inv.amountDue?.toFixed(2)}*\n\nThank you for your business!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>GST Tax Invoices & Dispatch</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Compliant GST invoicing, place-of-supply tax breakup, 1-click WhatsApp sharing & warehouse dispatch
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.85rem' }}
              placeholder="Search invoice or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button onClick={loadInvoices} className="btn btn-secondary btn-sm" title="Refresh Invoices">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
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
                <th>GST Type</th>
                <th>Taxable Value</th>
                <th>Total Tax</th>
                <th>Invoice Total</th>
                <th>Balance Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No invoices found. Approved sales orders will appear here for invoicing and dispatch.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{inv.orderNumber}</td>
                    <td style={{ fontWeight: 500 }}>{inv.customerName}</td>
                    <td>{inv.invoiceDate}</td>
                    <td>
                      <span className={`badge badge-${inv.gstType === 'INTRA_STATE' ? 'info' : 'warning'}`}>
                        {inv.gstType === 'INTRA_STATE' ? 'TN (CGST+SGST)' : 'Inter-State (IGST)'}
                      </span>
                    </td>
                    <td>₹{inv.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>₹{inv.totalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 600 }}>₹{inv.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: inv.amountDue > 0 ? 'var(--danger, #dc2626)' : 'var(--success, #16a34a)', fontWeight: 700 }}>
                      ₹{inv.amountDue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <button
                          onClick={() => handleDownloadPdf(inv.id)}
                          className="btn btn-secondary btn-sm"
                          title="Download Tax Invoice PDF"
                        >
                          <Download size={13} /> PDF
                        </button>
                        <button
                          onClick={() => shareWhatsAppInvoice(inv)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#15803d', borderColor: '#bbf7d0', padding: '0.35rem 0.5rem' }}
                          title="Share Invoice summary with customer via WhatsApp"
                        >
                          <MessageCircle size={13} />
                        </button>
                        {inv.dispatched ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.6rem' }}>
                            <Check size={13} /> Dispatched
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDispatch(inv.id)}
                            className="btn btn-primary btn-sm"
                            disabled={dispatching === inv.id}
                            title="Dispatch goods and reduce finished goods inventory"
                          >
                            <Send size={13} /> Dispatch
                          </button>
                        )}
                        {inv.amountDue > 0 && (
                          <Link
                            to="/payments"
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: 'var(--success, #16a34a)', borderColor: 'var(--success, #16a34a)', padding: '0.35rem 0.5rem' }}
                            title="Go to Payments to record collection for this invoice"
                          >
                            <DollarSign size={13} /> Pay
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
