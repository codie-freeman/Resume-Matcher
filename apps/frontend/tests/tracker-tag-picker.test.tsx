import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TagPicker } from '@/components/tracker/tag-picker';
import type { Tag, TagCategory, TagColor, TagWithUsage } from '@/lib/api/tracker';

// `t` echoes the key, and appends params so aria-labels stay addressable.
vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}|${Object.values(params).join(',')}` : key,
  }),
}));

function tag(id: string, label: string, overrides: Partial<TagWithUsage> = {}): TagWithUsage {
  return {
    tag_id: id,
    label,
    category: 'activity',
    color: 'blue',
    usage_count: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderPicker(props: {
  value?: Tag[];
  allTags?: TagWithUsage[];
  onChange?: (ids: string[]) => Promise<void>;
  onCreateTag?: (label: string, category: TagCategory, color: TagColor) => Promise<Tag>;
  onDeleteTag?: (id: string) => Promise<void>;
}) {
  const onChange = props.onChange ?? vi.fn().mockResolvedValue(undefined);
  const onCreateTag =
    props.onCreateTag ?? vi.fn().mockResolvedValue(tag('new', 'Created', { usage_count: 0 }));
  const onDeleteTag = props.onDeleteTag ?? vi.fn().mockResolvedValue(undefined);
  render(
    <TagPicker
      value={props.value ?? []}
      allTags={props.allTags ?? []}
      onChange={onChange}
      onCreateTag={onCreateTag}
      onDeleteTag={onDeleteTag}
    />
  );
  return { onChange, onCreateTag, onDeleteTag };
}

/** Open the "add tag" panel. */
const openPanel = () => fireEvent.click(screen.getByText('tracker.tags.add'));

describe('TagPicker', () => {
  it('shows the empty state when the card has no tags', () => {
    renderPicker({});
    expect(screen.getByText('tracker.tags.none')).toBeInTheDocument();
  });

  it('renders the card tags as chips', () => {
    renderPicker({ value: [tag('t1', 'Psychometric'), tag('t2', 'Ghosted')] });
    expect(screen.getByText('Psychometric')).toBeInTheDocument();
    expect(screen.getByText('Ghosted')).toBeInTheDocument();
  });

  it('removing a chip submits the remaining tag ids', async () => {
    const { onChange } = renderPicker({
      value: [tag('t1', 'Psychometric'), tag('t2', 'Ghosted')],
    });
    fireEvent.click(screen.getByLabelText('tracker.tags.removeAria|Psychometric'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['t2']));
  });

  it('ticking an unselected tag adds it to the existing set', async () => {
    const { onChange } = renderPicker({
      value: [tag('t1', 'Psychometric')],
      allTags: [tag('t1', 'Psychometric'), tag('t2', 'Take-home task')],
    });
    openPanel();
    const checkboxes = screen.getAllByRole('checkbox');
    // Second row is the unselected tag.
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
    fireEvent.click(checkboxes[1]);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['t1', 't2']));
  });

  it('unticking a selected tag drops just that one', async () => {
    const { onChange } = renderPicker({
      value: [tag('t1', 'Psychometric'), tag('t2', 'Take-home task')],
      allTags: [tag('t1', 'Psychometric'), tag('t2', 'Take-home task')],
    });
    openPanel();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['t2']));
  });

  it('groups the registry by category', () => {
    renderPicker({
      allTags: [
        tag('t1', 'Psychometric', { category: 'activity' }),
        tag('t2', 'Salary mismatch', { category: 'rejection' }),
      ],
    });
    openPanel();
    // The category name also labels the create-form dropdown, so target the
    // group heading specifically and assert each tag sits under its own group.
    const heading = (category: string) =>
      screen.getAllByText(`tracker.tags.categories.${category}`).find((el) => el.tagName === 'P');

    const activity = heading('activity');
    const rejection = heading('rejection');
    expect(activity?.parentElement).toHaveTextContent('Psychometric');
    expect(activity?.parentElement).not.toHaveTextContent('Salary mismatch');
    expect(rejection?.parentElement).toHaveTextContent('Salary mismatch');
    expect(rejection?.parentElement).not.toHaveTextContent('Psychometric');
  });

  it('hides suggestions whose label already exists, case-insensitively', () => {
    renderPicker({
      // The mocked `t` returns the key, so the suggestion label IS the key.
      allTags: [tag('t1', 'TRACKER.TAGS.SUGGESTIONS.PSYCHOMETRIC')],
    });
    openPanel();
    expect(screen.queryByText('tracker.tags.suggestions.psychometric')).not.toBeInTheDocument();
    expect(screen.getByText('tracker.tags.suggestions.ghosted')).toBeInTheDocument();
  });

  it('clicking a suggestion creates the tag then applies it to the card', async () => {
    const created = tag('t9', 'tracker.tags.suggestions.psychometric');
    const onCreateTag = vi.fn().mockResolvedValue(created);
    const { onChange } = renderPicker({ value: [tag('t1', 'Existing')], onCreateTag });
    openPanel();
    fireEvent.click(screen.getByText('tracker.tags.suggestions.psychometric'));

    await waitFor(() =>
      expect(onCreateTag).toHaveBeenCalledWith(
        'tracker.tags.suggestions.psychometric',
        'activity',
        'blue'
      )
    );
    // Applied on top of what the card already had, not replacing it.
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['t1', 't9']));
  });

  it('creates a custom tag with the chosen category and color', async () => {
    const created = tag('t9', 'Second interview');
    const onCreateTag = vi.fn().mockResolvedValue(created);
    const { onChange } = renderPicker({ onCreateTag });
    openPanel();

    fireEvent.change(screen.getByLabelText('tracker.tags.createLabel'), {
      target: { value: '  Second interview  ' },
    });
    fireEvent.click(screen.getByLabelText('tracker.tags.colors.red'));
    fireEvent.click(screen.getByRole('button', { name: 'tracker.tags.create' }));

    // The label is trimmed before it is sent.
    await waitFor(() =>
      expect(onCreateTag).toHaveBeenCalledWith('Second interview', 'activity', 'red')
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['t9']));
  });

  it('clears the custom label after creating from the form', async () => {
    const onCreateTag = vi.fn().mockResolvedValue(tag('t9', 'Second interview'));
    renderPicker({ onCreateTag });
    openPanel();
    const input = () => screen.getByLabelText('tracker.tags.createLabel') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'Second interview' } });
    fireEvent.click(screen.getByRole('button', { name: 'tracker.tags.create' }));
    await waitFor(() => expect(input().value).toBe(''));
  });

  it('keeps a half-typed custom label when a suggestion is clicked', async () => {
    const onCreateTag = vi.fn().mockResolvedValue(tag('t9', 'Ghosted'));
    renderPicker({ onCreateTag });
    openPanel();
    const input = () => screen.getByLabelText('tracker.tags.createLabel') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'Reference check' } });

    fireEvent.click(screen.getByText('tracker.tags.suggestions.ghosted'));
    await waitFor(() => expect(onCreateTag).toHaveBeenCalled());
    // The suggestion is a separate path — it must not wipe what was typed.
    expect(input().value).toBe('Reference check');
  });

  it('blocks creating a label that already exists and says why', () => {
    renderPicker({ allTags: [tag('t1', 'Psychometric')] });
    openPanel();
    fireEvent.change(screen.getByLabelText('tracker.tags.createLabel'), {
      target: { value: 'psychometric' },
    });
    expect(screen.getByRole('button', { name: 'tracker.tags.create' })).toBeDisabled();
    expect(screen.getByText('tracker.tags.duplicate')).toBeInTheDocument();
  });

  it('keeps the create button disabled for a blank label', () => {
    renderPicker({});
    openPanel();
    fireEvent.change(screen.getByLabelText('tracker.tags.createLabel'), {
      target: { value: '   ' },
    });
    expect(screen.getByRole('button', { name: 'tracker.tags.create' })).toBeDisabled();
  });

  it('requires a second click to delete a tag from the registry', async () => {
    const onDeleteTag = vi.fn().mockResolvedValue(undefined);
    renderPicker({ allTags: [tag('t1', 'Typo tag', { usage_count: 3 })], onDeleteTag });
    openPanel();

    fireEvent.click(screen.getByLabelText('tracker.tags.deleteAria|Typo tag'));
    // Armed, not deleted — one stray click can't drop a tag used by 3 cards.
    expect(onDeleteTag).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('tracker.tags.confirmDelete'));
    await waitFor(() => expect(onDeleteTag).toHaveBeenCalledWith('t1'));
  });

  it('shows how many cards carry each tag', () => {
    renderPicker({ allTags: [tag('t1', 'Psychometric', { usage_count: 4 })] });
    openPanel();
    expect(screen.getByText('tracker.tags.usage|4')).toBeInTheDocument();
  });

  it('surfaces a generic error when a tag write fails', async () => {
    const onChange = vi.fn().mockRejectedValue(new Error('boom'));
    renderPicker({ value: [tag('t1', 'Psychometric')], onChange });
    fireEvent.click(screen.getByLabelText('tracker.tags.removeAria|Psychometric'));
    // Generic copy only — raw backend text could carry sensitive values.
    await waitFor(() => expect(screen.getByText('common.error')).toBeInTheDocument());
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });
});
