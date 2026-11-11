import React, { useState } from 'react';
import { MetricCard } from '../../components/MetricCard';

export const CashFlowPage: React.FC = () => {
  const [horizon, setHorizon] = useState<'30' | '60' | '90'>('30');

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PREDICTIVE &bull; FORECAST</div>
          <h1>Cash Flow Projections</h1>
          <p>Machine-learning cash velocity models with 94% predictive precision for working capital planning.</p>
        </div>
        <div className="heading-actions">
          <div style={{ display: 'inline-flex', padding: '3px', background: '#e9edeb', borderRadius: '8px' }}>
            <button
              onClick={() => setHorizon('30')}
              style={{ border: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: horizon === '30' ? '#fff' : 'none', fontWeight: horizon === '30' ? 600 : 400, cursor: 'pointer' }}
            >
              30 Days
            </button>
            <button
              onClick={() => setHorizon('60')}
              style={{ border: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: horizon === '60' ? '#fff' : 'none', fontWeight: horizon === '60' ? 600 : 400, cursor: 'pointer' }}
            >
              60 Days
            </button>
            <button
              onClick={() => setHorizon('90')}
              style={{ border: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: horizon === '90' ? '#fff' : 'none', fontWeight: horizon === '90' ? 600 : 400, cursor: 'pointer' }}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      <div className="metrics">
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
          label="Projected Inflow"
          value="₹14,80,000"
          subtext={`Next ${horizon} days runway`}
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          }
          label="Committed Outflow"
          value="₹8,20,000"
          subtext="GST, Vendor payables, Payroll"
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="Net Working Capital"
          value="+₹6,60,000"
          subtext="Healthy liquidity cushion"
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          label="Default Risk Buffer"
          value="₹2,10,000"
          subtext="Based on debtor payment delays"
        />
      </div>

      <div className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-head">
          <div>
            <h3>Expected Inflow vs Outflow Velocity</h3>
            <p>Chronological working capital liquidity timeline</p>
          </div>
        </div>

        {/* SVG Cash Flow Timeline Visualizer */}
        <div style={{ padding: '20px 0', height: '220px', width: '100%' }}>
          <svg viewBox="0 0 800 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="cfInflow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#27845f" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#27845f" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#f0f2f1" strokeDasharray="4 4" />
            <line x1="0" y1="90" x2="800" y2="90" stroke="#f0f2f1" strokeDasharray="4 4" />
            <line x1="0" y1="140" x2="800" y2="140" stroke="#f0f2f1" strokeDasharray="4 4" />

            {/* Inflow Wave */}
            <path
              d="M 0,140 Q 150,60 300,100 T 600,50 T 800,70 L 800,180 L 0,180 Z"
              fill="url(#cfInflow)"
            />
            <path
              d="M 0,140 Q 150,60 300,100 T 600,50 T 800,70"
              fill="none"
              stroke="#27845f"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Outflow Line */}
            <path
              d="M 0,160 Q 200,140 400,130 T 800,110"
              fill="none"
              stroke="#e11d48"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#27845f', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '3px', background: '#27845f', borderRadius: '2px' }} /> Projected Inflow (Collections)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e11d48', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '2px', background: '#e11d48', borderRadius: '2px' }} /> Scheduled Outflow (Tax &amp; Vendors)
          </span>
        </div>
      </div>
    </>
  );
};

