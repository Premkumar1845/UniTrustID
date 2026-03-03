/* ══════════════════════════════════════════════════
   Blockchain console log viewer
   ══════════════════════════════════════════════════ */

import { useEffect, useRef } from 'react';
import type { LogLine } from '../lib/types';
import { fmtTime } from '../lib/utils';

interface ConsoleProps {
    lines: LogLine[];
}

const LOG_CLASS: Record<string, string> = {
    info: 'log-info',
    success: 'log-success',
    warn: 'log-warn',
    data: 'log-data',
};

export function Console({ lines }: ConsoleProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }, [lines]);

    return (
        <div className="console" ref={ref}>
            {!lines.length && (
                <span className="log-info" style={{ opacity: 0.4 }}>
                    Awaiting actions...
                </span>
            )}
            {lines.map((l, i) => (
                <span key={i} className={`console-line ${LOG_CLASS[l.type] || 'log-info'}`}>
                    <span style={{ opacity: 0.4 }}>[{fmtTime(l.ts)}]</span> {l.msg}
                    {'\n'}
                </span>
            ))}
        </div>
    );
}
