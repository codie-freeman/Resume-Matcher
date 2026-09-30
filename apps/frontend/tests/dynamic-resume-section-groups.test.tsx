import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DynamicResumeSection } from '@/components/resume/dynamic-resume-section';
import type {
  CustomSection,
  ResumeData,
  SectionMeta,
} from '@/components/dashboard/resume-component';

const publicationsSectionMeta: SectionMeta = {
  id: 'custom_publications',
  key: 'publications',
  displayName: 'Publications',
  sectionType: 'stringList',
  isDefault: false,
  isVisible: true,
  order: 6,
};

function buildResumeData(customSection: CustomSection): ResumeData {
  return {
    personalInfo: { name: 'Jane Doe' },
    sectionMeta: [publicationsSectionMeta],
    customSections: { publications: customSection },
  } as ResumeData;
}

describe('DynamicResumeSection stringList sub-grouping', () => {
  it('renders flat strings and named sub-groups together under the section heading', () => {
    const data = buildResumeData({
      sectionType: 'stringList',
      strings: ['Peer-reviewed'],
      additionalGroups: [
        { id: 'g1', label: 'Journal Articles', items: ['Paper One', 'Paper Two'] },
      ],
    });

    render(<DynamicResumeSection sectionMeta={publicationsSectionMeta} resumeData={data} />);

    expect(screen.getByText('Publications')).toBeInTheDocument();
    expect(screen.getByText('Peer-reviewed')).toBeInTheDocument();
    expect(screen.getByText('Journal Articles:')).toBeInTheDocument();
    expect(screen.getByText('Paper One, Paper Two')).toBeInTheDocument();
  });

  it('renders a section with only sub-groups and no flat strings', () => {
    const data = buildResumeData({
      sectionType: 'stringList',
      strings: [],
      additionalGroups: [{ id: 'g1', label: 'Conference Talks', items: ['ReactConf 2024'] }],
    });

    render(<DynamicResumeSection sectionMeta={publicationsSectionMeta} resumeData={data} />);

    expect(screen.getByText('Publications')).toBeInTheDocument();
    expect(screen.getByText('Conference Talks:')).toBeInTheDocument();
    expect(screen.getByText('ReactConf 2024')).toBeInTheDocument();
  });

  it('renders nothing when both strings and sub-groups are empty', () => {
    const data = buildResumeData({ sectionType: 'stringList', strings: [], additionalGroups: [] });

    const { container } = render(
      <DynamicResumeSection sectionMeta={publicationsSectionMeta} resumeData={data} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
