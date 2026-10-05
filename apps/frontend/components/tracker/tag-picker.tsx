'use client';

import React, { useMemo, useState } from 'react';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dropdown } from '@/components/ui/dropdown';
import { useTranslations } from '@/lib/i18n';
import {
  TAG_CATEGORY_ORDER,
  TAG_COLOR_ORDER,
  TAG_LABEL_MAX_LENGTH,
  type Tag,
  type TagCategory,
  type TagColor,
  type TagWithUsage,
} from '@/lib/api/tracker';
import { TagChip, TagSwatch } from './tag-chip';

/**
 * Suggested starter tags, keyed into `tracker.tags.suggestions.*` so they
 * arrive in the UI language. Picking one *creates a real tag* with the
 * translated label — tags are user data, so they are never stored as i18n keys.
 */
const SUGGESTIONS: { key: string; category: TagCategory; color: TagColor }[] = [
  { key: 'psychometric', category: 'activity', color: 'blue' },
  { key: 'oneWayInterview', category: 'activity', color: 'blue' },
  { key: 'phoneScreen', category: 'activity', color: 'blue' },
  { key: 'takeHomeTask', category: 'activity', color: 'blue' },
  { key: 'technicalInterview', category: 'activity', color: 'blue' },
  { key: 'assessmentCentre', category: 'activity', color: 'blue' },
  { key: 'finalInterview', category: 'activity', color: 'green' },
  { key: 'offerReceived', category: 'activity', color: 'green' },
  { key: 'ghosted', category: 'rejection', color: 'red' },
  { key: 'rejectedAfterInterview', category: 'rejection', color: 'red' },
  { key: 'salaryMismatch', category: 'rejection', color: 'orange' },
  { key: 'notEnoughExperience', category: 'rejection', color: 'orange' },
  { key: 'roleWithdrawn', category: 'rejection', color: 'orange' },
  { key: 'declinedOffer', category: 'rejection', color: 'grey' },
];

interface TagPickerProps {
  /** Tags currently on this card. */
  value: Tag[];
  /** Every tag defined by the user (the registry the picker toggles from). */
  allTags: TagWithUsage[];
  /** Replace the card's tag set. */
  onChange: (tagIds: string[]) => Promise<void>;
  /** Create a tag in the registry and return it (already deduped server-side). */
  onCreateTag: (label: string, category: TagCategory, color: TagColor) => Promise<Tag>;
  /** Remove a tag from the registry entirely. */
  onDeleteTag: (tagId: string) => Promise<void>;
  disabled?: boolean;
}

