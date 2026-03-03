/* ══════════════════════════════════════════════════
   Credentials Tab — issue & view credentials
   ══════════════════════════════════════════════════ */

import { useState } from 'react';
import type { Credential, CredentialType, DIDProfile } from '../lib/types';
import {
    CRED_DEFAULTS,
    CRED_META,
    CRED_TYPES,
} from '../lib/credentials';
import { delay } from '../lib/utils';
import { CredCard } from './CredCard';

interface CredentialsTabProps {
    profile: DIDProfile;
    credentials: Credential[];
    onIssue: (type: CredentialType) => void;
    onShare: (cred: Credential) => void;
}

export function CredentialsTab({
    profile,
    credentials,
    onIssue,
    onShare,
}: CredentialsTabProps) {
    const [selType, setSelType] = useState<CredentialType>('StudentID');
    const [issuing, setIssuing] = useState(false);

    const handleIssue = async () => {
        if (credentials.some((c) => c.credentialType === selType)) return;
        setIssuing(true);
        await delay(900);
        onIssue(selType);
        setIssuing(false);
    };

    return (
        <div>
            <div className="grid-2">
                {/* Left — Issue panel */}
                <div>
                    <div className="section-title">Issue Credential</div>
                    <div className="section-sub">
                        Create W3C Verifiable Credentials signed with your DID
                    </div>
                    <div className="card">
                        <div className="card-label">Select Type</div>
                        <div className="issue-type-grid">
                            {CRED_TYPES.map((t) => (
                                <button
                                    key={t}
                                    className={`issue-type-btn${selType === t ? ' selected' : ''}`}
                                    onClick={() => setSelType(t)}
                                >
                                    {CRED_META[t].icon}{' '}
                                    {t.replace(/([A-Z])/g, ' $1').trim()}
                                    {credentials.some((c) => c.credentialType === t) && (
                                        <span style={{ color: 'var(--green)', marginLeft: 4 }}>
                                            ✓
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="card-label">Claims Preview</div>
                        <div style={{ marginBottom: 14 }}>
                            {Object.entries(CRED_DEFAULTS[selType]).map(([k, v]) => (
                                <div key={k} className="claim-row" style={{ marginBottom: 5 }}>
                                    <span className="claim-key">{k}</span>
                                    <span className="claim-val">{String(v)}</span>
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                fontSize: 11,
                                color: 'var(--muted)',
                                marginBottom: 14,
                                padding: '8px 12px',
                                background: 'rgba(0,0,0,.2)',
                                borderRadius: 8,
                            }}
                        >
                            <span style={{ color: 'var(--cyan)' }}>Issuer:</span> Campus{' '}
                            {CRED_META[selType].label} Office
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%' }}
                            onClick={handleIssue}
                            disabled={
                                issuing ||
                                credentials.some((c) => c.credentialType === selType)
                            }
                        >
                            {issuing
                                ? '⏳ ISSUING...'
                                : credentials.some((c) => c.credentialType === selType)
                                    ? '✓ ALREADY ISSUED'
                                    : 'ISSUE CREDENTIAL'}
                        </button>
                    </div>

                    <div className="card" style={{ marginTop: 16 }}>
                        <div className="card-label">W3C VC Schema</div>
                        <div className="json-block">{`{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "type": [
    "VerifiableCredential",
    "Campus${selType}"
  ],
  "issuer": "did:algo:CAMPUS_UNIV",
  "proof": { "type": "AlgorandSignature2024" }
}`}</div>
                    </div>
                </div>

                {/* Right — Credential wallet */}
                <div>
                    <div className="section-title">Credential Wallet</div>
                    <div className="section-sub">
                        {credentials.length} credential
                        {credentials.length !== 1 ? 's' : ''} · All cryptographically signed
                    </div>
                    {credentials.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🪪</div>
                            <p>Issue credentials from the left panel.</p>
                        </div>
                    ) : (
                        <div className="cred-grid">
                            {credentials.map((c) => (
                                <CredCard key={c.id} cred={c} onShare={onShare} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
