import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Purchase, PurchaseItem, StockBalance, UnitOfMeasure } from '../../types';
import { 
  Truck, 
  Plus, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Trash2, 
  Eye, 
  PackagePlus,
  FileText
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  city?: string;
}

export const PurchasesList: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // New Purchase Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Factory raw material purchase receipt');
  const [items, setItems] = useState<Array<{ inventoryItemId: number; quantity: number; unit: UnitOfMeasure; unitPrice: number }>>([
    { inventoryItemId: 0, quantity: 50, unit: 'KG', unitPrice: 45.0 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPurchases, resSuppliers, resStock] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stock').catch(() => ({ data: { data: [] } }))
      ]);
      setPurchases(resPurchases.data.data || []);
      setSuppliers(resSuppliers.data.data || []);
      setRawMaterials(resStock.data.data || []);
    } catch (err: any) {
      console.error('Error loading purchases:', err);
      setErrorMessage('Failed to load purchase history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItemRow = () => {
    const firstId = rawMaterials.length > 0 ? rawMaterials[0].id : 0;
    const firstUnit = rawMaterials.length > 0 ? rawMaterials[0].unit : 'KG';
    setItems(prev => [...prev, { inventoryItemId: firstId, quantity: 50, unit: firstUnit, unitPrice: 45.0 }]);
  };

  const removeItemRow = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      if (field === 'inventoryItemId') {
        const selected = rawMaterials.find(rm => rm.id === Number(value));
        copy[idx] = {
          ...copy[idx],
          inventoryItemId: Number(value),
          unit: selected ? selected.unit : 'KG'
        };
      } else {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return copy;
    });
  };

  const grandTotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one material item');
      return;
    }
    for (const it of items) {
      if (!it.inventoryItemId || it.inventoryItemId === 0) {
        alert('Please select a material for all item rows');
        return;
      }
      if (it.quantity <= 0) {
        alert('Please provide a positive quantity for all items');
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/purchases', {
        supplierId: supplierId ? Number(supplierId) : null,
        purchaseDate: purchaseDate,
        notes: notes,
        items: items.map(it => ({
          inventoryItemId: it.inventoryItemId,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice
        }))
      });

      const created = res.data.data;
      setToastMessage(`✓ Purchase ${created.purchaseNumber} recorded! Raw materials have been added to inventory ledger.`);
      setShowNewModal(false);
      // Reset items
      setItems([{ inventoryItemId: 0, quantity: 50, unit: 'KG', unitPrice: 45.0 }]);
      await loadData();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Error creating purchase:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to record purchase receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.purchaseNumber.toLowerCase().includes(q) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={24} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Raw Material Purchases & Inward Receipts</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Goods receipt note (GRN), supplier purchases & automatic FIFO stock ledger inwarding
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={loadData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Plus size={16} /> Record Purchase Inward
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMessage && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Purchase Receipts History</h3>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search purchases or suppliers..."
              className="form-input"
              style={{ paddingLeft: '2rem', width: '260px', fontSize: '0.875rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Purchase Date</th>
                <th>Supplier</th>
                <th>Items Count</th>
                <th>Total Inward Value</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No purchase receipts recorded yet. Click "Record Purchase Inward" to inward raw materials.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(p => (
                  <tr key={p.id}>
                    <td><strong style={{ color: 'var(--primary)' }}>{p.purchaseNumber}</strong></td>
                    <td>{p.purchaseDate}</td>
                    <td style={{ fontWeight: 500 }}>{p.supplierName || 'Direct / Unregistered Mill'}</td>
                    <td><span className="badge badge-neutral">{p.items?.length || 0} materials</span></td>
                    <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      ₹{Number(p.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.notes || '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedPurchase(p)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem' }}
                      >
                        <Eye size={13} /> View Items
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record New Multi-Line Purchase */}
      {showNewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackagePlus size={22} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Record Raw Material Purchase Inward</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Supplier (Vendor / Mill)</label>
                  <select
                    className="form-select"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Direct Cash / Unregistered Mill --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.city ? `(${s.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Purchase / Receipt Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Invoice / GRN Reference</label>
                  <input
                    type="text"
                    className="form-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. GRN-2026-004, Mill Invoice #441"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Materials Received</h4>
                  <button type="button" onClick={addItemRow} className="btn btn-secondary btn-sm">
                    <Plus size={14} /> Add Material Line
                  </button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Raw / Packaging Material *</th>
                        <th style={{ width: '20%' }}>Quantity *</th>
                        <th style={{ width: '12%' }}>Unit</th>
                        <th style={{ width: '18%' }}>Rate (₹/Unit) *</th>
                        <th style={{ width: '10%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, idx) => (
                        <tr key={idx}>
                          <td>
                            <select
                              className="form-select"
                              value={row.inventoryItemId}
                              onChange={(e) => updateItemRow(idx, 'inventoryItemId', e.target.value)}
                              required
                            >
                              <option value={0}>-- Select Material --</option>
                              {rawMaterials.map(rm => (
                                <option key={rm.id} value={rm.id}>
                                  {rm.name} ({rm.code}) [{rm.itemType === 'RAW_MATERIAL' ? 'RM' : 'PM'}]
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              className="form-input"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) => updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              required
                            />
                          </td>
                          <td>
                            <span className="badge badge-neutral" style={{ padding: '0.4rem 0.5rem' }}>
                              {row.unit}
                            </span>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              className="form-input"
                              placeholder="₹"
                              value={row.unitPrice}
                              onChange={(e) => updateItemRow(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              required
                            />
                          </td>
                          <td>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="btn btn-secondary btn-sm"
                                style={{ color: 'var(--danger)', padding: '0.3rem' }}
                                title="Remove line"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'right', marginTop: '0.75rem', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '1rem' }}>Total Inward Valuation:</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNewModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: '180px' }}>
                  {submitting ? 'Recording Inward...' : 'Confirm Inward Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Purchase Line Items */}
      {selectedPurchase && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Receipt {selectedPurchase.purchaseNumber}</h3>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div><strong>Supplier:</strong> {selectedPurchase.supplierName || 'Direct / Unregistered Mill'}</div>
              <div><strong>Receipt Date:</strong> {selectedPurchase.purchaseDate}</div>
              <div><strong>Status:</strong> <span className="badge badge-success">{selectedPurchase.status}</span></div>
              <div><strong>Total Amount:</strong> ₹{Number(selectedPurchase.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              {selectedPurchase.notes && (
                <div style={{ gridColumn: 'span 2' }}><strong>Notes:</strong> {selectedPurchase.notes}</div>
              )}
            </div>

            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>Inwarded Items</h4>
            <div className="table-container" style={{ marginBottom: '1rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Unit Rate</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPurchase.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{it.inventoryItemName || `Item #${it.inventoryItemId}`}</td>
                      <td>{it.quantity} {it.unit}</td>
                      <td>₹{Number(it.unitPrice).toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(it.totalPrice || (it.quantity * it.unitPrice)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedPurchase(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
