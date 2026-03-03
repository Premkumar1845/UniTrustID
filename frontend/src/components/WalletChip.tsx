/* ══════════════════════════════════════════════════
   Wallet Chip — Header wallet status display
   ══════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import type { WalletInfo } from '../lib/types';
import { AlgoNode } from '../lib/algoNode';
import { shortAddr } from '../lib/utils';

interface WalletChipProps {
    wallet: WalletInfo;
    onDisconnect: () => void;
}

export function WalletChip({ wallet, onDisconnect }: WalletChipProps) {
    const [bal, setBal] = useState<string | null>(null);

    useEffect(() => {
        if (wallet?.isReal) {
            AlgoNode.getAccountInfo(wallet.address).then((d: any) => {
                if (d?.amount !== undefined) setBal((d.amount / 1e6).toFixed(3));
            });
        }
    }, [wallet?.address, wallet?.isReal]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="wallet-chip">
                <div className="wallet-chip-dot" />
                <span className="wallet-chip-name">{wallet.walletName}</span>
                <span className="wallet-chip-addr">{shortAddr(wallet.address)}</span>
                {bal !== null && (
                    <span className="wallet-chip-bal">{bal} ALGO</span>
                )}
                {wallet.isDemo && (
                    <span
                        className="pill amber"
                        style={{ fontSize: 9, padding: '1px 6px' }}
                    >
                        DEMO
                    </span>
                )}
            </div>
            <button className="disc-btn" onClick={onDisconnect}>
                Disconnect
            </button>
        </div>
    );
}
