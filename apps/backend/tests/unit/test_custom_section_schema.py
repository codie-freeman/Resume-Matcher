"""Unit tests for CustomSection.additionalGroups (sub-grouping within a custom section)."""

from app.schemas.models import AdditionalGroup, CustomSection, SectionType


def test_custom_section_defaults_to_empty_additional_groups() -> None:
    section = CustomSection(sectionType=SectionType.STRING_LIST)
    assert section.additionalGroups == []


def test_custom_section_coerces_additional_groups() -> None:
    section = CustomSection(
        sectionType=SectionType.STRING_LIST,
        strings=["Python"],
        additionalGroups=[{"id": "g1", "label": "Journals", "items": "Paper One\nPaper Two"}],
    )
    assert section.strings == ["Python"]
    assert section.additionalGroups == [
        AdditionalGroup(id="g1", label="Journals", items=["Paper One", "Paper Two"])
    ]


def test_malformed_custom_section_additional_groups_normalizes_to_empty_list() -> None:
    section = CustomSection(
        sectionType=SectionType.STRING_LIST,
        additionalGroups="not-a-list",  # type: ignore[arg-type]
    )
    assert section.additionalGroups == []
