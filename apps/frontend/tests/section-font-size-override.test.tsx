import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ResumeSingleColumn } from '@/components/resume/resume-single-column';
import { DEFAULT_SECTION_META } from '@/lib/utils/section-helpers';
import type { ResumeData } from '@/components/dashboard/resume-component';

function buildData(): ResumeData {
  const sectionMeta = DEFAULT_SECTION_META.map((section) =>
    section.id === 'summary' ? { ...section, fontSize: 5 as const } : section
  );

  return {
    personalInfo: { name: 'Jane Doe' },
    summary: 'Experienced engineer.',
    workExperience: [
      {
        id: 1,
        title: 'Engineer',
        company: 'Acme',
        years: '2020-Present',
        description: ['Did things'],
      },
    ],
    sectionMeta,
  } as ResumeData;
}

describe('Per-section font-size override (rendering)', () => {
  it('sets --font-size-base inline style only on the overridden section, not on others', () => {
    const { container } = render(<ResumeSingleColumn data={buildData()} />);

    const summaryHeading = Array.from(container.querySelectorAll('h3')).find(
      (el) => el.textContent === 'Summary'
    );
    const experienceHeading = Array.from(container.querySelectorAll('h3')).find(
      (el) => el.textContent === 'Experience'
    );

    const summarySection = summaryHeading?.closest('div');
    const experienceSection = experienceHeading?.closest('div');

    expect(summarySection?.style.getPropertyValue('--font-size-base')).toBe('16px');
    expect(experienceSection?.style.getPropertyValue('--font-size-base')).toBe('');
  });

  it('omits the inline style entirely when no section has an override', () => {
    const data = buildData();
    data.sectionMeta = DEFAULT_SECTION_META;
    const { container } = render(<ResumeSingleColumn data={data} />);

    const summaryHeading = Array.from(container.querySelectorAll('h3')).find(
      (el) => el.textContent === 'Summary'
    );
    const summarySection = summaryHeading?.closest('div');

    expect(summarySection?.getAttribute('style')).toBeNull();
  });
});
