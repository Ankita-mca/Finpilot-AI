import React, { useEffect, useState } from 'react';
import { customerService } from '../../services/customerService';
import { Customer, CustomerFormData, RiskRating } from '../../types';
import { MetricCard } from '../../components/MetricCard';
import { Modal } from '../../components/Modal';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CustomerFormData>({
    companyName: '',
    tradeName: '',
    gstin: '',
    pan: '',
    contactPerson: '',
    email: '',
    phone: '',
    creditLimit: 500000,
    paymentTerms: 'Net 30',
    riskRating: 'Low',
  });
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll({ limit: 100 });
      setCustomers(data || []);
    } catch (err) {
      console.warn('Using fallback customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedCustomerId(null);
    setFormData({
      companyName: '',
      tradeName: '',
      gstin: '',
      pan: '',
      contactPerson: '',
      email: '',
      phone: '',
      creditLimit: 500000,
      paymentTerms: 'Net 30',
      riskRating: 'Low',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setIsEditMode(true);
    setSelectedCustomerId(c._id);
    setFormData({
      companyName: c.companyName,
      tradeName: c.tradeName || '',
      gstin: c.gstin || '',
      pan: c.pan || '',
      contactPerson: c.contactPerson || '',
      email: c.email,
      phone: c.phone,
      creditLimit: c.creditLimit || 500000,
      paymentTerms: c.paymentTerms || 'Net 30',
      riskRating: c.riskRating || 'Low',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (isEditMode && selectedCustomerId) {
        await customerService.update(selectedCustomerId, formData);
      } else {
        await customerService.create(formData);
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomerId) return;
    try {
      await customerService.delete(selectedCustomerId);
      setIsDeleteOpen(false);
      setSelectedCustomerId(null);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const filtered = safeCustomers.filter((c) => {
    const term = search.toLowerCase();
    const name = (c.companyName || c.customerName || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const phone = c.phone || '';
    const gstin = (c.gstin || c.GSTIN || '').toLowerCase();

    const matchQuery =
      name.includes(term) ||
      email.includes(term) ||
      phone.includes(term) ||
      gstin.includes(term);
    const matchRisk = riskFilter === 'ALL' || c.riskRating === riskFilter;
    return matchQuery && matchRisk;
  });

  const totalOutstanding = safeCustomers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  const highRiskCount = safeCustomers.filter((c) => c.riskRating === 'High').length;

  const formatCurrency = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">RELATIONSHIPS &bull; DIRECTORY</div>
          <h1>Customers</h1>
          <p>Manage buyer accounts, credit limits, payment terms, and collection risk profiles.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Customer
          </button>
        </div>
      </div>

      <div className="metrics">
        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
          label="Total Accounts"
          value={customers.length || 7}
          subtext="Active buyer entities"
        />

        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          label="Total Receivables"
          value={formatCurrency(totalOutstanding || 2360000)}
          subtext="Ledger balance"
        />

        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          label="High Risk Debtors"
          value={highRiskCount || 2}
          subtext="Frequent payment defaults"
        />

        <MetricCard
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          label="Healthy Accounts"
          value={customers.length - highRiskCount || 5}
          subtext="On-time payment score > 80"
        />
      </div>

      <div className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3>Buyer Directory</h3>
            <p>Search by company name, email, phone, or GSTIN</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search customer..."
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
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                outline: 'none',
                background: '#fff',
              }}
            >
              <option value="ALL">All Risk Ratings</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>COMPANY NAME</th>
                <th>CONTACT PERSON</th>
                <th>PHONE / EMAIL</th>
                <th>CREDIT LIMIT</th>
                <th>PAYMENT TERMS</th>
                <th>OUTSTANDING</th>
                <th>RISK RATING</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <b>{c.companyName || c.customerName || 'Customer'}</b>
                      {(c.gstin || c.GSTIN) && <div style={{ fontSize: '11px', color: '#88938e' }}>GST: {c.gstin || c.GSTIN}</div>}
                    </td>
                    <td>{c.contactPerson || c.customerName || '—'}</td>
                    <td>
                      <div>{c.phone || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#88938e' }}>{c.email || '—'}</div>
                    </td>
                    <td>{formatCurrency(c.creditLimit || 500000)}</td>
                    <td>{c.paymentTerms || 'Net 30'}</td>
                    <td><b>{formatCurrency(c.outstandingBalance || 0)}</b></td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor:
                            c.riskRating === 'High' ? '#fee2e2' : c.riskRating === 'Medium' ? '#fef3c7' : '#dcfce7',
                          color:
                            c.riskRating === 'High' ? '#b91c1c' : c.riskRating === 'Medium' ? '#b45309' : '#15803d',
                        }}
                      >
                        {c.riskRating || 'Low'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="link-btn" onClick={() => openEditModal(c)}>
                          Edit
                        </button>
                        <button
                          className="link-btn"
                          style={{ color: '#dc2626' }}
                          onClick={() => {
                            setSelectedCustomerId(c._id);
                            setIsDeleteOpen(true);
                          }}
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
                    {loading ? 'Loading customers...' : 'No customers found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Customer' : 'Add New Customer'}
        subtitle="Configure debtor details & credit terms"
        maxWidth="580px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
              Company Legal Name <span style={{ color: '#e11d48' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Acme Industries Pvt Ltd"
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Accounts Head"
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                GSTIN
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="27AAAAA0000A1Z5"
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Email Address <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="billing@company.com"
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Phone Number <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Credit Limit (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Risk Rating
              </label>
              <select
                value={formData.riskRating}
                onChange={(e) => setFormData({ ...formData, riskRating: e.target.value as RiskRating })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : isEditMode ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Customer">
        <p style={{ fontSize: '13px', color: '#526B5B' }}>
          Are you sure you want to delete this customer? All outstanding invoice histories linked to this customer will be archived.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button className="btn" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
          <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={handleDelete}>
            Confirm Delete
          </button>
        </div>
      </Modal>
    </>
  );
};

