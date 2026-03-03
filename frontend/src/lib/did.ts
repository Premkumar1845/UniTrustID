/* ══════════════════════════════════════════════════
   DID Module — generate DID identifiers & documents
   ══════════════════════════════════════════════════ */

import type { DIDDocument, DIDFormData } from './types';

export const DIDModule = {
    generate(addr: string): string {
        return `did:algo:${addr}`;
    },

    createDocument(
        addr: string,
        did: string,
        meta: DIDFormData
    ): DIDDocument {
        const now = new Date().toISOString();
        return {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://w3id.org/security/v1',
            ],
            id: did,
            controller: did,
            verificationMethod: [
                {
                    id: `${did}#keys-1`,
                    type: 'AlgorandKey2021',
                    controller: did,
                    publicKeyBase58: addr,
                },
            ],
            authentication: [`${did}#keys-1`],
            assertionMethod: [`${did}#keys-1`],
            service: [
                {
                    id: `${did}#campus`,
                    type: 'CampusIdentityService',
                    serviceEndpoint: 'https://campus.edu/did',
                },
            ],
            created: now,
            updated: now,
            metadata: {
                name: meta.name,
                studentId: meta.studentId,
                department: meta.department,
            },
        };
    },
};
