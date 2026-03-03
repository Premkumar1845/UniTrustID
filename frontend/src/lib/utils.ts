/* ══════════════════════════════════════════════════
   General utility helpers
   ══════════════════════════════════════════════════ */

export function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

export const shortAddr = (a?: string) =>
    a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

export const shortTx = (t?: string) => (t ? `${t.slice(0, 14)}...` : '');

export const fmtDate = (d: number | string) =>
    new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export const fmtTime = (d: number | string) =>
    new Date(d).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });

export const CryptoUtils = {
    sha256(data: unknown): string {
        let h = 0xcbf29ce484222325n;
        const enc = new TextEncoder().encode(JSON.stringify(data));
        for (const b of enc) {
            h = BigInt.asUintN(64, (h ^ BigInt(b)) * 0x100000001b3n);
        }
        return h.toString(16).padStart(16, '0').repeat(2);
    },

    hmac(data: unknown, key: string): string {
        return this.sha256(JSON.stringify(data) + key).slice(0, 64);
    },
};
