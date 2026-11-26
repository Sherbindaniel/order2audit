import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Customer, Product } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, UserPlus, RefreshCw } from 'lucide-react';

export const CreateOrder: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [items, setItems] = useState<{ productId: number; quantity: number }[]>([
    { productId: 0, quantity: 1 }
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick Add Customer Modal/Form state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustContact, setNewCustContact] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustState, setNewCustState] = useState('Tamil Nadu');
  const [newCustStateCode, setNewCustStateCode] = useState('33');
  const [newCustGstin, setNewCustGstin] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoadingData(true);
    setErrorMessage('');
    try {
      const [resCust, resProd] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      const custList = resCust.data.data || [];
      const prodList = resProd.data.data || [];
      setCustomers(custList);
      setProducts(prodList);
      if (custList.length > 0 && selectedCustomer === '') {
        setSelectedCustomer(custList[0].id);
      }
      if (prodList.length > 0 && items[0].productId === 0) {
        setItems([{ productId: prodList[0].id, quantity: 1 }]);
      }
    } catch (err: any) {
      console.error('Error fetching customers/products:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load customers or products. Please retry.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStateChange = (stateName: string) => {
    setNewCustState(stateName);
    if (stateName === 'Tamil Nadu') setNewCustStateCode('33');
    else if (stateName === 'Karnataka') setNewCustStateCode('29');
    else if (stateName === 'Kerala') setNewCustStateCode('32');
    else if (stateName === 'Andhra Pradesh') setNewCustStateCode('37');
    else setNewCustStateCode('33');
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert('Please enter Customer / Retailer name');
      return;
    }
    setSavingCustomer(true);
    try {
      const res = await api.post('/customers', {
        name: newCustName,
        customerType: 'RETAILER',
        contactPerson: newCustContact,
        phone: newCustPhone,
        address: newCustCity,
        city: newCustCity,
        state: newCustState,
        stateCode: newCustStateCode,
        gstin: newCustGstin,
        creditLimit: 50000
      });
      const created = res.data.data;
      setCustomers(prev => [...prev, created]);
      setSelectedCustomer(created.id);
      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustContact('');
      setNewCustPhone('');
      setNewCustGstin('');
      setNewCustCity('');
      alert(`Customer "${created.name}" created and selected!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSavingCustomer(false);
    }
  };

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
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Create Sales Order (Fast Booking)</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Field Sales Order booking with instant stock check & GST calculation
            </p>
          </div>
          <button onClick={loadData} className="btn btn-secondary btn-sm" title="Refresh customers and products">
            <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} /> Reload Master Data
          </button>
        </div>

        {errorMessage && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--danger-light, #fee2e2)', color: 'var(--danger, #dc2626)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Selection Row */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Select Customer / Retailer *</label>
              <button
                type="button"
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <UserPlus size={14} /> {showAddCustomer ? 'Hide Form' : '+ Quick Add Retailer'}
              </button>
            </div>

            <select
              className="form-select"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(Number(e.target.value))}
              required
              disabled={loadingData}
            >
              <option value="">-- Choose Retailer / Distributor ({customers.length} available) --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city ? c.city + ', ' : ''}{c.state} {c.gstin ? `[GST: ${c.gstin}]` : '[Unregistered]'}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Customer Panel */}
          {showAddCustomer && (
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Quick Register New Customer / Retailer</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Store / Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ganga Stores"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    required={showAddCustomer}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Contact Person</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh"
                    value={newCustContact}
                    onChange={(e) => setNewCustContact(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+91-9842000000"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tiruchirappalli"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>State *</label>
                  <select
                    className="form-select"
                    value={newCustState}
                    onChange={(e) => handleStateChange(e.target.value)}
                  >
                    <option value="Tamil Nadu">Tamil Nadu (33 - CGST+SGST)</option>
                    <option value="Karnataka">Karnataka (29 - IGST)</option>
                    <option value="Kerala">Kerala (32 - IGST)</option>
                    <option value="Andhra Pradesh">Andhra Pradesh (37 - IGST)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="33AAAAA0000A1Z5"
                    value={newCustGstin}
                    onChange={(e) => setNewCustGstin(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddCustomer}
                  disabled={savingCustomer}
                  className="btn btn-primary btn-sm"
                >
                  {savingCustomer ? 'Saving...' : 'Save & Select Customer'}
                </button>
              </div>
            </div>
          )}

          {/* Items Section */}
          <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Order Items</h4>
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
                        {p.name} (SKU: {p.sku}) — ₹{p.sellingPrice.toFixed(2)} [GST: {p.gstRate}%]
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Quantity (pkts)</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    className="form-input"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>

                <div style={{ flex: 1.5 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Line Total (Pre-tax)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={prod ? `₹${(prod.sellingPrice * item.quantity).toFixed(2)}` : '₹0.00'}
                    disabled
                  />
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="btn btn-secondary"
                    style={{ color: 'var(--danger)', padding: '0.5rem' }}
                    title="Remove Item"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Estimated Order Total (excl. GST):</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              ₹{calculateTotal().toFixed(2)}
            </span>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Order Notes / Dispatch Instructions</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g. Urgent delivery required by Friday morning via South India Roadways"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting || loadingData} className="btn btn-primary">
              {submitting ? 'Booking Order...' : 'Submit Sales Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
