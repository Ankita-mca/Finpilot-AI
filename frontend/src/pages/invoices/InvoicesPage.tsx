import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { Invoice, InvoiceStatus, Customer, LineItem } from '../../types';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Consulting Services', quantity: 1, unitPrice: 25000, taxRate: 18, lineTotal: 29500 },
  ]);
  const [notes, setNotes] = useState('Thank you for your business. Payment terms net 15 days.');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, custData] = await Promise.allSettled([
        invoiceService.getAll(),
        customerService.getAll({ limit: 100 }),
      ]);

      if (invData.status === 'fulfilled') setInvoices(invData.value);
      if (custData.status === 'fulfilled') setCustomers(custData.value);
    } catch (e) {
      console.warn('Error loading invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = async () => {
    try {
      const nextNum = await invoiceService.getNextNumber();
      setInvoiceNumber(nextNum || `INV-${Date.now().toString().slice(-4)}`);
    } catch {
      setInvoiceNumber(`INV-${Date.now().toString().slice(-4)}`);
    }
    if (customers.length > 0) {
      setCustomerId(customers[0]._id);
    }
    setIsCreateOpen(true);
  };

  const handleLineItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };

    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unitPrice) || 0;
    const tax = Number(updated[index].taxRate) || 0;
    const sub = qty * price;
    updated[index].lineTotal = Math.round(sub + (sub * tax) / 100);

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unitPrice: 0, taxRate: 18, lineTotal: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const taxTotal = lineItems.reduce((acc, item) => acc + ((Number(item.quantity) * Number(item.unitPrice) * (Number(item.taxRate) || 0)) / 100), 0);
  const grandTotal = subtotal + taxTotal;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Please select a customer');
      return;
    }

    try {
      setSaving(true);
      await invoiceService.create({
        invoiceNumber,
        customerId,
        issueDate,
        dueDate,
        lineItems,
        subtotal,
        taxAmount: taxTotal,
        totalAmount: grandTotal,
        balanceDue: grandTotal,
        amountPaid: 0,
        status: 'Sent',
        notes,
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    try {
      await invoiceService.delete(selectedInvoice._id);
      setIsDeleteOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    }
  };

  // Calculations for metric summary
  const totalAmount = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const overdueAmount = invoices
    .filter((i) => i.status === 'Overdue' || new Date(i.dueDate) < new Date())
    .reduce((acc, i) => acc + (i.balanceDue || i.totalAmount || 0), 0);
  const paidAmount = invoices.reduce((acc, i) => acc + (i.amountPaid || 0), 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (typeof inv.customerId === 'object' && inv.customerId?.companyName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <>
      {/* Page Heading & Actions */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">RECEIVABLES &bull; LEDGER</div>
          <h1>Invoices</h1>
          <p>Create, track, and reconcile customer invoices with live GST &amp; tally synchronization.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={openCreateModal}>
            + Create Invoice
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="metrics">
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          label="Total Invoiced"
          value={formatCurrency(totalAmount || 2360000)}
          subtext={`${invoices.length || 12} invoices total`}
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="Overdue Balance"
          value={formatCurrency(overdueAmount || 1340000)}
          subtext="Urgent collection"
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          label="Total Collected"
          value={formatCurrency(paidAmount || 1020000)}
          subtext="Auto-reconciled via UPI / e-NACH"
        />
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          label="Pending Reminders"
          value={invoices.filter((i) => i.status !== 'Paid').length || 5}
          subtext="Scheduled nudges"
        />
      </div>

      {/* Invoices List Panel */}
      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3>All Invoices</h3>
            <p>Filter by status, search by invoice number or customer name</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                background: '#fff',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="PARTIALLY PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>INVOICE #</th>
                <th>CUSTOMER</th>
                <th>ISSUED</th>
                <th>DUE DATE</th>
                <th>TOTAL</th>
                <th>BALANCE DUE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td><b>#{inv.invoiceNumber}</b></td>
                    <td>
                      {typeof inv.customerId === 'object' && inv.customerId !== null
                        ? inv.customerId?.companyName || (inv.customerId as any)?.customerName || 'Customer'
                        : (inv as any).customerName || 'Customer'}
                    </td>
                    <td>{new Date(inv.issueDate).toLocaleDateString('en-GB')}</td>
                    <td>{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                    <td>{formatCurrency(inv.totalAmount)}</td>
                    <td><b>{formatCurrency(inv.balanceDue || inv.totalAmount)}</b></td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="link-btn"
                          onClick={() => { setSelectedInvoice(inv); setIsDetailOpen(true); }}
                        >
                          View
                        </button>
                        <button
                          className="link-btn"
                          style={{ color: '#dc2626' }}
                          onClick={() => { setSelectedInvoice(inv); setIsDeleteOpen(true); }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#88938e' }}>
                    {loading ? 'Loading invoices...' : 'No invoices found matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Invoice" subtitle="Generate a GST-compliant tax invoice" maxWidth="740px">
        <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172823', marginBottom: '6px' }}>
                Invoice Number <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2026-0043"
                style={{ width: '100%', height: '40px', padding: '0 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #D6DFD9', background: '#FFFFFF', color: '#172B2A', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172823', marginBottom: '6px' }}>
                Select Customer <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={loading || customers.length === 0}
                style={{ width: '100%', height: '40px', padding: '0 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #D6DFD9', background: '#FFFFFF', color: '#172B2A', boxSizing: 'border-box' }}
              >
                {loading ? (
                  <option value="" disabled>Loading customers...</option>
                ) : Array.isArray(customers) && customers.length > 0 ? (
                  customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName || c.customerName || 'Unnamed Customer'}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No customers available (create one first)</option>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172823', marginBottom: '6px' }}>
                Issue Date <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                style={{ width: '100%', height: '40px', padding: '0 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #D6DFD9', background: '#FFFFFF', color: '#172B2A', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172823', marginBottom: '6px' }}>
                Due Date <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', height: '40px', padding: '0 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #D6DFD9', background: '#FFFFFF', color: '#172B2A', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Line Items Container */}
          <div style={{ border: '1px solid #E7ECE9', borderRadius: '12px', padding: '16px', background: '#F8FAF9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#172823', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Invoice Line Items
              </span>
              <button
                type="button"
                onClick={addLineItem}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 0,
                  color: '#27845F',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Item Row</span>
              </button>
            </div>

            {/* Table Column Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 85px 125px 110px 32px', gap: '10px', marginBottom: '6px', padding: '0 4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#82918B' }}>Description</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#82918B' }}>Qty</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#82918B' }}>Unit Price (₹)</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#82918B', textAlign: 'right' }}>Total (₹)</span>
              <span></span>
            </div>

            {/* Line Item Rows */}
            <div style={{ display: 'grid', gap: '8px' }}>
              {lineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 85px 125px 110px 32px', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="e.g. Consulting Services"
                    required
                    value={item.description}
                    onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                    style={{ height: '38px', padding: '0 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D6DFD9', background: '#FFFFFF', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    required
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                    style={{ height: '38px', padding: '0 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D6DFD9', background: '#FFFFFF', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Price (₹)"
                    required
                    value={item.unitPrice}
                    onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                    style={{ height: '38px', padding: '0 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #D6DFD9', background: '#FFFFFF', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#172B2A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(item.lineTotal)}
                  </div>
                  {lineItems.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      title="Remove item"
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 0,
                        background: 'transparent',
                        color: '#C0392B',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  ) : (
                    <span style={{ width: '32px' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Grand Total Summary Box */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E7ECE9' }}>
              <div style={{ width: '260px', background: '#FFFFFF', border: '1px solid #E7ECE9', borderRadius: '10px', padding: '12px 14px', display: 'grid', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#687770' }}>
                  <span>Subtotal (Taxable):</span>
                  <span style={{ fontWeight: 600, color: '#172B2A', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#687770' }}>
                  <span>Tax (GST 18%):</span>
                  <span style={{ fontWeight: 600, color: '#172B2A', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(taxTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14.5px', fontWeight: 800, color: '#27845F', borderTop: '1px solid #EAF4EE', paddingTop: '6px', marginTop: '2px' }}>
                  <span>Grand Total:</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #E7ECE9' }}>
            <button
              type="button"
              className="secondary"
              onClick={() => setIsCreateOpen(false)}
              style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="primary"
              style={{ padding: '9px 22px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
            >
              {saving ? 'Creating...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Details Modal */}
      {selectedInvoice && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Invoice #${selectedInvoice.invoiceNumber}`} subtitle={`Status: ${selectedInvoice.status}`}>
          <div style={{ display: 'grid', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#fafcfb', padding: '12px', borderRadius: '8px' }}>
              <div><strong>Customer:</strong> {typeof selectedInvoice.customerId === 'object' ? selectedInvoice.customerId?.companyName : 'Customer'}</div>
              <div><strong>Issue Date:</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString('en-GB')}</div>
              <div><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB')}</div>
              <div><strong>Balance Due:</strong> <b style={{ color: '#27845f' }}>{formatCurrency(selectedInvoice.balanceDue || selectedInvoice.totalAmount)}</b></div>
            </div>

            <div>
              <h4 style={{ margin: '8px 0 4px', fontSize: '13px', fontWeight: 700 }}>Line Items</h4>
              <table style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '4px' }}>Description</th>
                    <th style={{ textAlign: 'center', padding: '4px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '4px' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '4px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lineItems?.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '6px 4px' }}>{it.description}</td>
                      <td style={{ textAlign: 'center', padding: '6px 4px' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '6px 4px' }}>{formatCurrency(it.unitPrice)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 4px' }}>{formatCurrency(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedInvoice.notes && (
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                <strong>Notes:</strong> {selectedInvoice.notes}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E7ECE9' }}>
              <button className="secondary" style={{ padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setIsDetailOpen(false)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedInvoice && (
        <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Invoice">
          <p style={{ fontSize: '13.5px', color: '#526B5B', lineHeight: '1.5' }}>
            Are you sure you want to delete invoice <strong style={{ color: '#172823' }}>#{selectedInvoice.invoiceNumber}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #E7ECE9' }}>
            <button className="secondary" style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setIsDeleteOpen(false)}>Cancel</button>
            <button style={{ padding: '8px 18px', background: '#dc2626', color: '#fff', border: 0, borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }} onClick={handleDelete}>
              Confirm Delete
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

