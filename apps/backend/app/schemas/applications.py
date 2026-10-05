"""Pydantic schemas for the Kanban application tracker."""

import re
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class ApplicationStatus(str, Enum):
    """The seven stable tracker columns (decoupled from i18n labels)."""

    saved = "saved"
    applied = "applied"
    no_response = "no_response"
    response = "response"
    interview = "interview"
    accepted = "accepted"
    rejected = "rejected"


# Order the board renders columns in.
APPLICATION_STATUS_ORDER: list[str] = [s.value for s in ApplicationStatus]


class TagCategory(str, Enum):
    """What a tag is flagging — drives grouping (not colour) in the picker."""

    # Something that happened in the process: psychometric test, one-way
    # interview, take-home task, assessment centre.
    activity = "activity"
    # Why the application ended: ghosted, salary mismatch, role withdrawn.
    rejection = "rejection"
    # Anything else the user wants to flag.
    general = "general"


class TagColor(str, Enum):
    """Swiss-palette keys. Stored as names, never raw hex (see tokens.md)."""

    ink = "ink"
    blue = "blue"
    green = "green"
    orange = "orange"
    red = "red"
    grey = "grey"


# A tag label is a chip on a Kanban card, so it has to stay short enough to read
# at a glance without truncating the card.
TAG_LABEL_MAX_LENGTH = 40


def _clean_label(value: str) -> str:
    """Trim and collapse internal whitespace in a tag label.

    Keeps " one  way interview " and "one way interview" from becoming two
    distinct tags that the case-insensitive unique index can't catch.
    """
    return re.sub(r"\s+", " ", value).strip()


class TagResponse(BaseModel):
    """A tag as returned on cards and in the tag list."""

    tag_id: str
    label: str
    category: TagCategory
    color: TagColor
    created_at: str
    updated_at: str


class TagWithUsage(TagResponse):
    """A tag plus how many cards carry it (so the UI can warn before deleting)."""

    usage_count: int = 0


class TagListResponse(BaseModel):
    """Every tag defined by the user."""

    tags: list[TagWithUsage]


class TagCreate(BaseModel):
    """Create a tag. Re-using an existing label returns that tag unchanged."""

    label: str = Field(min_length=1, max_length=TAG_LABEL_MAX_LENGTH)
    category: TagCategory = TagCategory.general
    color: TagColor = TagColor.ink

    @field_validator("label")
    @classmethod
    def _normalize_label(cls, value: str) -> str:
        cleaned = _clean_label(value)
        if not cleaned:
            raise ValueError("label must not be blank")
        return cleaned


class TagUpdate(BaseModel):
    """Partial tag update — rename, recolour, or recategorize."""

    label: str | None = Field(default=None, min_length=1, max_length=TAG_LABEL_MAX_LENGTH)
    category: TagCategory | None = None
    color: TagColor | None = None

    @field_validator("label")
    @classmethod
    def _normalize_label(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = _clean_label(value)
        if not cleaned:
            raise ValueError("label must not be blank")
        return cleaned


class ApplicationTagsUpdate(BaseModel):
    """Replace a card's tags wholesale (set semantics, so it's idempotent)."""

    tag_ids: list[str] = Field(default_factory=list)


class ApplicationResponse(BaseModel):
    """A single tracker card."""

    application_id: str
    job_id: str
    resume_id: str
    master_resume_id: str | None = None
    status: ApplicationStatus
    company: str | None = None
    role: str | None = None
    applied_at: str | None = None
    notes: str | None = None
    position: int
    tags: list[TagResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


class ApplicationDetailResponse(ApplicationResponse):
    """A card plus the embedded job description and applied resume.

    ``resume`` is null when the referenced resume has been deleted — the modal
    renders "resume unavailable" rather than 500ing.
    """

    job_content: str | None = None
    resume: dict[str, Any] | None = None


class ApplicationListResponse(BaseModel):
    """Applications grouped by column. All seven keys are always present."""

    columns: dict[str, list[ApplicationResponse]]


class ManualApplicationCreate(BaseModel):
    """Create a card from a pasted JD (no prior tailoring).

    The router creates the job from ``job_description`` then the application.
    ``company``/``role`` are optional overrides; when omitted the router runs a
    best-effort extraction.
    """

    resume_id: str
    job_description: str = Field(min_length=1)
    company: str | None = None
    role: str | None = None
    status: ApplicationStatus = ApplicationStatus.applied
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    """Partial update — every field optional.

    ``company``/``role`` are editable from the board's card modal, so a blank
    submission is normalized to ``None``: the card then shows its "unknown
    company" placeholder instead of an empty line.
    """

    status: ApplicationStatus | None = None
    position: int | None = None
    notes: str | None = None
    company: str | None = None
    role: str | None = None
    applied_at: str | None = None

    @field_validator("company", "role")
    @classmethod
    def _blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class BulkStatusUpdate(BaseModel):
    """Move many cards to one column."""

    application_ids: list[str] = Field(min_length=1)
    status: ApplicationStatus


class BulkDelete(BaseModel):
    """Delete many cards."""

    application_ids: list[str] = Field(min_length=1)


class ApplicationActionResponse(BaseModel):
    """Generic acknowledgement for bulk/destructive actions."""

    message: str
    affected: int
