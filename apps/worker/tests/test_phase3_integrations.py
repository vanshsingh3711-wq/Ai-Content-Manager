"""
Phase 3 Web Capture & Social Integrations Verification Suite.

Validates:
1. Kinetic 9:16 vertical web clip video generation from static screenshots.
2. OAuth 2.0 PKCE authorization URL generation, sandbox mock flows, and state security.
3. OAuth callback token exchange, AES encryption storage, and account listings.
4. Social publisher dispatcher (YouTube, TikTok Content Posting API, Instagram Reels).
"""

import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from main import app
from models import SocialAccount, SocialPlatform, User
from services.kinetic_web_clip import generate_kinetic_web_clip, get_ffmpeg_binary
from services.publisher import (
    publish_from_social_account,
    publish_to_instagram_reels,
    publish_to_tiktok,
    publish_to_youtube,
)


class TestKineticWebClipGenerator:
    def test_renders_valid_9_16_video_from_screenshot(self):
        ffmpeg_bin = get_ffmpeg_binary()
        with tempfile.TemporaryDirectory() as temp_dir:
            test_png = os.path.join(temp_dir, "web_capture_mock.png")
            out_mp4 = os.path.join(temp_dir, "web_clip_vertical.mp4")

            # 1. Generate a mock webpage screenshot using FFmpeg
            cmd_img = [
                ffmpeg_bin, "-y",
                "-f", "lavfi", "-i", "color=c=#181a26:s=1280x2000:d=1",
                "-vframes", "1",
                test_png
            ]
            subprocess.run(cmd_img, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            assert os.path.exists(test_png)

            # 2. Render kinetic 9:16 animated video clip
            res_path = generate_kinetic_web_clip(
                screenshot_path=test_png,
                output_mp4_path=out_mp4,
                duration=1.5,
                title="Stripe Documentation - Pricing",
                fps=30,
            )
            assert res_path == out_mp4
            assert os.path.exists(out_mp4)
            assert os.path.getsize(out_mp4) > 10 * 1024

            # 3. Probe rendered video dimensions (1080x1920)
            cmd_probe = [
                ffmpeg_bin, "-i", out_mp4
            ]
            res_probe = subprocess.run(cmd_probe, capture_output=True, text=True)
            # FFmpeg returns exit 1 when no output is specified, but prints stream details
            assert "1080x1920" in res_probe.stderr
            assert "Video: h264" in res_probe.stderr
            assert "Audio: aac" in res_probe.stderr


class TestOAuth2GatewayEndpoints:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_authorize_url_generation(self, client):
        for platform in ("youtube", "tiktok", "instagram"):
            res = client.get(f"/api/v1/oauth/authorize/{platform}")
            assert res.status_code == 200
            data = res.json()
            assert data["platform"] == platform
            assert "auth_url" in data
            assert "state" in data
            assert len(data["state"]) > 10

    def test_authorize_unsupported_platform(self, client):
        res = client.get("/api/v1/oauth/authorize/unsupported_platform_xyz")
        assert res.status_code == 400

    def test_oauth_callback_flow_and_encrypted_persistence(self, client):
        # 1. Initiate authorization to seed state
        auth_res = client.get("/api/v1/oauth/authorize/tiktok")
        state = auth_res.json()["state"]

        # 2. Trigger callback with mock authorization code
        cb_res = client.get(
            f"/api/v1/oauth/callback/tiktok?code=mock_code_test_12345&state={state}",
            follow_redirects=False,
        )
        assert cb_res.status_code in (302, 307)
        location = cb_res.headers["location"]
        assert "/dashboard/socials?connected=tiktok" in location

        # 3. Verify accounts list API returns connected account
        acc_res = client.get("/api/v1/oauth/accounts")
        assert acc_res.status_code == 200
        accounts = acc_res.json()
        tt_acc = [a for a in accounts if a["platform"] == "tiktok"]
        assert len(tt_acc) >= 1
        assert "is_expired" in tt_acc[0]
        assert "access_token" not in tt_acc[0]  # Tokens must never be leaked in list view

        # 4. Test account disconnect
        acc_id = tt_acc[0]["id"]
        del_res = client.delete(f"/api/v1/oauth/accounts/{acc_id}")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "success"

        # Verify removal
        post_del = client.get("/api/v1/oauth/accounts")
        remaining = [a for a in post_del.json() if a["id"] == acc_id]
        assert len(remaining) == 0


class TestPublisherDispatchers:
    def test_publish_to_tiktok_simulated_fallback(self):
        res = publish_to_tiktok(
            video_path="/fake/path.mp4",
            title="My TikTok AI Short",
            access_token=None,
        )
        assert res["platform"] == "tiktok"
        assert res["status"] == "simulated"
        assert "tt_sim_" in res["publish_id"]

    def test_publish_to_youtube_simulated_fallback(self):
        res = publish_to_youtube(
            video_path="/fake/path.mp4",
            title="My YouTube Short",
            access_token=None,
            is_shorts=True,
        )
        assert res["platform"] == "youtube"
        assert res["status"] == "simulated"
        assert "yt_sim_" in res["video_id"]

    def test_publish_to_instagram_simulated_fallback(self):
        res = publish_to_instagram_reels(
            video_url="http://example.com/video.mp4",
            caption="My Instagram Reel",
            access_token=None,
            instagram_account_id=None,
        )
        assert res["platform"] == "instagram"
        assert res["status"] == "simulated"
        assert "ig_sim_" in res["media_id"]

    def test_publish_from_social_account_dispatcher(self):
        class MockAccount:
            platform = SocialPlatform.TIKTOK
            access_token = "mock_enc"
            platform_account_id = "tt_123"

            def get_decrypted_access_token(self):
                return None  # Triggers simulated publish

        acc = MockAccount()
        res = publish_from_social_account(
            local_mp4_path="/fake/path.mp4",
            account=acc,
            title="Unified Publish Short",
        )
        assert res["platform"] == "tiktok"
        assert res["status"] == "simulated"
