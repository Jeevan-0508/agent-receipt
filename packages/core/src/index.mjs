import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import jcs from 'canonicalize';

export const STATUS = Object.freeze({ VERIFIED: 'VERIFIED', FAILED: 'FAILED', INDETERMINATE: 'INDETERMINATE', NOT_CHECKED: 'NOT_CHECKED' });
export const MAX_PACKAGE_BYTES = 1_000_000;
export const MAX_PAYLOAD_BYTES = 256_000;

// RFC 8785 JSON Canonicalization Scheme, provided by the maintained
// `canonicalize` implementation. The application profile additionally bounds
// payload and package sizes before cryptographic operations.
export function canonicalize(value) {
  const result = jcs(value);
  if (typeof result !== 'string') throw new Error('unsupported or non-finite JSON value');
  return result;
}

export function canonicalBytes(value) {
  const bytes = Buffer.from(canonicalize(value));
  if (bytes.length > MAX_PAYLOAD_BYTES) throw new Error(`payload exceeds ${MAX_PAYLOAD_BYTES} bytes`);
  return bytes;
}

export function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'string' ? value : canonicalize(value));
  return createHash('sha256').update(bytes).digest('hex');
}

export function generateSigner(id) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { id, publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64url'), privateKey };
}

function publicKeyFromBase64(publicKey) {
  if (typeof publicKey !== 'string' || !/^[A-Za-z0-9_-]+$/.test(publicKey)) throw new Error('invalid public key encoding');
  return { key: Buffer.from(publicKey, 'base64url'), format: 'der', type: 'spki' };
}

export function signRecord(payload, signer) {
  if (!signer?.id || !signer?.privateKey) throw new Error('signer identity and private key are required');
  const signingInput = canonicalBytes(payload);
  return { payload, signer: signer.id, alg: 'Ed25519', signature: sign(null, signingInput, signer.privateKey).toString('base64url'), digest: sha256(signingInput) };
}

export function verifyRecord(record, trustedKeys) {
  try {
    if (!record || typeof record !== 'object' || !record.payload || typeof record.payload !== 'object') return { status: STATUS.FAILED, code: 'malformed-record', message: 'Record payload is missing.' };
    if (!record.payload.id || typeof record.payload.id !== 'string') return { status: STATUS.FAILED, code: 'malformed-record', message: 'Record id is missing.' };
    const publicKey = trustedKeys?.[record.signer];
    if (!publicKey) return { status: STATUS.FAILED, code: 'untrusted-signer', message: `Signer ${record.signer ?? '(missing)'} is not trusted.` };
    if (record.alg !== 'Ed25519') return { status: STATUS.FAILED, code: 'algorithm-rejected', message: 'Only Ed25519 is accepted by this profile.' };
    if (typeof record.signature !== 'string' || typeof record.digest !== 'string') return { status: STATUS.FAILED, code: 'malformed-record', message: 'Signature or digest is missing.' };
    const input = canonicalBytes(record.payload);
    const valid = verify(null, input, publicKeyFromBase64(publicKey), Buffer.from(record.signature, 'base64url'));
    if (!valid) return { status: STATUS.FAILED, code: 'signature-invalid', message: 'Signature does not match the received payload.' };
    if (!/^[a-f0-9]{64}$/.test(record.digest) || sha256(input) !== record.digest) return { status: STATUS.FAILED, code: 'digest-mismatch', message: 'Record digest does not match the signed payload.' };
    return { status: STATUS.VERIFIED, code: 'signature-valid', message: 'Signature and digest verified.' };
  } catch (error) {
    return { status: STATUS.FAILED, code: 'malformed-record', message: error instanceof Error ? error.message : 'Malformed record.' };
  }
}

function parseTime(iso) { if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(iso)) return NaN; return Date.parse(iso); }
function withinWindow(iso, from, until) { const time = parseTime(iso); const start = parseTime(from); const end = parseTime(until); return Number.isFinite(time) && Number.isFinite(start) && Number.isFinite(end) && start <= end && time >= start && time <= end; }
function isNonNegativeInteger(value) { return Number.isSafeInteger(value) && value >= 0; }

export function actionDigest(action) { return sha256(action); }

