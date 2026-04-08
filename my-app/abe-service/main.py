from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(title="ABE Service", version="0.1.0")

MASTER_SECRET = os.getenv("ABE_MASTER_SECRET", "dev-only-change-me")


class EncryptKeyRequest(BaseModel):
    key: str = Field(..., description="Symmetric key as base64")
    policy: str = Field(..., description='Policy string, e.g. role:user AND course:"CS601"')


class EncryptKeyResponse(BaseModel):
    encrypted_key: str


class DecryptKeyRequest(BaseModel):
    encrypted_key: str
    user_private_key: str


class DecryptKeyResponse(BaseModel):
    key: str | None = None
    error: str | None = None


class GenerateUserKeyRequest(BaseModel):
    attributes: List[str]


class GenerateUserKeyResponse(BaseModel):
    user_private_key: str


def _b64e(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8")


def _b64d(data: str) -> bytes:
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def _sign(payload: dict) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    sig = hmac.new(MASTER_SECRET.encode("utf-8"), raw, hashlib.sha256).digest()
    return f"{_b64e(raw)}.{_b64e(sig)}"


def _verify(token: str) -> dict:
    try:
        raw_b64, sig_b64 = token.split(".")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid token format.") from exc

    raw = _b64d(raw_b64)
    actual_sig = _b64d(sig_b64)
    expected_sig = hmac.new(MASTER_SECRET.encode("utf-8"), raw, hashlib.sha256).digest()
    if not hmac.compare_digest(actual_sig, expected_sig):
        raise HTTPException(status_code=400, detail="Invalid token signature.")

    return json.loads(raw.decode("utf-8"))


def _normalize_attr(value: str) -> str:
    return value.strip().strip('"').lower()


def _parse_policy(policy: str) -> List[str]:
    parts = [p.strip() for p in policy.split("AND")]
    tokens: List[str] = []
    for part in parts:
        if not part:
            continue
        if ":" not in part:
            tokens.append(_normalize_attr(part))
            continue
        left, right = part.split(":", 1)
        tokens.append(f"{_normalize_attr(left)}:{_normalize_attr(right)}")
    return tokens


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/abe/generate-user-key", response_model=GenerateUserKeyResponse)
def generate_user_key(payload: GenerateUserKeyRequest) -> GenerateUserKeyResponse:
    normalized = []
    for attr in payload.attributes:
        if ":" in attr:
            left, right = attr.split(":", 1)
            normalized.append(f"{_normalize_attr(left)}:{_normalize_attr(right)}")
        else:
            normalized.append(_normalize_attr(attr))

    token = _sign({"attributes": sorted(set(normalized))})
    return GenerateUserKeyResponse(user_private_key=token)


@app.post("/abe/encrypt-key", response_model=EncryptKeyResponse)
def encrypt_key(payload: EncryptKeyRequest) -> EncryptKeyResponse:
    # Validate base64 key input
    try:
        _b64d(payload.key)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid key encoding; expected base64.") from exc

    token = _sign({"key": payload.key, "policy": payload.policy})
    return EncryptKeyResponse(encrypted_key=token)


@app.post("/abe/decrypt-key", response_model=DecryptKeyResponse)
def decrypt_key(payload: DecryptKeyRequest) -> DecryptKeyResponse:
    try:
        envelope = _verify(payload.encrypted_key)
        user_key = _verify(payload.user_private_key)
    except HTTPException:
        return DecryptKeyResponse(error="Access Denied")
    except Exception:
        return DecryptKeyResponse(error="Access Denied")

    policy_tokens = set(_parse_policy(str(envelope.get("policy", ""))))
    user_attrs = set(user_key.get("attributes", []))

    if not policy_tokens.issubset(user_attrs):
        return DecryptKeyResponse(error="Access Denied")

    key = envelope.get("key")
    if not isinstance(key, str):
        return DecryptKeyResponse(error="Access Denied")

    return DecryptKeyResponse(key=key)
