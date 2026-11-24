import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Bom } from '../../types';

export const BomsList: React.FC = () => {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/boms')
      .then(res => setBoms(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Bill of Materials (BOM) Master</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Standard batch recipes, expected yields and raw/packaging requirements</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {boms.map(b => (
          <div key={b.id} className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: '1.125rem' }}>{b.productName}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Version {b.version} | Batch Size: {b.batchSize} {b.batchUnit} | Expected: {b.expectedOutput} {b.outputUnit}
                </span>
              </div>
              <span className="badge badge-success">Active</span>
            </div>

            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Material Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
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
        ))}
      </div>
    </div>
  );
};
