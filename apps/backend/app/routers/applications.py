"""Kanban application-tracker endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.database import DuplicateTagLabel, UnknownTagIds, db
from app.services.improver import extract_job_keywords
from app.schemas import (
    APPLICATION_STATUS_ORDER,
    ApplicationActionResponse,
    ApplicationDetailResponse,
    ApplicationListResponse,
    ApplicationResponse,
    ApplicationTagsUpdate,
    ApplicationUpdate,
    BulkDelete,
    BulkStatusUpdate,
    ManualApplicationCreate,
    TagCreate,
    TagListResponse,
    TagResponse,
    TagUpdate,
    TagWithUsage,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["Application Tracker"])

# Tags are a top-level resource rather than ``/applications/tags``: a nested
# path would sit under the ``/{application_id}`` matcher and depend on
# declaration order to resolve.
tags_router = APIRouter(prefix="/tags", tags=["Application Tracker"])


def _group_by_status(applications: list[dict[str, Any]]) -> dict[str, list[ApplicationResponse]]:
    """Group a flat list into the seven columns (all keys always present).

    A row with an unknown status can't be represented by the enum-backed
    ``ApplicationResponse``; rather than 500 the whole board we skip it (the
    board only renders the seven known columns) and log it.
    """
    columns: dict[str, list[ApplicationResponse]] = {s: [] for s in APPLICATION_STATUS_ORDER}
    for app in applications:
        status = app.get("status")
        if status not in columns:
            logger.warning("Skipping application with unknown status %r", status)
            continue
        columns[status].append(ApplicationResponse(**app))
    return columns


@router.get("", response_model=ApplicationListResponse)
async def list_applications() -> ApplicationListResponse:
    """List all applications grouped by status column."""
    try:
        applications = await db.list_applications()
    except Exception as e:
        logger.error("Failed to list applications: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load applications. Please try again.")
    return ApplicationListResponse(columns=_group_by_status(applications))


@router.post("", response_model=ApplicationResponse)
async def create_application(request: ManualApplicationCreate) -> ApplicationResponse:
    """Manually add a card from a pasted job description.

    Creates the job, runs a best-effort company/role extraction when not
    provided, then creates the application. If application creation fails the
    just-created job is cleaned up (no orphan jobs / retry drift); caching
    company/role on the job is best-effort and never fails the request.
    """
    job = await db.create_job(content=request.job_description, resume_id=request.resume_id)

    company = request.company
    role = request.role
    if not company or not role:
        extracted = await _extract_company_role(request.job_description)
        company = company or extracted.get("company")
        role = role or extracted.get("role")

    try:
        application = await db.create_application(
            job_id=job["job_id"],
            resume_id=request.resume_id,
            status=request.status.value,
            company=company,
            role=role,
            notes=request.notes,
        )
    except Exception as e:
        logger.error("Failed to create application: %s", e)
        try:
            await db.delete_job(job["job_id"])
        except Exception as cleanup_error:
            logger.warning("Failed to clean up orphan job %s: %s", job["job_id"], cleanup_error)
        raise HTTPException(status_code=500, detail="Failed to create application. Please try again.")

    # Best-effort: cache company/role on the job for later reuse — never 500.
    if company or role:
        try:
            await db.update_job(job["job_id"], {"company": company, "role": role})
        except Exception as e:
            logger.warning("Failed to cache company/role on job %s: %s", job["job_id"], e)

    return ApplicationResponse(**application)


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
async def get_application_detail(application_id: str) -> ApplicationDetailResponse:
    """Get a card with its embedded JD and applied resume (one round-trip).

    Tolerates a deleted resume by returning ``resume: null`` rather than 500.
    """
    application = await db.get_application(application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    job_content: str | None = None
    resume: dict[str, Any] | None = None
    try:
        job = await db.get_job(application["job_id"])
        if job:
            job_content = job.get("content")
        resume = await db.get_resume(application["resume_id"])
    except Exception as e:
        # Detail is best-effort beyond the card itself; never 500 the modal.
        logger.warning("Failed to load detail context for %s: %s", application_id, e)

    return ApplicationDetailResponse(**application, job_content=job_content, resume=resume)


@router.patch("/bulk", response_model=ApplicationActionResponse)
async def bulk_update_applications(request: BulkStatusUpdate) -> ApplicationActionResponse:
    """Move many cards to one column."""
    try:
        moved = await db.bulk_update_applications(request.application_ids, request.status.value)
    except Exception as e:
        logger.error("Failed to bulk-update applications: %s", e)
        raise HTTPException(status_code=500, detail="Failed to move applications. Please try again.")
    return ApplicationActionResponse(message=f"Moved {moved} application(s)", affected=moved)


@router.patch("/{application_id}", response_model=ApplicationResponse)
async def update_application(application_id: str, request: ApplicationUpdate) -> ApplicationResponse:
    """Update a card (status/position/notes/company/role/applied_at)."""
    updates = request.model_dump(exclude_unset=True)
    # Normalize the enum to its stable string value for the data layer.
    if "status" in updates and updates["status"] is not None:
        updates["status"] = request.status.value
    try:
        updated = await db.update_application(application_id, updates)
    except Exception as e:
        logger.error("Failed to update application %s: %s", application_id, e)
        raise HTTPException(status_code=500, detail="Failed to update application. Please try again.")
    if updated is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse(**updated)


@router.put("/{application_id}/tags", response_model=ApplicationResponse)
async def set_application_tags(
    application_id: str, request: ApplicationTagsUpdate
) -> ApplicationResponse:
    """Replace a card's tags with exactly ``tag_ids`` (set semantics).

    Returns the updated card so the board can swap one object in place instead
    of re-fetching the whole board after every chip toggle.
    """
    try:
        updated = await db.set_application_tags(application_id, request.tag_ids)
    except UnknownTagIds as e:
        logger.warning("Rejected tag assignment with unknown ids: %s", e.tag_ids)
        raise HTTPException(status_code=400, detail="One or more tags no longer exist.")
    except Exception as e:
        logger.error("Failed to set tags on application %s: %s", application_id, e)
        raise HTTPException(status_code=500, detail="Failed to update tags. Please try again.")
    if updated is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse(**updated)


@router.delete("/{application_id}", response_model=ApplicationActionResponse)
async def delete_application(application_id: str) -> ApplicationActionResponse:
    """Delete a card."""
    try:
        deleted = await db.delete_application(application_id)
    except Exception as e:
        logger.error("Failed to delete application %s: %s", application_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete application. Please try again.")
    if not deleted:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationActionResponse(message="Application deleted", affected=1)


@router.post("/bulk-delete", response_model=ApplicationActionResponse)
async def bulk_delete_applications(request: BulkDelete) -> ApplicationActionResponse:
    """Delete many cards."""
    try:
        deleted = await db.bulk_delete_applications(request.application_ids)
    except Exception as e:
        logger.error("Failed to bulk-delete applications: %s", e)
        raise HTTPException(status_code=500, detail="Failed to delete applications. Please try again.")
    return ApplicationActionResponse(message=f"Deleted {deleted} application(s)", affected=deleted)


@tags_router.get("", response_model=TagListResponse)
async def list_tags() -> TagListResponse:
    """List every tag the user has defined, with per-tag usage counts."""
    try:
        tags = await db.list_tags()
    except Exception as e:
        logger.error("Failed to list tags: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load tags. Please try again.")
    return TagListResponse(tags=[TagWithUsage(**tag) for tag in tags])


@tags_router.post("", response_model=TagResponse)
async def create_tag(request: TagCreate) -> TagResponse:
    """Create a tag. An existing label (case-insensitive) is returned as-is."""
    try:
        tag = await db.create_tag(
            label=request.label,
            category=request.category.value,
            color=request.color.value,
        )
    except Exception as e:
        logger.error("Failed to create tag: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create tag. Please try again.")
    return TagResponse(**tag)


@tags_router.patch("/{tag_id}", response_model=TagResponse)
async def update_tag(tag_id: str, request: TagUpdate) -> TagResponse:
    """Rename, recolour, or recategorize a tag (applies everywhere it is used)."""
    updates = request.model_dump(exclude_unset=True)
    for key in ("category", "color"):
        value = updates.get(key)
        if value is not None:
            updates[key] = value.value if hasattr(value, "value") else value
    try:
        updated = await db.update_tag(tag_id, updates)
    except DuplicateTagLabel:
        raise HTTPException(status_code=409, detail="A tag with that name already exists.")
    except Exception as e:
        logger.error("Failed to update tag %s: %s", tag_id, e)
        raise HTTPException(status_code=500, detail="Failed to update tag. Please try again.")
    if updated is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    return TagResponse(**updated)


@tags_router.delete("/{tag_id}", response_model=ApplicationActionResponse)
async def delete_tag(tag_id: str) -> ApplicationActionResponse:
    """Delete a tag and remove it from every card carrying it."""
    try:
        deleted = await db.delete_tag(tag_id)
    except Exception as e:
        logger.error("Failed to delete tag %s: %s", tag_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete tag. Please try again.")
    if not deleted:
        raise HTTPException(status_code=404, detail="Tag not found")
    return ApplicationActionResponse(message="Tag deleted", affected=1)


async def _extract_company_role(job_description: str) -> dict[str, str | None]:
    """Best-effort company/role extraction for the manual-add path.

    Reuses the cached keyword-extraction pass; falls back to blank (editable)
    on any failure so a flaky LLM never blocks card creation. LLM output isn't
    guaranteed to be a string, so values are type-guarded before ``.strip()``.
    """
    try:
        keywords = await extract_job_keywords(job_description)
        raw_company = keywords.get("company")
        raw_role = keywords.get("role")
        return {
            "company": (raw_company.strip() if isinstance(raw_company, str) else "") or None,
            "role": (raw_role.strip() if isinstance(raw_role, str) else "") or None,
        }
    except Exception as e:
        logger.warning("Company/role extraction failed (manual add): %s", e)
        return {}
