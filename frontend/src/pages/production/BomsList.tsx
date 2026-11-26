import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Bom, Product, UnitOfMeasure } from '../../types';
import { PlusCircle, Plus, Trash2, ArrowLeft, Layers, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface InventoryOption {
  id: number;
  name: string;
  code: string;
  unit: UnitOfMeasure;
  itemType: string;
}

interface NewBomItemRow {
  inventoryItemId: number;
  quantity: number;
  unit: UnitOfMeasure;
}

export const BomsList: React.FC = () => {
  const { user } = useAuth();
  const [boms, setBoms] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [batchSize, setBatchSize] = useState<number>(200);
  const [batchUnit, setBatchUnit] = useState<UnitOfMeasure>('PACKET');
  const [expectedOutput, setExpectedOutput] = useState<number>(200);
  const [outputUnit, setOutputUnit] = useState<UnitOfMeasure>('PACKET');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<NewBomItemRow[]>([
    { inventoryItemId: 0, quantity: 40, unit: 'KG' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadBoms = () => {
    setLoading(true);
    setErrorMsg('');
    api.get('/boms')
      .then(res => setBoms(res.data.data || []))
      .catch(err => {
        console.error('Error fetching BOMs:', err);
        setErrorMsg('Failed to load Bill of Materials.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBoms();
    // Load products and inventory items for the Create modal
    Promise.all([
      api.get('/products'),
      api.get('/inventory/items')
    ]).then(([resProd, resItems]) => {
      setProducts(resProd.data.data || []);
      setInventoryItems(resItems.data.data || []);
      if (resProd.data.data?.length > 0) {
        setSelectedProductId(resProd.data.data[0].id);
      }
      if (resItems.data.data?.length > 0) {
        setItems([{ inventoryItemId: resItems.data.data[0].id, quantity: 40, unit: resItems.data.data[0].unit }]);
      }
    }).catch(console.error);
  }, []);

  const addItemRow = () => {
    const firstItem = inventoryItems[0];
    setItems([
      ...items,
      {
        inventoryItemId: firstItem ? firstItem.id : 0,
        quantity: 1,
        unit: firstItem ? firstItem.unit : 'KG'
      }
    ]);
  };

  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: keyof NewBomItemRow, value: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: value };
    if (field === 'inventoryItemId') {
      const inv = inventoryItems.find(it => it.id === Number(value));
      if (inv) copy[idx].unit = inv.unit;
    }
    setItems(copy);
  };

  const handleCreateBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a product');
      return;
    }
    const validItems = items.filter(it => it.inventoryItemId > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one material item with quantity > 0');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        productId: Number(selectedProductId),
        batchSize: Number(batchSize),
        batchUnit: batchUnit,
        expectedOutput: Number(expectedOutput),
        outputUnit: outputUnit,
        notes: notes,
        items: validItems.map(it => ({
          inventoryItemId: it.inventoryItemId,
          quantity: it.quantity,
          unit: it.unit
        }))
      };

      const res = await api.post('/boms', payload);
      setSuccessMsg(`BOM for ${res.data.data.productName} (v${res.data.data.version}) created successfully!`);
      setShowModal(false);
      setNotes('');
      loadBoms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create BOM');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Bill of Materials (BOM) Master</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Standard batch recipes, expected yields and raw/packaging requirements</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadBoms} className="btn btn-secondary btn-sm" title="Refresh BOMs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link to="/production/runs/new" className="btn btn-secondary">
            Floor Execution
          </Link>
          {['OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'].includes(user?.role || '') && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <PlusCircle size={18} /> Create New BOM
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
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--danger-light, #fee2e2)', color: 'var(--danger, #dc2626)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      {boms.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Layers size={40} color="var(--slate-light)" style={{ margin: '0 auto 1rem' }} />
          <h3>No Active BOMs Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            A Bill of Materials defines the exact raw materials and packaging materials needed for one standard production batch.
          </p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <PlusCircle size={18} /> Create First BOM Recipe
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {boms.map(b => (
          <div key={b.id} className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: '1.125rem' }}>{b.productName}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Version {b.version} | Batch Size: {b.batchSize} {b.batchUnit} | Expected Yield: {b.expectedOutput} {b.outputUnit}
                </span>
              </div>
              <span className="badge badge-success">Active Recipe</span>
            </div>

            <div className="table-container">
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Material Item</th>
                    <th>Type</th>
                    <th>Standard Qty</th>
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

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {b.notes || 'Standard manufacturing recipe'}
              </span>
              <Link to="/production/runs/new" className="btn btn-secondary btn-sm">
                Run This Recipe →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create New BOM */}
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
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>Create New BOM Recipe</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleCreateBom}>
              <div className="form-group">
                <label className="form-label">Finished Product *</label>
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Batch Size (pkts) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Expected Output (pkts) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Recipe Ingredients & Materials</h4>
                <button type="button" onClick={addItemRow} className="btn btn-secondary btn-sm">
                  <Plus size={14} /> Add Material
                </button>
              </div>

              {items.map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 3 }}>
                    <select
                      className="form-select"
                      value={row.inventoryItemId}
                      onChange={(e) => updateItemRow(idx, 'inventoryItemId', Number(e.target.value))}
                      required
                    >
                      <option value={0}>-- Select Material --</option>
                      {inventoryItems.map(it => (
                        <option key={it.id} value={it.id}>
                          {it.name} ({it.code}) [{it.itemType}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1.5 }}>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => updateItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-neutral" style={{ padding: '0.5rem' }}>{row.unit}</span>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)', padding: '0.4rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Recipe Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Standard 200g Murukku recipe v2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
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
                  {submitting ? 'Creating...' : 'Save BOM Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
