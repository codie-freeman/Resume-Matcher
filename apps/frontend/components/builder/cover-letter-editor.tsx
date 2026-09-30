'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Save, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { stripHtml, toRichTextHtml } from '@/lib/utils/rich-text';

// Tiptap needs the DOM, so load it client-only (matches the other
// RichTextEditor call sites in components/builder/forms/*).
const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor').then((m) => m.RichTextEditor),
  { ssr: false }
);

export interface CoverLetterEditorProps {
  /** Cover letter content */
  content: string;
  /** Callback when content changes */
  onChange: (content: string) => void;
  /** Callback when save is triggered */
  onSave: () => void;
  /** Whether save is in progress */
  isSaving: boolean;
  /** Additional class names */
  className?: string;
}

export function CoverLetterEditor({
  content,
  onChange,
  onSave,
  isSaving,
  className,
}: CoverLetterEditorProps) {
  const { t } = useTranslations();
  const plainText = stripHtml(content);
  const wordCount = plainText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = plainText.length;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black bg-[#F5F5F0]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
            {t('coverLetter.title')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-steel-grey">
            {t('builder.contentStats.wordsChars', { wordCount, charCount })}
          </span>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        <RichTextEditor
          value={toRichTextHtml(content)}
          onChange={onChange}
          placeholder={t('coverLetter.editor.placeholder')}
          allowParagraphs
          minHeight="60vh"
        />
      </div>

      {/* Footer Tips */}
      <div className="p-4 border-t border-paper-tint bg-[#F5F5F0]">
        <p className="font-mono text-xs text-steel-grey">{t('coverLetter.editor.tip')}</p>
      </div>
    </div>
  );
}
