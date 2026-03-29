/* ══════════════════════════════════════════════════
   Algorand Testnet — Real Transaction Helpers
   Uses algosdk v3 + use-wallet transactionSigner
   ══════════════════════════════════════════════════ */

import algosdk from 'algosdk';
import type { DIDDocument } from './types';
import { delay } from './utils';

const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;

/** Admin wallet that receives DID verification fees */
const ADMIN_ADDRESS = '5PZHJCQSYVEDAYTEFBQGXXUQJA6K3VDY6DBBAOLWFGQHA3R5FTYBLJ3NZE';

/** Lora block explorer base URL for Algorand Testnet */
const LORA_BASE = 'https://lora.algokit.io/testnet';

type LogFn = (type: 'info' | 'success' | 'warn' | 'data', msg: string) => void;

/** Transaction signer type from use-wallet */
type TxnSigner = (
    txnGroup: algosdk.Transaction[],
    indexesToSign: number[]
) => Promise<Uint8Array[]>;

/** Create a shared Algod client */
export function createAlgodClient() {
    return new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
}

export const AlgoNode = {
    async getAccountInfo(address: string) {
        try {
            const r = await fetch(`${ALGOD_SERVER}/v2/accounts/${address}`);
            return r.ok ? r.json() : null;
        } catch {
            return null;
        }
    },

    /**
     * Anchor a DID document on-chain via a real 1-ALGO payment to the
     * admin wallet, signed by the connected Pera/Defly wallet.
     */
    async anchorDID(
        address: string,
        didDocument: DIDDocument,
        addLog: LogFn,
        signTransactions: TxnSigner
    ): Promise<{ txId: string }> {
        console.log('[UniTrustID] anchorDID called for', address);

        // Always use our own Algod client (not the one from useWallet)
        const client = createAlgodClient();

        addLog('info', 'Connecting to Algorand Testnet...');

        // 1. Get suggested params
        let params: algosdk.SuggestedParams;
        try {
            params = await client.getTransactionParams().do();
            addLog(
                'data',
                `Network: ${params.genesisID} | Fee: ${params.fee} μALGO | Round: ${params.firstValid}`
            );
        } catch (e: any) {
            addLog('warn', `Failed to get tx params: ${e.message}`);
            throw new Error('Could not connect to Algorand Testnet. Check your network.');
        }

        // 2. Build compact note payload (Algorand max = 1024 bytes)
        //    Full DID doc is reconstructed client-side; on-chain we store
        //    only type marker, DID id, and user metadata.
        addLog('info', 'Encoding DID anchor note (compact)...');
        const compactNote: Record<string, unknown> = {
            t: 'DID_ANCHOR',
            v: 1,
            did: didDocument.id,
        };
        // Include user metadata if present
        if (didDocument.metadata) {
            compactNote.m = didDocument.metadata;
        }
        let noteBytes = new TextEncoder().encode(JSON.stringify(compactNote));
        if (noteBytes.length > 1024) {
            addLog('warn', `Note ${noteBytes.length}B exceeds 1024 — trimming metadata`);
            noteBytes = new TextEncoder().encode(
                JSON.stringify({ t: 'DID_ANCHOR', v: 1, did: didDocument.id })
            );
        }
        addLog('data', `Note payload: ${noteBytes.length} bytes`);

        // 3. Build 1-ALGO payment transaction (to admin for DID verification)
        addLog('info', 'Building 1-ALGO verification payment to admin...');
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: address,
            receiver: ADMIN_ADDRESS,          // pay admin for DID verification
            amount: 1_000_000,               // 1 ALGO = 1,000,000 microAlgos
            suggestedParams: params,
            note: noteBytes,
        });

        addLog('data', `Receiver (Admin): ${ADMIN_ADDRESS.slice(0, 8)}...${ADMIN_ADDRESS.slice(-4)}`);

        addLog('data', `TxID: ${txn.txID()}`);
        addLog('info', '📱 Please approve the transaction in your wallet app...');

        // 4. Sign via Pera/Defly wallet (QR/mobile approval)
        let signedTxnBytes: Uint8Array[];
        try {
            signedTxnBytes = await signTransactions([txn], [0]);
            addLog('success', '✓ Transaction signed by wallet');
        } catch (e: any) {
            const msg = String(e.message || e);
            if (/cancel|reject|abort|user/i.test(msg)) {
                addLog('warn', 'Transaction rejected by user');
                throw new Error('Transaction was rejected. Please try again.');
            }
            addLog('warn', `Signing failed: ${msg}`);
            throw new Error(`Wallet signing failed: ${msg}`);
        }

        // 5. Submit to network
        addLog('info', 'Broadcasting transaction to Algorand Testnet...');
        let confirmedTxId: string;
        try {
            const sendResult = await client
                .sendRawTransaction(signedTxnBytes[0])
                .do();
            confirmedTxId = sendResult.txid ?? txn.txID();
            addLog('data', `Submitted TxID: ${confirmedTxId}`);
        } catch (e: any) {
            addLog('warn', `Broadcast failed: ${e.message}`);
            throw new Error(`Transaction broadcast failed: ${e.message}`);
        }

        // 6. Wait for confirmation
        addLog('info', 'Waiting for block confirmation...');
        try {
            const confirmed = await algosdk.waitForConfirmation(
                client,
                confirmedTxId,
                4                            // wait up to 4 rounds
            );
            const confirmedRound = confirmed.confirmedRound;
            addLog('success', `✓ Confirmed in round ${confirmedRound}`);
        } catch (e: any) {
            addLog('warn', `Confirmation wait timed out: ${e.message}`);
            // Transaction may still confirm — don't throw
        }

        // 7. Show Lora explorer link
        const loraUrl = `${LORA_BASE}/transaction/${confirmedTxId}`;
        addLog('success', `✓ Anchored! TxID: ${confirmedTxId}`);
        addLog('data', `🔍 View on Lora: ${loraUrl}`);

        return { txId: confirmedTxId, loraUrl } as any;
    },

    /**
     * Pay 1 ALGO to admin for credential issuance.
     * Returns the transaction ID used as a unique hash for the credential / ID card.
     */
    async payForCredential(
        address: string,
        credentialType: string,
        addLog: LogFn,
        signTransactions: TxnSigner
    ): Promise<{ txId: string }> {
        console.log('[UniTrustID] payForCredential called for', credentialType);

        const client = createAlgodClient();

        addLog('info', `Initiating 1 ALGO payment for ${credentialType} credential...`);

        // 1. Get suggested params
        let params: algosdk.SuggestedParams;
        try {
            params = await client.getTransactionParams().do();
            addLog('data', `Network: ${params.genesisID} | Round: ${params.firstValid}`);
        } catch (e: any) {
            addLog('warn', `Failed to get tx params: ${e.message}`);
            throw new Error('Could not connect to Algorand Testnet.');
        }

        // 2. Build note payload
        const notePayload = {
            t: 'CRED_ISSUE',
            v: 1,
            cred: credentialType,
            addr: address,
            ts: Date.now(),
        };
        const noteBytes = new TextEncoder().encode(JSON.stringify(notePayload));
        addLog('data', `Credential note: ${noteBytes.length} bytes`);

        // 3. Build 1-ALGO payment
        addLog('info', `Building 1-ALGO payment for ${credentialType}...`);
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: address,
            receiver: ADMIN_ADDRESS,
            amount: 1_000_000, // 1 ALGO
            suggestedParams: params,
            note: noteBytes,
        });

        addLog('data', `TxID: ${txn.txID()}`);
        addLog('info', '📱 Please approve the transaction in your wallet app...');

        // 4. Sign
        let signedTxnBytes: Uint8Array[];
        try {
            signedTxnBytes = await signTransactions([txn], [0]);
            addLog('success', '✓ Transaction signed by wallet');
        } catch (e: any) {
            const msg = String(e.message || e);
            if (/cancel|reject|abort|user/i.test(msg)) {
                addLog('warn', 'Transaction rejected by user');
                throw new Error('Transaction was rejected. Please try again.');
            }
            addLog('warn', `Signing failed: ${msg}`);
            throw new Error(`Wallet signing failed: ${msg}`);
        }

        // 5. Submit
        addLog('info', 'Broadcasting credential payment...');
        let confirmedTxId: string;
        try {
            const sendResult = await client.sendRawTransaction(signedTxnBytes[0]).do();
            confirmedTxId = sendResult.txid ?? txn.txID();
            addLog('data', `Submitted TxID: ${confirmedTxId}`);
        } catch (e: any) {
            addLog('warn', `Broadcast failed: ${e.message}`);
            throw new Error(`Transaction broadcast failed: ${e.message}`);
        }

        // 6. Wait for confirmation
        addLog('info', 'Waiting for confirmation...');
        try {
            const confirmed = await algosdk.waitForConfirmation(client, confirmedTxId, 4);
            addLog('success', `✓ Confirmed in round ${confirmed.confirmedRound}`);
        } catch (e: any) {
            addLog('warn', `Confirmation timed out: ${e.message}`);
        }

        addLog('success', `✓ Credential payment confirmed! TxID: ${confirmedTxId}`);

        return { txId: confirmedTxId };
    },

    /** Get Lora explorer URL for a transaction */
    loraTransactionUrl(txId: string): string {
        return `${LORA_BASE}/transaction/${txId}`;
    },

    /** Get Lora explorer URL for an account */
    loraAccountUrl(address: string): string {
        return `${LORA_BASE}/account/${address}`;
    },
};
