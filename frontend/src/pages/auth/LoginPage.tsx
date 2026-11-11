import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

type AuthMode = 'login' | 'signup' | 'forgot';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, hasOrg, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');

  // Login & shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up fields
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect already-authenticated users to their destination
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(hasOrg ? '/dashboard' : '/org-setup', { replace: true });
    }
  }, [authLoading, isAuthenticated, hasOrg, navigate]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await login(email.trim(), password, rememberMe);
      if (res.organization) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/org-setup', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid business email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await register(fullName.trim(), email.trim(), password, confirmPassword);
      navigate('/org-setup', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid registered email address.');
      return;
    }

    try {
      setSubmitting(true);
      const msg = await authService.forgotPassword(email.trim());
      setSuccessMsg(msg);
    } catch (err: any) {
      setError(err.message || 'Unable to process password reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError: boolean, extraRightPadding = false): React.CSSProperties => ({
    width: '100%',
    padding: extraRightPadding ? '10px 38px 10px 14px' : '10px 14px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    border: hasError ? '1px solid #f43f5e' : '1px solid #C9D7CE',
    borderRadius: '8px',
    outline: 'none',
    color: '#123B3C',
    boxSizing: 'border-box',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F4F7F5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Outer Window Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '1120px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid #DCE5DE',
          boxShadow: '0 24px 60px -15px rgba(28, 48, 34, 0.14)',
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto',
        }}
      >
        {/* Top Window Bar */}
        <div
          style={{
            height: '42px',
            padding: '0 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderBottom: '1px solid #E7EFE9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#cbdad0' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#cbdad0' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#cbdad0' }} />
          </div>
          <span style={{ fontSize: '11px', color: '#82918B', fontWeight: 500 }}>
            Encrypted Financial Workspace
          </span>
        </div>

        {/* Two-Column Section: 48% Left / 52% Right */}
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', minHeight: '640px' }}>
          {/* Left Form Column (48%) */}
          <div
            style={{
              flex: '1 1 48%',
              minWidth: '320px',
              backgroundColor: '#F9FBF9',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '40px 48px',
              boxSizing: 'border-box',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: '#eaf3ef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#27845F',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#123B3C' }}>
                FinPilot <span style={{ color: '#27845F' }}>AI</span>
              </span>
            </div>

            {/* Form Container */}
            <div style={{ width: '100%', maxWidth: '370px', margin: 'auto', padding: '20px 0' }}>
              {/* Mode Toggle Tabs: Login vs Sign Up */}
              {mode !== 'forgot' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    padding: '4px',
                    backgroundColor: '#EAF4EE',
                    borderRadius: '10px',
                    border: '1px solid #D4E6DA',
                    marginBottom: '24px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '7px',
                      border: 0,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: mode === 'login' ? '#FFFFFF' : 'transparent',
                      color: mode === 'login' ? '#27845F' : '#5E726A',
                      boxShadow: mode === 'login' ? '0 1px 3px rgba(23, 43, 42, 0.08)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '7px',
                      border: 0,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: mode === 'signup' ? '#FFFFFF' : 'transparent',
                      color: mode === 'signup' ? '#27845F' : '#5E726A',
                      boxShadow: mode === 'signup' ? '0 1px 3px rgba(23, 43, 42, 0.08)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#123B3C',
                    margin: '0 0 6px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {mode === 'login'
                    ? 'Welcome Back'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Reset Password'}
                </h1>
                <p style={{ fontSize: '13px', color: '#82918B', margin: 0 }}>
                  {mode === 'login'
                    ? 'Sign in to access your FinPilot AI workspace.'
                    : mode === 'signup'
                    ? 'Register your business profile to get started.'
                    : 'Enter your registered email to receive instructions.'}
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  style={{
                    padding: '11px 13px',
                    borderRadius: '10px',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#be123c',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <strong>{mode === 'signup' ? 'Registration failed' : 'Authentication failed'}</strong>
                  <div style={{ marginTop: '2px' }}>{error}</div>
                </div>
              )}

              {/* Success Banner */}
              {successMsg && (
                <div
                  style={{
                    padding: '11px 13px',
                    borderRadius: '10px',
                    backgroundColor: '#EAF4EE',
                    border: '1px solid #B7DBC4',
                    color: '#1E6648',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {successMsg}
                </div>
              )}

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#123B3C', marginBottom: '6px' }}>
                      Registered Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={inputStyle(Boolean(error))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#123B3C', marginBottom: '6px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={inputStyle(Boolean(error), true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 0,
                          background: 'none',
                          color: '#82918B',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5E726A', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ accentColor: '#27845F', cursor: 'pointer' }}
                      />
                      Remember Me
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      style={{
                        border: 0,
                        background: 'none',
                        padding: 0,
                        fontSize: '12px',
                        color: '#27845F',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      backgroundColor: submitting ? '#60987D' : '#27845F',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '14px',
                      border: 0,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {submitting ? 'Authenticating...' : 'Login'}
                  </button>
                </form>
              )}

              {/* SIGN UP FORM */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUpSubmit} style={{ display: 'grid', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#123B3C', marginBottom: '5px' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ankit Sharma"
                      style={inputStyle(Boolean(error && fullName.trim().length < 2))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#123B3C', marginBottom: '5px' }}>
                      Business Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={inputStyle(Boolean(error))}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#123B3C', marginBottom: '5px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        style={inputStyle(Boolean(error), true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 0,
                          background: 'none',
                          color: '#82918B',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#123B3C', marginBottom: '5px' }}>
                      Confirm Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        style={inputStyle(Boolean(error), true)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 0,
                          background: 'none',
                          color: '#82918B',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {showConfirmPassword ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      backgroundColor: submitting ? '#60987D' : '#27845F',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '14px',
                      border: 0,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {submitting ? 'Creating Account...' : 'Create Account & Continue →'}
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgotSubmit} style={{ display: 'grid', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#123B3C', marginBottom: '6px' }}>
                      Registered Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={inputStyle(Boolean(error))}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      backgroundColor: submitting ? '#60987D' : '#27845F',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '14px',
                      border: 0,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Sending Instructions...' : 'Send Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{
                      border: 0,
                      background: 'none',
                      color: '#27845F',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    &larr; Back to Login
                  </button>
                </form>
              )}

              {/* Bottom Mode Link */}
              {mode !== 'forgot' && (
                <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '12px', color: '#82918B' }}>
                  {mode === 'login' ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signup')}
                        style={{
                          border: 0,
                          background: 'none',
                          padding: 0,
                          color: '#27845F',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        style={{
                          border: 0,
                          background: 'none',
                          padding: 0,
                          color: '#27845F',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Login
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ fontSize: '12px', color: '#82918B' }}>&copy; FinPilot AI 2026</div>
          </div>

          {/* Right Section: 3D Curved Pathway & Marble Artwork (52%) */}
          <div
            style={{
              flex: '1 1 52%',
              backgroundColor: '#DCEBDD',
              borderLeft: '1px solid #d3e3d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px',
              boxSizing: 'border-box',
              minHeight: '400px',
              overflow: 'hidden',
            }}
          >
            {/* High-fidelity 3D Curved Pathway Vector Artwork */}
            <svg viewBox="0 0 700 860" width="100%" height="100%" style={{ maxWidth: '620px', maxHeight: '720px', display: 'block', overflow: 'visible' }}>
              <defs>
                <filter id="reactSageTrackShadow" x="-20%" y="-20%" width="160%" height="160%">
                  <feDropShadow dx="16" dy="28" stdDeviation="22" floodColor="#486950" floodOpacity="0.26" />
                  <feDropShadow dx="6" dy="12" stdDeviation="10" floodColor="#38543f" floodOpacity="0.18" />
                </filter>
                <linearGradient id="wallFace" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#b4cbb8" />
                  <stop offset="60%" stopColor="#9eb6a1" />
                  <stop offset="100%" stopColor="#839c86" />
                </linearGradient>
                <linearGradient id="floorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c6dbc9" />
                  <stop offset="50%" stopColor="#bed4c1" />
                  <stop offset="100%" stopColor="#b2c9b6" />
                </linearGradient>
                <radialGradient id="marbleShading" cx="34%" cy="30%" r="68%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#f2f7f3" />
                  <stop offset="85%" stopColor="#d6e4d9" />
                  <stop offset="97%" stopColor="#b9ccbd" />
                  <stop offset="100%" stopColor="#9eb2a2" />
                </radialGradient>
              </defs>

              <g filter="url(#reactSageTrackShadow)">
                {/* 3D Extrusion Wall */}
                <path
                  d="M 680,248 C 600,218 520,230 495,310 C 470,390 560,440 535,520 C 510,600 420,605 340,585 C 260,565 220,630 180,680 C 140,730 90,750 40,740 L 40,762 C 95,772 150,750 195,698 C 235,645 270,585 345,605 C 425,625 528,620 555,530 C 580,440 490,390 515,315 C 538,240 615,232 680,265 Z"
                  fill="url(#wallFace)"
                />
                {/* Channel Bed Floor */}
                <path
                  d="M 680,228 C 600,198 525,210 500,290 C 475,370 565,420 540,500 C 515,580 425,585 345,565 C 265,545 225,610 185,660 C 145,710 95,730 40,720 L 40,742 C 95,752 148,730 188,678 C 228,625 268,565 345,585 C 425,605 518,600 545,510 C 570,420 480,370 508,295 C 530,220 605,215 680,248 Z"
                  fill="url(#floorGrad)"
                  stroke="#a6c0ab"
                  strokeWidth="1"
                />
                {/* Transverse Joint Seams */}
                <line x1="640" y1="216" x2="636" y2="248" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="585" y1="215" x2="578" y2="249" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="535" y1="234" x2="522" y2="268" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="500" y1="285" x2="480" y2="310" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="535" y1="425" x2="560" y2="435" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="508" y1="540" x2="488" y2="558" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="440" y1="578" x2="436" y2="602" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="380" y1="565" x2="378" y2="590" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="310" y1="552" x2="312" y2="578" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="250" y1="570" x2="260" y2="598" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="205" y1="620" x2="225" y2="640" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
                <line x1="165" y1="675" x2="185" y2="695" stroke="#8fa993" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* 3D Glossy White Marble Sphere */}
              <g transform="translate(500, 418)">
                <ellipse cx="6" cy="22" rx="22" ry="10" fill="#2d4533" opacity="0.4" />
                <circle cx="0" cy="0" r="23" fill="url(#marbleShading)" />
                <ellipse cx="-7" cy="-7" rx="7" ry="4.5" transform="rotate(-30, -7, -7)" fill="#ffffff" opacity="0.9" />
                <circle cx="-6" cy="-6" r="2.2" fill="#ffffff" opacity="1" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
