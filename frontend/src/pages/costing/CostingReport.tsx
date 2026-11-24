import React, { useEffect, useState } from 'react';
import api from '../../api/client';

export const CostingReport: React.FC = () => {
  const [margins, setMargins] = useState<any[]>([]);

  useEffect(() => {
    api.get('/costing/margins')
      .then(res => setMargins(res.data.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Production Costing & Margins (Weighted-Average Valuation)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Raw material weighted rates + packaging + labour + gas/power overheads</p>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Selling Price (Pre-Tax)</th>
                <th>Production Cost / Packet</th>
                <th>Gross Margin / Packet</th>
                <th>Gross Margin %</th>
              </tr>
            </thead>
            <tbody>
              {margins.map(m => (
                <tr key={m.productId}>
                  <td style={{ fontWeight: 600 }}>{m.productName}</td>
                  <td>₹{m.sellingPrice?.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>₹{m.avgCostPerPacket?.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{m.grossMargin?.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                      {m.marginPercentage?.toFixed(1)}%
                    </span>
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
