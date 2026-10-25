export type VerificationStatus = 'VERIFIED' | 'FAILED' | 'INDETERMINATE' | 'NOT_CHECKED';

export interface Signer {
  id: string;
  publicKey: string;
  privateKey?: string;
}

export interface EvidencePackage {
  manifest: Record<string, unknown>;
  authorization: Record<string, unknown>;
  records: Array<Record<string, unknown>>;
  keyHints?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export declare function actionDigest(action: Record<string, unknown>): string;
export declare function generateSigner(id: string): Signer;
export declare function signRecord(payload: Record<string, unknown>, signer: Signer): Record<string, unknown>;
export declare function evaluateAuthorization(policy: Record<string, unknown>, action: Record<string, unknown>): { status: VerificationStatus; findings: Array<Record<string, unknown>>; [key: string]: unknown };
export declare function verifyPackage(pkg: EvidencePackage, options: { trustedKeys: Record<string, string> }): Record<string, unknown> & { overall: VerificationStatus };
