/* ══════════════════════════════════════════════════
   Selective Disclosure Modal
   ══════════════════════════════════════════════════ */

import { useState } from 'react';
import type { Credential } from '../lib/types';

interface SelDiscModalProps {
    cred: Credential;
    onConfirm: (fields: string[]) => void;
    onClose: () => void;
}

export function SelDiscModal({ cred, onConfirm, onClose }: SelDiscModalProps) {
    const [sel, setSel] = useState<Set<string>>(new Set());

    const toggle = (k: string) =>
        setSel((p) => {
            const s = new Set(p);
            s.has(k) ? s.delete(k) : s.add(k);
            return s;
        });

    const claims = cred._claims || {};

    return (
        <div
            className="modal-backdrop"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal">
                <div className="modal-header">
                    <div className="modal-title">🔏 Selective Disclosure</div>
                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-info">
                    Pick exactly which fields to share. Everything else stays private —
                    the service only sees your approved data.
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 14,
                        flexWrap: 'wrap',
                    }}
                >
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Credential:
                    </span>
                    <span
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--cyan)',
                            padding: '2px 8px',
                            background: 'rgba(0,200,255,.06)',
                            borderRadius: 4,
                        }}
                    >
                        {cred.credentialType}
                    </span>
                    <span
                        style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--muted)',
                        }}
                    >
                        · {cred.issuer?.name}
                    </span>
                </div>

                <div className="field-list">
                    {Object.entries(claims).map(([k, v]) => (
                        <div
                            key={k}
                            className={`field-item${sel.has(k) ? ' selected' : ''}`}
                            onClick={() => toggle(k)}
                        >
                            <div className="field-check">{sel.has(k) ? '✓' : ''}</div>
                            <span className="field-key">{k}</span>
                            <span className={`field-val${sel.has(k) ? '' : ' hidden'}`}>
                                {sel.has(k) ? String(v) : '••••••'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="modal-actions">
                    <button className="btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        disabled={!sel.size}
                        onClick={() => onConfirm(Array.from(sel))}
                    >
                        SHARE {sel.size} FIELD{sel.size !== 1 ? 'S' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
