import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Customer, Invoice, Outstanding, Payment } from '../../types';
import { CreditCard, DollarSign, PlusCircle, AlertCircle, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PaymentsList: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outstandings, setOutstandings] = useState<Outstanding[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'receipts' | 'outstanding'>('receipts');

  // Modal / Form state for recording new payment
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [resPay, resOut, resCust, resInv] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/outstanding'),
        api.get('/customers'),
        api.get('/invoices')
      ]);
      setPayments(resPay.data.data || []);
      setOutstandings(resOut.data.data || []);
      setCustomers(resCust.data.data || []);
      setInvoices(resInv.data.data || []);
    } catch (err: any) {
      console.error('Error loading payment data:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load payments or outstandings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCustomerChange = (custId: number) => {
    setSelectedCustomerId(custId);
    // Find customer outstanding
    const out = outstandings.find(o => o.customerId === custId);
    if (out && out.totalOutstanding > 0) {
      setPaymentAmount(out.totalOutstanding);
    } else {
      setPaymentAmount('');
    }
    // Filter unpaid invoices for this customer
    const custInvoices = invoices.filter(inv => inv.customerId === custId && inv.amountDue > 0);
    if (custInvoices.length > 0) {
      setSelectedInvoiceId(custInvoices[0].id);
      setPaymentAmount(custInvoices[0].amountDue);
    } else {
      setSelectedInvoiceId('');
    }
  };

  const handleInvoiceChange = (invId: number) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find(i => i.id === invId);
    if (inv) {
      setPaymentAmount(inv.amountDue);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount greater than 0');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload: any = {
        customerId: Number(selectedCustomerId),
        amount: Number(paymentAmount),
        paymentDate: paymentDate,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber,
        notes: notes
      };

      if (selectedInvoiceId) {
        payload.allocations = [
          {
            invoiceId: Number(selectedInvoiceId),
            amount: Number(paymentAmount)
          }
        ];
      }

      const res = await api.post('/payments', payload);
      setSuccessMsg(`Payment ${res.data.data.paymentNumber} recorded successfully!`);
      setShowModal(false);
      // Reset form
      setSelectedCustomerId('');
      setSelectedInvoiceId('');
      setPaymentAmount('');
      setReferenceNumber('');
      setNotes('');
      // Reload lists
      loadAll();
    } catch (err: any) {
      console.error('Payment recording error:', err);
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstanding = outstandings.reduce((sum, o) => sum + (o.totalOutstanding || 0), 0);
  const selectedCustOut = outstandings.find(o => o.customerId === selectedCustomerId);
  const unpaidInvoicesForCust = invoices.filter(inv => inv.customerId === selectedCustomerId && inv.amountDue > 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Payments & Accounts Receivable</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Customer payment collections, invoice allocations & aging outstanding balances
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadAll} className="btn btn-secondary btn-sm" title="Refresh data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(user?.role || '') && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <PlusCircle size={18} /> Record Customer Payment
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--success-light, #dcfce7)', color: 'var(--success, #16a34a)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--danger-light, #fee2e2)', color: 'var(--danger, #dc2626)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>Total Collections</span>
            <DollarSign size={18} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--primary)' }}>
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payments.length} payment receipts</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>Total Outstanding Debt</span>
            <AlertCircle size={18} color="var(--danger)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: totalOutstanding > 0 ? 'var(--danger, #dc2626)' : 'var(--success, #16a34a)' }}>
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across all active debtors</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>Active Customers</span>
            <CreditCard size={18} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {customers.length}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered retailers & distributors</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${activeTab === 'receipts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('receipts')}
        >
          Payment Receipts Register ({payments.length})
        </button>
        <button
          className={`btn ${activeTab === 'outstanding' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('outstanding')}
        >
          Customer Outstanding & Aging Summary ({outstandings.length})
        </button>
      </div>

      {/* Tab 1: Payment Receipts Register */}
      {activeTab === 'receipts' && (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment Method</th>
                  <th>Reference Number</th>
                  <th>Amount (₹)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No payment receipts recorded yet. Click "Record Customer Payment" to add one.
                    </td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.paymentNumber}</td>
                      <td>{p.paymentDate}</td>
                      <td style={{ fontWeight: 500 }}>{p.customerName}</td>
                      <td><span className="badge badge-neutral">{p.paymentMethod}</span></td>
                      <td style={{ fontFamily: 'monospace' }}>{p.referenceNumber || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success, #16a34a)' }}>
                        ₹{p.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Customer Outstanding & Aging */}
      {activeTab === 'outstanding' && (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Total Invoiced</th>
                  <th>Total Paid</th>
                  <th>Outstanding Balance</th>
                  <th>0-30 Days</th>
                  <th>31-60 Days</th>
                  <th>61-90 Days</th>
                  <th>90+ Days</th>
                </tr>
              </thead>
              <tbody>
                {outstandings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No customer outstanding balances found.
                    </td>
                  </tr>
                ) : (
                  outstandings.map(o => (
                    <tr key={o.customerId}>
                      <td style={{ fontWeight: 600 }}>{o.customerName}</td>
                      <td>₹{o.totalInvoiced?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ color: 'var(--success, #16a34a)' }}>₹{o.totalPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 700, color: o.totalOutstanding > 0 ? 'var(--danger, #dc2626)' : 'var(--text-muted)' }}>
                        ₹{o.totalOutstanding?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>₹{o.bucket0_30?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>₹{o.bucket31_60?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>₹{o.bucket61_90?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ color: o.bucketOver90 > 0 ? 'var(--danger)' : 'inherit' }}>
                        ₹{o.bucketOver90?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Customer Payment */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>Record Customer Payment Receipt</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleRecordPayment}>
              {/* Customer selection */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Customer / Retailer *</label>
                <select
                  className="form-select"
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(Number(e.target.value))}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.state})
                    </option>
                  ))}
                </select>
                {selectedCustOut && (
                  <span style={{ fontSize: '0.75rem', color: selectedCustOut.totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '0.25rem', display: 'block' }}>
                    Current Outstanding Balance: ₹{selectedCustOut.totalOutstanding?.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Specific Invoice Allocation (Optional) */}
              {selectedCustomerId && unpaidInvoicesForCust.length > 0 && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Allocate to Specific Invoice (Optional)</label>
                  <select
                    className="form-select"
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(Number(e.target.value))}
                  >
                    <option value="">-- Auto-allocate (Oldest Invoices First) --</option>
                    {unpaidInvoicesForCust.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} (Date: {inv.invoiceDate} | Due: ₹{inv.amountDue.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Amount */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  placeholder="e.g. 4000.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || '')}
                  required
                />
              </div>

              {/* Payment Date & Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Payment Method *</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>

              {/* Reference Number */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Reference / Transaction Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UTR-20261122001 or Cheque #123456"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Remarks / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Part payment received towards order dispatch"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Recording...' : 'Save Payment Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

