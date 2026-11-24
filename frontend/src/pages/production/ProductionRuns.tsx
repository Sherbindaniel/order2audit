import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { ProductionRun } from '../../types';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export const ProductionRuns: React.FC = () => {
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/production/runs')
      .then(res => setRuns(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Production Floor Runs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Planned vs actual consumption, yield variance and batch costing</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/production/boms" className="btn btn-secondary">
            BOM Master
          </Link>
          <Link to="/production/runs/new" className="btn btn-primary">
            <PlusCircle size={18} /> Record New Run
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Run Number</th>
                <th>Product</th>
                <th>Date</th>
                <th>Planned Output</th>
                <th>Actual Good</th>
                <th>Yield Variance</th>
                <th>Total Cost</th>
                <th>Cost/Packet</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.runNumber}</td>
                  <td>{r.productName}</td>
                  <td>{r.productionDate}</td>
                  <td>{r.plannedOutput} pkts</td>
                  <td style={{ fontWeight: 600 }}>{r.actualGoodOutput} pkts</td>
                  <td>
                    <span className={`badge ${r.yieldVariancePercentage < -3 ? 'badge-danger' : 'badge-success'}`}>
                      {r.yieldVariancePercentage > 0 ? '+' : ''}{r.yieldVariancePercentage?.toFixed(2)}%
                    </span>
                  </td>
                  <td>₹{r.totalProductionCost?.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₹{r.costPerPacket?.toFixed(2)}</td>
                  <td><span className="badge badge-success">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
