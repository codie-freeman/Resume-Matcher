import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoverLetterPreview } from '@/components/builder/cover-letter-preview';

vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({ t: (key: string) => key, locale: 'en' }),
}));

const personalInfo = { name: 'Jane Doe', email: 'jane@example.com' };

describe('CoverLetterPreview', () => {
  it('renders rich-text formatting from the editor', () => {
    render(
      <CoverLetterPreview
        content="<p><strong>Dear</strong> <em>Hiring Manager</em>,</p><p>Second paragraph.</p>"
        personalInfo={personalInfo}
      />
    );

    const bold = screen.getByText('Dear');
    expect(bold.tagName).toBe('STRONG');
    const italic = screen.getByText('Hiring Manager');
    expect(italic.tagName).toBe('EM');
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
  });

  it('still renders legacy plain-text content as paragraphs', () => {
    render(
      <CoverLetterPreview
        content={'Dear Hiring Manager,\n\nI am writing to apply.'}
        personalInfo={personalInfo}
      />
    );

    expect(screen.getByText('Dear Hiring Manager,')).toBeInTheDocument();
    expect(screen.getByText('I am writing to apply.')).toBeInTheDocument();
  });

  it('strips a script tag instead of rendering it', () => {
    render(
      <CoverLetterPreview
        content={'<p>safe<script>window.__xss = true;</script></p>'}
        personalInfo={personalInfo}
      />
    );

    expect(screen.getByText('safe')).toBeInTheDocument();
    expect(document.querySelector('script')).not.toBeInTheDocument();
  });

  it('shows the empty state for blank content', () => {
    render(<CoverLetterPreview content="" personalInfo={personalInfo} />);
    expect(screen.getByText('coverLetter.preview.emptyTitle')).toBeInTheDocument();
  });
});
