import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export const ProductionDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/production')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading production floor dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Production Floor Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Batch tracking, BOM adherence, wastage and yield variance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/production/boms/new" className="btn btn-secondary">
            <PlusCircle size={16} /> New Recipe
          </Link>
          <Link to="/production/runs/new" className="btn btn-primary">
            <PlusCircle size={18} /> Record Production Run
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-title">Completed Runs</span>
          <span className="stat-value">{data?.totalRuns || 0}</span>
          <span className="stat-subtitle">Batches executed</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Good Output</span>
          <span className="stat-value">{data?.totalGoodPackets || 0} <span style={{ fontSize: '1rem' }}>pkts</span></span>
          <span className="stat-subtitle">Produced finished goods</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Average Yield</span>
          <span className="stat-value">{data?.avgYield?.toFixed(1) || '0.0'}%</span>
          <span className="stat-subtitle">Target: 100% (Tolerance ±3%)</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>Recent Batch Runs & Variance</h3>
          <Link to="/production" className="btn btn-secondary btn-sm">Full Production Register</Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Run Number</th>
                <th>Product</th>
                <th>Date</th>
                <th>Planned</th>
                <th>Actual Good</th>
                <th>Yield Variance</th>
                <th>Cost/Packet</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentRuns?.length ? data.recentRuns.map((r: any) => (
                <tr key={r.runNumber}>
                  <td style={{ fontWeight: 600 }}>{r.runNumber}</td>
                  <td>{r.productName}</td>
                  <td>{r.productionDate}</td>
                  <td>{r.plannedOutput}</td>
                  <td style={{ fontWeight: 600 }}>{r.actualGoodOutput}</td>
                  <td>
                    <span className={`badge ${r.yieldVariancePercentage < -3 ? 'badge-danger' : 'badge-success'}`}>
                      {r.yieldVariancePercentage > 0 ? '+' : ''}{r.yieldVariancePercentage?.toFixed(2)}%
                    </span>
                  </td>
                  <td>₹{r.costPerPacket?.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No production runs recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
