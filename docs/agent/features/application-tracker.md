# Application Tracker Feature

> **A Kanban board for managing the job-application pipeline, auto-populated from the tailor flow.**

## Overview

The Application Tracker (`/tracker`) gives each tailored resume a place in a
seven-column Kanban pipeline. Tailoring a resume to a job auto-creates an
`applied` card; users can also add cards manually from a pasted job
description. Cards are drag-and-drop reorderable within and across columns.

**Tags** carry the detail the seven columns can't — which assessments a
candidate has completed (psychometric, one-way interview, take-home task) and
why an application ended (ghosted, salary mismatch). A column like `response`
stays deliberately coarse; the tags on the card say what actually happened.

## Columns (stable keys, decoupled from i18n labels)

`saved` · `applied` · `no_response` · `response` · `interview` · `accepted` · `rejected`

Auto-created cards from the tailor flow land in **`applied`**. Manual cards
default to `applied` but can be created as `saved`.

## How It Works

1. **Auto-create:** `POST /resumes/improve/confirm` (and the legacy
   `POST /resumes/improve`) create an `applied` card after persisting the
   tailored resume — best-effort (a tracker failure never breaks tailoring).
   Company/role come from the cached keyword-extraction pass, so there is **no
   extra LLM call** on this path.
2. **Manual add:** `POST /applications` creates the job from the pasted JD then
   the card; when company/role aren't supplied it runs one best-effort
   extraction call (falls back to blank/editable).
3. **Drag/drop:** cards reorder within a column or move across columns; the
   board updates optimistically and reverts on a failed `PATCH`.
4. **Detail modal:** shows the JD + the applied resume, and is where
   company/role/notes are edited and tags applied; **Edit** opens
   `/builder?id=<resume_id>`. Tolerates a deleted resume (`resume: null`).
5. **Bulk actions:** multi-select cards to move or delete in one request.

## Tags

User-defined labels, applied to any number of cards. Three fields:

| Field | Values | Purpose |
|-------|--------|---------|
| `label` | free text, ≤40 chars | Whitespace-collapsed; **case-insensitively unique** (`ux_tags_label_nocase`, a `lower(label)` expression index) |
| `category` | `activity` · `rejection` · `general` | Groups the picker — what was done vs. why it ended |
| `color` | `ink` · `blue` · `green` · `orange` · `red` · `grey` | A **palette key, never hex** — the frontend maps it to a Swiss token |

- **Creation is idempotent:** `POST /tags` with an existing label (any casing)
  returns that tag unchanged, so double-clicking a suggestion can't duplicate it.
- **Suggestions are i18n, tags are data:** the picker offers starter tags from
  `tracker.tags.suggestions.*` (translated); picking one creates a *real* tag
  with the translated label. Labels are never stored as i18n keys.
- **Assignment is set semantics:** `PUT /applications/{id}/tags` replaces the
  card's whole tag set (idempotent). An unknown tag id is rejected 400 and
  **nothing** is applied — no silent partial writes.
- **Renaming propagates** everywhere the tag is used; a collision answers 409.
  Deleting a tag detaches it from every card.
- Cards carry their tags on every read path (`lazy="selectin"`, so the board is
  a fixed two queries, not N+1).

## Editing a card

`company`, `role` and `notes` are editable in the card modal (one PATCH, saved
together) — the board is the only place they can be corrected, so a
mis-extracted company name no longer means leaving the page. Blank input is
normalized to `null` server-side, so the card falls back to its "unknown
company" placeholder rather than rendering an empty line.

## Data Model

`Application` (SQLite, `apps/backend/app/models.py`): `application_id` (PK),
`job_id`, `resume_id` (the applied/tailored resume), `master_resume_id`
(optional base — powers the "shared resume" badge), `status` (7-key enum),
`company`, `role`, `applied_at`, `notes`, `position` (per-column order,
server-renumbered on PATCH), `created_at`, `updated_at`. `create_application`
dedupes on `(job_id, resume_id)` to survive double-submit.

`Tag` (`tag_id` PK, `label`, `category`, `color`, timestamps) and the
`application_tags` join table (a plain `Table`, not a mapped class, so
SQLAlchemy owns inserts/deletes via `Application.tags`; `ON DELETE CASCADE`
backs it at the storage layer). Both tables are created by `create_all` — an
existing database picks them up on startup with no migration step.

## API (`prefix=/applications`, mounted under `/api/v1`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/applications` | All cards grouped by column (all 7 keys present) |
| POST | `/applications` | Manual add (creates job + card; best-effort extraction) |
| GET | `/applications/{id}` | Card + embedded JD + resume (resume null if deleted) |
| PATCH | `/applications/{id}` | Update status/position/notes/company/role/applied_at |
| PATCH | `/applications/bulk` | Move many cards to one column |
| DELETE | `/applications/{id}` | Delete one card |
| POST | `/applications/bulk-delete` | Delete many cards |
| PUT | `/applications/{id}/tags` | Replace a card's tag set (`{tag_ids: [...]}`); 400 on an unknown id |

Tags are a top-level resource (`prefix=/tags`) rather than nested under
`/applications`, where they would sit behind the `/{application_id}` matcher and
depend on route-declaration order:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/tags` | All tags + `usage_count` per tag |
| POST | `/tags` | Create (returns the existing tag on a duplicate label) |
| PATCH | `/tags/{id}` | Rename / recolour / recategorize; 409 on a label clash |
| DELETE | `/tags/{id}` | Delete + detach from every card |

## Key Files

| File | Purpose |
|------|---------|
| `apps/backend/app/models.py` | `Application` + `Tag` ORM models, `application_tags` join table |
| `apps/backend/app/schemas/applications.py` | Pydantic request/response schemas + status enum |
| `apps/backend/app/routers/applications.py` | The tracker endpoints + `tags_router` |
| `apps/backend/app/database.py` | Facade CRUD/bulk/reorder methods |
| `apps/backend/app/routers/resumes.py` | `_auto_create_tracker_application` hook (both confirm paths) |
| `apps/backend/app/services/improver.py` + `app/prompts/templates.py` | Company/role added to keyword extraction |
| `apps/frontend/app/(default)/tracker/page.tsx` | Route |
| `apps/frontend/components/tracker/*` | Board, column, card, detail modal, bulk bar, manual-add dialog |
| `apps/frontend/components/tracker/tag-chip.tsx` | Tag chip + the 12px palette swatch |
| `apps/frontend/components/tracker/tag-picker.tsx` | Toggle/create/delete tags on a card (incl. translated suggestions) |
| `apps/frontend/components/tracker/reorder.ts` | Pure drag-end resolution (`planMove`) |
| `apps/frontend/lib/api/tracker.ts` | Typed API client |

## Tests

- Backend: `tests/integration/test_applications_api.py` (CRUD, grouping, detail
  tolerance, bulk), `tests/integration/test_tracker_autocreate.py` (confirm
  auto-creates an `applied` card), `tests/unit/test_database.py::TestApplications`.
- Backend tags: `tests/integration/test_application_tags_api.py` (tag CRUD,
  dedupe, 409/400 paths, set semantics, editable company/role) and
  `tests/unit/test_database.py::TestTags` (storage: usage counts, rename
  propagation, no orphan links after a card or tag delete).
- Frontend: `tests/tracker-reorder.test.ts` (`planMove` within/cross-column +
  empty-column drop), `tests/api-tracker.test.ts` (client payloads/URLs),
  `tests/tracker-tag-picker.test.tsx` (toggle/create/suggest/two-step delete),
  `tests/tracker-card-detail-modal.test.tsx` (company/role dirty-tracking,
  trimming, failure handling).
