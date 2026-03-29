/* ══════════════════════════════════════════════════
   Shared TypeScript types for UniTrustID
   ══════════════════════════════════════════════════ */

export interface WalletInfo {
    address: string;
    walletName: string;
    isReal?: boolean;
    isDemo?: boolean;
}

export interface DIDProfile {
    did: string;
    name: string;
    studentId: string;
    email: string;
    department: string;
    createdAt: number;
    txId: string;
}

export interface DIDDocument {
    '@context': string[];
    id: string;
    controller: string;
    verificationMethod: {
        id: string;
        type: string;
        controller: string;
        publicKeyBase58: string;
    }[];
    authentication: string[];
    assertionMethod: string[];
    service: {
        id: string;
        type: string;
        serviceEndpoint: string;
    }[];
    created: string;
    updated: string;
    metadata: {
        name: string;
        studentId: string;
        department: string;
    };
}

export interface CredentialClaims {
    [key: string]: string;
}

export interface Credential {
    id: string;
    type: string[];
    credentialType: CredentialType;
    issuer: { id: string; name: string };
    issuanceDate: string;
    expirationDate: string;
    credentialSubject: { id: string } & CredentialClaims;
    proof: {
        type: string;
        created: string;
        signature: string;
    };
    _claims: CredentialClaims;
    _issuedAt: number;
    _expiresAt: number;
    _txId?: string;      // Algorand transaction ID for credential payment
    _txHash?: string;    // Unique hash derived from txId for ID card
}

export interface Disclosure {
    credentialType: string;
    issuer: string;
    disclosedAt: string;
    disclosedClaims: CredentialClaims;
    withheldCount: number;
    selectedFields: string[];
}

export type CredentialType =
    | 'StudentID'
    | 'LibraryAccess'
    | 'HostelResident'
    | 'EventAttendee'
    | 'CourseEnrollment';

export interface CredentialMeta {
    icon: string;
    color: string;
    label: string;
    bg: string;
}

export interface LogLine {
    type: 'info' | 'success' | 'warn' | 'data';
    msg: string;
    ts: number;
}

export interface ServiceDef {
    id: string;
    name: string;
    desc: string;
    icon: string;
    cls: string;
    credType: CredentialType;
    required: string[];
}

export interface DIDFormData {
    name: string;
    studentId: string;
    email: string;
    department: string;
}