export function TagPicker({
  value,
  allTags,
  onChange,
  onCreateTag,
  onDeleteTag,
  disabled = false,
}: TagPickerProps) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<TagCategory>('activity');
  const [newColor, setNewColor] = useState<TagColor>('blue');
  // Two-step delete: the first click arms this tag, the second removes it.
  // Avoids nesting a confirm dialog inside the card modal.
  const [armedForDelete, setArmedForDelete] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(value.map((tag) => tag.tag_id)), [value]);

  // Existing labels, lowercased — mirrors the backend's case-insensitive
  // uniqueness so suggestions and the create button don't offer duplicates.
  const existingLabels = useMemo(
    () => new Set(allTags.map((tag) => tag.label.toLowerCase())),
    [allTags]
  );

  const grouped = useMemo(
    () =>
      TAG_CATEGORY_ORDER.map((category) => ({
        category,
        tags: allTags.filter((tag) => tag.category === category),
      })).filter((group) => group.tags.length > 0),
    [allTags]
  );

  const unusedSuggestions = useMemo(
    () =>
      SUGGESTIONS.map((suggestion) => ({
        ...suggestion,
        label: t(`tracker.tags.suggestions.${suggestion.key}`),
      })).filter((suggestion) => !existingLabels.has(suggestion.label.toLowerCase())),
    [existingLabels, t]
  );

  const trimmedNewLabel = newLabel.trim();
  const canCreate =
    trimmedNewLabel.length > 0 && !existingLabels.has(trimmedNewLabel.toLowerCase());

  /** Run a tag write, surfacing a generic message on failure. */
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      // Never echo raw backend error text — it could carry sensitive values.
      setError(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (tagId: string) =>
    run(async () => {
      const next = selectedIds.has(tagId)
        ? value.filter((tag) => tag.tag_id !== tagId).map((tag) => tag.tag_id)
        : [...value.map((tag) => tag.tag_id), tagId];
      await onChange(next);
    });

  const remove = (tagId: string) =>
    run(async () => {
      await onChange(value.filter((tag) => tag.tag_id !== tagId).map((tag) => tag.tag_id));
    });

  /** Create a tag and apply it to this card in one go. */
  const createAndApply = (label: string, category: TagCategory, color: TagColor) =>
    run(async () => {
      const created = await onCreateTag(label, category, color);
      if (!selectedIds.has(created.tag_id)) {
        await onChange([...value.map((tag) => tag.tag_id), created.tag_id]);
      }
    });

  /** The custom-tag form: create, apply, then clear the input it came from.
      Suggestions deliberately don't clear it — a half-typed custom label must
      survive clicking a suggestion. */
  const createFromForm = async () => {
    await createAndApply(trimmedNewLabel, newCategory, newColor);
    setNewLabel('');
  };

  const confirmDelete = (tagId: string) =>
    run(async () => {
      await onDeleteTag(tagId);
      setArmedForDelete(null);
    });

  const busyOrDisabled = busy || disabled;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t('tracker.tags.label')}</Label>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-primary hover:underline"
        >
          <Plus className="h-3 w-3" />
          {open ? t('tracker.tags.done') : t('tracker.tags.add')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {value.length === 0 ? (
          <p className="font-mono text-xs text-steel-grey">{t('tracker.tags.none')}</p>
        ) : (
          value.map((tag) => (
            <TagChip key={tag.tag_id} tag={tag} onRemove={remove} disabled={busyOrDisabled} />
          ))
        )}
        {busy && <Loader2 className="h-3 w-3 animate-spin text-steel-grey" />}
      </div>

      {error && <p className="font-mono text-xs text-destructive">{error}</p>}

      {open && (
        <div className="space-y-4 border border-black bg-paper-tint p-3">
          {/* Toggle tags already in the registry */}
          {grouped.length > 0 && (
            <div className="space-y-2">
              {grouped.map((group) => (
                <div key={group.category} className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-steel-grey">
                    {t(`tracker.tags.categories.${group.category}`)}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.tags.map((tag) => {
                      const armed = armedForDelete === tag.tag_id;
                      return (
                        <div key={tag.tag_id} className="flex items-center gap-2">
                          <label className="flex min-w-0 flex-1 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(tag.tag_id)}
                              onChange={() => toggle(tag.tag_id)}
                              disabled={busyOrDisabled}
                              className="h-4 w-4 shrink-0 rounded-none border-black accent-primary"
                            />
                            <TagSwatch color={tag.color} />
                            <span className="truncate font-mono text-xs text-ink">{tag.label}</span>
                            <span className="shrink-0 font-mono text-[10px] text-steel-grey">
                              {t('tracker.tags.usage', { count: String(tag.usage_count) })}
                            </span>
                          </label>
                          {armed ? (
                            <button
                              type="button"
                              onClick={() => confirmDelete(tag.tag_id)}
                              disabled={busyOrDisabled}
                              className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-destructive hover:underline disabled:pointer-events-none"
                            >
                              {t('tracker.tags.confirmDelete')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setArmedForDelete(tag.tag_id)}
                              disabled={busyOrDisabled}
                              aria-label={t('tracker.tags.deleteAria', { label: tag.label })}
                              className="shrink-0 text-steel-grey hover:text-destructive disabled:pointer-events-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* One-click starter tags, in the UI language */}
          {unusedSuggestions.length > 0 && (
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-wide text-steel-grey">
                {t('tracker.tags.suggested')}
              </p>
              <div className="flex flex-wrap gap-1">
                {unusedSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.key}
                    type="button"
                    onClick={() =>
                      createAndApply(suggestion.label, suggestion.category, suggestion.color)
                    }
                    disabled={busyOrDisabled}
                    className="inline-flex items-center gap-1 border border-black bg-background px-1 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink shadow-sw-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:text-primary hover:shadow-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create a custom tag */}
          <div className="space-y-2 border-t border-black pt-3">
            <Label htmlFor="new-tag-label">{t('tracker.tags.createLabel')}</Label>
            <Input
              id="new-tag-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={TAG_LABEL_MAX_LENGTH}
              placeholder={t('tracker.tags.createPlaceholder')}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-tag-category">{t('tracker.tags.category')}</Label>
                <Dropdown
                  options={TAG_CATEGORY_ORDER.map((category) => ({
                    id: category,
                    label: t(`tracker.tags.categories.${category}`),
                  }))}
                  value={newCategory}
                  onChange={(next) => setNewCategory(next as TagCategory)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t('tracker.tags.color')}</Label>
                <div className="flex items-center gap-1">
                  {TAG_COLOR_ORDER.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      aria-label={t(`tracker.tags.colors.${color}`)}
                      aria-pressed={newColor === color}
                      className={`flex h-8 w-8 items-center justify-center border border-black bg-background ${
                        newColor === color ? 'shadow-sw-xs' : ''
                      }`}
                    >
                      <TagSwatch color={color} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={createFromForm}
              disabled={busyOrDisabled || !canCreate}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('tracker.tags.create')}
            </Button>
            {trimmedNewLabel.length > 0 && !canCreate && (
              <p className="font-mono text-xs text-warning">{t('tracker.tags.duplicate')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
