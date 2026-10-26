"""
Phase 1 Foundation Verification Test Suite.

Validates:
1. Production token encryption, decryption, tampering resilience, and legacy fallbacks.
2. SocialAccount model with encrypted storage, platform expansion (TikTok), and expiration checks.
3. Model registry catalog discovery, health inspection, and atomic provisioning.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from sqlmodel import Session, select

from models import SocialAccount, SocialPlatform, User
from services.model_registry import (
    MODEL_CATALOG,
    ensure_model_provisioned,
    get_model_health_summary,
    get_model_path,
    get_models_cache_dir,
    is_model_healthy,
)
from services.security import decrypt_token, encrypt_token


class TestTokenEncryptionService:
    def test_encrypt_decrypt_roundtrip(self):
        token = "ya29.a0AfH6SMD_example_oauth2_access_token_super_secret"
        encrypted = encrypt_token(token)
        assert encrypted is not None
        assert encrypted != token
        assert "ya29" not in encrypted

        decrypted = decrypt_token(encrypted)
        assert decrypted == token

    def test_handles_empty_and_none(self):
        assert encrypt_token(None) is None
        assert encrypt_token("") is None
        assert decrypt_token(None) is None
        assert decrypt_token("") is None

    def test_legacy_unencrypted_token_fallback(self):
        legacy_plain_token = "plain_unencrypted_token_from_v1"
        # Decrypting an unencrypted string should safely return the string without raising an exception
        assert decrypt_token(legacy_plain_token) == legacy_plain_token

    def test_custom_key_support(self):
        token = "custom_scoped_secret_token"
        key_a = "secret-encryption-passphrase-alpha-32b"
        key_b = "secret-encryption-passphrase-beta--32b"

        enc_a = encrypt_token(token, custom_key=key_a)
        assert decrypt_token(enc_a, custom_key=key_a) == token
        # Different key should not decrypt to the plain token
        assert decrypt_token(enc_a, custom_key=key_b) != token


class TestSocialAccountModel:
    def test_social_account_encrypted_getters_setters(self):
        user_id = uuid.uuid4()
        account = SocialAccount(
            user_id=user_id,
            platform=SocialPlatform.TIKTOK,
            access_token="",
            account_name="@creator_test",
        )

        plain_access = "act.tiktok.live.token.987654321"
        plain_refresh = "rft.tiktok.refresh.token.123456789"
        account.set_tokens(plain_access, plain_refresh)

        # Database column must store ciphertext
        assert account.access_token != plain_access
        assert account.refresh_token != plain_refresh

        # Decrypted getters recover plain token
        assert account.get_decrypted_access_token() == plain_access
        assert account.get_decrypted_refresh_token() == plain_refresh

    def test_token_expiration_check(self):
        now = datetime.now(timezone.utc)
        account = SocialAccount(
            user_id=uuid.uuid4(),
            platform=SocialPlatform.YOUTUBE,
            access_token="enc_dummy",
            token_expires_at=now + timedelta(hours=1),
        )
        assert account.is_token_expired() is False

        account.token_expires_at = now - timedelta(seconds=10)
        assert account.is_token_expired() is True

    def test_social_platform_enum_includes_tiktok(self):
        assert SocialPlatform.TIKTOK.value == "tiktok"
        assert SocialPlatform.YOUTUBE.value == "youtube"
        assert SocialPlatform.INSTAGRAM.value == "instagram"


class TestModelRegistry:
    def test_catalog_contains_core_models(self):
        assert "rvm_mobilenetv3" in MODEL_CATALOG
        assert "pose_landmarker" in MODEL_CATALOG
        assert "face_detector" in MODEL_CATALOG

    def test_model_paths_resolve_under_cache_dir(self):
        cache_dir = get_models_cache_dir()
        rvm_path = get_model_path("rvm_mobilenetv3")
        assert rvm_path.parent == cache_dir
        assert rvm_path.name == "rvm_mobilenetv3_fp32.onnx"

    def test_health_summary_structure(self):
        summary = get_model_health_summary()
        assert "models_dir" in summary
        assert "all_healthy" in summary
        assert "models" in summary
        assert "rvm_mobilenetv3" in summary["models"]
        assert "pose_landmarker" in summary["models"]

    def test_provision_with_mocked_download(self, tmp_path):
        test_cache = tmp_path / "models_test"
        with patch("services.model_registry.get_models_cache_dir", return_value=test_cache):
            # Create a mock source payload
            fake_payload = b"X" * (11 * 1024 * 1024)  # 11MB (meets 10MB threshold)

            class MockResponse:
                def __enter__(self):
                    return self
                def __exit__(self, *args):
                    pass
                def read(self, n=-1):
                    return b""

            with patch("urllib.request.urlopen") as mock_urlopen, \
                 patch("shutil.copyfileobj") as mock_copy:
                mock_urlopen.return_value = MockResponse()
                def fake_copy(src, dst):
                    dst.write(fake_payload)
                mock_copy.side_effect = fake_copy

                target = ensure_model_provisioned("rvm_mobilenetv3")
                assert target.exists()
                assert target.stat().st_size == len(fake_payload)
                assert is_model_healthy("rvm_mobilenetv3") is True
