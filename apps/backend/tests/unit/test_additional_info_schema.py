"""Unit tests for AdditionalInfo.additionalGroups (freeform named sections)."""

from app.schemas.models import AdditionalGroup, AdditionalInfo


def test_additional_info_defaults_to_empty_additional_groups() -> None:
    info = AdditionalInfo()
    assert info.additionalGroups == []


def test_additional_group_coerces_newline_separated_items_string() -> None:
    info = AdditionalInfo(
        additionalGroups=[{"id": "g1", "label": "Languages", "items": "Spanish\nFrench"}]
    )
    assert info.additionalGroups == [
        AdditionalGroup(id="g1", label="Languages", items=["Spanish", "French"])
    ]


def test_additional_groups_are_not_limited_to_skills() -> None:
    """Groups are freeform sections (Publications, Volunteer Work, ...), not skill-specific."""
    info = AdditionalInfo(
        technicalSkills=["Python"],
        additionalGroups=[
            {"id": "g1", "label": "Publications", "items": ['"Scaling Postgres" (2024)']},
            {"id": "g2", "label": "Volunteer Work", "items": ["Code for Good mentor"]},
        ],
    )
    assert info.technicalSkills == ["Python"]
    assert [g.label for g in info.additionalGroups] == ["Publications", "Volunteer Work"]
    assert info.additionalGroups[1].items == ["Code for Good mentor"]


def test_malformed_additional_groups_value_normalizes_to_empty_list() -> None:
    info = AdditionalInfo(additionalGroups="not-a-list")  # type: ignore[arg-type]
    assert info.additionalGroups == []