export function evaluateAuthorization(grant, action, options = {}) {
  const findings = []; const add = (status, code, message) => findings.push({ status, code, message });
  if (!grant || typeof grant !== 'object' || !action || typeof action !== 'object') return { status: STATUS.FAILED, findings: [{ status: STATUS.FAILED, code: 'malformed-authorization', message: 'Grant or action is not an object.' }] };
  if (grant.revocation?.status === 'revoked') add(STATUS.FAILED, 'authority-revoked', 'The grant was revoked before this action.');
  else if (grant.revocation?.status === 'unknown') add(STATUS.INDETERMINATE, 'revocation-unknown', 'Revocation evidence is unavailable or stale.');
  else if (grant.revocation?.status === 'active') add(STATUS.VERIFIED, 'authority-active', 'No revocation was reported at the verification checkpoint.');
  else add(STATUS.INDETERMINATE, 'revocation-unknown', 'The grant has no valid revocation status.');
  if (typeof grant.action !== 'string' || grant.action !== action.type) add(STATUS.FAILED, 'action-type-mismatch', `Grant permits ${grant.action ?? '(missing)'}, received ${action.type ?? '(missing)'}.`);
  if (typeof grant.resource !== 'string' || grant.resource !== action.resource) add(STATUS.FAILED, 'resource-mismatch', 'Action resource is outside the granted resource.'); else add(STATUS.VERIFIED, 'resource-match', 'Action targets the granted resource.');
  const constraints = grant.constraints;
  if (!constraints || typeof constraints !== 'object' || !isNonNegativeInteger(constraints.maxAmountCents) || typeof constraints.currency !== 'string' || !Array.isArray(constraints.endpoints)) add(STATUS.FAILED, 'malformed-constraints', 'Grant constraints are malformed.');
  else {
    if (constraints.currency !== action.currency) add(STATUS.FAILED, 'currency-mismatch', 'Currency does not match the grant.');
    if (!isNonNegativeInteger(action.amountCents)) add(STATUS.FAILED, 'invalid-amount', 'Action amount must be a non-negative safe integer in cents.');
    else if (action.amountCents > constraints.maxAmountCents) add(STATUS.FAILED, 'amount-limit-exceeded', `Amount ${action.amountCents}¢ exceeds ${constraints.maxAmountCents}¢.`); else add(STATUS.VERIFIED, 'amount-within-limit', 'Amount is within the grant limit.');
    if (!constraints.endpoints.includes(action.endpoint)) add(STATUS.FAILED, 'endpoint-not-allowed', 'Endpoint is not in the allow-list.'); else add(STATUS.VERIFIED, 'endpoint-allowed', 'Endpoint is explicitly allowed.');
  }
  if (!withinWindow(action.at, grant.validFrom, grant.validUntil)) add(STATUS.FAILED, 'outside-validity-window', 'Action falls outside the grant validity window.'); else add(STATUS.VERIFIED, 'within-validity-window', 'Action falls inside the grant validity window.');
  const expectedApproval = grant.approval?.actionDigest;
  if (typeof expectedApproval !== 'string') add(STATUS.INDETERMINATE, 'approval-missing', 'No exact-parameter approval digest is available.'); else if (expectedApproval !== actionDigest(action)) add(STATUS.FAILED, 'approval-binding-failed', 'Approval is bound to different action parameters.'); else add(STATUS.VERIFIED, 'approval-bound', 'Approval digest matches the exact action parameters.');
  if (options.delegation) {
    const d = options.delegation;
    if (!grant.delegation?.allowed) add(STATUS.FAILED, 'delegation-not-allowed', 'This grant cannot be delegated.');
    else if (!Number.isSafeInteger(d.depth) || d.depth < 1 || d.depth > grant.delegation.maxDepth) add(STATUS.FAILED, 'delegation-too-deep', 'Delegation depth exceeds the grant limit.');
    else if (!isNonNegativeInteger(d.amountCents) || d.amountCents > grant.constraints.maxAmountCents) add(STATUS.FAILED, 'delegation-widens-scope', 'Delegation attempts to widen the financial limit.'); else add(STATUS.VERIFIED, 'delegation-within-scope', 'Delegation remains within the grant scope.');
  }
  const failed = findings.some((f) => f.status === STATUS.FAILED); const indeterminate = findings.some((f) => f.status === STATUS.INDETERMINATE);
  return { status: failed ? STATUS.FAILED : indeterminate ? STATUS.INDETERMINATE : STATUS.VERIFIED, findings };
}

function failedPackage(message, packageId = 'malformed-package') { return { packageId, integrity: STATUS.FAILED, signatures: STATUS.FAILED, authorization: { status: STATUS.FAILED, findings: [{ status: STATUS.FAILED, code: 'malformed-package', message }] }, outcome: { status: STATUS.NOT_CHECKED, message: 'Outcome was not checked because the package is malformed.' }, completeness: STATUS.FAILED, recordResults: [], overall: STATUS.FAILED }; }

