"""Independent AGENT//RECEIPT v0.1 verifier.

This module deliberately shares only the evidence-format contract with the
JavaScript implementation. It does not import project JavaScript code.
"""
import base64
import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path

import rfc8785
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_der_public_key

VERIFIED = "VERIFIED"
FAILED = "FAILED"
INDETERMINATE = "INDETERMINATE"
MAX_PACKAGE_BYTES = 1_000_000
MAX_PAYLOAD_BYTES = 256_000


def canonical_bytes(value):
    result = rfc8785.dumps(value)
    if not isinstance(result, bytes):
        result = result.encode("utf-8")
    if len(result) > MAX_PAYLOAD_BYTES:
        raise ValueError("payload exceeds 256000 bytes")
    return result


def decode_b64url(value):
    if not isinstance(value, str) or not value or any(c not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" for c in value):
        raise ValueError("invalid base64url")
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def verify_record(record, trusted_keys):
    try:
        if not isinstance(record, dict) or not isinstance(record.get("payload"), dict) or not isinstance(record["payload"].get("id"), str):
            return FAILED, "malformed-record"
        signer = record.get("signer")
        if signer not in trusted_keys:
            return FAILED, "untrusted-signer"
        if record.get("alg") != "Ed25519":
            return FAILED, "algorithm-rejected"
        payload_bytes = canonical_bytes(record["payload"])
        public_key = load_der_public_key(decode_b64url(trusted_keys[signer]))
        if not isinstance(public_key, Ed25519PublicKey):
            return FAILED, "invalid-public-key"
        public_key.verify(decode_b64url(record.get("signature")), payload_bytes)
        expected_digest = hashlib.sha256(payload_bytes).hexdigest()
        if record.get("digest") != expected_digest:
            return FAILED, "digest-mismatch"
        return VERIFIED, "signature-valid"
    except (InvalidSignature, ValueError, TypeError, KeyError):
        return FAILED, "malformed-record"


def parse_time(value):
    if not isinstance(value, str):
        return None
    try:
        if not value.endswith("Z") or len(value) not in (20, 24):
            return None
        return datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError:
        return None


def authorization_findings(grant, action, delegation=None):
    findings = []
    def add(status, code): findings.append((status, code))
    if grant.get("revocation", {}).get("status") == "revoked": add(FAILED, "authority-revoked")
    elif grant.get("revocation", {}).get("status") == "unknown": add(INDETERMINATE, "revocation-unknown")
    elif grant.get("revocation", {}).get("status") == "active": add(VERIFIED, "authority-active")
    else: add(INDETERMINATE, "revocation-unknown")
    if grant.get("action") != action.get("type"): add(FAILED, "action-type-mismatch")
    if grant.get("resource") != action.get("resource"): add(FAILED, "resource-mismatch")
    constraints = grant.get("constraints")
    if not isinstance(constraints, dict) or not isinstance(constraints.get("maxAmountCents"), int) or constraints.get("maxAmountCents") < 0 or not isinstance(constraints.get("currency"), str) or not isinstance(constraints.get("endpoints"), list):
        add(FAILED, "malformed-constraints")
    else:
        if constraints["currency"] != action.get("currency"): add(FAILED, "currency-mismatch")
        if not isinstance(action.get("amountCents"), int) or action["amountCents"] < 0: add(FAILED, "invalid-amount")
        elif action["amountCents"] > constraints["maxAmountCents"]: add(FAILED, "amount-limit-exceeded")
        if action.get("endpoint") not in constraints["endpoints"]: add(FAILED, "endpoint-not-allowed")
    action_at, valid_from, valid_until = parse_time(action.get("at")), parse_time(grant.get("validFrom")), parse_time(grant.get("validUntil"))
    if not action_at or not valid_from or not valid_until or valid_from > valid_until or not valid_from <= action_at <= valid_until: add(FAILED, "outside-validity-window")
    else: add(VERIFIED, "within-validity-window")
    if not isinstance(grant.get("approval", {}).get("actionDigest"), str): add(INDETERMINATE, "approval-missing")
    else:
        digest = hashlib.sha256(canonical_bytes(action)).hexdigest()
        if digest != grant["approval"]["actionDigest"]: add(FAILED, "approval-binding-failed")
    if delegation is not None:
        d = delegation
        if not grant.get("delegation", {}).get("allowed"): add(FAILED, "delegation-not-allowed")
        elif not isinstance(d.get("depth"), int) or d["depth"] < 1 or d["depth"] > grant.get("delegation", {}).get("maxDepth", 0): add(FAILED, "delegation-too-deep")
        elif not isinstance(d.get("amountCents"), int) or d["amountCents"] < 0 or d["amountCents"] > grant["constraints"]["maxAmountCents"]: add(FAILED, "delegation-widens-scope")
    return findings


def verify_package(package, trusted_keys):
    try:
        if not isinstance(package, dict): return {"overall": FAILED, "code": "malformed-package"}
        if len(json.dumps(package, separators=(",", ":")).encode()) > MAX_PACKAGE_BYTES: return {"overall": FAILED, "code": "package-too-large"}
        manifest, records, authorization = package.get("manifest"), package.get("records"), package.get("authorization")
        if not isinstance(manifest, dict) or not isinstance(manifest.get("packageId"), str) or not isinstance(records, list) or not isinstance(authorization, dict): return {"overall": FAILED, "code": "malformed-package"}
        if manifest.get("recordCount") != len(records) or not isinstance(trusted_keys, dict) or not trusted_keys: return {"overall": FAILED, "code": "missing-trust"}
        auth_status, _ = verify_record(authorization, trusted_keys)
        delegation = package.get("delegation")
        delegation_status = verify_record(delegation, trusted_keys)[0] if delegation else None
        record_statuses = [verify_record(record, trusted_keys)[0] for record in records]
        ids = [authorization.get("payload", {}).get("id")] + ([delegation.get("payload", {}).get("id")] if delegation else []) + [record.get("payload", {}).get("id") for record in records]
        duplicates = {item for item in ids if item and ids.count(item) > 1}
        execution = next((record for record in records if record.get("payload", {}).get("kind") == "execution" and record.get("payload", {}).get("action", {}).get("type") == authorization.get("payload", {}).get("action")), next((record for record in records if record.get("payload", {}).get("kind") == "execution"), None))
        grant, action = authorization.get("payload", {}), execution.get("payload", {}).get("action") if execution else None
        findings = authorization_findings(grant, action, delegation.get("payload") if delegation else None) if action else [(FAILED, "execution-missing")]
        if auth_status != VERIFIED: findings.append((auth_status, "authorization-signature-invalid"))
        if authorization.get("signer") != grant.get("principal"): findings.append((FAILED, "authorization-signer-mismatch"))
        if execution and execution.get("signer") != grant.get("agent"): findings.append((FAILED, "execution-signer-mismatch"))
        if delegation and delegation_status != VERIFIED: findings.append((delegation_status, "delegation-signature-invalid"))
        acknowledgement = next((record for record in records if record.get("payload", {}).get("kind") == "provider_ack"), None)
        if not acknowledgement: outcome = INDETERMINATE
        else:
            ack_payload = acknowledgement.get("payload", {})
            ack_ok = acknowledgement.get("signer") == ack_payload.get("provider") and acknowledgement.get("signer") != (execution or {}).get("signer") and acknowledgement.get("payload", {}).get("eventId") == (execution or {}).get("payload", {}).get("id") and ack_payload.get("correlationId") == (execution or {}).get("payload", {}).get("correlationId") and ack_payload.get("actionDigest") == hashlib.sha256(canonical_bytes(action)).hexdigest() and ack_payload.get("amountCents") == action.get("amountCents") and ack_payload.get("currency") == action.get("currency")
            outcome = VERIFIED if verify_record(acknowledgement, trusted_keys)[0] == VERIFIED and ack_ok and ack_payload.get("status") == "confirmed" else FAILED
        integrity = VERIFIED if auth_status == VERIFIED and all(status == VERIFIED for status in record_statuses) and (delegation_status in (None, VERIFIED)) and not duplicates else FAILED
        auth_status_final = FAILED if any(status == FAILED for status, _ in findings) else INDETERMINATE if any(status == INDETERMINATE for status, _ in findings) else VERIFIED
        overall = FAILED if FAILED in (integrity, auth_status_final, outcome) else INDETERMINATE if INDETERMINATE in (integrity, auth_status_final, outcome) else VERIFIED
        return {"packageId": manifest["packageId"], "overall": overall, "integrity": integrity, "authorization": auth_status_final, "outcome": outcome, "findings": [{"status": status, "code": code} for status, code in findings]}
    except Exception:
        return {"overall": FAILED, "code": "malformed-package"}


def main(argv):
    if len(argv) not in (2, 3):
        print("usage: python python/verify.py PACKAGE.json [TRUSTED_KEYS.json]", file=sys.stderr)
        return 2
    package_path = Path(argv[1])
    document = json.loads(package_path.read_text(encoding="utf-8"))
    trusted = document.get("trustedKeys") if "trustedKeys" in document and "package" in document else None
    package = document.get("package", document)
    if len(argv) == 3: trusted = json.loads(Path(argv[2]).read_text(encoding="utf-8"))
    result = verify_package(package, trusted or {})
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["overall"] == VERIFIED else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
