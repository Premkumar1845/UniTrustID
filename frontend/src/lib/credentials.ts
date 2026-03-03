/* ══════════════════════════════════════════════════
   Credential Module — issue & selective disclosure
   ══════════════════════════════════════════════════ */

import type {
    Credential,
    CredentialClaims,
    CredentialMeta,
    CredentialType,
    Disclosure,
} from './types';
import { CryptoUtils } from './utils';

const ISSUER_KEY = 'campus-did-issuer-key-2024';

export const CRED_DEFAULTS: Record<CredentialType, CredentialClaims> = {
    StudentID: {
        studentId: 'STU2024001',
        name: 'Student',
        department: 'Computer Science',
        year: '3rd Year',
        enrolledSince: '2022',
        cgpa: '8.7',
    },
    LibraryAccess: {
        cardNumber: 'LIB-88421',
        category: 'Undergraduate',
        booksLimit: '5',
        digitalAccess: 'Yes',
        expiryDate: '2025-06-30',
    },
    HostelResident: {
        hostelBlock: 'Block A',
        roomNumber: 'A-214',
        floor: '2nd',
        mealPlan: 'Full Board',
        allottedSince: '2022-08',
    },
    EventAttendee: {
        eventName: 'TechFest 2024',
        role: 'Participant',
        passes: '3',
        tshirtSize: 'M',
        registeredOn: '2024-10-01',
    },
    CourseEnrollment: {
        courseCode: 'CS401',
        courseName: 'Distributed Systems',
        credits: '4',
        semester: 'VII',
        instructor: 'Dr. Mehta',
    },
};

export const CRED_TYPES = Object.keys(CRED_DEFAULTS) as CredentialType[];

export const CRED_META: Record<CredentialType, CredentialMeta> = {
    StudentID: {
        icon: '🎓',
        color: 'var(--cyan)',
        label: 'Student Identity',
        bg: 'rgba(0,200,255,0.1)',
    },
    LibraryAccess: {
        icon: '📚',
        color: '#a78bfa',
        label: 'Library Access',
        bg: 'rgba(167,139,250,0.1)',
    },
    HostelResident: {
        icon: '🏠',
        color: 'var(--amber)',
        label: 'Hostel Resident',
        bg: 'rgba(245,166,35,0.1)',
    },
    EventAttendee: {
        icon: '🎟️',
        color: 'var(--green)',
        label: 'Event Attendee',
        bg: 'rgba(46,213,115,0.1)',
    },
    CourseEnrollment: {
        icon: '📖',
        color: '#f97316',
        label: 'Course Enrollment',
        bg: 'rgba(249,115,22,0.1)',
    },
};

export const CredModule = {
    issue(
        type: CredentialType,
        subjectDID: string,
        issuerName: string,
        customClaims?: CredentialClaims
    ): Credential {
        const claims = customClaims || { ...CRED_DEFAULTS[type] };
        const base = {
            id: `vc:campus:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            type: ['VerifiableCredential', `Campus${type}`],
            credentialType: type,
            issuer: { id: 'did:algo:CAMPUS_UNIVERSITY_ISSUER', name: issuerName },
            issuanceDate: new Date().toISOString(),
            expirationDate: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
            credentialSubject: { id: subjectDID, ...claims },
        };
        return {
            ...base,
            proof: {
                type: 'AlgorandSignature2024',
                created: new Date().toISOString(),
                signature: CryptoUtils.hmac(base, ISSUER_KEY),
            },
            _claims: claims,
            _issuedAt: Date.now(),
            _expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        };
    },

    selDisclosure(cred: Credential, fields: string[]): Disclosure {
        const d: CredentialClaims = {};
        fields.forEach((k) => {
            d[k] = cred._claims[k];
        });
        return {
            credentialType: cred.credentialType,
            issuer: cred.issuer?.name,
            disclosedAt: new Date().toISOString(),
            disclosedClaims: d,
            withheldCount: Object.keys(cred._claims).length - fields.length,
            selectedFields: fields,
        };
    },
};
