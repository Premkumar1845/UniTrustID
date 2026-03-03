/* ══════════════════════════════════════════════════
   Toast notification component
   ══════════════════════════════════════════════════ */

import { useEffect } from 'react';

interface ToastProps {
    msg: string;
    err?: boolean;
    onDone: () => void;
}

export function Toast({ msg, err, onDone }: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onDone, 4500);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <div className={`toast${err ? ' err' : ''}`}>
            <span>{err ? '❌' : '✅'}</span>
            <span style={{ fontSize: 13 }}>{msg}</span>
        </div>
    );
}
