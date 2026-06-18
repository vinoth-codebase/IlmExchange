import React, { useState } from 'react';
import {
  forgotPasswordRequest,
  loginUser,
  registerUser,
  resetUserPassword,
  User,
  verifyEmailCode,
} from '../../api';

export type AuthTab = 'LOGIN' | 'REGISTER' | 'VERIFY_EMAIL' | 'FORGOT_PASSWORD';

interface AuthModalsProps {
  open: boolean;
  currentUser: User | null;
  initialTab?: AuthTab;
  initialMessage?: string | null;
  onClose: () => void;
  onAuthenticated: (token: string, user: User) => void;
  onOpenUserDashboard: () => void;
  onOpenAdminDashboard: () => void;
  onSignOut: () => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  open,
  currentUser,
  initialTab = 'LOGIN',
  initialMessage = null,
  onClose,
  onAuthenticated,
  onOpenUserDashboard,
  onOpenAdminDashboard,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(initialMessage);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState<string>('vinothofficial14@gmail.com');
  const [loginPassword, setLoginPassword] = useState<string>('Ilmenau2026!');

  // Register State
  const [regName, setRegName] = useState<string>('');
  const [regContact, setRegContact] = useState<string>('+49 152 ');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');

  // Verify Email State
  const [verifyEmail, setVerifyEmail] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState<string>('');

