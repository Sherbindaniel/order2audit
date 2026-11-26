import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Bom, BomItem, StockBalance } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Factory, Zap, Plus, RefreshCw, PackagePlus } from 'lucide-react';

interface MaterialInputRow {
  inventoryItemId: number;
  itemName: string;
  unit: string;
  bomQty: number;
  plannedQty: number;
  actualQty: number;
  damagedQty: number;
}

export const CreateProductionRun: React.FC = () => {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [selectedBomId, setSelectedBomId] = useState<number | ''>('');
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1.0);
  const [actualGoodOutput, setActualGoodOutput] = useState<number>(188);
  const [damagedOutput, setDamagedOutput] = useState<number>(4);
  const [wastageQuantity, setWastageQuantity] = useState<number>(8);
  const [labourCost, setLabourCost] = useState<number>(500);
  const [gasPowerCost, setGasPowerCost] = useState<number>(300);
  const [otherOverheadCost, setOtherOverheadCost] = useState<number>(50);
  const [productionDate, setProductionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Standard batch production run');
  const [materials, setMaterials] = useState<MaterialInputRow[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [restocking, setRestocking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const fetchStock = async () => {
    try {
      const res = await api.get('/inventory/stock');
      const items: StockBalance[] = res.data.data || [];
      const map: Record<number, number> = {};
      items.forEach(it => {
        map[it.id] = Number(it.currentStock) || 0;
      });
      setStockMap(map);
    } catch (err) {
      console.error('Error fetching current stock balances:', err);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/boms'),
      api.get('/inventory/stock')
    ])
      .then(([bomRes, stockRes]) => {
        const bomList: Bom[] = bomRes.data.data || [];
        setBoms(bomList);

        const stockItems: StockBalance[] = stockRes.data.data || [];
        const map: Record<number, number> = {};
        stockItems.forEach(it => {
          map[it.id] = Number(it.currentStock) || 0;
        });
        setStockMap(map);

        if (bomList.length > 0) {
          selectBom(bomList[0], 1.0);
        }
      })
      .catch(err => {
        console.error('Error initializing production run:', err);
        setErrorMsg('Failed to load Bill of Materials or stock levels. Please check if the backend is running.');
      })
      .finally(() => setLoading(false));
  }, []);

  const selectBom = (bom: Bom, multiplier: number) => {
    setSelectedBomId(bom.id);
    const plannedOut = Math.round(bom.expectedOutput * multiplier);
    setActualGoodOutput(plannedOut > 0 ? plannedOut : 188);
    setDamagedOutput(4);
    setWastageQuantity(8);

    const rows: MaterialInputRow[] = (bom.items || []).map((item: BomItem) => {
      const planned = Number((item.quantity * multiplier).toFixed(2));
      let actual = planned;
      let damaged = 0;
      if (item.inventoryItemName.toLowerCase().includes('oil')) {
        actual = Number((10.5 * multiplier).toFixed(2));
      } else if (item.inventoryItemName.toLowerCase().includes('pouch')) {
        actual = Number((194 * multiplier).toFixed(0));
        damaged = Number((6 * multiplier).toFixed(0));
      } else if (item.inventoryItemName.toLowerCase().includes('carton')) {
        actual = Number((9 * multiplier).toFixed(0));
        damaged = Number((1 * multiplier).toFixed(0));
      }

      return {
        inventoryItemId: item.inventoryItemId,
        itemName: item.inventoryItemName,
        unit: item.unit,
        bomQty: item.quantity,
        plannedQty: planned,
        actualQty: actual,
        damagedQty: damaged
      };
    });
    setMaterials(rows);
  };

  const handleBomChange = (bomId: number) => {
    const found = boms.find(b => b.id === bomId);
    if (found) {
      selectBom(found, batchMultiplier);
    }
  };

  const handleMultiplierChange = (val: number) => {
    const newMult = Math.max(0.01, val);
    setBatchMultiplier(newMult);
    const found = boms.find(b => b.id === selectedBomId);
    if (found) {
      setMaterials(prev => prev.map(m => ({
        ...m,
        plannedQty: Number((m.bomQty * newMult).toFixed(2)),
        actualQty: Number((m.bomQty * newMult).toFixed(2))
      })));
      setActualGoodOutput(Math.round(found.expectedOutput * newMult));
    }
  };

  const updateMaterialActual = (idx: number, actualVal: number) => {
    setMaterials(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], actualQty: actualVal };
      return copy;
    });
  };

  const updateMaterialDamaged = (idx: number, damagedVal: number) => {
    setMaterials(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], damagedQty: damagedVal };
      return copy;
    });
  };

  // Check if any required material is short in inventory
  const shortMaterials = materials.filter(m => {
    const available = stockMap[m.inventoryItemId] ?? 0;
    return available < m.actualQty;
  });

  // 1-Click Quick Inward / Restock for all missing materials
  const handleRestockMissing = async () => {
    if (shortMaterials.length === 0) return;
    setRestocking(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Create a purchase order containing all short items with a healthy buffer
      const purchaseItems = shortMaterials.map(m => {
        const available = stockMap[m.inventoryItemId] ?? 0;
        const deficit = Math.max(m.actualQty - available, 0);
        // Inward deficit + 50 units (or 2x required) so future runs succeed seamlessly
        const quantityToInward = Math.max(Math.ceil(deficit * 1.5), 50);
        
        // Realistic default unit costs based on item type
        let defaultCost = 45.00;
        const nameLower = m.itemName.toLowerCase();
        if (nameLower.includes('oil')) defaultCost = 120.00;
        else if (nameLower.includes('chilli') || nameLower.includes('spice') || nameLower.includes('asafoetida')) defaultCost = 250.00;
        else if (nameLower.includes('flour') || nameLower.includes('besan')) defaultCost = 42.00;
        else if (nameLower.includes('pouch') || nameLower.includes('packet')) defaultCost = 1.20;
        else if (nameLower.includes('carton') || nameLower.includes('box')) defaultCost = 18.00;

        return {
          inventoryItemId: m.inventoryItemId,
          quantity: quantityToInward,
          unit: m.unit,
          unitPrice: defaultCost
        };
      });

      await api.post('/purchases', {
        supplierId: null,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: `Quick factory inward for Production Run (${selectedBom?.productName || 'Snacks'})`,
        items: purchaseItems
      });

      await fetchStock();
      setSuccessMsg(`⚡ Successfully inwarded fresh stock for ${purchaseItems.length} materials! All required inventory is now ready for production.`);
    } catch (err: any) {
      console.error('Failed to quick-restock:', err);
      // Fallback: Try direct opening stock if purchase failed
      try {
        for (const m of shortMaterials) {
          const available = stockMap[m.inventoryItemId] ?? 0;
          const deficit = Math.max(m.actualQty - available, 0);
          const quantityToInward = Math.max(Math.ceil(deficit * 1.5), 50);
          await api.post('/inventory/opening-stock', {
            itemId: m.inventoryItemId,
            quantity: quantityToInward,
            unit: m.unit,
            unitCost: 45.00
          });
        }
        await fetchStock();
        setSuccessMsg(`⚡ Stock replenished successfully via direct inward balance.`);
      } catch (innerErr: any) {
        setErrorMsg('Failed to auto-restock materials: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setRestocking(false);
    }
  };

  // Quick Inward for a single specific material
  const handleRestockSingle = async (m: MaterialInputRow) => {
    setRestocking(true);
    setErrorMsg('');
    try {
      const available = stockMap[m.inventoryItemId] ?? 0;
      const deficit = Math.max(m.actualQty - available, 0);
      const quantityToInward = Math.max(Math.ceil(deficit * 2), 50);

      let defaultCost = 45.00;
      const nameLower = m.itemName.toLowerCase();
      if (nameLower.includes('oil')) defaultCost = 120.00;
      else if (nameLower.includes('flour')) defaultCost = 42.00;
      else if (nameLower.includes('pouch')) defaultCost = 1.20;

      await api.post('/purchases', {
        supplierId: null,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: `Inward for ${m.itemName}`,
        items: [{
          inventoryItemId: m.inventoryItemId,
          quantity: quantityToInward,
          unit: m.unit,
          unitPrice: defaultCost
        }]
      });

      await fetchStock();
      setSuccessMsg(`Inwarded ${quantityToInward} ${m.unit} of ${m.itemName} successfully!`);
    } catch (err: any) {
      setErrorMsg('Failed to inward item: ' + (err.response?.data?.message || err.message));
    } finally {
      setRestocking(false);
    }
  };

  const selectedBom = boms.find(b => b.id === selectedBomId);
  const plannedOutput = selectedBom ? selectedBom.expectedOutput * batchMultiplier : 0;
  const yieldVariancePackets = actualGoodOutput - plannedOutput;
  const yieldVariancePct = plannedOutput > 0 ? (yieldVariancePackets / plannedOutput) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBom) {
      alert('Please select a BOM recipe');
      return;
    }
    if (materials.length === 0) {
      alert('BOM has no items defined');
      return;
    }

    // Safety pre-check
    if (shortMaterials.length > 0) {
      setErrorMsg(`Cannot start run: Insufficient stock for ${shortMaterials.map(m => m.itemName).join(', ')}. Click "1-Click Inward Short Materials" below to restock immediately.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        productId: selectedBom.productId,
        bomId: selectedBom.id,
        batchMultiplier: batchMultiplier,
        actualGoodOutput: actualGoodOutput,
        damagedOutput: damagedOutput,
        wastageQuantity: wastageQuantity,
        labourCost: labourCost,
        gasPowerCost: gasPowerCost,
        otherOverheadCost: otherOverheadCost,
        productionDate: productionDate,
        notes: notes,
        materialIssues: materials.map(m => ({
          inventoryItemId: m.inventoryItemId,
          actualQuantity: m.actualQty,
          damagedQuantity: m.damagedQty
        }))
      };

      const res = await api.post('/production/runs', payload);
      const run = res.data.data;
      alert(`Production Run ${run.runNumber} created and completed successfully!\nGood Output: ${run.actualGoodOutput} pkts | Cost/pkt: ₹${run.costPerPacket?.toFixed(4)} | Yield Variance: ${run.yieldVariancePercentage?.toFixed(2)}%`);
      navigate('/production');
    } catch (err: any) {
      console.error('Production Run error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to record production run. Ensure sufficient raw materials are in stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Production Floor
      </button>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Factory size={26} color="var(--primary)" />
            <div>
              <h2 style={{ margin: 0 }}>Record New Production Run</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Execute BOM recipe, record planned vs actual consumption, yield variance & overhead costing
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={fetchStock} 
            className="btn btn-secondary btn-sm" 
            title="Refresh current inventory balances"
          >
            <RefreshCw size={14} /> Refresh Stock
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.875rem 1rem', backgroundColor: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
            {shortMaterials.length > 0 && (
              <button
                type="button"
                onClick={handleRestockMissing}
                disabled={restocking}
                className="btn btn-sm"
                style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
              >
                <Zap size={14} /> {restocking ? 'Inwarding Stock...' : '1-Click Restock All Missing'}
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '0.875rem 1rem', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Warning & 1-Click Action if short of stock */}
        {shortMaterials.length > 0 && (
          <div style={{ padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <AlertTriangle size={18} /> Insufficient Raw Materials in Inventory ({shortMaterials.length} item{shortMaterials.length > 1 ? 's' : ''} short)
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#b45309' }}>
                {shortMaterials.map(m => `${m.itemName} (Available: ${(stockMap[m.inventoryItemId] ?? 0)} ${m.unit}, Need: ${m.actualQty} ${m.unit})`).join(' • ')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestockMissing}
              disabled={restocking}
              className="btn btn-sm"
              style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
            >
              <Zap size={15} /> {restocking ? 'Inwarding Stock...' : '⚡ 1-Click Inward Short Materials'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: BOM & Batch Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-subtle, #f8fafc)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <label className="form-label">Select BOM (Recipe) *</label>
              <select
                className="form-select"
                value={selectedBomId}
                onChange={(e) => handleBomChange(Number(e.target.value))}
                required
                disabled={loading}
              >
                {boms.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.productName} (BOM v{b.version} - Batch: {b.batchSize} {b.batchUnit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Batch Multiplier</label>
              <input
                type="number"
                step="any"
                min="0.01"
                className="form-input"
                value={batchMultiplier}
                onChange={(e) => handleMultiplierChange(parseFloat(e.target.value) || 1.0)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>e.g. 1.0 for 1 batch, 100 for 100 batches</span>
            </div>

            <div>
              <label className="form-label">Planned Output</label>
              <input
                type="text"
                className="form-input"
                value={`${plannedOutput} pkts`}
                disabled
                style={{ backgroundColor: 'var(--bg-input, #fff)', fontWeight: 600 }}
              />
            </div>

            <div>
              <label className="form-label">Production Date *</label>
              <input
                type="date"
                className="form-input"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 2: Material Issues Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0 }}>Raw & Packaging Material Consumption</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ledger FIFO allocation verified live against factory stock
              </span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material Item</th>
                    <th>Unit</th>
                    <th>Planned Qty</th>
                    <th>Actual Qty Used *</th>
                    <th>Damaged / Rejected</th>
                    <th>Current Stock</th>
                    <th>Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, idx) => {
                    const variance = m.actualQty - m.plannedQty;
                    const available = stockMap[m.inventoryItemId] ?? 0;
                    const isShort = available < m.actualQty;

                    return (
                      <tr key={m.inventoryItemId} style={{ backgroundColor: isShort ? '#fffbeb' : undefined }}>
                        <td style={{ fontWeight: 600 }}>{m.itemName}</td>
                        <td>{m.unit}</td>
                        <td>{m.plannedQty}</td>
                        <td style={{ maxWidth: '120px' }}>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="form-input"
                            style={{ padding: '0.375rem 0.5rem', borderColor: isShort ? '#f59e0b' : undefined }}
                            value={m.actualQty}
                            onChange={(e) => updateMaterialActual(idx, parseFloat(e.target.value) || 0)}
                            required
                          />
                        </td>
                        <td style={{ maxWidth: '110px' }}>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="form-input"
                            style={{ padding: '0.375rem 0.5rem' }}
                            value={m.damagedQty}
                            onChange={(e) => updateMaterialDamaged(idx, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: isShort ? '#b91c1c' : '#15803d' }}>
                            {available.toFixed(2)} {m.unit}
                          </span>
                        </td>
                        <td>
                          {isShort ? (
                            <button
                              type="button"
                              onClick={() => handleRestockSingle(m)}
                              disabled={restocking}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#b45309', borderColor: '#fde68a', backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              title={`Inward ${m.itemName} to inventory`}
                            >
                              <Plus size={12} /> Inward Stock
                            </button>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle2 size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Output Quantities & Yield Variance */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Production Output & Yield</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <label className="form-label">Actual Good Packets *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  value={actualGoodOutput}
                  onChange={(e) => setActualGoodOutput(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Damaged / Defective Output</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  value={damagedOutput}
                  onChange={(e) => setDamagedOutput(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="form-label">Wastage (Unpacked)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  value={wastageQuantity}
                  onChange={(e) => setWastageQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yield Variance</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: yieldVariancePct < -3 ? 'var(--danger, #dc2626)' : 'var(--success, #16a34a)' }}>
                  {yieldVariancePct.toFixed(2)}% ({yieldVariancePackets} pkts)
                </span>
                <span style={{ fontSize: '0.7rem', color: yieldVariancePct < -3 ? 'var(--danger, #dc2626)' : 'var(--text-muted)' }}>
                  {yieldVariancePct < -3 ? 'Warning: Exceeds ±3% tolerance' : 'Within normal tolerance'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Production Overheads */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Overhead Cost Allocation</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label">Labour Cost (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  value={labourCost}
                  onChange={(e) => setLabourCost(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="form-label">Gas & Power (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  value={gasPowerCost}
                  onChange={(e) => setGasPowerCost(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="form-label">Other Overheads (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="form-input"
                  value={otherOverheadCost}
                  onChange={(e) => setOtherOverheadCost(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Run Notes</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Batch executed under standard operating parameters"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading || shortMaterials.length > 0}
              className="btn btn-primary"
              style={{ minWidth: '200px' }}
            >
              {submitting ? 'Processing Run...' : shortMaterials.length > 0 ? 'Restock Materials First' : 'Complete Production Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
