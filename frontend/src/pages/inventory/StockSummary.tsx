import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { StockBalance, UnitOfMeasure } from '../../types';
import { 
  Boxes, 
  PackagePlus, 
  Plus, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Truck,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';

interface SupplierSimple {
  id: number;
  name: string;
  city?: string;
}

export const StockSummary: React.FC = () => {
  const [rawItems, setRawItems] = useState<StockBalance[]>([]);
  const [products, setProducts] = useState<StockBalance[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal State for Inward Stock
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardItemId, setInwardItemId] = useState<number | ''>('');
  const [inwardQuantity, setInwardQuantity] = useState<number>(50);
  const [inwardUnitPrice, setInwardUnitPrice] = useState<number>(45.0);
  const [inwardSupplierId, setInwardSupplierId] = useState<number | ''>('');
  const [inwardDate, setInwardDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inwardNotes, setInwardNotes] = useState<string>('Direct purchase inward');
  const [inwardMode, setInwardMode] = useState<'PURCHASE' | 'OPENING'>('PURCHASE');
  const [submittingInward, setSubmittingInward] = useState(false);

  // Modal State for New Raw Material
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCode, setNewMatCode] = useState('');
  const [newMatType, setNewMatType] = useState<'RAW_MATERIAL' | 'PACKAGING_MATERIAL'>('RAW_MATERIAL');
  const [newMatUnit, setNewMatUnit] = useState<UnitOfMeasure>('KG');
  const [newMatReorderLevel, setNewMatReorderLevel] = useState<number>(20);
  const [submittingNewMat, setSubmittingNewMat] = useState(false);

  // Alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resStock, resProd, resSupp] = await Promise.all([
        api.get('/inventory/stock'),
        api.get('/inventory/stock/products'),
        api.get('/suppliers').catch(() => ({ data: { data: [] } }))
      ]);
      setRawItems(resStock.data.data || []);
      setProducts(resProd.data.data || []);
      setSuppliers(resSupp.data.data || []);
    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      setErrorMessage('Failed to load inventory data. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openInwardModalForItem = (item?: StockBalance) => {
    if (item) {
      setInwardItemId(item.id);
      let defaultCost = 45.0;
      const lower = item.name.toLowerCase();
      if (lower.includes('oil')) defaultCost = 120.0;
      else if (lower.includes('spice') || lower.includes('chilli')) defaultCost = 250.0;
      else if (lower.includes('pouch')) defaultCost = 1.20;
      else if (lower.includes('box') || lower.includes('carton')) defaultCost = 18.0;
      setInwardUnitPrice(defaultCost);
      setInwardQuantity(item.unit === 'KG' ? 50 : item.unit === 'PACKET' || item.unit === 'PIECE' ? 500 : 50);
    } else if (rawItems.length > 0) {
      setInwardItemId(rawItems[0].id);
    }
    setErrorMessage(null);
    setShowInwardModal(true);
  };

  const handleInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inwardItemId) {
      alert('Please select an item to inward');
      return;
    }
    if (inwardQuantity <= 0) {
      alert('Please enter a valid positive quantity');
      return;
    }

    setSubmittingInward(true);
    setErrorMessage(null);

    const selectedItem = rawItems.find(it => it.id === Number(inwardItemId));
    const itemName = selectedItem ? selectedItem.name : 'Material';

    try {
      if (inwardMode === 'PURCHASE') {
        // Record as an official Purchase Order receipt
        await api.post('/purchases', {
          supplierId: inwardSupplierId ? Number(inwardSupplierId) : null,
          purchaseDate: inwardDate,
          notes: inwardNotes,
          items: [
            {
              inventoryItemId: Number(inwardItemId),
              quantity: inwardQuantity,
              unit: selectedItem?.unit || 'KG',
              unitPrice: inwardUnitPrice
            }
          ]
        });
      } else {
        // Record as direct opening / adjustment stock
        await api.post('/inventory/opening-stock', {
          itemId: Number(inwardItemId),
          quantity: inwardQuantity,
          unit: selectedItem?.unit || 'KG',
          unitCost: inwardUnitPrice
        });
      }

      setToastMessage(`✓ Successfully added ${inwardQuantity} ${selectedItem?.unit || 'units'} of ${itemName} to inventory!`);
      setShowInwardModal(false);
      await loadAllData();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Error submitting inward stock:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to inward stock. Please verify your permissions and input.');
    } finally {
      setSubmittingInward(false);
    }
  };

  const handleCreateNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim() || !newMatCode.trim()) {
      alert('Please provide item name and code');
      return;
    }

    setSubmittingNewMat(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/inventory/items', {
        name: newMatName.trim(),
        code: newMatCode.trim().toUpperCase(),
        itemType: newMatType,
        unit: newMatUnit,
        reorderLevel: newMatReorderLevel,
        description: `${newMatType === 'RAW_MATERIAL' ? 'Raw Material' : 'Packaging'} added via Inventory Console`
      });

      const created = res.data.data;
      setToastMessage(`✓ Created new material ${created.name} (${created.code})! You can now inward stock for it.`);
      setShowNewMaterialModal(false);
      setNewMatName('');
      setNewMatCode('');
      await loadAllData();
      
      // Immediately offer to inward stock for the newly created item
      setTimeout(() => {
        openInwardModalForItem(created);
      }, 500);
    } catch (err: any) {
      console.error('Error creating material:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to create new inventory material.');
    } finally {
      setSubmittingNewMat(false);
    }
  };

  // Filter raw items based on search and category
  const filteredRawItems = rawItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterType === 'RAW_MATERIAL') return item.itemType === 'RAW_MATERIAL';
    if (filterType === 'PACKAGING_MATERIAL') return item.itemType === 'PACKAGING_MATERIAL';
    if (filterType === 'LOW_STOCK') return item.lowStock;
    return true;
  });

  const lowStockCount = rawItems.filter(it => it.lowStock).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Boxes size={24} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Inventory Engine & Raw Materials</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-time stock balance calculated strictly from immutable stock ledger movements
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={loadAllData} className="btn btn-secondary btn-sm" title="Refresh stock balances">
            <RefreshCw size={14} /> Refresh
          </button>
          <button 
            onClick={() => setShowNewMaterialModal(true)} 
            className="btn btn-secondary btn-sm"
          >
            <Plus size={14} /> New Material Type
          </button>
          <button 
            onClick={() => openInwardModalForItem()} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <PackagePlus size={16} /> Inward Stock / Receive Materials
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

      {/* Low Stock Quick Warning Banner */}
      {lowStockCount > 0 && (
        <div style={{ padding: '0.875rem 1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e' }}>
            <TrendingDown size={18} />
            <span style={{ fontWeight: 600 }}>{lowStockCount} raw material item{lowStockCount > 1 ? 's are' : ' is'} below minimum reorder level!</span>
          </div>
          <button 
            onClick={() => setFilterType('LOW_STOCK')} 
            className="btn btn-sm" 
            style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
          >
            Show Low Stock Items
          </button>
        </div>
      )}

      {/* Section 1: Raw Materials & Packaging */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Raw Materials & Packaging Stock</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Used in recipe formulation (BOM) and production batch runs
            </p>
          </div>

          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search raw materials..."
                className="form-input"
                style={{ paddingLeft: '2rem', width: '220px', fontSize: '0.875rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: '160px', fontSize: '0.875rem' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Items</option>
              <option value="RAW_MATERIAL">Raw Materials (RM)</option>
              <option value="PACKAGING_MATERIAL">Packaging (PM)</option>
              <option value="LOW_STOCK">Low Stock Only</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Item Code</th>
                <th>Category</th>
                <th>Available Balance</th>
                <th>Unit</th>
                <th>Reorder Level</th>
                <th>Stock Health</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRawItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No materials found matching criteria. Click "+ New Material Type" to register items.
                  </td>
                </tr>
              ) : (
                filteredRawItems.map(item => (
                  <tr key={item.id} style={{ backgroundColor: item.lowStock ? '#fffbeb' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><code style={{ fontSize: '0.85rem' }}>{item.code}</code></td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {item.itemType === 'RAW_MATERIAL' ? 'Raw Material' : 'Packaging'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: item.currentStock <= 0 ? '#b91c1c' : item.lowStock ? '#d97706' : '#15803d' }}>
                        {Number(item.currentStock).toFixed(2)}
                      </span>
                    </td>
                    <td>{item.unit}</td>
                    <td>{item.reorderLevel}</td>
                    <td>
                      {item.currentStock <= 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : item.lowStock ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">Sufficient</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => openInwardModalForItem(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                        title={`Inward ${item.name} to stock`}
                      >
                        <PackagePlus size={13} /> Inward Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Finished Goods Inventory */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Finished Packaged Goods Inventory</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Produced by Factory Runs • Reduced automatically upon Sales Dispatch
            </p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Available Packets</th>
                <th>Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No products recorded yet. Create recipes and execute production runs to produce finished snacks.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><code>{p.code}</code></td>
                    <td>Finished Goods</td>
                    <td style={{ fontSize: '1.1rem', fontWeight: 700, color: p.currentStock > 0 ? 'var(--primary)' : '#b91c1c' }}>
                      {p.currentStock}
                    </td>
                    <td>{p.unit}</td>
                    <td>
                      <span className={`badge ${p.currentStock > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {p.currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Inward Stock / Receive Materials */}
      {showInwardModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackagePlus size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Inward Materials to Inventory</h3>
              </div>
              <button onClick={() => setShowInwardModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInwardSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Select Material / Ingredient *</label>
                <select
                  className="form-select"
                  value={inwardItemId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setInwardItemId(id);
                    const it = rawItems.find(x => x.id === id);
                    if (it) openInwardModalForItem(it);
                  }}
                  required
                >
                  <option value="">-- Choose Raw Material or Packaging --</option>
                  {rawItems.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.code}) — Current Stock: {it.currentStock} {it.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">
                    Quantity to Inward ({rawItems.find(it => it.id === Number(inwardItemId))?.unit || 'Units'}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    className="form-input"
                    value={inwardQuantity}
                    onChange={(e) => setInwardQuantity(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>e.g. 100, 500, 1000</span>
                </div>

                <div>
                  <label className="form-label">Unit Rate / Cost (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    value={inwardUnitPrice}
                    onChange={(e) => setInwardUnitPrice(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost per 1 {rawItems.find(it => it.id === Number(inwardItemId))?.unit || 'unit'}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Inward Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Supplier (Optional)</label>
                  <select
                    className="form-select"
                    value={inwardSupplierId}
                    onChange={(e) => setInwardSupplierId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">-- Direct / Unregistered Mill --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.city ? `(${s.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Reference / Bill Note</label>
                <input
                  type="text"
                  className="form-input"
                  value={inwardNotes}
                  onChange={(e) => setInwardNotes(e.target.value)}
                  placeholder="e.g. Mill Invoice #8921, Opening Stock, Cash Receipt"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md)' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Inward Method</label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inwardMode"
                      value="PURCHASE"
                      checked={inwardMode === 'PURCHASE'}
                      onChange={() => setInwardMode('PURCHASE')}
                    />
                    <span>Purchase Receipt (Generates PO & Ledger Movement)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inwardMode"
                      value="OPENING"
                      checked={inwardMode === 'OPENING'}
                      onChange={() => setInwardMode('OPENING')}
                    />
                    <span>Opening Stock Entry</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInwardModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingInward} className="btn btn-primary" style={{ minWidth: '150px' }}>
                  {submittingInward ? 'Inwarding...' : 'Confirm Inward Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Raw Material Definition */}
      {showNewMaterialModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Register New Material Type</h3>
              </div>
              <button onClick={() => setShowNewMaterialModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewMaterial}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Material Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Premium Cashew Nuts, Sesame Seeds"
                  value={newMatName}
                  onChange={(e) => {
                    setNewMatName(e.target.value);
                    if (!newMatCode) {
                      setNewMatCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase());
                    }
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Item Code / SKU *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="RM-CSHW"
                    value={newMatCode}
                    onChange={(e) => setNewMatCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={newMatType}
                    onChange={(e) => setNewMatType(e.target.value as any)}
                  >
                    <option value="RAW_MATERIAL">Raw Material (RM)</option>
                    <option value="PACKAGING_MATERIAL">Packaging Material (PM)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Unit of Measure *</label>
                  <select
                    className="form-select"
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value as UnitOfMeasure)}
                  >
                    <option value="KG">KG (Kilograms)</option>
                    <option value="G">G (Grams)</option>
                    <option value="L">L (Litres)</option>
                    <option value="PACKET">PACKET</option>
                    <option value="PIECE">PIECE</option>
                    <option value="BOX">BOX</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Min Reorder Level</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    value={newMatReorderLevel}
                    onChange={(e) => setNewMatReorderLevel(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNewMaterialModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingNewMat} className="btn btn-primary" style={{ minWidth: '150px' }}>
                  {submittingNewMat ? 'Registering...' : 'Register Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
