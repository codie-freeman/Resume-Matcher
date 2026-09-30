import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumeClean } from '@/components/resume/resume-clean';
import type { ResumeData } from '@/components/dashboard/resume-component';

vi.mock('@/lib/i18n', () => ({ useTranslations: () => ({ t: (k: string) => k }) }));

const data: ResumeData = {
  personalInfo: { name: 'Saurabh Rai', email: 'a@b.com', phone: '+91-700' },
  workExperience: [
    {
      id: 1,
      title: 'DevRel Engineer',
      company: 'Apideck',
      location: 'Remote',
      years: '2025-Present',
      description: ['Lead client demos.'],
    },
  ],
  education: [
    {
      id: 1,
      institution: 'University of Reading',
      degree: 'BSc (Hons) Pharmaceutical Chemistry',
      years: 'Sep 2021 - Jun 2027',
      note: 'including foundation year, industrial placement and approved interruption of study',
    },
  ],
  additional: { technicalSkills: ['Python', 'TypeScript'] },
} as ResumeData;

describe('ResumeClean', () => {
  it('renders name, company, role and a bullet', () => {
    render(<ResumeClean data={data} />);
    expect(screen.getByText('Saurabh Rai')).toBeInTheDocument();
    expect(screen.getByText('Apideck')).toBeInTheDocument();
    expect(screen.getByText('DevRel Engineer')).toBeInTheDocument();
    expect(screen.getByText('Lead client demos.')).toBeInTheDocument();
  });

  it('renders the education note as an italic footnote', () => {
    render(<ResumeClean data={data} />);
    const note = screen.getByText(
      'including foundation year, industrial placement and approved interruption of study'
    );
    expect(note).toBeInTheDocument();
    expect(note).toHaveClass('italic');
  });
});
