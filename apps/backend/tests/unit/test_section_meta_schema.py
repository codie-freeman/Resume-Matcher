"""Unit tests for SectionMeta.fontSize (per-section font-size override)."""

from app.schemas.models import SectionMeta, SectionType


def _section(**overrides: object) -> SectionMeta:
    defaults = {
        "id": "summary",
        "key": "summary",
        "displayName": "Summary",
        "sectionType": SectionType.TEXT,
    }
    defaults.update(overrides)
    return SectionMeta(**defaults)  # type: ignore[arg-type]


def test_font_size_defaults_to_none() -> None:
    assert _section().fontSize is None


def test_font_size_accepts_a_valid_level() -> None:
    assert _section(fontSize=4).fontSize == 4


def test_font_size_clamps_out_of_range_values() -> None:
    assert _section(fontSize=0).fontSize == 1
    assert _section(fontSize=99).fontSize == 5
    assert _section(fontSize=-3).fontSize == 1


def test_font_size_normalizes_blank_or_invalid_input_to_none() -> None:
    assert _section(fontSize="").fontSize is None
    assert _section(fontSize=None).fontSize is None
    assert _section(fontSize="not-a-number").fontSize is None
