from datetime import datetime, timezone
import enum
from typing import Any, Dict, List, Optional
import uuid
from sqlmodel import Column, DateTime, Enum, Field, Relationship, SQLModel, String, Text
from sqlalchemy import JSON


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SocialPlatform(str, enum.Enum):
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"


class VideoType(str, enum.Enum):
    TALKING_HEAD = "talking_head"
    FACELESS_SHORT = "faceless_short"


class VideoJobStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    DOWNLOADING = "DOWNLOADING"
    TRANSCRIBING = "TRANSCRIBING"
    AI_DIRECTING = "AI_DIRECTING"
    RENDERING = "RENDERING"
    PUBLISHING = "PUBLISHING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ---------------------------------------------------------------------------
# Database Models (Tables)
# ---------------------------------------------------------------------------

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    clerk_id: str = Field(
        sa_column=Column(String(255), unique=True, index=True, nullable=False),
        description="Clerk User ID for external auth mapping",
    )
    email: str = Field(
        sa_column=Column(String(255), index=True, nullable=False),
        description="Primary email address",
    )
    created_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
        description="Timestamp when the user account was registered",
    )

    # Relationships
    social_accounts: List["SocialAccount"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    video_jobs: List["VideoJob"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class SocialAccount(SQLModel, table=True):
    __tablename__ = "social_accounts"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
    )
    platform: SocialPlatform = Field(
        sa_column=Column(Enum(SocialPlatform), nullable=False),
        description="Social platform type (youtube, instagram, tiktok, linkedin)",
    )
    access_token: str = Field(
        sa_column=Column(Text, nullable=False),
        description="Encrypted OAuth2 Access Token",
    )
    refresh_token: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Encrypted OAuth2 Refresh Token for long-lived access",
    )
    token_expires_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
        description="Timestamp when the access token expires",
    )
    platform_account_id: Optional[str] = Field(
        default=None,
        sa_column=Column(String(255), nullable=True),
        description="External account / channel identifier on the platform",
    )
    account_name: Optional[str] = Field(
        default=None,
        sa_column=Column(String(255), nullable=True),
        description="Display name / Channel title / Handle",
    )
    account_avatar: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Profile picture or channel avatar URL",
    )
    scopes: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Space-delimited list of authorized scopes",
    )
    is_active: bool = Field(
        default=True,
        description="Whether this integration connection is actively enabled",
    )
    created_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    # Relationships
    user: Optional[User] = Relationship(back_populates="social_accounts")

    def set_tokens(self, plain_access: str, plain_refresh: Optional[str] = None) -> None:
        """Encrypts and sets tokens using the security encryption layer."""
        from services.security import encrypt_token
        self.access_token = encrypt_token(plain_access) or ""
        if plain_refresh is not None:
            self.refresh_token = encrypt_token(plain_refresh)
        self.updated_at = get_utc_now()

    def get_decrypted_access_token(self) -> str:
        """Decrypts and returns the active access token."""
        from services.security import decrypt_token
        return decrypt_token(self.access_token) or ""

    def get_decrypted_refresh_token(self) -> Optional[str]:
        """Decrypts and returns the refresh token if present."""
        if not self.refresh_token:
            return None
        from services.security import decrypt_token
        return decrypt_token(self.refresh_token)

    def is_token_expired(self) -> bool:
        """Checks if the access token has passed its expiration timestamp."""
        if not self.token_expires_at:
            return False
        now = get_utc_now()
        exp = self.token_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        # Treat as expired 60 seconds early to avoid race conditions
        return exp <= now


class VideoJob(SQLModel, table=True):
    __tablename__ = "video_jobs"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
    )
    title: str = Field(
        sa_column=Column(String(255), nullable=False),
        description="Job title or video project name",
    )
    source_url: str = Field(
        sa_column=Column(Text, nullable=False),
        description="S3 / Cloudflare R2 raw video source URL",
    )
    rendered_url: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Public S3 / Cloudflare R2 URL for final edited video export",
    )
    video_type: VideoType = Field(
        default=VideoType.TALKING_HEAD,
        sa_column=Column(Enum(VideoType), nullable=False),
        description="Talking head cutting vs faceless short generation",
    )
    status: VideoJobStatus = Field(
        default=VideoJobStatus.QUEUED,
        sa_column=Column(Enum(VideoJobStatus), index=True, nullable=False),
        description="Current processing pipeline state",
    )
    edit_decision_list: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="JSON structured Edit Decision List generated by LLM (Gemini/OpenRouter)",
    )
    error_log: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Error stacktrace or diagnostic logs if job failed",
    )
    settings: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
        description="JSON object storing frontend preferences (ratio, style, niche, character, mood, etc.)",
    )
    created_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
        description="Creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
        description="Last state update timestamp",
    )

    # Relationships
    user: Optional[User] = Relationship(back_populates="video_jobs")
    snapshots: List["ProjectSnapshot"] = Relationship(
        back_populates="video_job",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class ProjectSnapshot(SQLModel, table=True):
    __tablename__ = "project_snapshots"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    video_id: uuid.UUID = Field(
        foreign_key="video_jobs.id",
        index=True,
        nullable=False,
    )
    version: int = Field(
        default=1,
        index=True,
        nullable=False,
        description="Monotonically increasing version checkpoint",
    )
    label: str = Field(
        sa_column=Column(String(255), nullable=False),
        description="Snapshot title or description (e.g., 'Initial Draft', 'Added Intro B-Roll')",
    )
    description: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Optional extended notes",
    )
    timeline_project: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON, nullable=False),
        description="Full serialized TimelineProject state snapshot",
    )
    created_at: datetime = Field(
        default_factory=get_utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
        description="Snapshot timestamp",
    )

    # Relationships
    video_job: Optional[VideoJob] = Relationship(back_populates="snapshots")
