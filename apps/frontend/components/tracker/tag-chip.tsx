'use client';

import React from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import { useTranslations } from '@/lib/i18n';
import type { Tag, TagColor } from '@/lib/api/tracker';

/**
 * Palette key → swatch class. Tags store a NAME, never hex, so the chip can
 * only ever render a Swiss-palette colour (see tokens.md). The swatch is a
 * 12px square — the design system's status indicator, not a dot.
 */
const SWATCH_CLASS: Record<TagColor, string> = {
  ink: 'bg-ink',
  blue: 'bg-primary',
  green: 'bg-success',
  orange: 'bg-warning',
  red: 'bg-destructive',
  grey: 'bg-steel-grey',
};

export function TagSwatch({ color, className = '' }: { color: TagColor; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-3 w-3 shrink-0 border border-black ${SWATCH_CLASS[color]} ${className}`}
    />
  );
}

interface TagChipProps {
  tag: Tag;
  /** Renders a remove button; omit for a read-only chip (e.g. on a card). */
  onRemove?: (tagId: string) => void;
  /** Dims the chip while a tag write is in flight. */
  disabled?: boolean;
}

export function TagChip({ tag, onRemove, disabled = false }: TagChipProps) {
  const { t } = useTranslations();

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 border border-black bg-background px-1 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <TagSwatch color={tag.color} />
      <span className="truncate">{tag.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(tag.tag_id)}
          disabled={disabled}
          aria-label={t('tracker.tags.removeAria', { label: tag.label })}
          className="shrink-0 text-steel-grey hover:text-destructive disabled:pointer-events-none"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