export function verifyPackage(pkg, options = {}) {
  try {
    if (!pkg || typeof pkg !== 'object') return failedPackage('Package must be a JSON object.');
    if (Buffer.byteLength(JSON.stringify(pkg)) > MAX_PACKAGE_BYTES) return failedPackage(`Package exceeds ${MAX_PACKAGE_BYTES} bytes.`, pkg.manifest?.packageId);
    if (!pkg.manifest || typeof pkg.manifest.packageId !== 'string' || !Array.isArray(pkg.records) || !pkg.authorization) return failedPackage('Manifest, authorization, or records are missing.', pkg.manifest?.packageId);
    if (pkg.manifest.recordCount !== pkg.records.length) return failedPackage('Manifest record count does not match the package.', pkg.manifest.packageId);
    const trustedKeys = options.trustedKeys;
    if (!trustedKeys || typeof trustedKeys !== 'object' || Object.keys(trustedKeys).length === 0) return failedPackage('No out-of-band trusted keys were supplied.', pkg.manifest.packageId);
    const authorizationResult = verifyRecord(pkg.authorization, trustedKeys);
    const delegationResult = pkg.delegation ? verifyRecord(pkg.delegation, trustedKeys) : null;
    const recordResults = pkg.records.map((record) => ({ id: record?.payload?.id, ...verifyRecord(record, trustedKeys) }));
    const allSigned = [{ id: pkg.authorization?.payload?.id, ...authorizationResult }, ...(delegationResult ? [{ id: pkg.delegation?.payload?.id, ...delegationResult }] : []), ...recordResults];
    const ids = allSigned.map((r) => r.id).filter(Boolean); const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length) recordResults.push({ id: duplicateIds[0], status: STATUS.FAILED, code: 'duplicate-event-id', message: `Duplicate evidence identifier: ${duplicateIds[0]}.` });
    const grant = pkg.authorization.payload;
    const executionRecord = pkg.records.find((r) => r?.payload?.kind === 'execution' && r.payload.action?.type === grant.action) ?? pkg.records.find((r) => r?.payload?.kind === 'execution');
    const action = executionRecord?.payload?.action;
    const auth = action ? evaluateAuthorization(grant, action, { delegation: pkg.delegation?.payload }) : { status: STATUS.FAILED, findings: [{ status: STATUS.FAILED, code: 'execution-missing', message: 'No execution event is present.' }] };
    if (authorizationResult.status !== STATUS.VERIFIED) auth.findings.push({ status: authorizationResult.status, code: 'authorization-signature-invalid', message: 'The authorization record is not cryptographically verified.' }); else if (pkg.authorization.signer !== grant.principal) auth.findings.push({ status: STATUS.FAILED, code: 'authorization-signer-mismatch', message: 'Authorization was not signed by the named principal.' });
    if (executionRecord && executionRecord.signer !== grant.agent) auth.findings.push({ status: STATUS.FAILED, code: 'execution-signer-mismatch', message: 'Execution was not signed by the authorized agent.' });
    if (delegationResult && delegationResult.status !== STATUS.VERIFIED) auth.findings.push({ status: delegationResult.status, code: 'delegation-signature-invalid', message: 'Delegation evidence is not cryptographically verified.' });
    const acknowledgement = pkg.records.find((r) => r?.payload?.kind === 'provider_ack');
    let outcome;
    if (!acknowledgement) outcome = { status: STATUS.INDETERMINATE, message: 'Agent report exists without independent provider confirmation.' };
    else {
      const ackResult = recordResults.find((r) => r.id === acknowledgement?.payload?.id); const providerIsIndependent = acknowledgement.signer !== executionRecord?.signer && acknowledgement.signer === acknowledgement.payload.provider; const bound = acknowledgement.payload.eventId === executionRecord?.payload?.id && acknowledgement.payload.correlationId === executionRecord?.payload?.correlationId && acknowledgement.payload.actionDigest === actionDigest(action) && acknowledgement.payload.amountCents === action.amountCents && acknowledgement.payload.currency === action.currency;
      if (ackResult?.status !== STATUS.VERIFIED) outcome = { status: STATUS.FAILED, message: 'Provider acknowledgement signature is invalid.' }; else if (!providerIsIndependent) outcome = { status: STATUS.FAILED, message: 'Provider acknowledgement is not independently signed.' }; else if (!bound) outcome = { status: STATUS.FAILED, message: 'Provider acknowledgement does not bind to the executed action.' }; else if (acknowledgement.payload.status !== 'confirmed') outcome = { status: STATUS.FAILED, message: 'Provider reported a non-confirmed outcome.' }; else outcome = { status: STATUS.VERIFIED, message: 'Provider acknowledgement is independently signed and action-bound.' };
    }
    const integrity = allSigned.every((r) => r.status === STATUS.VERIFIED) && duplicateIds.length === 0 ? STATUS.VERIFIED : STATUS.FAILED; const completeness = acknowledgement ? STATUS.VERIFIED : STATUS.INDETERMINATE; const authStatus = auth.findings.some((f) => f.status === STATUS.FAILED) ? STATUS.FAILED : auth.findings.some((f) => f.status === STATUS.INDETERMINATE) ? STATUS.INDETERMINATE : STATUS.VERIFIED; const overall = [integrity, authStatus, outcome.status].includes(STATUS.FAILED) ? STATUS.FAILED : [integrity, authStatus, outcome.status].includes(STATUS.INDETERMINATE) ? STATUS.INDETERMINATE : STATUS.VERIFIED;
    return { packageId: pkg.manifest.packageId, integrity, signatures: integrity, authorization: { ...auth, status: authStatus }, outcome, completeness, recordResults, overall };
  } catch (error) { return failedPackage(error instanceof Error ? error.message : 'Package could not be verified.'); }
}

export function publicSigner(signer) { return signer.publicKey; }
