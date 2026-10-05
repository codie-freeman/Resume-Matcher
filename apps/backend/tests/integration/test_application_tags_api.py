"""Integration tests for tracker tags + editable company/role (real isolated DB).

Tags are what makes a vague column like ``response`` specific: which
assessments a candidate completed, and why an application ended. These exercise
the real routers over httpx/ASGI against a temp SQLite file — no mocked ``db``.
"""

from httpx import ASGITransport, AsyncClient

from app.main import app


def _client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def _seed_card(isolated_db, **kwargs):
    defaults = dict(job_id="job-1", resume_id="res-1", status="applied")
    defaults.update(kwargs)
    return await isolated_db.create_application(**defaults)


class TestTagCrudApi:
    async def test_create_list_and_default_fields(self, isolated_db):
        async with _client() as client:
            created = await client.post(
                "/api/v1/tags",
                json={"label": "Psychometric", "category": "activity", "color": "blue"},
            )
            assert created.status_code == 200
            body = created.json()
            assert body["label"] == "Psychometric"
            assert body["category"] == "activity"
            assert body["color"] == "blue"

            plain = await client.post("/api/v1/tags", json={"label": "Ghosted"})
            assert plain.json()["category"] == "general"
            assert plain.json()["color"] == "ink"

            listed = await client.get("/api/v1/tags")
        assert listed.status_code == 200
        tags = listed.json()["tags"]
        assert [t["label"] for t in tags] == ["Ghosted", "Psychometric"]
        assert all(t["usage_count"] == 0 for t in tags)

    async def test_label_whitespace_is_collapsed(self, isolated_db):
        async with _client() as client:
            resp = await client.post("/api/v1/tags", json={"label": "  one   way  interview "})
        assert resp.json()["label"] == "one way interview"

    async def test_blank_label_is_rejected(self, isolated_db):
        async with _client() as client:
            empty = await client.post("/api/v1/tags", json={"label": ""})
            spaces = await client.post("/api/v1/tags", json={"label": "   "})
            too_long = await client.post("/api/v1/tags", json={"label": "x" * 41})
        assert empty.status_code == 422
        assert spaces.status_code == 422
        assert too_long.status_code == 422

    async def test_unknown_category_or_color_is_rejected(self, isolated_db):
        async with _client() as client:
            bad_category = await client.post(
                "/api/v1/tags", json={"label": "a", "category": "whatever"}
            )
            # Raw hex is not a palette key — the UI maps names to Swiss tokens.
            bad_color = await client.post(
                "/api/v1/tags", json={"label": "b", "color": "#ff00ff"}
            )
        assert bad_category.status_code == 422
        assert bad_color.status_code == 422

    async def test_duplicate_label_returns_the_existing_tag(self, isolated_db):
        async with _client() as client:
            first = await client.post(
                "/api/v1/tags", json={"label": "Psychometric", "color": "blue"}
            )
            again = await client.post("/api/v1/tags", json={"label": "psychometric"})
            listed = await client.get("/api/v1/tags")
        assert again.status_code == 200
        assert again.json()["tag_id"] == first.json()["tag_id"]
        assert again.json()["color"] == "blue"
        assert len(listed.json()["tags"]) == 1

    async def test_rename_conflict_is_409_not_500(self, isolated_db):
        async with _client() as client:
            await client.post("/api/v1/tags", json={"label": "Psychometric"})
            other = await client.post("/api/v1/tags", json={"label": "Phone screen"})
            resp = await client.patch(
                f"/api/v1/tags/{other.json()['tag_id']}", json={"label": "PSYCHOMETRIC"}
            )
        assert resp.status_code == 409

    async def test_patch_updates_only_supplied_fields(self, isolated_db):
        async with _client() as client:
            tag = (
                await client.post(
                    "/api/v1/tags",
                    json={"label": "Phone screen", "category": "activity", "color": "blue"},
                )
            ).json()
            resp = await client.patch(f"/api/v1/tags/{tag['tag_id']}", json={"color": "green"})
        body = resp.json()
        assert body["color"] == "green"
        assert body["label"] == "Phone screen"
        assert body["category"] == "activity"

    async def test_patch_and_delete_missing_tag_are_404(self, isolated_db):
        async with _client() as client:
            patched = await client.patch("/api/v1/tags/nope", json={"label": "x"})
            deleted = await client.delete("/api/v1/tags/nope")
        assert patched.status_code == 404
        assert deleted.status_code == 404


