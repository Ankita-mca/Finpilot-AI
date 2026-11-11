import React from 'react';
import { MetricCard } from '../../components/MetricCard';

export const AuditLogPage: React.FC = () => {
  const auditEntries = [
    { timestamp: '05 Nov 2026, 17:32', actor: 'Rajesh Sharma (Owner)', event: 'Invoice Created (#120)', entity: 'person 5', ip: '172.27.176.1', status: 'Success' },
    { timestamp: '05 Nov 2026, 17:15', actor: 'FinPilot Copilot', event: 'AI Query Executed', entity: 'Receivables Analysis', ip: '127.0.0.1', status: 'Success' },
    { timestamp: '05 Nov 2026, 16:40', actor: 'System Auto-Scheduler', event: 'Reminder WhatsApp Trigger', entity: 'Invoice #56', ip: 'System Core', status: 'Delivered' },
    { timestamp: '05 Nov 2026, 14:10', actor: 'Rajesh Sharma (Owner)', event: 'Organization Switcher Selected', entity: 'Test Org', ip: '172.27.176.1', status: 'Success' },
    { timestamp: '04 Nov 2026, 11:05', actor: 'Test User', event: 'Payment Reconciled', entity: '₹1,20,000 (UPI)', ip: '172.27.176.1', status: 'Success' },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">COMPLIANCE &bull; TRAIL</div>
          <h1>Security &amp; Audit Log</h1>
          <p>Cryptographically verified immutable ledger of system modifications, API requests, and automated bot actions.</p>
        </div>
      </div>

      <div className="metrics">
        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          label="Total logged events"
          value="1,248"
          subtext="30 days retention"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          }
          label="Active sessions"
          value="1 User"
          subtext="Current IP: 172.27.176.1"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          label="Security violations"
          value="0"
          subtext="Zero unauthorized attempts"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            </svg>
          }
          label="e-Invoice integrity"
          value="100%"
          subtext="Cryptographically verified"
        />
      </div>

      <div className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-head">
          <div>
            <h3>Recent Audit Trail</h3>
            <p>Chronological record of system modifications</p>
          </div>
          <div className="period">
            <span className="live-dot" /> Real-time Capture
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ACTOR</th>
                <th>EVENT</th>
                <th>ENTITY</th>
                <th>IP ADDRESS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.timestamp}</td>
                  <td><b>{row.actor}</b></td>
                  <td>{row.event}</td>
                  <td><span style={{ color: '#27845f', fontWeight: 600 }}>{row.entity}</span></td>
                  <td><code style={{ fontSize: '11px' }}>{row.ip}</code></td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600 }}>
                      {row.status}
                    </span>
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
