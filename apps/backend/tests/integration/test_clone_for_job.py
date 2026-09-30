"""``/resumes/clone-for-job`` creates a tailored resume with zero LLM calls.

Unlike ``/improve/preview`` + ``/improve/confirm`` (see test_pipeline_e2e.py /
test_tracker_autocreate.py), this endpoint never touches the LLM boundary —
no mocking of parse/keyword/diff/cover-letter functions is needed here, since
none of them are called.
"""

from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.integration.test_pipeline_e2e import _upload_resume


def _new_client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _upload_job(description: str) -> str:
    async with _new_client() as client:
        resp = await client.post(
            "/api/v1/jobs/upload",
            json={"job_descriptions": [description]},
        )
    return resp.json()["job_id"][0]


class TestCloneResumeForJob:
    async def test_clone_creates_untouched_copy(self, isolated_db, sample_resume):
        upload_resp = await _upload_resume(isolated_db, sample_resume)
        master_id = upload_resp.json()["resume_id"]
        job_id = await _upload_job("Senior Backend Engineer at Acme Corp: Python, FastAPI.")

        async with _new_client() as client:
            resp = await client.post(
                "/api/v1/resumes/clone-for-job",
                json={"resume_id": master_id, "job_id": job_id},
            )

        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        tailored_id = data["resume_id"]

        assert tailored_id != master_id
        assert data["parent_id"] == master_id

        async with _new_client() as client:
            master_resp = await client.get(f"/api/v1/resumes?resume_id={master_id}")
        master_processed = master_resp.json()["data"]["processed_resume"]

        # Content is an exact, unmodified copy of the master — no AI pass.
        assert data["processed_resume"] == master_processed
        # No auxiliary content was generated.
        assert data["cover_letter"] is None
        assert data["interview_prep"] is None

    async def test_clone_links_job_for_later_lookup(self, isolated_db, sample_resume):
        upload_resp = await _upload_resume(isolated_db, sample_resume)
        master_id = upload_resp.json()["resume_id"]
        jd_text = "Senior Backend Engineer at Acme Corp: Python, FastAPI."
        job_id = await _upload_job(jd_text)

        async with _new_client() as client:
            clone_resp = await client.post(
                "/api/v1/resumes/clone-for-job",
                json={"resume_id": master_id, "job_id": job_id},
            )
        tailored_id = clone_resp.json()["data"]["resume_id"]

        async with _new_client() as client:
            jd_resp = await client.get(f"/api/v1/resumes/{tailored_id}/job-description")
        assert jd_resp.status_code == 200, jd_resp.text
        assert jd_resp.json()["content"] == jd_text

    async def test_clone_autocreates_tracker_card(self, isolated_db, sample_resume):
        upload_resp = await _upload_resume(isolated_db, sample_resume)
        master_id = upload_resp.json()["resume_id"]
        job_id = await _upload_job("Senior Backend Engineer at Acme Corp: Python, FastAPI.")

        async with _new_client() as client:
            clone_resp = await client.post(
                "/api/v1/resumes/clone-for-job",
                json={"resume_id": master_id, "job_id": job_id},
            )
        tailored_id = clone_resp.json()["data"]["resume_id"]

        async with _new_client() as client:
            board = (await client.get("/api/v1/applications")).json()["columns"]
        applied = board["applied"]
        assert len(applied) == 1
        assert applied[0]["resume_id"] == tailored_id
        assert applied[0]["master_resume_id"] == master_id
        assert applied[0]["job_id"] == job_id

    async def test_unknown_master_resume_404s(self, isolated_db):
        job_id = await _upload_job("Senior Backend Engineer at Acme Corp: Python, FastAPI.")
        async with _new_client() as client:
            resp = await client.post(
                "/api/v1/resumes/clone-for-job",
                json={"resume_id": "does-not-exist", "job_id": job_id},
            )
        assert resp.status_code == 404

    async def test_unknown_job_404s(self, isolated_db, sample_resume):
        upload_resp = await _upload_resume(isolated_db, sample_resume)
        master_id = upload_resp.json()["resume_id"]
        async with _new_client() as client:
            resp = await client.post(
                "/api/v1/resumes/clone-for-job",
                json={"resume_id": master_id, "job_id": "does-not-exist"},
            )
        assert resp.status_code == 404
