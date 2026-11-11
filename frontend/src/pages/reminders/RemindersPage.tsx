import React, { useState } from 'react';
import { MetricCard } from '../../components/MetricCard';

export const RemindersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'templates'>('queue');

  const reminderQueue = [
    { customer: 'Dynamic Steel Fabricators', invoice: '#523', amount: '₹8,00,000', due: 'Overdue by 6 days', channel: 'WhatsApp + Email', tier: 'Urgent Nudge' },
    { customer: 'ABC Technologies Pvt Ltd', invoice: '#56', amount: '₹4,00,000', due: 'Overdue by 7 days', channel: 'WhatsApp + UPI Link', tier: 'Second Notice' },
    { customer: 'Pune Auto Components Ltd', invoice: '#55', amount: '₹20,000', due: 'Overdue by 2 days', channel: 'WhatsApp', tier: 'Polite Reminder' },
    { customer: 'Mahavir Precision Engineering', invoice: '#120', amount: '₹20,000', due: 'Due in 9 days', channel: 'Email', tier: 'Upcoming Notice' },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">AUTOMATION &bull; NUDGES</div>
          <h1>Smart Reminders</h1>
          <p>Context-aware WhatsApp &amp; email follow-ups with embedded dynamic Bharat BillPay &amp; instant UPI autopay links.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={() => alert('Triggering scheduled WhatsApp nudges...')}>
            Trigger Scheduled Nudges
          </button>
        </div>
      </div>

      <div className="metrics">
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          label="Queued Reminders"
          value="4 Invoices"
          subtext="Ready to dispatch"
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          label="Nudges Sent (30d)"
          value="38 Nudges"
          subtext="84% WhatsApp delivery rate"
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          label="Realized Post-Nudge"
          value="₹7,40,000"
          subtext="Cleared within 48h of nudge"
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="Avg Response Time"
          value="1.8 Days"
          subtext="-3.2 days vs manual email"
        />
      </div>

      <div className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-head">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('queue')}
              style={{
                border: 0,
                background: activeTab === 'queue' ? '#edf5f1' : 'none',
                color: activeTab === 'queue' ? '#27845f' : '#88938e',
                fontWeight: activeTab === 'queue' ? 700 : 500,
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Pending Dispatch Queue
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              style={{
                border: 0,
                background: activeTab === 'templates' ? '#edf5f1' : 'none',
                color: activeTab === 'templates' ? '#27845f' : '#88938e',
                fontWeight: activeTab === 'templates' ? 700 : 500,
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Template Rules
            </button>
          </div>
        </div>

        {activeTab === 'queue' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>INVOICE</th>
                  <th>AMOUNT DUE</th>
                  <th>AGING STATUS</th>
                  <th>CHANNEL</th>
                  <th>TRIGGER TIER</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {reminderQueue.map((item, idx) => (
                  <tr key={idx}>
                    <td><b>{item.customer}</b></td>
                    <td>{item.invoice}</td>
                    <td><b>{item.amount}</b></td>
                    <td><span style={{ color: item.due.includes('Overdue') ? '#dc2626' : '#27845f', fontWeight: 600 }}>{item.due}</span></td>
                    <td>{item.channel}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#eaf4ee', color: '#27845f', fontSize: '11px', fontWeight: 600 }}>
                        {item.tier}
                      </span>
                    </td>
                    <td>
                      <button
                        className="link-btn"
                        onClick={() => alert(`Simulated WhatsApp API trigger to ${item.customer} for invoice ${item.invoice}`)}
                      >
                        Send Now &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '16px', display: 'grid', gap: '14px', fontSize: '13px' }}>
            <div style={{ padding: '14px', border: '1px solid #edf0ee', borderRadius: '8px', background: '#fafcfb' }}>
              <div style={{ fontWeight: 700, color: '#172823', marginBottom: '4px' }}>Tier 1: Upcoming Reminder (3 Days Before Due Date)</div>
              <p style={{ margin: 0, color: '#526B5B', fontSize: '12px' }}>
                "Dear Customer, courteous reminder that invoice {'{invoice_number}'} for {'{amount}'} is due on {'{due_date}'}. Pay instantly via UPI: {'{upi_link}'}."
              </p>
            </div>
            <div style={{ padding: '14px', border: '1px solid #edf0ee', borderRadius: '8px', background: '#fafcfb' }}>
              <div style={{ fontWeight: 700, color: '#172823', marginBottom: '4px' }}>Tier 2: Due Today Notice</div>
              <p style={{ margin: 0, color: '#526B5B', fontSize: '12px' }}>
                "Greetings from {'{org_name}'}. Your invoice {'{invoice_number}'} for {'{amount}'} is due today. Tap to authorize direct settlement."
              </p>
            </div>
            <div style={{ padding: '14px', border: '1px solid #edf0ee', borderRadius: '8px', background: '#fafcfb' }}>
              <div style={{ fontWeight: 700, color: '#172823', marginBottom: '4px' }}>Tier 3: 7 Days Overdue Escalation</div>
              <p style={{ margin: 0, color: '#526B5B', fontSize: '12px' }}>
                "Urgent attention required: Invoice {'{invoice_number}'} is now 7 days overdue. Please settle or reply with dispute details to avoid credit review."
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

