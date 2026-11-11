import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { org, user, setOrganization } = useAuth();
  const [orgName, setOrgName] = useState(org?.name || 'Kalyan Forge Engineering Pvt Ltd');
  const [gstin, setGstin] = useState('27AAAAA0000A1Z5');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setOrganization({ name: orgName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PREFERENCES &bull; SYSTEM</div>
          <h1>Settings</h1>
          <p>Organization profile, tax settings, Tally / ERP synchronization, and automated notification channels.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Organization Profile Settings */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Organization Profile</h3>
              <p>Update legal business entity and GST registration details</p>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px', marginTop: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #C9D7CE', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172823', marginBottom: '4px' }}>
                Account Owner
              </label>
              <input
                type="text"
                disabled
                value={`${user?.name || 'Test User'} (${user?.email || 'test@finpilot.local'})`}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #eee', background: '#fafcfb', color: '#88938e', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              {saved && <span style={{ fontSize: '12px', color: '#27845f', fontWeight: 600 }}>Saved successfully!</span>}
            </div>
          </form>
        </div>

        {/* Live Integrations */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>ERP &amp; Communication Feeds</h3>
              <p>Connected data connectors</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#fafcfb', borderRadius: '8px', border: '1px solid #edf0ee' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#172823', display: 'block' }}>TallyPrime Gateway</strong>
                <small style={{ color: '#88938e', fontSize: '11px' }}>Continuous XML ledger synchronization</small>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600 }}>
                Active &bull; Live
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#fafcfb', borderRadius: '8px', border: '1px solid #edf0ee' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#172823', display: 'block' }}>WhatsApp Business Cloud API</strong>
                <small style={{ color: '#88938e', fontSize: '11px' }}>Verified Green Tick sender for instant nudges</small>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600 }}>
                Connected
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#fafcfb', borderRadius: '8px', border: '1px solid #edf0ee' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#172823', display: 'block' }}>Bharat BillPay / UPI Gateway</strong>
                <small style={{ color: '#88938e', fontSize: '11px' }}>Dynamic collect QR code generator</small>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600 }}>
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

