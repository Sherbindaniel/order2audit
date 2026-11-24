import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Download, FileSpreadsheet } from 'lucide-react';

export const ReportsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'gst' | 'stock' | 'production'>('sales');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [gstData, setGstData] = useState<any>(null);
  const [stockData, setStockData] = useState<any[]>([]);
  const [prodData, setProdData] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'sales') {
      api.get('/reports/sales-register').then(res => setSalesData(res.data.data)).catch(console.error);
    } else if (activeTab === 'gst') {
      api.get('/reports/gst-summary').then(res => setGstData(res.data.data)).catch(console.error);
    } else if (activeTab === 'stock') {
      api.get('/reports/stock-summary').then(res => setStockData(res.data.data)).catch(console.error);
    } else if (activeTab === 'production') {
      api.get('/reports/production').then(res => setProdData(res.data.data)).catch(console.error);
    }
  }, [activeTab]);

  const exportReport = (format: 'csv' | 'excel') => {
    const reportType = activeTab === 'sales' ? 'sales-register' : activeTab === 'gst' ? 'sales-register' : 'stock-summary';
    window.open(`/api/reports/export/${reportType}?format=${format}`, '_blank');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>Auditor & Reporting Centre</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Actual database transactions with export to CSV / Excel</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => exportReport('csv')} className="btn btn-secondary btn-sm">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => exportReport('excel')} className="btn btn-primary btn-sm">
            <FileSpreadsheet size={14} /> Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Register
        </button>
        <button
          className={`btn ${activeTab === 'gst' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('gst')}
        >
          GST Outward Supplies (GSTR-1 format)
        </button>
        <button
          className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('stock')}
        >
          Stock Summary & Movement
        </button>
        <button
          className={`btn ${activeTab === 'production' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('production')}
        >
          Production & Yield Report
        </button>
      </div>

      <div className="card">
        {activeTab === 'sales' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>GSTIN</th>
                  <th>Taxable (₹)</th>
                  <th>CGST (₹)</th>
                  <th>SGST (₹)</th>
                  <th>IGST (₹)</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{s.invoiceNumber}</td>
                    <td>{s.invoiceDate}</td>
                    <td>{s.customerName}</td>
                    <td>{s.customerGstin}</td>
                    <td>₹{s.taxableValue?.toLocaleString()}</td>
                    <td>₹{s.cgstAmount?.toFixed(2)}</td>
                    <td>₹{s.sgstAmount?.toFixed(2)}</td>
                    <td>₹{s.igstAmount?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>₹{s.totalAmount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'gst' && (
          <div>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total Taxable Value</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalTaxableValue?.toLocaleString() || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total CGST</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalCgst?.toFixed(2) || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total SGST</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalSgst?.toFixed(2) || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total IGST</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{gstData?.totalIgst?.toFixed(2) || 0}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>Total GST Tax</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>₹{gstData?.totalTax?.toFixed(2) || 0}</p>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>GSTIN</th>
                    <th>Type</th>
                    <th>Taxable Value</th>
                    <th>CGST</th>
                    <th>SGST</th>
                    <th>IGST</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData?.entries?.map((e: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{e.invoiceNumber}</td>
                      <td>{e.customerName}</td>
                      <td>{e.customerGstin}</td>
                      <td><span className="badge badge-info">{e.gstType}</span></td>
                      <td>₹{e.taxableValue?.toLocaleString()}</td>
                      <td>₹{e.cgstAmount?.toFixed(2)}</td>
                      <td>₹{e.sgstAmount?.toFixed(2)}</td>
                      <td>₹{e.igstAmount?.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>₹{e.totalAmount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Opening</th>
                  <th>Receipts (+)</th>
                  <th>Issues (-)</th>
                  <th>Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map((s, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{s.itemName}</td>
                    <td>{s.code}</td>
                    <td><span className="badge badge-neutral">{s.itemType}</span></td>
                    <td>{s.openingBalance} {s.unit}</td>
                    <td style={{ color: 'var(--success)' }}>+{s.totalReceipts}</td>
                    <td style={{ color: 'var(--danger)' }}>-{s.totalIssues}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.closingBalance} {s.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'production' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Run No</th>
                  <th>Product</th>
                  <th>Date</th>
                  <th>Planned</th>
                  <th>Actual Good</th>
                  <th>Yield Var %</th>
                  <th>Production Cost</th>
                  <th>Cost/Packet</th>
                </tr>
              </thead>
              <tbody>
                {prodData.map((p, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{p.runNumber}</td>
                    <td>{p.productName}</td>
                    <td>{p.productionDate}</td>
                    <td>{p.plannedOutput}</td>
                    <td style={{ fontWeight: 600 }}>{p.actualGoodOutput}</td>
                    <td>
                      <span className={`badge ${p.yieldVariancePercentage < -3 ? 'badge-danger' : 'badge-success'}`}>
                        {p.yieldVariancePercentage > 0 ? '+' : ''}{p.yieldVariancePercentage?.toFixed(2)}%
                      </span>
                    </td>
                    <td>₹{p.totalProductionCost?.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{p.costPerPacket?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
