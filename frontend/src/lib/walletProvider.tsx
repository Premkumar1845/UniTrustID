/* ══════════════════════════════════════════════════
   Wallet Provider — @txnlab/use-wallet-react v4
   Configures Pera + Defly via their native SDKs
   ══════════════════════════════════════════════════ */

import { WalletId, WalletManager, NetworkId } from '@txnlab/use-wallet-react';

export const walletManager = new WalletManager({
    wallets: [
        {
            id: WalletId.PERA,
            options: {
                chainId: 416002,              // Algorand Testnet
                compactMode: true,
            },
        },
        {
            id: WalletId.DEFLY,
            options: {
                chainId: 416002,              // Algorand Testnet
            },
        },
    ],
    defaultNetwork: NetworkId.TESTNET,
    networks: {
        [NetworkId.TESTNET]: {
            algod: {
                token: '',
                baseServer: 'https://testnet-api.algonode.cloud',
                port: '',
            },
        },
    },
});
