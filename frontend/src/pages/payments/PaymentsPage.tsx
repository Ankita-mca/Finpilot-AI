import React, { useState } from 'react';
import { MetricCard } from '../../components/MetricCard';
import { Modal } from '../../components/Modal';

export const PaymentsPage: React.FC = () => {
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customer: 'ABC Technologies Pvt Ltd',
    invoice: '#INV-2024-1041',
    amount: '190000',
    mode: 'RTGS Bank Transfer',
    ref: 'CMS9023418902',
  });

  const [transactions, setTransactions] = useState([
    { utr: 'CMS9023418902', customer: 'ABC Technologies Pvt Ltd', invoice: '#INV-2024-1041', date: '05 Nov 2026', mode: 'RTGS Bank Transfer', amount: '₹1,90,000', status: 'Settled' },
    { utr: 'UPI9942013840', customer: 'BlueDart Hub Logistics', invoice: '#INV-2024-1038', date: '04 Nov 2026', mode: 'UPI Business Autopay', amount: '₹1,20,000', status: 'Settled' },
    { utr: 'NEFT8847192301', customer: 'Mahavir Precision Forgings', invoice: '#INV-2024-1034', date: '02 Nov 2026', mode: 'NEFT Corporate', amount: '₹1,65,000', status: 'Settled' },
    { utr: 'CMS8830192341', customer: 'Dynamic Steel Fabricators', invoice: '#INV-2024-1029', date: '31 Oct 2026', mode: 'RTGS Wire', amount: '₹1,50,000', status: 'Partially Paid' },
    { utr: 'BAT7720193481', customer: 'Pune Auto Components Ltd', invoice: '#INV-2024-1025', date: '29 Oct 2026', mode: 'IMPS Instant', amount: '₹60,000', status: 'Settled' },
  ]);

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransactions([
      {
        utr: paymentForm.ref || `MANUAL-${Date.now().toString().slice(-4)}`,
        customer: paymentForm.customer,
        invoice: paymentForm.invoice,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        mode: paymentForm.mode,
        amount: '₹' + Number(paymentForm.amount).toLocaleString('en-IN'),
        status: 'Settled',
      },
      ...transactions,
    ]);
    setIsRecordOpen(false);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SETTLEMENTS &amp; CASH COLLECTIONS</div>
          <h1>Payments &amp; Collections</h1>
          <p>Track inbound wire transfers, verify RTGS/NEFT/UPI UTRs, and auto-settle customer receivables.</p>
        </div>
        <div className="heading-actions">
          <button className="btn" onClick={() => alert('Exporting settlement CSV statement...')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setIsRecordOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record Payment
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics">
        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          label="Total collected"
          value="₹12,25,000"
          subtext="42 settled payments this month"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="In-transit settlements"
          value="₹1,40,000"
          subtext="3 bank batches clearing today"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
          label="Collection velocity"
          value="+14.2% MoM"
          subtext="Avg realization: 28.4 days"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          label="Overdue collections"
          value="9 Invoices"
          subtext="WhatsApp follow-ups pending"
        />
      </div>

      {/* Table Panel */}
      <div className="panel" style={{ marginTop: '20px' }}>
        <div className="panel-head">
          <div>
            <h3>Recent Payment Receipts</h3>
            <p>Real-time banking transactions mapped to invoices</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>UTR / REFERENCE</th>
                <th>CUSTOMER</th>
                <th>INVOICE #</th>
                <th>DATE</th>
                <th>MODE</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={idx}>
                  <td><code style={{ fontWeight: 600 }}>{t.utr}</code></td>
                  <td><b>{t.customer}</b></td>
                  <td><span style={{ color: '#27845f', fontWeight: 600 }}>{t.invoice}</span></td>
                  <td>{t.date}</td>
                  <td>{t.mode}</td>
                  <td><b style={{ color: '#27845f' }}>{t.amount}</b></td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: t.status === 'Settled' ? '#dcfce7' : '#fef3c7',
                        color: t.status === 'Settled' ? '#15803d' : '#b45309',
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Modal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} title="Record Manual Payment" subtitle="Allocate bank credits against customer receivables">
        <form onSubmit={handleRecordSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
              Customer Name
            </label>
            <input
              type="text"
              required
              value={paymentForm.customer}
              onChange={(e) => setPaymentForm({ ...paymentForm, customer: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Invoice Number
              </label>
              <input
                type="text"
                required
                value={paymentForm.invoice}
                onChange={(e) => setPaymentForm({ ...paymentForm, invoice: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Payment Mode
              </label>
              <select
                value={paymentForm.mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="UPI Business Autopay">UPI Business Autopay</option>
                <option value="RTGS Bank Transfer">RTGS Bank Transfer</option>
                <option value="NEFT Corporate">NEFT Corporate</option>
                <option value="IMPS Instant">IMPS Instant</option>
                <option value="Cheque / DD">Cheque / Demand Draft</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                UTR / Reference Number
              </label>
              <input
                type="text"
                required
                value={paymentForm.ref}
                onChange={(e) => setPaymentForm({ ...paymentForm, ref: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E7ECE9' }}>
            <button type="button" className="secondary" style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setIsRecordOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="primary" style={{ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer' }}>
              Confirm Receipt
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
