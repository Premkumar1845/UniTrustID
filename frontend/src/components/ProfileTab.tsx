/* ══════════════════════════════════════════════════
   Profile Tab — DID Document viewer
   ══════════════════════════════════════════════════ */

import { useState } from 'react';
import type { Credential, WalletInfo, DIDProfile } from '../lib/types';
import { CRED_META, CRED_TYPES } from '../lib/credentials';
import { DIDModule } from '../lib/did';
import { shortAddr, shortTx, fmtDate } from '../lib/utils';

interface ProfileTabProps {
    profile: DIDProfile;
    wallet: WalletInfo;
    credentials: Credential[];
}

export function ProfileTab({ profile, wallet, credentials }: ProfileTabProps) {
    const [showFull, setShowFull] = useState(false);
    const didDoc = DIDModule.createDocument(wallet.address, profile.did, profile);

    return (
        <div style={{ maxWidth: 720 }}>
            <div className="section-title">Identity Profile</div>
            <div className="section-sub">
                Your W3C DID ·{' '}
                {wallet.isReal
                    ? 'Live Algorand Testnet'
                    : wallet.isDemo
                        ? 'Demo Mode'
                        : 'Connected'}
            </div>

            <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="card">
                    <div className="card-label">Personal Details</div>
                    {(
                        [
                            ['Name', profile.name],
                            ['Student ID', profile.studentId],
                            ['Email', profile.email],
                            ['Department', profile.department],
                            ['Wallet', shortAddr(wallet.address)],
                            ['Wallet Type', wallet.walletName],
                            ['Network', wallet.isReal ? 'Algorand Testnet' : 'Demo'],
                            ['Anchor TX', shortTx(profile.txId)],
                            ['Created', fmtDate(profile.createdAt)],
                        ] as [string, string][]
                    ).map(([k, v]) => (
                        <div key={k} className="claim-row" style={{ marginBottom: 7 }}>
                            <span className="claim-key" style={{ minWidth: 100 }}>
                                {k}
                            </span>
                            <span
                                className="claim-val"
                                style={{ maxWidth: 'none', flex: 1 }}
                            >
                                {v}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="card-label">Credential Status</div>
                    {CRED_TYPES.map((t) => {
                        const has = credentials.find((c) => c.credentialType === t);
                        return (
                            <div
                                key={t}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '9px 0',
                                    borderBottom: '1px solid var(--border)',
                                }}
                            >
                                <span style={{ fontSize: 18 }}>{CRED_META[t].icon}</span>
                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: 12,
                                        color: has ? 'var(--text)' : 'var(--muted)',
                                    }}
                                >
                                    {CRED_META[t].label}
                                </span>
                                <span className={`pill ${has ? 'green' : 'amber'}`}>
                                    {has ? 'ISSUED' : 'PENDING'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                    }}
                >
                    <div className="card-label" style={{ marginBottom: 0 }}>
                        DID Document (W3C)
                    </div>
                    <button
                        className="inline-btn"
                        style={{ marginTop: 0 }}
                        onClick={() => setShowFull((f) => !f)}
                    >
                        {showFull ? 'Collapse' : 'Expand full doc'}
                    </button>
                </div>
                <div className="json-block">
                    {JSON.stringify(
                        showFull
                            ? didDoc
                            : {
                                id: didDoc.id,
                                controller: didDoc.controller,
                                verificationMethod: didDoc.verificationMethod,
                                '...': 'expand to see full document',
                            },
                        null,
                        2
                    )}
                </div>
            </div>
        </div>
    );
}
