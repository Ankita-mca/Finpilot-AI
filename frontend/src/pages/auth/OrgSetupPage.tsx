import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const OrgSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, hasOrg, loading: authLoading, setupOrganization } = useAuth();

  const [orgName, setOrgName] = useState('');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [businessStructure, setBusinessStructure] = useState('Private Limited Company');
  const [industry, setIndustry] = useState('Manufacturing & Engineering');
  const [orgSize, setOrgSize] = useState('11 - 50 employees');
  const [country] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (!authLoading && isAuthenticated && hasOrg && !showSuccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, hasOrg, showSuccess, navigate]);

  useEffect(() => {
    if (user?.email && !businessEmail) {
      setBusinessEmail(user.email);
    }
  }, [user?.email, businessEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (orgName.trim().length < 2) {
      setError('Organization name must be at least 2 characters.');
      return;
    }

    try {
      setLoading(true);
      await setupOrganization({
        name: orgName.trim(),
        email: businessEmail.trim(),
        phone: phone.trim(),
        structure: businessStructure,
        industry,
        size: orgSize,
        country,
        state: state.trim(),
        city: city.trim(),
      });
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unable to configure organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F7F5', fontFamily: "'DM Sans', sans-serif", padding: '32px 16px' }}>
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column (Brand & Benefits): #EAF4EE */}
          <aside style={{ backgroundColor: '#EAF4EE', border: '1px solid #DCEBDD', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#27845F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="3" />
                    <circle cx="16" cy="12" r="1.5" />
                    <path d="M6 10h4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#172B2A', lineHeight: 1 }}>
                    FinPilot <span style={{ color: '#27845F' }}>AI</span>
                  </span>
                  <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#27845F', marginTop: '2px' }}>
                    Autonomous Cashflow Engine
                  </span>
                </div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#F0F7F2', color: '#27845F', border: '1px solid rgba(39, 132, 95, 0.2)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#27845F' }} />
                Built for Indian MSME Working Capital
              </span>
            </div>

            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#172B2A', margin: '0 0 12px', lineHeight: 1.15, fontFamily: "'Manrope', sans-serif" }}>
                Set up your organization
              </h1>
              <p style={{ fontSize: '14px', color: '#526B5B', margin: 0, lineHeight: 1.6 }}>
                Create your high-trust business workspace to reconcile ledgers, orchestrate smart payment nudges, and secure predictable liquidity.
              </p>
            </div>

            {/* 3 Value Cards */}
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#EAF4EE', border: '1px solid #DCEBDD', display: 'flex', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DCEBDD', color: '#27845F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#172B2A', margin: 0 }}>Track outstanding invoices</h2>
                  <p style={{ fontSize: '12px', color: '#526B5B', margin: '4px 0 0', lineHeight: 1.5 }}>Continuous zero-latency sync across TallyPrime, Zoho Books, Busy, and GSTN e-Invoice portals.</p>
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#EAF4EE', border: '1px solid #DCEBDD', display: 'flex', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DCEBDD', color: '#27845F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#172B2A', margin: 0 }}>Simplify payment follow-ups</h2>
                  <p style={{ fontSize: '12px', color: '#526B5B', margin: '4px 0 0', lineHeight: 1.5 }}>Context-aware WhatsApp &amp; email follow-ups embed dynamic Bharat BillPay &amp; instant UPI autopay links.</p>
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#EAF4EE', border: '1px solid #DCEBDD', display: 'flex', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#DCEBDD', color: '#27845F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#172B2A', margin: 0 }}>Understand your cash flow</h2>
                  <p style={{ fontSize: '12px', color: '#526B5B', margin: '4px 0 0', lineHeight: 1.5 }}>Predictive collection algorithms quantify DSO variances and forecast 90-day cash positions.</p>
                </div>
              </div>
            </div>

            {/* Compliance Footer */}
            <div style={{ borderTop: '1px solid #DCEBDD', paddingTop: '16px', fontSize: '12px', color: '#82918B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27845F" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Compliance &amp; Security Standards
              </div>
              <p style={{ margin: '6px 0 0', color: '#82918B' }}>
                256-bit bank-grade encryption &bull; RBI Fair Practices Framework &bull; ISO 27001 &amp; SOC2 Type II Certified
              </p>
            </div>
          </aside>

          {/* Right Column (Form Card): #FFFFFF */}
          <section style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7ECE9', borderRadius: '24px', padding: '36px', boxShadow: '0 20px 50px -10px rgba(23, 43, 42, 0.05)', position: 'relative' }}>
            {/* 3-Step Progress Header */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                <span style={{ color: '#27845F', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>Step 2 of 3</span>
                <span style={{ color: '#82918B' }}>Organization Setup &bull; Next: Dashboard</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{ height: '6px', borderRadius: '999px', backgroundColor: '#27845F' }} />
                <div style={{ height: '6px', borderRadius: '999px', backgroundColor: '#27845F' }} />
                <div style={{ height: '6px', borderRadius: '999px', backgroundColor: '#DCE5DF' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#82918B', marginTop: '8px', fontWeight: 500 }}>
                <span style={{ color: '#27845F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  &#10003; Sign In (Done)
                </span>
                <span style={{ color: '#27845F', fontWeight: 600 }}>Org Setup (Active)</span>
                <span>Step 3: Dashboard</span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#172B2A', margin: 0 }}>Organization details</h2>
              <p style={{ fontSize: '13px', color: '#82918B', margin: '4px 0 0' }}>
                Tell us a little about your business entity to configure your auto-reconciliation ledgers.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  color: '#be123c',
                  fontSize: '12px',
                  marginBottom: '18px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    Organization Name <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Engineering Pvt Ltd"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    Business Email <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="finance@company.com"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    Phone Number <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98234 11290"
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    Business Structure <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <select
                    value={businessStructure}
                    onChange={(e) => setBusinessStructure(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  >
                    <option value="Private Limited Company">Private Limited Company (Pvt Ltd)</option>
                    <option value="Sole Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLP">LLP</option>
                    <option value="Public Limited Company">Public Limited Company</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    Industry Vertical <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  >
                    <option value="Manufacturing & Engineering">Manufacturing &amp; Engineering</option>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale / Distribution">Wholesale / Distribution</option>
                    <option value="IT & Software Services">IT &amp; Software Services</option>
                    <option value="Healthcare & Pharma">Healthcare &amp; Pharma</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    Organization Size <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <select
                    value={orgSize}
                    onChange={(e) => setOrgSize(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  >
                    <option value="1 - 10 employees">1 - 10 employees</option>
                    <option value="11 - 50 employees">11 - 50 employees</option>
                    <option value="51 - 200 employees">51 - 200 employees</option>
                    <option value="201+ employees">201+ employees</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    Country <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={country}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    State <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#172B2A', marginBottom: '6px' }}>
                    City <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', fontSize: '14px', backgroundColor: '#F9FBF9', border: '1px solid #E7ECE9', borderRadius: '10px', outline: 'none', color: '#172B2A', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Security info box: #F0F7F2 */}
              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: '#F0F7F2', border: '1px solid #DCEBDD', display: 'flex', gap: '12px', fontSize: '12px', color: '#526B5B' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27845F" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span>Your business data is stored under AES-256 encryption. Only verified organization owners and appointed finance controllers can view ledger records.</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '12px',
                    backgroundColor: '#27845F',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 0,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {loading ? 'Creating Workspace...' : 'Create Organization →'}
                </button>
              </div>
            </form>

            {/* Success Modal */}
            {showSuccess && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(4px)', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EAF4EE', color: '#27845F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#172B2A', margin: '0 0 8px' }}>Organization Configured!</h3>
                <p style={{ fontSize: '14px', color: '#526B5B', maxWidth: '360px', margin: '0 0 24px' }}>
                  Your workspace has been initialized with statutory MSME limits and ledger reconciliation rules.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: '#27845F', color: '#fff', fontSize: '13px', fontWeight: 600, border: 0, cursor: 'pointer' }}
                >
                  Launch Dashboard &rarr;
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

