"""
Worker Security and Token Decryption Facade.
Re-exports encryption and decryption utilities for worker publishing tasks.
"""

import sys
import os

# Ensure apps/api is accessible
api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "api"))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

try:
    from services.security import encrypt_token, decrypt_token
except ImportError:
    # Direct import fallback
    import importlib.util
    sec_path = os.path.join(api_dir, "services", "security.py")
    spec = importlib.util.spec_from_file_location("api_security", sec_path)
    api_security = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(api_security)
    encrypt_token = api_security.encrypt_token
    decrypt_token = api_security.decrypt_token

__all__ = ["encrypt_token", "decrypt_token"]
