import type { AdditionalGroup } from '@/components/dashboard/resume-component';

export function createAdditionalGroupId(): string {
  return `additional-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Drop blank/whitespace-only entries so empty lines (e.g. from editing in the
// builder) never render in the resume or PDF, matching the technicalSkills
// convention (issue #763).
export function cleanAdditionalGroupItems(items?: string[]): string[] {
  return (items ?? []).filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
}

// Groups ready for rendering: blank items filtered out, unnamed or empty groups dropped.
export function getVisibleAdditionalGroups(groups?: AdditionalGroup[]): AdditionalGroup[] {
  return (groups ?? [])
    .map((group) => ({ ...group, items: cleanAdditionalGroupItems(group.items) }))
    .filter((group) => group.label.trim() !== '' && group.items.length > 0);
}
