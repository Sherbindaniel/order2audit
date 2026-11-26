import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Product, UnitOfMeasure } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, BookOpen, Sparkles, PlusCircle, CheckCircle2, Calculator } from 'lucide-react';

interface MaterialRow {
  inventoryItemId: number;
  quantity: number;
  unit: UnitOfMeasure;
  estimatedCostPerUnit?: number;
}

interface InventoryOption {
  id: number;
  name: string;
  code: string;
  unit: UnitOfMeasure;
  itemType: string;
}

export const CreateBom: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Mode: select existing or create new snack
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');

  // New Product fields
  const [newProdName, setNewProdName] = useState('');
  const [newProdPackSize, setNewProdPackSize] = useState<number>(200);
  const [newProdPackUnit, setNewProdPackUnit] = useState<UnitOfMeasure>('G');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState<number>(50);
  const [newProdMrp, setNewProdMrp] = useState<number>(60);
  const [newProdHsn, setNewProdHsn] = useState('2106');
  const [newProdGstRate, setNewProdGstRate] = useState<number>(5);

  // Recipe (BOM) fields
  const [batchSize, setBatchSize] = useState<number>(200);
  const [batchUnit, setBatchUnit] = useState<UnitOfMeasure>('PACKET');
  const [expectedOutput, setExpectedOutput] = useState<number>(200);
  const [outputUnit, setOutputUnit] = useState<UnitOfMeasure>('PACKET');
  const [recipeNotes, setRecipeNotes] = useState('Standard master manufacturing batch recipe');

  // Materials rows
  const [items, setItems] = useState<MaterialRow[]>([]);

  // Quick Material Addition Modal
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCode, setNewMatCode] = useState('');
  const [newMatType, setNewMatType] = useState<'RAW_MATERIAL' | 'PACKAGING_MATERIAL'>('RAW_MATERIAL');
  const [newMatUnit, setNewMatUnit] = useState<UnitOfMeasure>('KG');
  const [savingMat, setSavingMat] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [resProd, resInv] = await Promise.all([
        api.get('/products'),
        api.get('/inventory/items')
      ]);
      const prodList: Product[] = resProd.data.data || [];
      const invList: InventoryOption[] = resInv.data.data || [];
      setProducts(prodList);
      setInventoryItems(invList);

      if (prodList.length > 0 && selectedProductId === '') {
        setSelectedProductId(prodList[0].id);
      }

      // Pre-seed default material rows if empty
      if (items.length === 0 && invList.length > 0) {
        const defaultRows: MaterialRow[] = [];
        const flour = invList.find(i => i.name.toLowerCase().includes('flour'));
        const oil = invList.find(i => i.name.toLowerCase().includes('oil'));
        const spice = invList.find(i => i.name.toLowerCase().includes('spice'));
        const pouch = invList.find(i => i.name.toLowerCase().includes('pouch'));
        const carton = invList.find(i => i.name.toLowerCase().includes('carton'));

        if (flour) defaultRows.push({ inventoryItemId: flour.id, quantity: 40, unit: flour.unit });
        if (oil) defaultRows.push({ inventoryItemId: oil.id, quantity: 10, unit: oil.unit });
        if (spice) defaultRows.push({ inventoryItemId: spice.id, quantity: 1.2, unit: spice.unit });
        if (pouch) defaultRows.push({ inventoryItemId: pouch.id, quantity: 200, unit: pouch.unit });
        if (carton) defaultRows.push({ inventoryItemId: carton.id, quantity: 10, unit: carton.unit });

        if (defaultRows.length > 0) {
          setItems(defaultRows);
        } else {
          setItems([{ inventoryItemId: invList[0].id, quantity: 10, unit: invList[0].unit }]);
        }
      }
    } catch (err) {
      console.error('Failed to load products/items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addRow = () => {
    const first = inventoryItems[0];
    setItems([
      ...items,
      {
        inventoryItemId: first ? first.id : 0,
        quantity: 1,
        unit: first ? first.unit : 'KG'
      }
    ]);
  };

  const removeRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: keyof MaterialRow, val: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [field]: val };
    if (field === 'inventoryItemId') {
      const match = inventoryItems.find(it => it.id === Number(val));
      if (match) copy[idx].unit = match.unit;
    }
    setItems(copy);
  };

  const handleQuickAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) {
      alert('Enter material name');
      return;
    }
    setSavingMat(true);
    try {
      const genCode = newMatCode.trim() || `${newMatType === 'RAW_MATERIAL' ? 'RM' : 'PM'}-${newMatName.substring(0, 4).toUpperCase()}`;
      const res = await api.post('/inventory/items', {
        name: newMatName,
        code: genCode,
        itemType: newMatType,
        unit: newMatUnit,
        reorderLevel: 10
      });
      const created: InventoryOption = res.data.data;
      setInventoryItems(prev => [...prev, created]);
      // Add as row
      setItems(prev => [...prev, { inventoryItemId: created.id, quantity: 1, unit: created.unit }]);
      setShowAddMaterialModal(false);
      setNewMatName('');
      setNewMatCode('');
      alert(`Material "${created.name}" added and appended to recipe ingredients!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create material');
    } finally {
      setSavingMat(false);
    }
  };

  const activeSellingPrice = isNewProduct
    ? (newProdSellingPrice || 0)
    : (products.find(p => p.id === selectedProductId)?.sellingPrice || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const validItems = items.filter(it => it.inventoryItemId > 0 && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one recipe ingredient with quantity > 0');
      return;
    }

    setSubmitting(true);
    try {
      let finalProductId = selectedProductId;

      // If creating new product first
      if (isNewProduct) {
        if (!newProdName.trim()) {
          alert('Please enter snack / product name');
          setSubmitting(false);
          return;
        }
        const prodPayload = {
          name: newProdName.trim(),
          packSize: Number(newProdPackSize),
          packUnit: newProdPackUnit,
          sellingPrice: Number(newProdSellingPrice),
          mrp: Number(newProdMrp),
          hsnCode: newProdHsn || '2106',
          gstRate: Number(newProdGstRate)
        };
        const prodRes = await api.post('/products', prodPayload);
        finalProductId = prodRes.data.data.id;
      }

      if (!finalProductId) {
        alert('Please choose or create a product');
        setSubmitting(false);
        return;
      }

      // Create BOM
      const bomPayload = {
        productId: Number(finalProductId),
        batchSize: Number(batchSize),
        batchUnit: batchUnit,
        expectedOutput: Number(expectedOutput),
        outputUnit: outputUnit,
        notes: recipeNotes,
        items: validItems.map(it => ({
          inventoryItemId: it.inventoryItemId,
          quantity: it.quantity,
          unit: it.unit
        }))
      };

      const bomRes = await api.post('/boms', bomPayload);
      alert(`Recipe for "${bomRes.data.data.productName}" (BOM Version ${bomRes.data.data.version}) created successfully!`);
      navigate('/production/boms');
    } catch (err: any) {
      console.error('Error creating BOM recipe:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create recipe. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Recipes
      </button>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary-light, #eff6ff)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>Create New Snack Recipe (Bill of Materials)</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Define standard batch ingredients, pouch/carton packaging requirements & expected batch yields
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--danger-light, #fee2e2)', color: 'var(--danger, #dc2626)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Snack / Product Association */}
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>1. Product Target</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNewProduct(false)}
                  className={`btn btn-sm ${!isNewProduct ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Existing Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewProduct(true)}
                  className={`btn btn-sm ${isNewProduct ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Plus size={14} /> New Snack Product
                </button>
              </div>
            </div>

            {!isNewProduct ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Select Packaged Snack Product *</label>
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  required={!isNewProduct}
                  disabled={loading}
                >
                  <option value="">-- Choose Product to formulate --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku}) — Pack: {p.packSize}{p.packUnit} | Selling Price: ₹{p.sellingPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label">Snack Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Special Madras Mixture 200g"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      required={isNewProduct}
                    />
                  </div>
                  <div>
                    <label className="form-label">Pack Net Weight</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        value={newProdPackSize}
                        onChange={(e) => setNewProdPackSize(parseFloat(e.target.value) || 0)}
                        required={isNewProduct}
                      />
                      <select
                        className="form-select"
                        style={{ width: '80px' }}
                        value={newProdPackUnit}
                        onChange={(e) => setNewProdPackUnit(e.target.value as UnitOfMeasure)}
                      >
                        <option value="G">G</option>
                        <option value="KG">KG</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Selling Price (excl. GST) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      placeholder="50.00"
                      value={newProdSellingPrice}
                      onChange={(e) => setNewProdSellingPrice(parseFloat(e.target.value) || 0)}
                      required={isNewProduct}
                    />
                  </div>
                  <div>
                    <label className="form-label">MRP (₹)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      placeholder="60.00"
                      value={newProdMrp}
                      onChange={(e) => setNewProdMrp(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">HSN Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newProdHsn}
                      onChange={(e) => setNewProdHsn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">GST Rate (%)</label>
                    <select
                      className="form-select"
                      value={newProdGstRate}
                      onChange={(e) => setNewProdGstRate(parseFloat(e.target.value) || 5)}
                    >
                      <option value={5}>5% (Packaged snacks standard)</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Standard Batch Output Parameters */}
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', marginBottom: '1rem' }}>2. Standard Batch Output</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Batch Size (Input Units)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <select
                    className="form-select"
                    style={{ width: '110px' }}
                    value={batchUnit}
                    onChange={(e) => setBatchUnit(e.target.value as UnitOfMeasure)}
                  >
                    <option value="PACKET">PACKET</option>
                    <option value="KG">KG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Expected Good Yield (Packets) *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-input"
                    value={expectedOutput}
                    onChange={(e) => setExpectedOutput(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <select
                    className="form-select"
                    style={{ width: '110px' }}
                    value={outputUnit}
                    onChange={(e) => setOutputUnit(e.target.value as UnitOfMeasure)}
                  >
                    <option value="PACKET">PACKET</option>
                    <option value="KG">KG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Recipe Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  placeholder="e.g. Traditional formula with 10% cashew"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ingredients & Materials */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>3. Recipe Ingredients & Packaging Materials</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
                  Quantities required per 1 standard batch ({batchSize} {batchUnit})
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus size={14} /> New Raw Material
                </button>
                <button
                  type="button"
                  onClick={addRow}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} /> Add Ingredient Row
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Material / Packaging Item</th>
                    <th style={{ width: '25%' }}>Standard Quantity per Batch *</th>
                    <th style={{ width: '20%' }}>Unit</th>
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
                          onChange={(e) => updateRow(idx, 'inventoryItemId', Number(e.target.value))}
                          required
                        >
                          <option value={0}>-- Select Ingredient / Packaging --</option>
                          {inventoryItems.map(it => (
                            <option key={it.id} value={it.id}>
                              {it.name} ({it.code}) [{it.itemType === 'RAW_MATERIAL' ? 'RM' : 'PM'}]
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          className="form-input"
                          placeholder="e.g. 40.0"
                          value={row.quantity}
                          onChange={(e) => updateRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ padding: '0.4rem 0.6rem' }}>
                          {row.unit}
                        </span>
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--danger)' }}
                            title="Remove Ingredient"
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
          </div>

          {/* Section 4: Shopkeeper's Profit Analysis Card */}
          <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Calculator size={28} color="var(--success, #16a34a)" />
              <div>
                <h4 style={{ margin: 0, color: '#166534', fontSize: '0.95rem' }}>Shopkeeper's Recipe Formulation Summary</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803d', marginTop: '0.125rem' }}>
                  {items.length} items configured • Standard batch yield: <strong>{expectedOutput} {outputUnit}</strong> • Target Price: <strong>₹{activeSellingPrice.toFixed(2)}</strong>
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#15803d', display: 'block' }}>Expected Batch Turnover</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>
                ₹{(expectedOutput * activeSellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/production/boms')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="btn btn-primary"
              style={{ minWidth: '180px' }}
            >
              <CheckCircle2 size={16} /> {submitting ? 'Saving Recipe...' : 'Save & Activate Recipe'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Quick Add New Raw Material */}
      {showAddMaterialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Add New Material to Master</h3>
              <button onClick={() => setShowAddMaterialModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            <form onSubmit={handleQuickAddMaterial}>
              <div className="form-group">
                <label className="form-label">Material Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Gram Flour / Besan, Peanuts, Cashews"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Material Type</label>
                  <select
                    className="form-select"
                    value={newMatType}
                    onChange={(e) => setNewMatType(e.target.value as any)}
                  >
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="PACKAGING_MATERIAL">Packaging Material</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit of Measure</label>
                  <select
                    className="form-select"
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value as any)}
                  >
                    <option value="KG">KG</option>
                    <option value="G">G</option>
                    <option value="L">L</option>
                    <option value="ML">ML</option>
                    <option value="PIECE">PIECE</option>
                    <option value="PACKET">PACKET</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Item Code (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RM-BESAN, PM-BOX"
                  value={newMatCode}
                  onChange={(e) => setNewMatCode(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMat}
                  className="btn btn-primary"
                >
                  {savingMat ? 'Saving...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