class TestCardTagsApi:
    async def test_put_replaces_a_cards_tags(self, isolated_db):
        card = await _seed_card(isolated_db)
        async with _client() as client:
            activity = (
                await client.post(
                    "/api/v1/tags", json={"label": "One-way interview", "category": "activity"}
                )
            ).json()
            rejection = (
                await client.post(
                    "/api/v1/tags", json={"label": "Salary mismatch", "category": "rejection"}
                )
            ).json()

            resp = await client.put(
                f"/api/v1/applications/{card['application_id']}/tags",
                json={"tag_ids": [activity["tag_id"], rejection["tag_id"]]},
            )
            assert resp.status_code == 200
            assert sorted(t["label"] for t in resp.json()["tags"]) == [
                "One-way interview",
                "Salary mismatch",
            ]

            # Set semantics: the second call replaces rather than appends.
            narrowed = await client.put(
                f"/api/v1/applications/{card['application_id']}/tags",
                json={"tag_ids": [rejection["tag_id"]]},
            )
            assert [t["label"] for t in narrowed.json()["tags"]] == ["Salary mismatch"]

            cleared = await client.put(
                f"/api/v1/applications/{card['application_id']}/tags", json={"tag_ids": []}
            )
        assert cleared.json()["tags"] == []

    async def test_board_and_detail_include_tags(self, isolated_db):
        card = await _seed_card(isolated_db, status="response")
        async with _client() as client:
            tag = (await client.post("/api/v1/tags", json={"label": "Psychometric"})).json()
            await client.put(
                f"/api/v1/applications/{card['application_id']}/tags",
                json={"tag_ids": [tag["tag_id"]]},
            )
            board = await client.get("/api/v1/applications")
            detail = await client.get(f"/api/v1/applications/{card['application_id']}")

        assert [t["label"] for t in board.json()["columns"]["response"][0]["tags"]] == [
            "Psychometric"
        ]
        assert [t["label"] for t in detail.json()["tags"]] == ["Psychometric"]

    async def test_cards_without_tags_report_an_empty_list(self, isolated_db):
        await _seed_card(isolated_db)
        async with _client() as client:
            board = await client.get("/api/v1/applications")
        assert board.json()["columns"]["applied"][0]["tags"] == []

    async def test_unknown_tag_id_is_400_and_applies_nothing(self, isolated_db):
        card = await _seed_card(isolated_db)
        async with _client() as client:
            tag = (await client.post("/api/v1/tags", json={"label": "Psychometric"})).json()
            resp = await client.put(
                f"/api/v1/applications/{card['application_id']}/tags",
                json={"tag_ids": [tag["tag_id"], "ghost-id"]},
            )
            detail = await client.get(f"/api/v1/applications/{card['application_id']}")
        assert resp.status_code == 400
        # Partial application would silently drop a tag the user thought stuck.
        assert detail.json()["tags"] == []

    async def test_put_tags_on_missing_card_is_404(self, isolated_db):
        async with _client() as client:
            resp = await client.put("/api/v1/applications/nope/tags", json={"tag_ids": []})
        assert resp.status_code == 404

    async def test_deleting_a_tag_removes_it_from_cards(self, isolated_db):
        card = await _seed_card(isolated_db)
        async with _client() as client:
            tag = (await client.post("/api/v1/tags", json={"label": "Psychometric"})).json()
            await client.put(
                f"/api/v1/applications/{card['application_id']}/tags",
                json={"tag_ids": [tag["tag_id"]]},
            )
            deleted = await client.delete(f"/api/v1/tags/{tag['tag_id']}")
            detail = await client.get(f"/api/v1/applications/{card['application_id']}")
        assert deleted.status_code == 200
        assert detail.json()["tags"] == []

    async def test_usage_count_reflects_cards_carrying_the_tag(self, isolated_db):
        first = await _seed_card(isolated_db, job_id="j1", resume_id="r1")
        second = await _seed_card(isolated_db, job_id="j2", resume_id="r2")
        async with _client() as client:
            tag = (await client.post("/api/v1/tags", json={"label": "Psychometric"})).json()
            for card in (first, second):
                await client.put(
                    f"/api/v1/applications/{card['application_id']}/tags",
                    json={"tag_ids": [tag["tag_id"]]},
                )
            listed = await client.get("/api/v1/tags")
        assert listed.json()["tags"][0]["usage_count"] == 2


class TestEditCompanyAndRole:
    """The board's card modal edits these in place, so PATCH has to round-trip."""

    async def test_patch_updates_company_and_role(self, isolated_db):
        card = await _seed_card(isolated_db, company="Acme", role="Engineer")
        async with _client() as client:
            resp = await client.patch(
                f"/api/v1/applications/{card['application_id']}",
                json={"company": "Globex", "role": "Staff Engineer"},
            )
            board = await client.get("/api/v1/applications")
        assert resp.status_code == 200
        assert resp.json()["company"] == "Globex"
        assert resp.json()["role"] == "Staff Engineer"
        # Persisted, not just echoed back.
        assert board.json()["columns"]["applied"][0]["company"] == "Globex"

    async def test_blank_company_or_role_is_stored_as_null(self, isolated_db):
        card = await _seed_card(isolated_db, company="Acme", role="Engineer")
        async with _client() as client:
            resp = await client.patch(
                f"/api/v1/applications/{card['application_id']}",
                json={"company": "   ", "role": ""},
            )
        # Null, not "" — the card then shows its "unknown company" placeholder.
        assert resp.json()["company"] is None
        assert resp.json()["role"] is None

    async def test_company_and_role_are_trimmed(self, isolated_db):
        card = await _seed_card(isolated_db)
        async with _client() as client:
            resp = await client.patch(
                f"/api/v1/applications/{card['application_id']}",
                json={"company": "  Globex  ", "role": " Staff Engineer "},
            )
        assert resp.json()["company"] == "Globex"
        assert resp.json()["role"] == "Staff Engineer"

    async def test_editing_company_leaves_tags_and_position_untouched(self, isolated_db):
        card = await _seed_card(isolated_db, status="interview")
        async with _client() as client:
            tag = (await client.post("/api/v1/tags", json={"label": "Psychometric"})).json()
            await client.put(
                f"/api/v1/applications/{card['application_id']}/tags",
                json={"tag_ids": [tag["tag_id"]]},
            )
            resp = await client.patch(
                f"/api/v1/applications/{card['application_id']}", json={"company": "Globex"}
            )
        body = resp.json()
        assert [t["label"] for t in body["tags"]] == ["Psychometric"]
        assert body["status"] == "interview"
        assert body["position"] == card["position"]
