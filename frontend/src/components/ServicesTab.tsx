/* ══════════════════════════════════════════════════
   Services Tab — campus service integration
   ══════════════════════════════════════════════════ */

import { useState } from 'react';
import type {
    Credential,
    CredentialType,
    Disclosure,
    ServiceDef,
} from '../lib/types';
import { CredModule } from '../lib/credentials';
import { SelDiscModal } from './SelDiscModal';

interface ServicesTabProps {
    credentials: Credential[];
}

const SERVICES: ServiceDef[] = [
    {
        id: 'library',
        name: 'Campus Library',
        desc: 'Books & digital resources',
        icon: '📚',
        cls: 'lib',
        credType: 'LibraryAccess',
        required: ['cardNumber', 'category', 'digitalAccess'],
    },
    {
        id: 'hostel',
        name: 'Hostel Management',
        desc: 'Gate entry & meal plan',
        icon: '🏠',
        cls: 'hostel',
        credType: 'HostelResident',
        required: ['hostelBlock', 'roomNumber', 'mealPlan'],
    },
    {
        id: 'events',
        name: 'Campus Events',
        desc: 'Fest & access control',
        icon: '🎟️',
        cls: 'event',
        credType: 'EventAttendee',
        required: ['eventName', 'role', 'passes'],
    },
    {
        id: 'courses',
        name: 'Course Portal',
        desc: 'Enrollment verification',
        icon: '📖',
        cls: 'course',
        credType: 'CourseEnrollment',
        required: ['courseCode', 'courseName', 'credits'],
    },
];

export function ServicesTab({ credentials }: ServicesTabProps) {
    const [granted, setGranted] = useState<Record<string, boolean>>({});
    const [presenting, setPresenting] = useState<ServiceDef | null>(null);
    const [disclosures, setDisclosures] = useState<Record<string, Disclosure>>(
        {}
    );

    const findCred = (type: CredentialType) =>
        credentials.find((c) => c.credentialType === type);

    return (
        <div>
            <div className="section-title">Campus Services</div>
            <div className="section-sub">
                Present only what each service needs — powered by selective disclosure.
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {SERVICES.map((svc) => {
                    const cred = findCred(svc.credType);
                    const done = granted[svc.id];
                    const disc = disclosures[svc.id];
                    return (
                        <div key={svc.id} className="service-card">
                            <div className="service-header">
                                <div className={`svc-icon ${svc.cls}`}>{svc.icon}</div>
                                <div>
                                    <div className="svc-name">{svc.name}</div>
                                    <div className="svc-desc">{svc.desc}</div>
                                </div>
                            </div>
                            <div className="card-label" style={{ marginBottom: 6 }}>
                                Required fields
                            </div>
                            <div className="svc-reqs">
                                {svc.required.map((r) => (
                                    <span key={r} className="req-tag">
                                        {r}
                                    </span>
                                ))}
                            </div>
                            {done ? (
                                <div>
                                    <div className="access-granted">
                                        <span>✅</span>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>Access Granted</div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    opacity: 0.7,
                                                    marginTop: 2,
                                                }}
                                            >
                                                {disc?.selectedFields?.length} field(s) shared ·{' '}
                                                {disc?.withheldCount} withheld
                                            </div>
                                        </div>
                                    </div>
                                    {disc && (
                                        <div style={{ marginTop: 8 }}>
                                            {Object.entries(disc.disclosedClaims).map(([k, v]) => (
                                                <div
                                                    key={k}
                                                    className="claim-row"
                                                    style={{ marginBottom: 3 }}
                                                >
                                                    <span className="claim-key">{k}</span>
                                                    <span className="claim-val">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    className={`access-btn${cred ? ' ready' : ' no-cred'}`}
                                    onClick={() => cred && setPresenting(svc)}
                                >
                                    {cred
                                        ? 'PRESENT CREDENTIAL'
                                        : 'NO CREDENTIAL — ISSUE FIRST'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Privacy note */}
            <div className="privacy-note">
                <span style={{ fontSize: 26, flexShrink: 0 }}>🛡️</span>
                <div>
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 15,
                            fontWeight: 700,
                            marginBottom: 4,
                        }}
                    >
                        Zero-Knowledge Selective Disclosure
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--muted)',
                            lineHeight: 1.7,
                        }}
                    >
                        Each service receives only the minimum required data, verified by
                        cryptographic proof anchored on Algorand. Your full identity and
                        other credentials are never exposed.
                    </div>
                </div>
            </div>

            {/* Selective Disclosure Modal */}
            {presenting && (
                <SelDiscModal
                    cred={findCred(presenting.credType)!}
                    onConfirm={(fields) => {
                        const disc = CredModule.selDisclosure(
                            findCred(presenting.credType)!,
                            fields
                        );
                        setGranted((g) => ({ ...g, [presenting.id]: true }));
                        setDisclosures((d) => ({ ...d, [presenting.id]: disc }));
                        setPresenting(null);
                    }}
                    onClose={() => setPresenting(null)}
                />
            )}
        </div>
    );
}
