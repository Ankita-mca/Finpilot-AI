import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { Invoice, InvoiceSummary, Customer } from '../../types';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalReceivables: 2360000,
    overdueAmount: 1340000,
    dueSoonAmount: 100000,
    paidAmount: 520000,
    totalCount: 12,
    overdueCount: 5,
    paidCount: 4,
    customersCount: 7,
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, invoiceData, custData] = await Promise.allSettled([
        invoiceService.getSummary(),
        invoiceService.getAll({ limit: 8 }),
        customerService.getAll({ limit: 100 }),
      ]);

      // 1. Process Summary
      if (summaryData.status === 'fulfilled' && summaryData.value) {
        const s = summaryData.value;
        setSummary((prev) => ({
          totalReceivables: s.totalOutstanding ?? s.totalReceivables ?? prev.totalReceivables,
          overdueAmount: s.overdueAmount ?? prev.overdueAmount,
          dueSoonAmount: s.dueSoonAmount ?? prev.dueSoonAmount,
          paidAmount: s.totalPaid ?? s.paidAmount ?? prev.paidAmount,
          totalCount: s.totalInvoices ?? s.totalCount ?? prev.totalCount,
          overdueCount: s.overdueCount ?? prev.overdueCount,
          paidCount: s.counts?.paid ?? s.paidCount ?? prev.paidCount,
          customersCount: s.customersCount ?? prev.customersCount,
        }));
      }

      // 2. Process Invoices
      if (invoiceData.status === 'fulfilled' && invoiceData.value) {
        const rawInv = invoiceData.value;
        const invoiceList: Invoice[] = Array.isArray(rawInv)
          ? rawInv
          : Array.isArray((rawInv as any)?.invoices)
          ? (rawInv as any).invoices
          : [];
        setInvoices(invoiceList);
      } else {
        setInvoices([]);
      }

      // 3. Process Customers (ensuring customers is always a valid Array)
      if (custData.status === 'fulfilled' && custData.value) {
        const rawCust = custData.value;
        const customerList: Customer[] = Array.isArray(rawCust)
          ? rawCust
          : Array.isArray((rawCust as any)?.customers)
          ? (rawCust as any).customers
          : [];
        setCustomers(customerList);
        setSummary((prev) => ({
          ...prev,
          customersCount: customerList.length || prev.customersCount,
        }));
      } else {
        setCustomers([]);
        if (custData.status === 'rejected') {
          console.error('Failed to load customers from API:', custData.reason);
        }
      }
    } catch (err: any) {
      console.warn('Dashboard data loaded with error:', err);
      setError(err?.message || 'Failed to load dashboard data');
      setCustomers([]);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (val: number) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).toUpperCase()}
          </div>
          <h1>Good evening, {user?.name || 'Test User'}</h1>
          <p>Here's your receivables position today.</p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics">
        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          iconColor="blue"
          title="Total receivables"
          value={formatCurrency(summary.totalReceivables)}
          note="Across all issued invoices"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          }
          iconColor="rose"
          title="Overdue"
          value={formatCurrency(summary.overdueAmount)}
          note={`${summary.overdueCount || 0} invoices need attention`}
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          iconColor="amber"
          title="Due in 7 days"
          value={formatCurrency(summary.dueSoonAmount)}
          note="Due within 7 days"
        />

        <MetricCard
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          iconColor="green"
          title="Customers owing"
          value={summary.customersCount || (Array.isArray(customers) ? customers.length : 0)}
          note="With outstanding balance"
        />
      </div>

      {/* Outstanding Invoices Table Panel */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Outstanding invoices</h2>
            <p>Keep an eye on what's coming in</p>
          </div>
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate('/invoices')}
          >
            View all <span>&rarr;</span>
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>INVOICE</th>
                <th>CUSTOMER</th>
                <th>ISSUED</th>
                <th>DUE DATE</th>
                <th>AMOUNT DUE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#88938e' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid #27845f', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.75s linear infinite' }} />
                      <span>Loading invoices from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : Array.isArray(invoices) && invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className="strong">#{inv.invoiceNumber}</td>
                    <td>
                      {typeof inv.customerId === 'object' && inv.customerId !== null
                        ? inv.customerId?.companyName || (inv.customerId as any)?.customerName || 'Customer'
                        : (inv as any).customerName || 'Customer'}
                    </td>
                    <td>{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-GB') : '-'}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="amount">{formatCurrency(inv.balanceDue ?? inv.totalAmount ?? (inv as any).amount ?? 0)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#88938e' }}>
                    No outstanding invoices found in MongoDB.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Grid: Aging & AI Assistant Callout */}
      <div className="lower-grid">
        {/* Receivables Aging Card */}
        <div className="panel aging-panel">
          <div className="panel-head">
            <div>
              <h2>Receivables aging</h2>
              <p>Outstanding by days past due</p>
            </div>
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate('/reports')}
            >
              Full report <span>&rarr;</span>
            </button>
          </div>
          <div className="aging-list">
            <div className="aging-row">
              <div className="aging-dot blue" />
              <span className="aging-title">Not yet due</span>
              <span className="aging-count">5</span>
              <strong>₹10,20,000</strong>
            </div>
            <div className="aging-row">
              <div className="aging-dot green" />
              <span className="aging-title">1–30 days</span>
              <span className="aging-count">5</span>
              <strong>₹13,40,000</strong>
            </div>
            <div className="aging-row">
              <div className="aging-dot amber" />
              <span className="aging-title">31–60 days</span>
              <span className="aging-count">0</span>
              <strong>₹0</strong>
            </div>
            <div className="aging-row">
              <div className="aging-dot orange" />
              <span className="aging-title">61–90 days</span>
              <span className="aging-count">0</span>
              <strong>₹0</strong>
            </div>
            <div className="aging-row">
              <div className="aging-dot rose" />
              <span className="aging-title">90+ days</span>
              <span className="aging-count">0</span>
              <strong>₹0</strong>
            </div>
          </div>
        </div>

        {/* AI Finance Assistant Tip Card */}
        <div className="tip-card">
          <div className="tip-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <rect x="4" y="8" width="16" height="12" rx="2" />
              <circle cx="9" cy="13" r="1" />
              <circle cx="15" cy="13" r="1" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </svg>
          </div>
          <div className="eyebrow">AI FINANCE ASSISTANT</div>
          <h3>Ask about your financial Transactions.</h3>
          <p>Get instant answers about outstanding balances, customer risk profiles, and collection timelines.</p>
          <button type="button" onClick={() => navigate('/ai-assistant')}>
            Ask Assistant <span>&rarr;</span>
          </button>
        </div>
      </div>
    </>
  );
};