  // Forgot / Reset Password State
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetStep, setResetStep] = useState<'REQUEST' | 'CONFIRM'>('REQUEST');
  const [resetCode, setResetCode] = useState<string>('');
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');

  if (!open) return null;

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setBusy(true);
    try {
      const res = await loginUser({ email: loginEmail, password: loginPassword });
      onAuthenticated(res.token, res.user);
      onClose();
    } catch (err: any) {
      if (err.needsVerification) {
        setVerifyEmail(err.email || loginEmail);
        setActiveTab('VERIFY_EMAIL');
        setStatusMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Invalid credentials.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setBusy(true);
    try {
      const res = await registerUser({
        name: regName,
        contact_number: regContact,
        email: regEmail,
        password: regPassword,
        confirm_password: regConfirmPassword,
      });
      setVerifyEmail(res.email);
      if (res.demoCode) {
        setVerifyCode(res.demoCode);
      }
      setActiveTab('VERIFY_EMAIL');
      setStatusMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setBusy(true);
    try {
      const res = await verifyEmailCode({
        email: verifyEmail,
        code: verifyCode,
      });
      onAuthenticated(res.token, res.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Email verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgotRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setBusy(true);
    try {
      const res = await forgotPasswordRequest(resetEmail);
      setResetStep('CONFIRM');
      setStatusMessage(res.message);
      if (res.demoCode) {
        setResetCode(res.demoCode);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch reset code.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setBusy(true);
    try {
      const res = await resetUserPassword({
        email: resetEmail,
        code: resetCode,
        password: resetNewPassword,
        confirm_password: resetConfirmPassword,
      });
      setLoginEmail(resetEmail);
      setLoginPassword(resetNewPassword);
      setResetStep('REQUEST');
      setActiveTab('LOGIN');
      setStatusMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            {currentUser
              ? 'TU Ilmenau Account Session'
              : 'IlmExchange Campus Authentication'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ESC
          </button>
        </div>

        <div className="modal-body">
          {currentUser ? (
            <div>
              <div className="status-banner">
                <div>
                  Signed in as <strong>{currentUser.name}</strong> ({currentUser.email})
                </div>
                <div style={{ marginTop: '4px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                  CONTACT: {currentUser.contact_number || '+49 3677 69-0'} // ROLE: {currentUser.role}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-primary-teal"
                  onClick={() => {
                    onClose();
                    onOpenUserDashboard();
                  }}
                >
                  Open My Ads &amp; Lifecycle Status Dashboard
                </button>

                {currentUser.role === 'ADMIN' && (
                  <button
                    type="button"
                    className="btn-primary-teal"
                    style={{ backgroundColor: '#003a63' }}
                    onClick={() => {
                      onClose();
                      onOpenAdminDashboard();
                    }}
                  >
                    Open Admin Moderation Console
                  </button>
                )}

                <button
                  type="button"
                  className="btn-danger-outline"
                  style={{ padding: '9px 14px' }}
                  onClick={onSignOut}
                >
                  Sign Out of Session
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="auth-tabs-bar" role="tablist">
                <button
                  type="button"
                  className={`auth-tab-btn ${activeTab === 'LOGIN' ? 'active' : ''}`}
                  onClick={() => switchTab('LOGIN')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${activeTab === 'REGISTER' ? 'active' : ''}`}
                  onClick={() => switchTab('REGISTER')}
                >
                  Register
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${activeTab === 'VERIFY_EMAIL' ? 'active' : ''}`}
                  onClick={() => switchTab('VERIFY_EMAIL')}
                >
                  Verify Email
                </button>
                <button
                  type="button"
                  className={`auth-tab-btn ${activeTab === 'FORGOT_PASSWORD' ? 'active' : ''}`}
                  onClick={() => switchTab('FORGOT_PASSWORD')}
                >
                  Reset Password
                </button>
              </div>

              {statusMessage && <div className="status-banner">{statusMessage}</div>}
              {errorMessage && <div className="error-banner">{errorMessage}</div>}

              {activeTab === 'LOGIN' && (
                <form onSubmit={handleLoginSubmit}>
                  <div className="form-field">
                    <label htmlFor="login-email">Institutional or Gmail Address</label>
                    <input
                      id="login-email"
                      type="email"
                      required
                      className="form-input"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="vinothofficial14@gmail.com"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="login-password">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      required
                      className="form-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      fontSize: '11.5px',
                      color: '#64748B',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      Demo Pass: Ilmenau2026!
                    </span>
                    <button
                      type="button"
                      className="footer-link-btn"
                      style={{ color: '#0D9488', fontWeight: 600 }}
                      onClick={() => {
                        setResetEmail(loginEmail);
                        switchTab('FORGOT_PASSWORD');
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button type="submit" className="btn-primary-teal" disabled={busy}>
                    {busy ? 'Authenticating...' : 'Sign In to IlmExchange'}
                  </button>
                </form>
              )}

              {activeTab === 'REGISTER' && (
                <form onSubmit={handleRegisterSubmit}>
                  <div className="form-row-2col">
                    <div className="form-field">
                      <label htmlFor="reg-name">Full Name</label>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        className="form-input"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Lukas Weber"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="reg-contact">Contact Number</label>
                      <input
                        id="reg-contact"
                        type="text"
                        required
                        className="form-input"
                        value={regContact}
                        onChange={(e) => setRegContact(e.target.value)}
                        placeholder="+49 176 34189022"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="reg-email">Email Address</label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      className="form-input"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@tu-ilmenau.de"
                    />
                  </div>
                  <div className="form-row-2col">
                    <div className="form-field">
                      <label htmlFor="reg-password">Password</label>
                      <input
                        id="reg-password"
                        type="password"
                        required
                        minLength={6}
                        className="form-input"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="reg-confirm">Confirm Password</label>
                      <input
                        id="reg-confirm"
                        type="password"
                        required
                        minLength={6}
                        className="form-input"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary-teal" disabled={busy}>
                    {busy ? 'Creating Account...' : 'Register & Send Verification Code'}
                  </button>
                </form>
              )}

              {activeTab === 'VERIFY_EMAIL' && (
                <form onSubmit={handleVerifyEmailSubmit}>
                  <div className="form-field">
                    <label htmlFor="verify-email">Registered Email Address</label>
                    <input
                      id="verify-email"
                      type="email"
                      required
                      className="form-input"
                      value={verifyEmail}
                      onChange={(e) => setVerifyEmail(e.target.value)}
                      placeholder="student@tu-ilmenau.de"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="verify-code">6-Digit Verification Code</label>
                    <input
                      id="verify-code"
                      type="text"
                      required
                      maxLength={6}
                      className="form-input"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '18px',
                        letterSpacing: '0.2em',
                      }}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <button type="submit" className="btn-primary-teal" disabled={busy}>
                    {busy ? 'Verifying Code...' : 'Verify Email & Activate Account'}
                  </button>
                </form>
              )}

              {activeTab === 'FORGOT_PASSWORD' && (
                <>
                  {resetStep === 'REQUEST' ? (
                    <form onSubmit={handleForgotRequestSubmit}>
                      <div className="form-field">
                        <label htmlFor="reset-email">Account Email Address</label>
                        <input
                          id="reset-email"
                          type="email"
                          required
                          className="form-input"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="vinothofficial14@gmail.com"
                        />
                      </div>
                      <button type="submit" className="btn-primary-teal" disabled={busy}>
                        {busy ? 'Sending Reset Code...' : 'Send 6-Digit Password Reset Code'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetConfirmSubmit}>
                      <div className="form-field">
                        <label htmlFor="reset-code">6-Digit Reset Code ({resetEmail})</label>
                        <input
                          id="reset-code"
                          type="text"
                          required
                          maxLength={6}
                          className="form-input"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '18px',
                            letterSpacing: '0.2em',
                          }}
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          placeholder="123456"
                        />
                      </div>
                      <div className="form-row-2col">
                        <div className="form-field">
                          <label htmlFor="reset-new-pass">New Password</label>
                          <input
                            id="reset-new-pass"
                            type="password"
                            required
                            minLength={6}
                            className="form-input"
                            value={resetNewPassword}
                            onChange={(e) => setResetNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor="reset-confirm-pass">Confirm Password</label>
                          <input
                            id="reset-confirm-pass"
                            type="password"
                            required
                            minLength={6}
                            className="form-input"
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary-teal" disabled={busy}>
                        {busy ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
