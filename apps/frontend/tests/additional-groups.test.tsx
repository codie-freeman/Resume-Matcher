import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdditionalForm } from '@/components/builder/forms/additional-form';
import { ResumeSingleColumn } from '@/components/resume/resume-single-column';
import { getVisibleAdditionalGroups } from '@/lib/utils/additional-groups';
import type { AdditionalInfo, ResumeData } from '@/components/dashboard/resume-component';

// Components call useTranslations(); return the key so we can match deterministically.
vi.mock('@/lib/i18n', () => ({
  useTranslations: () => ({
    t: (key: string) => key,
  }),
}));

describe('getVisibleAdditionalGroups', () => {
  it('drops blank items and groups with no name or no items', () => {
    const result = getVisibleAdditionalGroups([
      { id: '1', label: 'Languages', items: ['Spanish', '', '   ', 'French'] },
      { id: '2', label: '  ', items: ['Ignored because unnamed'] },
      { id: '3', label: 'Empty Group', items: ['', '  '] },
    ]);

    expect(result).toEqual([{ id: '1', label: 'Languages', items: ['Spanish', 'French'] }]);
  });

  it('returns an empty array when no groups are provided', () => {
    expect(getVisibleAdditionalGroups(undefined)).toEqual([]);
  });
});

describe('AdditionalForm additional sections', () => {
  it('adds a new empty section when the add button is clicked', () => {
    const onChange = vi.fn<(data: AdditionalInfo) => void>();
    render(<AdditionalForm data={{}} onChange={onChange} />);

    fireEvent.click(screen.getByText('builder.additionalForm.addSection'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [{ additionalGroups }] = onChange.mock.calls[0];
    expect(additionalGroups).toHaveLength(1);
    expect(additionalGroups?.[0]).toMatchObject({ label: '', items: [] });
  });

  it('updates an existing section label and items independently', () => {
    const onChange = vi.fn<(data: AdditionalInfo) => void>();
    const data: AdditionalInfo = {
      additionalGroups: [{ id: 'g1', label: '', items: [] }],
    };
    render(<AdditionalForm data={data} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('builder.additionalForm.sectionNamePlaceholder'), {
      target: { value: 'Publications' },
    });
    expect(onChange.mock.calls[0][0].additionalGroups?.[0]).toMatchObject({
      label: 'Publications',
    });

    fireEvent.change(
      screen.getByPlaceholderText('builder.additionalForm.sectionItemsPlaceholder'),
      { target: { value: 'Paper One\nPaper Two' } }
    );
    expect(onChange.mock.calls[1][0].additionalGroups?.[0].items).toEqual([
      'Paper One',
      'Paper Two',
    ]);
  });

  it('removes a section without touching the base Technical Skills field', () => {
    const onChange = vi.fn<(data: AdditionalInfo) => void>();
    const data: AdditionalInfo = {
      technicalSkills: ['React'],
      additionalGroups: [{ id: 'g1', label: 'Languages', items: ['Spanish'] }],
    };
    render(<AdditionalForm data={data} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('a11y.removeItem'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].additionalGroups).toEqual([]);
    expect(onChange.mock.calls[0][0].technicalSkills).toEqual(['React']);
  });
});

describe('ResumeSingleColumn renders additional sections alongside Technical Skills', () => {
  it('renders each named section as its own labeled line', () => {
    const data: ResumeData = {
      personalInfo: { name: 'Jane Doe' },
      additional: {
        technicalSkills: ['React'],
        additionalGroups: [{ id: 'g1', label: 'Languages', items: ['Spanish', 'French'] }],
      },
    } as ResumeData;

    render(<ResumeSingleColumn data={data} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Languages:')).toBeInTheDocument();
    expect(screen.getByText('Spanish, French')).toBeInTheDocument();
  });

  it('does not render a section with no items', () => {
    const data: ResumeData = {
      personalInfo: { name: 'Jane Doe' },
      additional: {
        technicalSkills: ['React'],
        additionalGroups: [{ id: 'g1', label: 'Languages', items: [] }],
      },
    } as ResumeData;

    render(<ResumeSingleColumn data={data} />);

    expect(screen.queryByText('Languages:')).not.toBeInTheDocument();
  });
});
