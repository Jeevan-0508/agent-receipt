import type { EvidencePackage, Signer, VerificationStatus } from '@agent-receipt/core';

export interface Policy extends Record<string, unknown> {
  id: string;
  principal: string;
  agent: string;
  action: string;
  resource: string;
  constraints: Record<string, unknown>;
}

export interface ToolAction extends Record<string, unknown> {
  type: string;
  resource: string;
  endpoint?: string;
  at: string;
}

export interface ProviderResult extends Record<string, unknown> {}

export interface ToolCallResult {
  allowed: boolean;
  executed: boolean;
  preflight: Record<string, unknown> & { status: VerificationStatus };
  result: ProviderResult | null;
  package: EvidencePackage | null;
  verification?: Record<string, unknown> & { overall: VerificationStatus };
}

export interface ReceiptAgent {
  callTool(input: { name: string; action: ToolAction; invoke: (action: ToolAction) => ProviderResult | Promise<ProviderResult> }): Promise<ToolCallResult>;
  exportPackage(): EvidencePackage | null;
  verifyExportedPackage(): (Record<string, unknown> & { overall: VerificationStatus }) | null;
  getProviderCallCount(): number;
  trustedKeys: Record<string, string>;
}

export declare function definePolicy(policy: Policy): Policy;
export declare function createReceiptAgent(input: { policy: Policy; signers: { principalSigner: Signer; agentSigner: Signer; providerSigner: Signer }; sessionId?: string; correlationId?: string }): ReceiptAgent;
export declare function actionDigest(action: Record<string, unknown>): string;
export declare function generateSigner(id: string): Signer;
export declare function verifyPackage(pkg: EvidencePackage, options: { trustedKeys: Record<string, string> }): Record<string, unknown> & { overall: VerificationStatus };
