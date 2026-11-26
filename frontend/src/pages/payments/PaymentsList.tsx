import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Customer, Invoice, Outstanding, Payment } from '../../types';
import { CreditCard, DollarSign, PlusCircle, AlertCircle, RefreshCw, FileText, CheckCircle2, MessageCircle, Search, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PaymentsList: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [outstandings, setOutstandings] = useState<Outstanding[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'receipts' | 'outstanding'>('outstanding'); // Default to outstanding for shopkeepers

  // Filter / Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyDebtors, setOnlyDebtors] = useState(false);

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

  // Quick 1-click action to collect payment from a customer
  const openPaymentForCustomer = (custId: number) => {
    handleCustomerChange(custId);
    setShowModal(true);
  };

  // WhatsApp payment reminder
  const sendWhatsAppReminder = (customerName: string, amount: number, phone?: string) => {
    const text = encodeURIComponent(
      `Namaste ${customerName}, this is a polite payment reminder from Sri Balaji Snacks regarding your current outstanding balance of ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Kindly arrange transfer via UPI/Bank at your convenience. Thank you!`
    );
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
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
      setSuccessMsg(`Payment ${res.data.data.paymentNumber} of ₹${Number(paymentAmount).toFixed(2)} recorded successfully!`);
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
  const activeDebtorsCount = outstandings.filter(o => o.totalOutstanding > 0).length;

  const selectedCustOut = outstandings.find(o => o.customerId === selectedCustomerId);
  const unpaidInvoicesForCust = invoices.filter(inv => inv.customerId === selectedCustomerId && inv.amountDue > 0);

  // Sort customers so debtors with balances appear first
  const sortedCustomers = [...customers].sort((a, b) => {
    const outA = outstandings.find(o => o.customerId === a.id)?.totalOutstanding || 0;
    const outB = outstandings.find(o => o.customerId === b.id)?.totalOutstanding || 0;
    return outB - outA;
  });

  // Filtered lists
  const filteredOutstandings = outstandings.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDebtors = onlyDebtors ? o.totalOutstanding > 0 : true;
    return matchesSearch && matchesDebtors;
  });

  const filteredPayments = payments.filter(p =>
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Payments & Accounts Receivable</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Track customer balances, 1-click collections, UPI/Bank receipts & debtor aging
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
            <span>Total Collections (To Date)</span>
            <DollarSign size={18} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--primary)' }}>
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payments.length} receipts booked</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>Total Pending Receivables</span>
            <AlertCircle size={18} color="var(--danger)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: totalOutstanding > 0 ? 'var(--danger, #dc2626)' : 'var(--success, #16a34a)' }}>
            ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owed by {activeDebtorsCount} retailers / distributors</span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span>Registered Accounts</span>
            <CreditCard size={18} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {customers.length}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeDebtorsCount} accounts with balance due</span>
        </div>
      </div>

      {/* Search and Tabs Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'outstanding' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('outstanding')}
          >
            Customer Outstanding & Aging ({outstandings.length})
          </button>
          <button
            className={`btn ${activeTab === 'receipts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('receipts')}
          >
            Payment Receipts Register ({payments.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.85rem' }}
              placeholder="Search retailer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {activeTab === 'outstanding' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--slate)' }}>
              <input
                type="checkbox"
                checked={onlyDebtors}
                onChange={(e) => setOnlyDebtors(e.target.checked)}
              />
              Due balances only
            </label>
          )}
        </div>
      </div>

      {/* Tab 1: Customer Outstanding & Aging Matrix */}
      {activeTab === 'outstanding' && (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Total Invoiced</th>
                  <th>Total Paid</th>
                  <th>Balance Due</th>
                  <th>0-30 Days</th>
                  <th>31-60 Days</th>
                  <th>61-90 Days</th>
                  <th>90+ Days</th>
                  <th>Shopkeeper Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutstandings.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No matching customer accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredOutstandings.map(o => {
                    const cust = customers.find(c => c.id === o.customerId);
                    const hasDue = o.totalOutstanding > 0;
                    return (
                      <tr key={o.customerId} style={{ backgroundColor: hasDue ? 'inherit' : '#fafafa' }}>
                        <td style={{ fontWeight: 600 }}>
                          {o.customerName}
                          {cust?.phone && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.phone}</span>}
                        </td>
                        <td>₹{o.totalInvoiced?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ color: 'var(--success, #16a34a)' }}>₹{o.totalPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 700, fontSize: '0.95rem', color: hasDue ? 'var(--danger, #dc2626)' : 'var(--text-muted)' }}>
                          ₹{o.totalOutstanding?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>₹{o.bucket0_30?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>₹{o.bucket31_60?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>₹{o.bucket61_90?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ color: o.bucketOver90 > 0 ? 'var(--danger)' : 'inherit' }}>
                          ₹{o.bucketOver90?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          {hasDue ? (
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                onClick={() => openPaymentForCustomer(o.customerId)}
                                className="btn btn-primary btn-sm"
                                style={{ backgroundColor: 'var(--success, #16a34a)', borderColor: 'var(--success, #16a34a)', whiteSpace: 'nowrap' }}
                                title="Record payment received from this customer"
                              >
                                <DollarSign size={13} /> Collect
                              </button>
                              <button
                                onClick={() => sendWhatsAppReminder(o.customerName, o.totalOutstanding, cust?.phone)}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#15803d', borderColor: '#bbf7d0', padding: '0.25rem 0.4rem' }}
                                title="Send friendly payment reminder via WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payment Receipts Register */}
      {activeTab === 'receipts' && (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Customer / Payer</th>
                  <th>Method</th>
                  <th>Reference Number</th>
                  <th>Amount Collected</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No payment receipts matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.paymentNumber}</td>
                      <td>{p.paymentDate}</td>
                      <td style={{ fontWeight: 500 }}>{p.customerName}</td>
                      <td><span className="badge badge-neutral">{p.paymentMethod}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.referenceNumber || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success, #16a34a)', fontSize: '0.95rem' }}>
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
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Record Customer Payment Receipt</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                  Select customer with balance due to auto-fill amount & invoice allocation
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleRecordPayment}>
              {/* Customer selection with visible amount due */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Customer / Payer *</label>
                <select
                  className="form-select"
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(Number(e.target.value))}
                  required
                >
                  <option value="">-- Choose Payer (Balances Shown Below) --</option>
                  {sortedCustomers.map(c => {
                    const out = outstandings.find(o => o.customerId === c.id);
                    const due = out ? out.totalOutstanding : 0;
                    return (
                      <option key={c.id} value={c.id}>
                        {due > 0 ? `🔴 ₹${due.toLocaleString('en-IN', { minimumFractionDigits: 2 })} DUE — ` : '✓ Settled (₹0.00) — '}
                        {c.name} ({c.state})
                      </option>
                    );
                  })}
                </select>

                {selectedCustOut && (
                  <div style={{ marginTop: '0.375rem', padding: '0.5rem 0.75rem', backgroundColor: selectedCustOut.totalOutstanding > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 'var(--radius-sm)', border: `1px solid ${selectedCustOut.totalOutstanding > 0 ? '#fecaca' : '#bbf7d0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: selectedCustOut.totalOutstanding > 0 ? '#b91c1c' : '#15803d', fontWeight: 500 }}>
                      {selectedCustOut.totalOutstanding > 0 ? `Total Balance Due: ₹${selectedCustOut.totalOutstanding?.toFixed(2)}` : 'Account is fully settled!'}
                    </span>
                    {selectedCustOut.totalOutstanding > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(selectedCustOut.totalOutstanding)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                      >
                        Set Full Amount
                      </button>
                    )}
                  </div>
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
                        {inv.invoiceNumber} (Date: {inv.invoiceDate} | Balance Due: ₹{inv.amountDue.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Payment Amount */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Payment Amount Collected (₹) *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  className="form-input"
                  placeholder="e.g. 3875.00"
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
                  <label className="form-label">Payment Mode *</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Reference Number */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">UPI Transaction ID / Cheque / UTR No.</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. UPI-6110294819 or Cheque #884102"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Shopkeeper Remarks</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Cleared pending invoice balance"
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
                  style={{ minWidth: '150px' }}
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
