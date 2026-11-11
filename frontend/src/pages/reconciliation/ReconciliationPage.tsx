import React, { useState } from 'react';
import { MetricCard } from '../../components/MetricCard';

export const ReconciliationPage: React.FC = () => {
  const [queue, setQueue] = useState([
    { ref: 'TXN-90234812', account: 'HDFC Current (9402)', narration: 'CMS/ABC TECH/INVOICE 1041', credit: '₹1,90,000', suggestedInvoice: '#INV-2024-1041 (100% Match)', matched: false },
    { ref: 'TXN-88294102', account: 'ICICI Corporate (4412)', narration: 'NEFT-MAHAVIR PREC-SETTLE', credit: '₹1,65,000', suggestedInvoice: '#INV-2024-1034 (100% Match)', matched: false },
    { ref: 'TXN-77301948', account: 'SBI Corporate (1190)', narration: 'UPI-BLUEDART-AUTOPAY', credit: '₹1,20,000', suggestedInvoice: '#INV-2024-1038 (100% Match)', matched: true },
  ]);

  const handleConfirmMatch = (idx: number) => {
    const updated = [...queue];
    updated[idx].matched = true;
    setQueue(updated);
  };

  const handleRunAutoMatch = () => {
    setQueue(queue.map((item) => ({ ...item, matched: true })));
    alert('Autonomous reconciliation completed: All matched bank transactions mapped to invoice ledgers.');
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">AUTONOMOUS RECONCILIATION ENGINE</div>
          <h1>Bank &amp; Ledger Reconciliation</h1>
          <p>AI-assisted counterparty resolution, UTR matching, and bank statement discrepancy detection.</p>
        </div>
        <div className="heading-actions">
          <button className="btn" onClick={() => alert('Please select a bank statement CSV / MT940 file...')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Statement
          </button>
          <button className="btn btn-primary" onClick={handleRunAutoMatch}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Run Auto-Match
          </button>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="metrics">
        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          label="Auto-matched rate"
          value="98.6%"
          subtext="142 of 144 items reconciled"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          label="Unresolved items"
          value={`${queue.filter((q) => !q.matched).length} Items`}
          subtext="Awaiting counterparty confirmation"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          label="Connected bank feeds"
          value="3 Accounts"
          subtext="HDFC, ICICI, SBI Corporate"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          label="Net ledger variance"
          value="₹0.00"
          subtext="Books balanced perfectly"
        />
      </div>

      {/* Reconciliation Tasks Panel */}
      <div className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-head">
          <div>
            <h3>Bank Feed Matching Queue</h3>
            <p>AI suggestions for unlinked bank credits</p>
          </div>
          <button className="link-btn" onClick={handleRunAutoMatch}>
            Refresh Queue <span>&rarr;</span>
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>BANK REFERENCE</th>
                <th>ACCOUNT</th>
                <th>NARRATION</th>
                <th>CREDIT</th>
                <th>SUGGESTED INVOICE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((row, idx) => (
                <tr key={idx}>
                  <td><code style={{ fontWeight: 600 }}>{row.ref}</code></td>
                  <td>{row.account}</td>
                  <td>{row.narration}</td>
                  <td><b style={{ color: '#27845f' }}>{row.credit}</b></td>
                  <td>
                    <span style={{ color: '#27845f', fontWeight: 600 }}>{row.suggestedInvoice}</span>
                  </td>
                  <td>
                    {row.matched ? (
                      <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600 }}>
                        Reconciled
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => handleConfirmMatch(idx)}
                      >
                        Confirm Match
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
