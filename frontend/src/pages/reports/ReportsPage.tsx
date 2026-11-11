import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../../components/Modal';

interface InvoiceAgingRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  amount: number;
  agingCategory: 'Not Due' | '1–30 Days' | '31–60 Days' | '61–90 Days' | '90+ Days';
  risk: 'Low' | 'Medium' | 'High';
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const ReportsPage: React.FC = () => {
  // State: Period & Filters
  const [period, setPeriod] = useState<'30' | '60' | '90' | 'custom'>('90');
  const [activeBucketFilter, setActiveBucketFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Custom Date Range Modal State
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-31');

  // Quick Nudge Modal State
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [selectedNudge, setSelectedNudge] = useState<{
    customerName: string;
    invoiceNumber: string;
    amount: number;
    overdueAmount: number;
    channel: 'whatsapp' | 'email';
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Detailed Invoices Aging Register (Realistic enterprise data)
  const allInvoices: InvoiceAgingRow[] = [
    { id: '1', invoiceNumber: 'INV-2026-1041', customerName: 'ABC Technologies Pvt Ltd', issueDate: '15 Sep 2026', dueDate: '30 Oct 2026', daysOverdue: 11, amount: 190000, agingCategory: '1–30 Days', risk: 'Medium' },
    { id: '2', invoiceNumber: 'INV-2026-1042', customerName: 'Mahavir Precision Engineering', issueDate: '28 Sep 2026', dueDate: '28 Oct 2026', daysOverdue: 13, amount: 145000, agingCategory: '1–30 Days', risk: 'Low' },
    { id: '3', invoiceNumber: 'INV-2026-1037', customerName: 'Dynamic Steel Fabricators', issueDate: '10 Aug 2026', dueDate: '10 Oct 2026', daysOverdue: 31, amount: 110000, agingCategory: '31–60 Days', risk: 'High' },
    { id: '4', invoiceNumber: 'INV-2026-1039', customerName: 'BlueDart Hub Logistics', issueDate: '22 Sep 2026', dueDate: '22 Oct 2026', daysOverdue: 19, amount: 75000, agingCategory: '1–30 Days', risk: 'Low' },
    { id: '5', invoiceNumber: 'INV-2026-1035', customerName: 'Pune Auto Components Ltd', issueDate: '25 Aug 2026', dueDate: '10 Oct 2026', daysOverdue: 31, amount: 80000, agingCategory: '31–60 Days', risk: 'Medium' },
    { id: '6', invoiceNumber: 'INV-2026-1033', customerName: 'Omkar Engineering Works', issueDate: '14 Sep 2026', dueDate: '14 Oct 2026', daysOverdue: 27, amount: 40000, agingCategory: '1–30 Days', risk: 'Low' },
    { id: '7', invoiceNumber: 'INV-2026-1028', customerName: 'Dynamic Steel Fabricators', issueDate: '15 Jul 2026', dueDate: '15 Sep 2026', daysOverdue: 56, amount: 150000, agingCategory: '31–60 Days', risk: 'High' },
    { id: '8', invoiceNumber: 'INV-2026-1022', customerName: 'Apex Industrial Castings', issueDate: '10 Jun 2026', dueDate: '25 Jul 2026', daysOverdue: 108, amount: 95000, agingCategory: '90+ Days', risk: 'High' },
    { id: '9', invoiceNumber: 'INV-2026-1019', customerName: 'Kalyani Tools & Dies', issueDate: '20 Jun 2026', dueDate: '05 Aug 2026', daysOverdue: 97, amount: 45000, agingCategory: '90+ Days', risk: 'High' },
    { id: '10', invoiceNumber: 'INV-2026-1025', customerName: 'Tata Precision Bearings', issueDate: '18 Jul 2026', dueDate: '18 Aug 2026', daysOverdue: 84, amount: 115000, agingCategory: '61–90 Days', risk: 'Medium' },
    { id: '11', invoiceNumber: 'INV-2026-1029', customerName: 'Bharat Forge Subcontractor', issueDate: '25 Jul 2026', dueDate: '25 Aug 2026', daysOverdue: 77, amount: 55000, agingCategory: '61–90 Days', risk: 'Low' },
    { id: '12', invoiceNumber: 'INV-2026-1045', customerName: 'ABC Technologies Pvt Ltd', issueDate: '01 Oct 2026', dueDate: '15 Nov 2026', daysOverdue: 0, amount: 190000, agingCategory: 'Not Due', risk: 'Medium' },
    { id: '13', invoiceNumber: 'INV-2026-1046', customerName: 'Mahavir Precision Engineering', issueDate: '05 Oct 2026', dueDate: '05 Nov 2026', daysOverdue: 0, amount: 165000, agingCategory: 'Not Due', risk: 'Low' },
    { id: '14', invoiceNumber: 'INV-2026-1048', customerName: 'BlueDart Hub Logistics', issueDate: '12 Oct 2026', dueDate: '12 Nov 2026', daysOverdue: 0, amount: 120000, agingCategory: 'Not Due', risk: 'Low' },
    { id: '15', invoiceNumber: 'INV-2026-1050', customerName: 'Godrej Process Solutions', issueDate: '18 Oct 2026', dueDate: '18 Nov 2026', daysOverdue: 0, amount: 140000, agingCategory: 'Not Due', risk: 'Low' },
    { id: '16', invoiceNumber: 'INV-2026-1052', customerName: 'Schneider Electric Vendor', issueDate: '22 Oct 2026', dueDate: '22 Nov 2026', daysOverdue: 0, amount: 110000, agingCategory: 'Not Due', risk: 'Low' },
  ];

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      // Search
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      // Bucket Filter
      let matchesBucket = true;
      if (activeBucketFilter !== 'All') {
        matchesBucket = inv.agingCategory === activeBucketFilter;
      }

      // Risk Filter
      let matchesRisk = true;
      if (riskFilter !== 'All') {
        matchesRisk = inv.risk === riskFilter;
      }

      return matchesSearch && matchesBucket && matchesRisk;
    });
  }, [allInvoices, searchQuery, activeBucketFilter, riskFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeBucketFilter, riskFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Customer',
      'Issue Date',
      'Due Date',
      'Days Overdue',
      'Outstanding Amount (INR)',
      'Aging Category',
      'Risk Level',
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.customerName}"`,
      `"${inv.issueDate}"`,
      `"${inv.dueDate}"`,
      inv.daysOverdue,
      inv.amount,
      `"${inv.agingCategory}"`,
      `"${inv.risk}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `FinPilot_Accounts_Receivable_Aging_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Accounts Receivable Aging Report downloaded as CSV!');
  };

  // Open Quick Nudge Modal
  const openNudge = (
    customerName: string,
    invoiceNumber: string,
    amount: number,
    overdueAmount: number
  ) => {
    setSelectedNudge({
      customerName,
      invoiceNumber,
      amount,
      overdueAmount,
      channel: 'whatsapp',
    });
    setIsNudgeModalOpen(true);
  };

  // Send Nudge Action
  const handleSendNudge = () => {
    if (!selectedNudge) return;
    setIsNudgeModalOpen(false);
    showToast(
      `Payment reminder sent to ${selectedNudge.customerName} via ${
        selectedNudge.channel === 'whatsapp' ? 'WhatsApp' : 'Email'
      }!`
    );
  };

  // Donut chart calculations:
  // Total = 18,45,000 | Overdue = 7,40,000 (40.1%) | Not Due = 11,05,000 (59.9%)
  const totalAR = 1845000;
  const overdueAR = 740000;
  const notDueAR = 1105000;
  const overduePct = 40.1;
  const notDuePct = 59.9;

  // SVG Donut circumference: r=54 -> C = 339.292
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const notDueStroke = (circumference * notDuePct) / 100;
  const overdueStroke = (circumference * overduePct) / 100;

  return (
    <div className="ar-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#172B2A',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27845F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header & Actions */}
      <div className="ar-header">
        <div className="ar-header-text">
          <h1>Accounts Receivable Overview</h1>
          <p>Understand your outstanding payments and collection performance.</p>
        </div>

        <div className="ar-header-actions">
          {/* Date Range Selector Pills */}
          <div className="ar-pill-group">
            <button
              type="button"
              onClick={() => {
                setPeriod('30');
                showToast('Filtered report for This Month');
              }}
              className={`ar-pill-btn ${period === '30' ? 'active' : ''}`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('60');
                showToast('Filtered report for Last Month');
              }}
              className={`ar-pill-btn ${period === '60' ? 'active' : ''}`}
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('90');
                showToast('Filtered report for Last 3 Months');
              }}
              className={`ar-pill-btn ${period === '90' ? 'active' : ''}`}
            >
              Last 3 Months
            </button>
            <button
              type="button"
              onClick={() => setIsCustomDateModalOpen(true)}
              className={`ar-pill-btn ${period === 'custom' ? 'active' : ''}`}
              title="Select custom date range"
            >
              Custom Range
            </button>
          </div>

          {/* Export Report Button */}
          <button type="button" onClick={handleExportCSV} className="ar-export-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Row (4 Metric Cards) */}
      <div className="ar-kpi-grid">
        {/* KPI 1: Total Outstanding */}
        <div className="ar-kpi-card">
          <div className="ar-kpi-top">
            <span className="ar-kpi-title">Total Outstanding</span>
            <div className="ar-kpi-icon-wrap green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>
          <div className="ar-kpi-value">{formatINR(totalAR)}</div>
          <div className="ar-kpi-meta">
            <span className="ar-trend-chip pos">↑ +4.8%</span>
            <span>Across 28 active counterparties</span>
          </div>
        </div>

        {/* KPI 2: Overdue Amount */}
        <div className="ar-kpi-card">
          <div className="ar-kpi-top">
            <span className="ar-kpi-title">Overdue Amount</span>
            <div className="ar-kpi-icon-wrap red">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div className="ar-kpi-value danger">{formatINR(overdueAR)}</div>
          <div className="ar-kpi-meta">
            <span className="ar-trend-chip neg">40.1% of AR</span>
            <span>9 invoices delinquent</span>
          </div>
        </div>

        {/* KPI 3: Open Invoices */}
        <div className="ar-kpi-card">
          <div className="ar-kpi-top">
            <span className="ar-kpi-title">Open Invoices</span>
            <div className="ar-kpi-icon-wrap amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
          </div>
          <div className="ar-kpi-value">28 Invoices</div>
          <div className="ar-kpi-meta">
            <span className="ar-trend-chip warn">19 on schedule</span>
            <span>Avg invoice {formatINR(65892)}</span>
          </div>
        </div>

        {/* KPI 4: Days Sales Outstanding (DSO) */}
        <div className="ar-kpi-card">
          <div className="ar-kpi-top">
            <span className="ar-kpi-title">Average DSO</span>
            <div className="ar-kpi-icon-wrap blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="ar-kpi-value">41.2 Days</div>
          <div className="ar-kpi-meta">
            <span className="ar-trend-chip pos">↓ -3.4 days</span>
            <span>Industry MSME avg: 45.0d</span>
          </div>
        </div>
      </div>

      {/* 3. Aging Composition Donut Card */}
      <div className="ar-card">
        <div className="ar-card-head">
          <div className="ar-card-title">
            <h3>Aging Composition</h3>
            <p>Overdue versus not-yet-due distribution of total receivables</p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#27845F', background: '#EAF4EE', padding: '3px 8px', borderRadius: '6px' }}>
            Live Sync
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }}>
          {/* SVG Donut */}
          <div className="ar-donut-container" style={{ padding: '0 10px' }}>
            <div className="ar-donut-svg-wrap">
              <svg width="180" height="180" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={r}
                  fill="transparent"
                  stroke="#F0F4F2"
                  strokeWidth="14"
                />

                {/* Segment 1: Current / Not Due (59.9%) - Primary Green #27845F */}
                <circle
                  cx="70"
                  cy="70"
                  r={r}
                  fill="transparent"
                  stroke="#27845F"
                  strokeWidth="14"
                  strokeDasharray={`${notDueStroke} ${circumference}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />

                {/* Segment 2: Overdue (40.1%) - Warning Rose #DC2626 */}
                <circle
                  cx="70"
                  cy="70"
                  r={r}
                  fill="transparent"
                  stroke="#DC2626"
                  strokeWidth="14"
                  strokeDasharray={`${overdueStroke} ${circumference}`}
                  strokeDashoffset={`-${notDueStroke}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Metrics in Donut */}
              <div className="ar-donut-center">
                <span className="ar-donut-center-amt">₹18.45L</span>
                <span className="ar-donut-center-lbl">Total AR</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="ar-legend-item" style={{ padding: '16px 18px', background: '#F8FAF9' }}>
              <div className="ar-legend-label">
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27845F', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#172B2A', fontSize: '14px' }}>Current / Not Due</strong>
                  <div style={{ fontSize: '11.5px', color: '#82918B', marginTop: '2px' }}>19 invoices within credit terms</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="ar-legend-val" style={{ fontSize: '16px' }}>{formatINR(notDueAR)}</div>
                <div style={{ fontSize: '11.5px', color: '#27845F', fontWeight: 600 }}>59.9% of total</div>
              </div>
            </div>

            <div className="ar-legend-item" style={{ padding: '16px 18px', background: '#FDF7F7' }}>
              <div className="ar-legend-label">
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#172B2A', fontSize: '14px' }}>Overdue Receivables</strong>
                  <div style={{ fontSize: '11.5px', color: '#82918B', marginTop: '2px' }}>9 invoices past grace period</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="ar-legend-val" style={{ fontSize: '16px', color: '#DC2626' }}>{formatINR(overdueAR)}</div>
                <div style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600 }}>40.1% of total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Detailed Invoice Aging Table (Full-Width Register) */}
      <div className="ar-card">
        <div className="ar-card-head">
          <div className="ar-card-title">
            <h3>Detailed Invoice Aging Register</h3>
            <p>Granular invoice-level breakdown with days overdue and statutory buckets</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 12px 0 32px',
                  borderRadius: '8px',
                  border: '1px solid #D6DFD9',
                  background: '#FFFFFF',
                  fontSize: '12.5px',
                  color: '#172B2A',
                  outline: 'none',
                  width: '210px',
                }}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#82918B"
                strokeWidth="2"
                style={{ position: 'absolute', left: '10px', top: '11px', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Aging Bracket Filter */}
            <select
              value={activeBucketFilter}
              onChange={(e) => setActiveBucketFilter(e.target.value)}
              style={{
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #D6DFD9',
                background: '#FFFFFF',
                fontSize: '12.5px',
                color: '#172B2A',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Aging Brackets</option>
              <option value="Not Due">Not Due</option>
              <option value="1–30 Days">1–30 Days</option>
              <option value="31–60 Days">31–60 Days</option>
              <option value="61–90 Days">61–90 Days</option>
              <option value="90+ Days">90+ Days</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid #D6DFD9',
                background: '#FFFFFF',
                fontSize: '12.5px',
                color: '#172B2A',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>

            {(searchQuery || activeBucketFilter !== 'All' || riskFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveBucketFilter('All');
                  setRiskFilter('All');
                }}
                className="secondary"
                style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto', margin: '0 -24px', padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E7ECE9', color: '#82918B', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 12px' }}>Invoice #</th>
                <th style={{ padding: '10px 12px' }}>Customer Name</th>
                <th style={{ padding: '10px 12px' }}>Invoice Date</th>
                <th style={{ padding: '10px 12px' }}>Due Date</th>
                <th style={{ padding: '10px 12px' }}>Days Overdue</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Outstanding Amount</th>
                <th style={{ padding: '10px 12px' }}>Aging Category</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #F0F4F2', transition: 'background 0.15s ease' }} className="table-row-hover">
                    {/* Invoice Number */}
                    <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#172B2A' }}>
                      {inv.invoiceNumber}
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '12px', fontWeight: 600, color: '#172B2A' }}>
                      {inv.customerName}
                    </td>

                    {/* Invoice Date */}
                    <td style={{ padding: '12px', color: '#4C5752' }}>
                      {inv.issueDate}
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '12px', color: '#4C5752' }}>
                      {inv.dueDate}
                    </td>

                    {/* Days Overdue */}
                    <td style={{ padding: '12px' }}>
                      {inv.daysOverdue === 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#27845F', fontWeight: 600, fontSize: '11.5px', background: '#EAF4EE', padding: '2px 8px', borderRadius: '4px' }}>
                          On Schedule
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: inv.daysOverdue > 60 ? '#FEE2E2' : '#FEF3C7',
                            color: inv.daysOverdue > 60 ? '#DC2626' : '#B45309',
                          }}
                        >
                          {inv.daysOverdue} Days Late
                        </span>
                      )}
                    </td>

                    {/* Outstanding Amount */}
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#172B2A', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINR(inv.amount)}
                    </td>

                    {/* Aging Category */}
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background:
                            inv.agingCategory === 'Not Due'
                              ? '#EAF4EE'
                              : inv.agingCategory === '1–30 Days'
                              ? '#EDF5F1'
                              : inv.agingCategory === '31–60 Days'
                              ? '#FEF3C7'
                              : inv.agingCategory === '61–90 Days'
                              ? '#FFEDD5'
                              : '#FEE2E2',
                          color:
                            inv.agingCategory === 'Not Due'
                              ? '#27845F'
                              : inv.agingCategory === '1–30 Days'
                              ? '#347D61'
                              : inv.agingCategory === '31–60 Days'
                              ? '#D97706'
                              : inv.agingCategory === '61–90 Days'
                              ? '#EA580C'
                              : '#DC2626',
                        }}
                      >
                        {inv.agingCategory}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openNudge(inv.customerName, inv.invoiceNumber, inv.amount, inv.daysOverdue > 0 ? inv.amount : 0)}
                        className="secondary"
                        style={{
                          padding: '4px 9px',
                          fontSize: '11.5px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span>Nudge</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#82918B' }}>
                    No invoices match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginTop: '12px', borderTop: '1px solid #F0F4F2', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#82918B' }}>
            Showing <strong>{paginatedInvoices.length}</strong> of <strong>{filteredInvoices.length}</strong> invoices
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>

            <span style={{ fontSize: '12px', fontWeight: 600, color: '#172B2A', padding: '0 6px' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="secondary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Custom Date Range Modal */}
      <Modal
        isOpen={isCustomDateModalOpen}
        onClose={() => setIsCustomDateModalOpen(false)}
        title="Select Custom Date Range"
        subtitle="Filter receivables data by invoice issue or maturity period"
        maxWidth="480px"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsCustomDateModalOpen(false);
            setPeriod('custom');
            showToast(`Filtered report for ${customStartDate} to ${customEndDate}`);
          }}
          style={{ display: 'grid', gap: '16px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                required
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #D6DFD9', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                End Date
              </label>
              <input
                type="date"
                required
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #D6DFD9', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #E7ECE9' }}>
            <button type="button" className="secondary" onClick={() => setIsCustomDateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Apply Date Filter
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Quick WhatsApp / Email Nudge Modal */}
      {selectedNudge && (
        <Modal
          isOpen={isNudgeModalOpen}
          onClose={() => setIsNudgeModalOpen(false)}
          title="Send Payment Reminder"
          subtitle={`Multi-channel notification for invoice #${selectedNudge.invoiceNumber}`}
          maxWidth="540px"
        >
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ background: '#F8FAF9', border: '1px solid #E7ECE9', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#82918B' }}>
                <span>Recipient:</span>
                <strong style={{ color: '#172B2A' }}>{selectedNudge.customerName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#82918B', marginTop: '4px' }}>
                <span>Invoice Total:</span>
                <span style={{ fontWeight: 600, color: '#172B2A' }}>{formatINR(selectedNudge.amount)}</span>
              </div>
              {selectedNudge.overdueAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#DC2626', marginTop: '4px', fontWeight: 600 }}>
                  <span>Overdue Balance:</span>
                  <span>{formatINR(selectedNudge.overdueAmount)}</span>
                </div>
              )}
            </div>

            {/* Delivery Channel Radio */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B2A', marginBottom: '8px' }}>
                Dispatch Channel
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedNudge({ ...selectedNudge, channel: 'whatsapp' })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedNudge.channel === 'whatsapp' ? '#27845F' : '#E7ECE9'}`,
                    background: selectedNudge.channel === 'whatsapp' ? '#EAF4EE' : '#FFFFFF',
                    color: selectedNudge.channel === 'whatsapp' ? '#27845F' : '#4C5752',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>WhatsApp Nudge</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedNudge({ ...selectedNudge, channel: 'email' })}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedNudge.channel === 'email' ? '#27845F' : '#E7ECE9'}`,
                    background: selectedNudge.channel === 'email' ? '#EAF4EE' : '#FFFFFF',
                    color: selectedNudge.channel === 'email' ? '#27845F' : '#4C5752',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>Email Statement</span>
                </button>
              </div>
            </div>

            {/* Message Preview */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                Message Template Preview
              </label>
              <div style={{ background: '#F9FBFA', border: '1px solid #E7ECE9', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#4C5752', lineHeight: '1.5' }}>
                Dear accounts team at <strong>{selectedNudge.customerName}</strong>, this is a courteous reminder from FinPilot AI regarding outstanding invoice <strong>#{selectedNudge.invoiceNumber}</strong> for {formatINR(selectedNudge.amount)}. Please confirm NEFT/RTGS transaction reference upon remittance.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #E7ECE9' }}>
              <button type="button" className="secondary" onClick={() => setIsNudgeModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSendNudge}>
                Send Reminder Now
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
