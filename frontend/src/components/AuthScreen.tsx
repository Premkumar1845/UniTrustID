/* ══════════════════════════════════════════════════
   AuthScreen — Create Account / Login
   Two-panel auth with logo animation & Supabase
   ══════════════════════════════════════════════════ */

import { useState } from 'react';
import { AuthService, type SignUpData, type LoginData, type AuthUser } from '../lib/supabase';
import type { WalletInfo } from '../lib/types';

interface AuthScreenProps {
  wallet: WalletInfo;
  onAuthenticated: (user: AuthUser) => void;
  onBack: () => void;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
];

export function AuthScreen({ wallet, onAuthenticated, onBack }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupStudentId, setSignupStudentId] = useState('');
  const [signupDepartment, setSignupDepartment] = useState(DEPARTMENTS[0]);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const data: LoginData = { email: loginEmail, password: loginPassword };
    const result = await AuthService.login(data, wallet.address, wallet.walletName);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess('Login successful! Tokenizing session...');
    setTimeout(() => {
      onAuthenticated(result.user!);
    }, 1200);
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupStudentId || !signupPassword || !signupConfirm) {
      setError('Please fill in all fields');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const data: SignUpData = {
      email: signupEmail,
      password: signupPassword,
      full_name: signupName,
      student_id: signupStudentId,
      department: signupDepartment,
      wallet_address: wallet.address,
      wallet_name: wallet.walletName,
    };

    const result = await AuthService.signUp(data);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess('Account created! Redirecting...');
    setTimeout(() => {
      onAuthenticated(result.user!);
    }, 1200);
  };

  return (
    <div className="auth-screen">
      {/* ── Animated Logo ── */}
      <div className="auth-logo-container">
        <div className="auth-logo-ring auth-ring-outer">
          <div className="auth-logo-ring auth-ring-middle">
            <div className="auth-logo-ring auth-ring-inner">
              <div className="auth-logo-core">
                <span className="auth-logo-icon">🔐</span>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-logo-text">
          UniTrust<span>ID</span>
        </div>
        <div className="auth-logo-sub">Decentralized Identity on Algorand</div>
      </div>

      {/* ── Auth Card ── */}
      <div className="auth-card">
        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            🔑 Login
          </button>
          <button
            className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
          >
            ✨ Create Account
          </button>
        </div>

        {/* Wallet Badge */}
        <div className="auth-wallet-badge">
          <div className="auth-wallet-dot" />
          <span className="auth-wallet-label">Connected Wallet</span>
          <span className="auth-wallet-addr">
            {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
          </span>
          <span className="auth-wallet-name">{wallet.walletName}</span>
        </div>

        {/* ── Login Form ── */}
        {mode === 'login' && (
          <div className="auth-form">
            <div className="auth-form-title">
              Login to Your Decentralized Identity
            </div>
            <div className="auth-form-sub">
              Enter the credentials you used when creating your account
            </div>

            <div className="form-group">
              <label className="form-label">Campus Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@campus.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button
              className="btn-primary auth-submit"
              onClick={handleLogin}
              disabled={loading || !loginEmail || !loginPassword}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="spin-sm" /> Verifying...
                </span>
              ) : (
                '🔑 LOGIN & TOKENIZE SESSION'
              )}
            </button>

            <div className="auth-switch">
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}>
                Create one here
              </button>
            </div>
          </div>
        )}

        {/* ── Signup Form ── */}
        {mode === 'signup' && (
          <div className="auth-form">
            <div className="auth-form-title">
              Create Your Decentralized Identity Account
            </div>
            <div className="auth-form-sub">
              Your credentials will be securely stored and linked to your wallet
            </div>

            <div className="auth-form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Prem Kumar"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="23RA1A6675"
                  value={signupStudentId}
                  onChange={(e) => setSignupStudentId(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Campus Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@campus.edu"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={signupDepartment}
                onChange={(e) => setSignupDepartment(e.target.value)}
                disabled={loading}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="auth-form-grid">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Re-enter password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button
              className="btn-primary auth-submit"
              onClick={handleSignup}
              disabled={loading || !signupName || !signupEmail || !signupStudentId || !signupPassword || !signupConfirm}
            >
              {loading ? (
                <span className="auth-btn-loading">
                  <span className="spin-sm" /> Creating Account...
                </span>
              ) : (
                '✨ CREATE ACCOUNT & TOKENIZE'
              )}
            </button>

            <div className="auth-switch">
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                Login here
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        <button className="auth-back-btn" onClick={onBack}>
          ← Change Wallet
        </button>
      </div>

      {/* Token Info */}
      <div className="auth-token-info">
        <span>🔗</span>
        <span>
          Every login generates a unique session token from your connected {wallet.walletName} wallet
        </span>
      </div>
    </div>
  );
}
