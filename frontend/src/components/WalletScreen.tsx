/* ══════════════════════════════════════════════════
   Wallet Connect Screen — Pera + Defly + Demo
   Uses @txnlab/use-wallet-react v4 (WalletConnect v2)
   ══════════════════════════════════════════════════ */

import { useState, useEffect } from 'react';
import { useWallet, type Wallet } from '@txnlab/use-wallet-react';
import type { LogLine, WalletInfo } from '../lib/types';
import { Console } from './Console';

interface WalletScreenProps {
  onConnected: (wallet: WalletInfo) => void;
  addLog: (type: LogLine['type'], msg: string) => void;
  logs: LogLine[];
}

export function WalletScreen({ onConnected, addLog, logs }: WalletScreenProps) {
  const { wallets, activeAddress, activeWallet } = useWallet();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');

  // When wallet connects via use-wallet, propagate to parent
  useEffect(() => {
    if (activeAddress && activeWallet) {
      const name =
        activeWallet.id === 'pera' ? 'Pera Wallet' :
          activeWallet.id === 'defly' ? 'Defly Wallet' :
            activeWallet.metadata.name;
      addLog('success', `✓ Connected via ${name}: ${activeAddress.slice(0, 20)}...`);
      onConnected({ address: activeAddress, walletName: name, isReal: true });
    }
  }, [activeAddress, activeWallet]);

  const handleWalletConnect = async (wallet: Wallet) => {
    setBusy(wallet.id);
    setErr('');
    const name = wallet.metadata.name;
    try {
      addLog('info', `Connecting ${name}...`);
      addLog('info', 'A QR code will appear — scan with your mobile wallet app.');
      await wallet.connect();
      // The useEffect above will handle the callback
    } catch (e: any) {
      const msg = String(e.message || e);
      if (/cancel|reject|abort|close|user/i.test(msg)) {
        setErr(`${name} connection cancelled — try again when ready.`);
        addLog('warn', `${name} cancelled by user`);
      } else {
        setErr(`${name} error: ${msg.slice(0, 120)}`);
        addLog('warn', `${name} error: ${msg}`);
      }
    }
    setBusy(null);
  };

  const handleDemo = () => {
    addLog('info', 'Loading demo mode with simulated wallet...');
    const fakeAddr =
      'DEMO' +
      Array.from(window.crypto.getRandomValues(new Uint8Array(28)))
        .map((b) => String.fromCharCode(65 + (b % 26)))
        .join('');
    addLog('success', `✓ Demo wallet ready: ${fakeAddr.slice(0, 20)}...`);
    onConnected({ address: fakeAddr, walletName: 'Demo Wallet', isDemo: true });
  };

  // Find Pera and Defly from the configured wallets
  const peraWallet = wallets.find((w) => w.id === 'pera');
  const deflyWallet = wallets.find((w) => w.id === 'defly');

  const HOW_TO_STEPS = [
    ['🔶', 'Open Pera or Defly', 'Install from App Store / Google Play'],
    ['📷', 'Scan QR Code', 'Click a wallet button, then scan the QR with your app'],
    ['✅', 'Approve Connection', 'Tap Approve on your phone to connect securely'],
    ['🪪', 'Create Your DID', 'Fill in your campus profile to anchor on Algorand'],
  ];

  return (
    <div className="wallet-screen">
      <div className="wallet-hero">
        <div className="wallet-hero-icon">🪪</div>
        <h1>
          Your <em>Identity</em>,<br />
          Your Control
        </h1>
        <p>
          Decentralized campus identity on Algorand. Connect your Pera or Defly
          wallet to create a DID, issue verifiable credentials, and authenticate
          without passwords.
        </p>
      </div>

      <div className="connect-card">
        {/* Pera Wallet */}
        {peraWallet && (
          <button
            className="pera-btn"
            onClick={() => handleWalletConnect(peraWallet)}
            disabled={!!busy}
          >
            <div className="icon pera-icon">🔶</div>
            <div className="text">
              <div className="t">
                {busy === 'pera' ? 'Connecting Pera...' : 'Connect Pera Wallet'}
              </div>
              <div className="s">Scan QR code with Pera mobile app</div>
            </div>
            {busy === 'pera' && <div className="spin-sm" />}
          </button>
        )}

        {/* Defly Wallet */}
        {deflyWallet && (
          <button
            className="pera-btn defly-style"
            onClick={() => handleWalletConnect(deflyWallet)}
            disabled={!!busy}
          >
            <div className="icon defly-icon">🦅</div>
            <div className="text">
              <div className="t">
                {busy === 'defly' ? 'Connecting Defly...' : 'Connect Defly Wallet'}
              </div>
              <div className="s">Scan QR code with Defly mobile app</div>
            </div>
            {busy === 'defly' && <div className="spin-sm" />}
          </button>
        )}

        {err && <div className="error-msg">{err}</div>}
      </div>

      <div className="feature-pills">
        {[
          '🔶 Pera Wallet',
          '🦅 Defly Wallet',
          '⛓️ Algorand Testnet',
          '🔏 Selective Disclosure',
        ].map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>

      {/* How-to */}
      <div className="howto">
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--muted)',
            letterSpacing: 1,
            marginBottom: 14,
          }}
        >
          HOW TO CONNECT
        </div>
        {HOW_TO_STEPS.map(([icon, title, sub]) => (
          <div key={title} className="howto-row">
            <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
            <div>
              <div
                style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  marginTop: 2,
                }}
              >
                {sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.length > 0 && (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 4,
            }}
          >
            CONSOLE
          </div>
          <Console lines={logs} />
        </div>
      )}
    </div>
  );
}
