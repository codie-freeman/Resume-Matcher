'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import {
  createTag,
  deleteTag,
  getApplicationDetail,
  setApplicationTags,
  updateApplication,
  type ApplicationDetail,
  type Tag,
  type TagCategory,
  type TagColor,
  type TagWithUsage,
} from '@/lib/api/tracker';
import { TagPicker } from './tag-picker';

interface CardDetailModalProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  /** The tag registry, owned by the board so it is fetched once. */
  allTags: TagWithUsage[];
  /** Re-fetch the registry after a tag is created or deleted here. */
  onTagsChanged: () => void;
}

export function CardDetailModal({
  applicationId,
  open,
  onOpenChange,
  onUpdated,
  allTags,
  onTagsChanged,
}: CardDetailModalProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  // Company/role/notes are edited together and saved in one PATCH — the board
  // is the only place these are editable, and retyping a mis-extracted company
  // name shouldn't mean leaving the page.
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !applicationId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getApplicationDetail(applicationId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setCompany(data.company ?? '');
        setRole(data.role ?? '');
        setNotes(data.notes ?? '');
        setTags(data.tags ?? []);
        setSaveError(null);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, applicationId]);

  // Keep textarea Enter from bubbling to dialog/global handlers.
  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') e.stopPropagation();
  };

  // Compare against the loaded card so the save button only lights up on a
  // real change. Blank input and a null field are the same thing.
  const dirty =
    detail !== null &&
    (company.trim() !== (detail.company ?? '') ||
      role.trim() !== (detail.role ?? '') ||
      notes !== (detail.notes ?? ''));

  const handleSave = async () => {
    if (!applicationId || !detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateApplication(applicationId, {
        company: company.trim(),
        role: role.trim(),
        notes,
      });
      // Re-sync from the server response (it normalizes blanks to null) so the
      // dirty check settles and the header shows the stored value.
      setDetail({ ...detail, ...updated });
      setCompany(updated.company ?? '');
      setRole(updated.role ?? '');
      setNotes(updated.notes ?? '');
      onUpdated();
    } catch {
      // Show a generic message — never echo raw backend error text inline,
      // which could contain sensitive values.
      setSaveError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleTagsChange = async (tagIds: string[]) => {
    if (!applicationId) return;
    const updated = await setApplicationTags(applicationId, tagIds);
    setTags(updated.tags);
    onUpdated();
  };

  const handleCreateTag = async (
    label: string,
    category: TagCategory,
    color: TagColor
  ): Promise<Tag> => {
    const created = await createTag({ label, category, color });
    onTagsChanged();
    return created;
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTag(tagId);
    setTags((prev) => prev.filter((tag) => tag.tag_id !== tagId));
    onTagsChanged();
    onUpdated();
  };

  const resumeAvailable = Boolean(detail?.resume);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>{detail?.company || t('tracker.card.companyUnknown')}</DialogTitle>
          <DialogDescription>{detail?.role || t('tracker.card.roleUnknown')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-steel-grey" />
          </div>
        ) : detail ? (
          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase text-ink-soft">
              <span className="border border-black bg-paper-tint px-2 py-0.5">
                {t(`tracker.columns.${detail.status}`)}
              </span>
              {detail.applied_at && (
                <span>
                  {new Date(detail.applied_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="card-company">{t('tracker.modal.company')}</Label>
                <Input
                  id="card-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={t('tracker.card.companyUnknown')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-role">{t('tracker.modal.role')}</Label>
                <Input
                  id="card-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={t('tracker.card.roleUnknown')}
                />
              </div>
            </div>

            <TagPicker
              value={tags}
              allTags={allTags}
              onChange={handleTagsChange}
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
              disabled={saving}
            />

            <div className="space-y-1">
              <Label>{t('tracker.modal.jobDescription')}</Label>
              <div className="max-h-48 overflow-y-auto whitespace-pre-wrap border border-black bg-background p-3 text-sm">
                {detail.job_content || t('tracker.modal.noJobDescription')}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="card-notes">{t('tracker.modal.notes')}</Label>
              <Textarea
                id="card-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={handleNotesKeyDown}
                placeholder={t('tracker.modal.notesPlaceholder')}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {saveError && <span className="font-mono text-xs text-destructive">{saveError}</span>}
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || !dirty}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('tracker.modal.saveDetails')
                )}
              </Button>
            </div>

            {!resumeAvailable && (
              <p className="font-mono text-xs text-warning">
                {t('tracker.modal.resumeUnavailable')}
              </p>
            )}
          </div>
        ) : (
          <p className="py-6 text-center font-mono text-sm text-steel-grey">
            {t('tracker.modal.loadFailed')}
          </p>
        )}

        <DialogFooter className="mt-4 shrink-0">
          <Button
            onClick={() => {
              if (detail?.resume_id) router.push(`/builder?id=${detail.resume_id}`);
            }}
            disabled={!resumeAvailable}
          >
            <Pencil className="h-4 w-4" />
            {t('tracker.modal.editResume')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
