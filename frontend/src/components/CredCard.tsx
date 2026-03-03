/* ══════════════════════════════════════════════════
   Credential Card component
   ══════════════════════════════════════════════════ */

import type { Credential } from '../lib/types';
import { CRED_META } from '../lib/credentials';
import { fmtDate } from '../lib/utils';

interface CredCardProps {
    cred: Credential;
    onShare: (cred: Credential) => void;
}

export function CredCard({ cred, onShare }: CredCardProps) {
    const m = CRED_META[cred.credentialType] || ({} as any);
    const expired = cred._expiresAt < Date.now();

    return (
        <div className={`cred-card ${cred.credentialType}`}>
            <div className="cred-top">
                <div className="cred-icon" style={{ background: m.bg }}>
                    {m.icon}
                </div>
                <div className={`cred-status ${expired ? 'expired' : 'valid'}`}>
                    {expired ? 'EXPIRED' : 'VALID'}
                </div>
            </div>

            <div className="cred-type">{m.label}</div>
            <div className="cred-issuer">{cred.issuer?.name}</div>

            <div>
                {Object.entries(cred._claims || {})
                    .slice(0, 3)
                    .map(([k, v]) => (
                        <div key={k} className="claim-row">
                            <span className="claim-key">{k}</span>
                            <span className="claim-val">{String(v)}</span>
                        </div>
                    ))}
                {Object.keys(cred._claims || {}).length > 3 && (
                    <div
                        style={{
                            fontSize: 10,
                            color: 'var(--muted)',
                            marginTop: 4,
                            textAlign: 'right',
                        }}
                    >
                        +{Object.keys(cred._claims).length - 3} more
                    </div>
                )}
            </div>

            <div className="cred-footer">
                <span className="cred-expiry">Exp. {fmtDate(cred._expiresAt)}</span>
                <button className="share-btn" onClick={() => onShare(cred)}>
                    🔗 Share
                </button>
            </div>
        </div>
    );
}
