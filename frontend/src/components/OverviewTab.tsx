/* ══════════════════════════════════════════════════
   Overview Tab
   ══════════════════════════════════════════════════ */

import type { Credential, DIDProfile, LogLine, WalletInfo } from '../lib/types';
import { AlgoNode } from '../lib/algoNode';
import { CRED_META } from '../lib/credentials';
import { fmtDate, fmtTime, shortAddr } from '../lib/utils';

interface OverviewTabProps {
  profile: DIDProfile;
  wallet: WalletInfo;
  credentials: Credential[];
  logs: LogLine[];
  onTabChange: (tab: string) => void;
}

export function OverviewTab({
  profile,
  wallet,
  credentials,
  logs,
  onTabChange,
}: OverviewTabProps) {
  const recent = [...credentials].reverse().slice(0, 5);

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* DID Profile Card */}
        <div className="did-profile">
          <div className="verified-ribbon">VERIFIED</div>
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              marginBottom: 14,
            }}
          >
            <div className="did-avatar">👤</div>
            <div style={{ flex: 1 }}>
              <div className="did-name">{profile.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  marginBottom: 8,
                }}
              >
                {profile.studentId} · {profile.department}
              </div>
              <span className="pill cyan">● Active DID</span>
              {wallet.isReal && (
                <span className="pill green" style={{ marginLeft: 6 }}>
                  ● Real Wallet
                </span>
              )}
            </div>
          </div>
          <div className="card-label">Decentralized Identifier</div>
          <div className="did-address">{profile.did}</div>
          <div className="anchor-block">
            <div className="anchor-pulse" />
            <div style={{ flex: 1 }}>
              <div className="anchor-label">ALGORAND TESTNET ANCHOR</div>
              <div className="anchor-txid">{profile.txId}</div>
              {!profile.txId.startsWith('DEMO') && (
                <a
                  href={AlgoNode.loraTransactionUrl(profile.txId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 6,
                    fontSize: 11,
                    color: 'var(--cyan)',
                    fontFamily: 'var(--font-mono)',
                    textDecoration: 'none',
                    borderBottom: '1px dashed var(--cyan)',
                    paddingBottom: 1,
                  }}
                >
                  🔍 View on Lora Explorer →
                </a>
              )}
            </div>
            <span>⛓️</span>
          </div>
          <div className="did-stats">
            <div className="did-stat">
              <div className="did-stat-val">{credentials.length}</div>
              <div className="did-stat-label">Credentials</div>
            </div>
            <div className="did-stat">
              <div className="did-stat-val">{credentials.length}</div>
              <div className="did-stat-label">Verified</div>
            </div>
            <div className="did-stat">
              <div className="did-stat-val">4</div>
              <div className="did-stat-label">Services</div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-label">Recent Activity</div>
            {recent.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
                No activity yet.
              </div>
            ) : (
              recent.map((c) => (
                <div key={c.id} className="activity-item">
                  <div
                    className="activity-dot"
                    style={{
                      background:
                        CRED_META[c.credentialType]?.color || 'var(--cyan)',
                    }}
                  />
                  <div>
                    <div className="activity-text">
                      <strong>{CRED_META[c.credentialType]?.label}</strong>{' '}
                      credential issued
                    </div>
                    <div className="activity-time">
                      {fmtDate(c._issuedAt)} · {fmtTime(c._issuedAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <button
              className="inline-btn"
              onClick={() => onTabChange('credentials')}
            >
              View all credentials →
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-3">
        {[
          {
            label: 'Identity',
            val: 'On-Chain',
            icon: '⛓️',
            color: 'var(--cyan)',
          },
          {
            label: 'Privacy',
            val: '98%',
            icon: '🔒',
            color: 'var(--green)',
          },
          {
            label: 'Wallet',
            val: shortAddr(wallet.address),
            icon: '💼',
            color: 'var(--amber)',
          },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 17,
                color: s.color,
                fontWeight: 700,
              }}
            >
              {s.val}
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
