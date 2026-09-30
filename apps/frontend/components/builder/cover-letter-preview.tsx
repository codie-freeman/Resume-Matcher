'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { sanitizeRichText } from '@/lib/utils/html-sanitizer';
import { stripHtml, toRichTextHtml } from '@/lib/utils/rich-text';

export interface CoverLetterPersonalInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface CoverLetterPreviewProps {
  /** Cover letter content */
  content: string;
  /** Personal info for header */
  personalInfo: CoverLetterPersonalInfo;
  /** Page size for styling */
  pageSize?: 'A4' | 'LETTER';
  /** Additional class names */
  className?: string;
}

export function CoverLetterPreview({
  content,
  personalInfo,
  pageSize = 'A4',
  className,
}: CoverLetterPreviewProps) {
  const { t, locale } = useTranslations();
  const today = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const hasContent = stripHtml(content).trim().length > 0;
  const safeHtml = hasContent ? sanitizeRichText(toRichTextHtml(content)) : '';

  return (
    <div
      className={cn(
        'bg-white border-2 border-black',
        'shadow-sw-default',
        'overflow-hidden',
        className
      )}
    >
      {/* Letter Content */}
      <div
        className={cn('p-8 md:p-12', pageSize === 'A4' ? 'min-h-[297mm]' : 'min-h-[11in]')}
        style={{
          maxWidth: pageSize === 'A4' ? '210mm' : '8.5in',
        }}
      >
        {/* Header - Personal Info */}
        <header className="mb-8 border-b-2 border-black pb-4">
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {personalInfo.name || t('coverLetter.preview.defaultName')}
          </h1>
          <div className="mt-2 font-mono text-xs text-ink-soft flex flex-wrap gap-x-4 gap-y-1">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          </div>
        </header>

        {/* Date */}
        <div className="mb-8">
          <p className="font-mono text-sm text-ink-soft">{today}</p>
        </div>

        {/* Body */}
        {hasContent ? (
          <div
            className={cn(
              'font-serif text-base leading-relaxed text-ink-soft',
              '[&_p]:mb-4 [&_p:last-child]:mb-0',
              '[&_strong]:font-bold [&_em]:italic [&_u]:underline',
              '[&_a]:text-blue-700 [&_a]:underline',
              '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4',
              '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4'
            )}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <div className="text-center py-12 text-steel-grey">
            <p className="font-mono text-sm">{t('coverLetter.preview.emptyTitle')}</p>
            <p className="font-mono text-xs mt-2">{t('coverLetter.preview.emptyDescription')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
