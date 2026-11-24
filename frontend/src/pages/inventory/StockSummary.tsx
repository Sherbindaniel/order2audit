import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { StockBalance } from '../../types';
import { Link } from 'react-router-dom';

export const StockSummary: React.FC = () => {
  const [rawItems, setRawItems] = useState<StockBalance[]>([]);
  const [products, setProducts] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/inventory/stock'),
      api.get('/inventory/stock/products')
    ]).then(([resStock, resProd]) => {
      setRawItems(resStock.data.data);
      setProducts(resProd.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Central Inventory Engine & Stock Valuation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time stock balance calculated strictly from immutable stock ledger movements</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Finished Goods Inventory</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.code}</td>
                  <td>Finished Goods</td>
                  <td style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{p.currentStock}</td>
                  <td>{p.unit}</td>
                  <td>
                    <span className={`badge ${p.currentStock > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {p.currentStock > 0 ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Raw Materials & Packaging Materials</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Available Balance</th>
                <th>Unit</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rawItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.code}</td>
                  <td><span className="badge badge-neutral">{item.itemType}</span></td>
                  <td style={{ fontSize: '1rem', fontWeight: 700 }}>{item.currentStock}</td>
                  <td>{item.unit}</td>
                  <td>{item.reorderLevel}</td>
                  <td>
                    {item.lowStock ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">Healthy</span>
                    )}
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
