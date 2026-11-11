import React from 'react';

export const NotificationsPage: React.FC = () => {
  const notifications = [
    { id: 1, title: 'Payment Received', desc: '₹20,000 credited from person 5 for Invoice #55 via UPI.', time: '10 mins ago', type: 'payment' },
    { id: 2, title: 'Overdue Alert', desc: 'Invoice #523 for Dynamic Steel Fabricators is now 6 days overdue.', time: '2 hours ago', type: 'alert' },
    { id: 3, title: 'ERP Sync Completed', desc: 'Successfully synchronized 42 ledger entries with TallyPrime.', time: '5 hours ago', type: 'sync' },
    { id: 4, title: 'Auto-Nudge Dispatched', desc: 'WhatsApp reminder sent to Mahavir Precision for Invoice #100.', time: 'Yesterday', type: 'nudge' },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FEED &bull; ALERTS</div>
          <h1>Notifications</h1>
          <p>Real-time updates on receivables, payment confirmations, and automated reminders.</p>
        </div>
        <div className="heading-actions">
          <button className="btn" onClick={() => alert('All notifications marked as read')}>
            Mark all as read
          </button>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'grid', gap: '12px', padding: '8px 0' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '10px',
                background: '#fafcfb',
                border: '1px solid #edf0ee',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#172823', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.type === 'alert' ? '#e11d48' : '#27845f' }} />
                  {n.title}
                </div>
                <div style={{ fontSize: '12px', color: '#526B5B', marginTop: '4px' }}>{n.desc}</div>
              </div>
              <span style={{ fontSize: '11px', color: '#88938e', whiteSpace: 'nowrap' }}>{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

