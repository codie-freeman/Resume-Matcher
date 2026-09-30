/**
 * Cover Letter Print Page
 *
 * This page renders a cover letter for PDF generation.
 * Uses the same API fetch pattern as the resume print page.
 */

import type { Metadata } from 'next';
import { API_BASE } from '@/lib/api/client';
import { translate } from '@/lib/i18n/server';
import { resolveLocale } from '@/lib/i18n/locale';
import { sanitizeRichText } from '@/lib/utils/html-sanitizer';
import { stripHtml, toRichTextHtml } from '@/lib/utils/rich-text';

// Overrides the root layout's "Resume Matcher" title so the PDF's embedded
// /Title metadata (which Chromium's print-to-PDF reads from <title>) reads
// as the candidate's own document rather than the app name.
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const locale = resolveLocale(resolvedSearchParams?.lang);

  // Reuses the page's own fetch; React memoizes identical requests within a
  // single render pass, so this costs no extra round trip. A failure here is
  // swallowed so the page body reports the real error instead of metadata.
  let name: string;
  try {
    const { personalInfo } = await fetchCoverLetterData(resolvedParams.id);
    name = personalInfo.name?.trim() || translate(locale, 'resume.defaults.name');
  } catch {
    name = translate(locale, 'resume.defaults.name');
  }

  return { title: translate(locale, 'coverLetter.pdfTitle', { name }) };
}

const PAGE_DIMENSIONS = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
} as const;

type PageSize = 'A4' | 'LETTER';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    pageSize?: string;
    lang?: string;
  }>;
};

interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

interface CoverLetterData {
  coverLetter: string;
  personalInfo: PersonalInfo;
}

async function fetchCoverLetterData(resumeId: string): Promise<CoverLetterData> {
  const res = await fetch(`${API_BASE}/resumes?resume_id=${encodeURIComponent(resumeId)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to load resume (status ${res.status}).`);
  }
  const payload = (await res.json()) as {
    data: {
      cover_letter?: string;
      processed_resume?: {
        personalInfo?: PersonalInfo;
      };
    };
  };

  return {
    coverLetter: payload.data.cover_letter || '',
    personalInfo: payload.data.processed_resume?.personalInfo || {},
  };
}

function parsePageSize(value: string | undefined): PageSize {
  if (value === 'A4' || value === 'LETTER') {
    return value;
  }
  return 'A4';
}

export default async function PrintCoverLetterPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const pageSize = parsePageSize(resolvedSearchParams?.pageSize);
  const pageDims = PAGE_DIMENSIONS[pageSize];
  const locale = resolveLocale(resolvedSearchParams?.lang);

  // Fetch cover letter data from API (same pattern as resume)
  const { coverLetter, personalInfo } = await fetchCoverLetterData(resolvedParams.id);

  // Standard cover letter margins
  const margins = { top: 25, right: 25, bottom: 25, left: 25 };

  // Get today's date formatted
  const today = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const nameFallback = translate(locale, 'resume.defaults.name');

  const hasContent = stripHtml(coverLetter).trim().length > 0;
  const safeHtml = hasContent ? sanitizeRichText(toRichTextHtml(coverLetter)) : '';

  return (
    <div
      className="cover-letter-print bg-white"
      style={{
        width: `${pageDims.width}mm`,
        minHeight: `${pageDims.height}mm`,
        padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
        boxSizing: 'border-box',
        fontFamily: 'Georgia, serif',
        color: '#000000',
      }}
    >
      {/* Header - Personal Info */}
      <header
        style={{
          marginBottom: '8mm',
          paddingBottom: '4mm',
          borderBottom: '2px solid #000',
        }}
      >
        <h1
          style={{
            fontSize: '18pt',
            fontWeight: 'bold',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {personalInfo.name || nameFallback}
        </h1>
        <div
          style={{
            marginTop: '2mm',
            fontSize: '9pt',
            fontFamily: 'monospace',
            color: '#666',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4mm',
          }}
        >
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
        </div>
      </header>

      {/* Date */}
      <div
        style={{
          marginBottom: '8mm',
          fontSize: '10pt',
          fontFamily: 'monospace',
          color: '#666',
        }}
      >
        {today}
      </div>

      {/* Body */}
      <div style={{ lineHeight: '1.6' }}>
        {hasContent ? (
          <div
            style={{ fontSize: '11pt' }}
            className="[&_p]:m-0 [&_p]:mb-[4mm] [&_p]:text-justify [&_p:last-child]:mb-0 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-[4mm] [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-[4mm]"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <p style={{ fontSize: '11pt', color: '#999' }}>
            {translate(locale, 'coverLetter.print.emptyContent')}
          </p>
        )}
      </div>
    </div>
  );
}
