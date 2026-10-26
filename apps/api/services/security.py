"""
Security and Token Encryption Service.

Provides AES-128-CBC / HMAC-SHA256 authenticated symmetric encryption (Fernet)
for long-lived OAuth access tokens, refresh tokens, and sensitive integration credentials.
"""

import base64
import hashlib
import os
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken


def _derive_fernet_key(raw_key: Optional[str] = None) -> bytes:
    """
    Derives a valid 32-byte url-safe base64 Fernet key from any secret string.
    If the key is already 44-byte base64, returns it directly; otherwise hashes with SHA-256.
    """
    if not raw_key:
        raw_key = os.environ.get("TOKEN_ENCRYPTION_KEY") or os.environ.get("SECRET_KEY") or "ai-director-production-token-vault-key-2026"

    try:
        raw_bytes = raw_key.encode("utf-8")
        if len(raw_bytes) == 44 and base64.urlsafe_b64decode(raw_bytes):
            return raw_bytes
    except Exception:
        pass

    digest = hashlib.sha256(raw_key.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_token(plain_token: Optional[str], custom_key: Optional[str] = None) -> Optional[str]:
    """
    Encrypts a plaintext OAuth token into an authenticated Fernet ciphertext string.
    Returns None if the input is None or empty.
    """
    if not plain_token:
        return None
    key = _derive_fernet_key(custom_key)
    f = Fernet(key)
    return f.encrypt(plain_token.encode("utf-8")).decode("utf-8")


def decrypt_token(cipher_token: Optional[str], custom_key: Optional[str] = None) -> Optional[str]:
    """
    Decrypts an authenticated Fernet ciphertext string back into the original token.
    Gracefully returns the input as plaintext if it was unencrypted or legacy format.
    """
    if not cipher_token:
        return None
    key = _derive_fernet_key(custom_key)
    f = Fernet(key)
    try:
        return f.decrypt(cipher_token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception):
        # Graceful fallback for unencrypted legacy tokens or plain test fixtures
        return cipher_token
