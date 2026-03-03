/* ══════════════════════════════════════════════════
   UniTrustID — Root App component
   ══════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import type {
  Credential,
  CredentialType,
  DIDFormData,
  DIDProfile,
  LogLine,
  WalletInfo,
} from './lib/types';
import { AlgoNode } from './lib/algoNode';
import { DIDModule } from './lib/did';
import { CredModule, CRED_META } from './lib/credentials';
import { delay, shortAddr } from './lib/utils';
import { AuthService, type AuthUser } from './lib/supabase';

import { Toast } from './components/Toast';
import { WalletChip } from './components/WalletChip';
import { WalletScreen } from './components/WalletScreen';
import { AuthScreen } from './components/AuthScreen';
import { OverviewTab } from './components/OverviewTab';
import { CredentialsTab } from './components/CredentialsTab';
import { ServicesTab } from './components/ServicesTab';
import { ProfileTab } from './components/ProfileTab';
import { SelDiscModal } from './components/SelDiscModal';
import { Console } from './components/Console';

type AppStep = 'wallet' | 'auth' | 'create-did' | 'app';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'services', label: 'Services' },
  { id: 'profile', label: 'Profile' },
];

export default function App() {
  const { activeWallet, transactionSigner } = useWallet();
  const [step, setStep] = useState<AppStep>('wallet');
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [profile, setProfile] = useState<DIDProfile | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [disclosureCred, setDisclosureCred] = useState<Credential | null>(null);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(
    null
  );
  const [form, setForm] = useState<DIDFormData>({
    name: '',
    studentId: '',
    email: '',
    department: 'Computer Science',
  });
  const [creatingDID, setCreatingDID] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('unitrustid-theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('unitrustid-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const addLog = useCallback(
    (type: LogLine['type'], msg: string) =>
      setLogs((l) => [...l, { type, msg, ts: Date.now() }]),
    []
  );
  const showToast = (msg: string, err = false) => setToast({ msg, err });

  /* use-wallet-react handles session persistence automatically */

  const handleConnected = (w: WalletInfo) => {
    setWallet(w);
    // After wallet connection, go to auth screen for login/signup
    setStep('auth');
  };

  const handleAuthenticated = (user: AuthUser) => {
    setAuthUser(user);
    // Pre-fill form from user's Supabase profile
    setForm({
      name: user.full_name,
      studentId: user.student_id,
      email: user.email,
      department: user.department,
    });
    addLog('success', `✓ Authenticated as ${user.full_name} (${user.email})`);
    addLog('data', `🔗 Session token: ${user.session_token.slice(0, 20)}...`);
    showToast(`Welcome, ${user.full_name}!`);
    setStep('create-did');
  };

  const handleAuthBack = () => {
    // Go back to wallet selection
    if (wallet?.isReal && activeWallet) {
      activeWallet.disconnect().catch(() => { });
    }
    setWallet(null);
    setStep('wallet');
  };

  const handleLogout = async () => {
    if (authUser) {
      await AuthService.logout(authUser.id).catch(() => { });
    }
    setProfile(null);
    setCredentials([]);
    setLogs([]);
    setAuthUser(null);
    setActiveTab('overview');
    setStep('auth');
    showToast('Logged out — please login again');
  };

  const handleDisconnect = async () => {
    if (authUser) {
      await AuthService.logout(authUser.id).catch(() => { });
    }
    if (wallet?.isReal && activeWallet) {
      try {
        await activeWallet.disconnect();
      } catch (_e) { /* ignore */ }
    }
    setWallet(null);
    setProfile(null);
    setCredentials([]);
    setLogs([]);
    setAuthUser(null);
    setStep('wallet');
    setActiveTab('overview');
    showToast('Disconnected & session cleared');
  };

  const handleCreateDID = async () => {
    if (!form.name || !form.studentId || !form.email || !wallet) return;
    setCreatingDID(true);
    const addr = wallet.address;
    const did = DIDModule.generate(addr);
    const didDoc = DIDModule.createDocument(addr, did, form);

    let txId: string;
    try {
      if (wallet.isReal) {
        // Real wallet: 1-ALGO to admin for DID verification
        addLog('info', 'Sending 1 ALGO to admin for DID verification...');
        const result = await AlgoNode.anchorDID(
          addr,
          didDoc,
          addLog,
          transactionSigner
        );
        txId = result.txId;
      } else {
        // Demo mode: simulated transaction
        addLog('info', 'Demo mode — simulating anchor transaction...');
        await delay(800);
        txId =
          'DEMO' +
          Array.from(window.crypto.getRandomValues(new Uint8Array(14)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        addLog('success', `✓ Simulated TxID: ${txId}`);
      }
    } catch (e: any) {
      console.error('[UniTrustID] Transaction error:', e);
      addLog('warn', `Transaction failed: ${e.message}`);
      showToast(e.message || 'Transaction failed', true);
      setCreatingDID(false);
      return;
    }

    const p: DIDProfile = {
      did,
      ...form,
      createdAt: Date.now(),
      txId,
    };
    addLog('info', 'Issuing default StudentID credential...');
    const cred = CredModule.issue('StudentID', did, 'Campus Registrar Office', {
      studentId: form.studentId,
      name: form.name,
      department: form.department,
      year: '3rd Year',
      enrolledSince: '2022',
      cgpa: '8.7',
    });
    await delay(500);
    addLog('success', '✓ StudentID credential issued & signed');

    if (wallet.isReal) {
      const loraUrl = AlgoNode.loraTransactionUrl(txId);
      addLog('data', `🔍 View on Lora: ${loraUrl}`);
    }

    setProfile(p);
    setCredentials([cred]);
    setCreatingDID(false);
    setStep('app');
    showToast(
      wallet.isReal
        ? 'DID verified — 1 ALGO sent to admin ✓'
        : 'DID anchored (demo mode) ✓'
    );
  };

  const handleIssueCred = (type: CredentialType) => {
    if (!profile) return;
    const c = CredModule.issue(
      type,
      profile.did,
      `Campus ${CRED_META[type].label} Office`
    );
    setCredentials((prev) => [...prev, c]);
    addLog('success', `✓ ${CRED_META[type].label} credential issued`);
    showToast(`${CRED_META[type].label} credential issued`);
  };

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

  return (
    <div className="app">
      <div className="content">
        {/* HEADER */}
        <header className="header">
          <div className="logo">
            <div className="logo-mark">
              <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="100%" stopColor="#0088cc" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect x="4" y="4" width="92" height="92" rx="20" ry="20" fill="#0a1628" stroke="#00c8ff" strokeWidth="3" />
                <g transform="translate(50,50) rotate(45)" filter="url(#glow)">
                  <rect x="-22" y="-22" width="44" height="44" rx="6" ry="6" fill="url(#diamondGrad)" />
                </g>
              </svg>
            </div>
            <span className="logo-text">
              UniTrust<span>ID</span>
            </span>
          </div>
          <div className="header-right">
            <span className="network-badge">ALGORAND TESTNET</span>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {wallet && (
              <WalletChip wallet={wallet} onDisconnect={handleDisconnect} />
            )}
            {step === 'app' && (
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout and return to login page"
              >
                Logout
              </button>
            )}
            {step === 'app' && <span className="pill green">● DID Active</span>}
          </div>
        </header>

        {/* WALLET SCREEN */}
        {step === 'wallet' && (
          <WalletScreen
            onConnected={handleConnected}
            addLog={addLog}
            logs={logs}
          />
        )}

        {/* AUTH SCREEN */}
        {step === 'auth' && wallet && (
          <AuthScreen
            wallet={wallet}
            onAuthenticated={handleAuthenticated}
            onBack={handleAuthBack}
          />
        )}

        {/* CREATE DID */}
        {step === 'create-did' && wallet && (
          <div className="wallet-screen">
            <div style={{ width: '100%', maxWidth: 480 }}>
              <div
                className="section-title"
                style={{ textAlign: 'center', marginBottom: 6 }}
              >
                Create Your DID
              </div>
              <div
                className="section-sub"
                style={{ textAlign: 'center', marginBottom: 22 }}
              >
                Verified by sending 1 ALGO to the admin wallet with your DID
                document in the note field
              </div>
              {creatingDID ? (
                <div className="card">
                  <div className="did-creating">
                    <div className="big-spinner" />
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--cyan)',
                        fontSize: 13,
                      }}
                    >
                      Anchoring DID on Algorand...
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  {(
                    [
                      { k: 'name', l: 'Full Name', p: 'Aarav Sharma' },
                      { k: 'studentId', l: 'Student ID', p: 'STU2024001' },
                      {
                        k: 'email',
                        l: 'Campus Email',
                        p: 'you@campus.edu',
                        t: 'email',
                      },
                    ] as const
                  ).map((f) => (
                    <div key={f.k} className="form-group">
                      <label className="form-label">{f.l}</label>
                      <input
                        className="form-input"
                        type={'t' in f ? f.t : 'text'}
                        placeholder={f.p}
                        value={form[f.k]}
                        onChange={(e) =>
                          setForm((d) => ({ ...d, [f.k]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={form.department}
                      onChange={(e) =>
                        setForm((d) => ({
                          ...d,
                          department: e.target.value,
                        }))
                      }
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginBottom: 16,
                      padding: '8px 12px',
                      background: 'rgba(0,200,255,.03)',
                      borderRadius: 8,
                      border: '1px solid rgba(0,200,255,.08)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>💼</span>
                    <span
                      style={{
                        color: 'var(--cyan)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {shortAddr(wallet.address)}
                    </span>
                    <span>·</span>
                    <span style={{ color: 'var(--muted)' }}>
                      {wallet.walletName}
                    </span>
                    {wallet.isReal && (
                      <span className="pill green" style={{ fontSize: 9 }}>
                        REAL
                      </span>
                    )}
                    {wallet.isDemo && (
                      <span className="pill amber" style={{ fontSize: 9 }}>
                        DEMO
                      </span>
                    )}
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={handleCreateDID}
                    disabled={!form.name || !form.studentId || !form.email}
                  >
                    ANCHOR DID ON ALGORAND
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN APP */}
        {step === 'app' && profile && (
          <>
            <nav className="tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {activeTab === t.id && <span className="tab-dot" />}
                  {t.label}
                  {t.id === 'credentials' && credentials.length > 0 && (
                    <span className="tab-badge">{credentials.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <main className="main">
              {activeTab === 'overview' && (
                <OverviewTab
                  profile={profile}
                  wallet={wallet!}
                  credentials={credentials}
                  logs={logs}
                  onTabChange={setActiveTab}
                />
              )}
              {activeTab === 'credentials' && (
                <CredentialsTab
                  profile={profile}
                  credentials={credentials}
                  onIssue={handleIssueCred}
                  onShare={setDisclosureCred}
                />
              )}
              {activeTab === 'services' && (
                <ServicesTab credentials={credentials} />
              )}
              {activeTab === 'profile' && (
                <ProfileTab
                  profile={profile}
                  wallet={wallet!}
                  credentials={credentials}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* SELECTIVE DISCLOSURE MODAL */}
      {disclosureCred && (
        <SelDiscModal
          cred={disclosureCred}
          onConfirm={(fields) => {
            const d = CredModule.selDisclosure(disclosureCred, fields);
            addLog(
              'success',
              `✓ Disclosed ${fields.length} field(s) from ${disclosureCred.credentialType}`
            );
            setDisclosureCred(null);
            showToast(
              `Shared ${fields.length} field(s) — ${d.withheldCount} kept private`
            );
          }}
          onClose={() => setDisclosureCred(null)}
        />
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          err={toast.err}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
