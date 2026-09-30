import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';
import type {
  ResumeData,
  SectionMeta,
  AdditionalSectionLabels,
} from '@/components/dashboard/resume-component';
import { getSortedSections, getSectionFontSizeStyle } from '@/lib/utils/section-helpers';
import { getVisibleAdditionalGroups } from '@/lib/utils/additional-groups';
import { formatDateRange } from '@/lib/utils';
import { SafeHtml } from './safe-html';
import baseStyles from './styles/_base.module.css';
import styles from './styles/modern.module.css';

interface ResumeModernProps {
  data: ResumeData;
  showContactIcons?: boolean;
  justifyBullets?: boolean;
  additionalSectionLabels?: Partial<AdditionalSectionLabels>;
}

/**
 * Modern Resume Template
 *
 * Single-column layout with user-selectable accent colors.
 * Features colored section headers with underline and decorative name underline.
 * ATS-compatible: all visual elements are real DOM text nodes.
 *
 * Section order: Determined by sectionMeta ordering
 */
export const ResumeModern: React.FC<ResumeModernProps> = ({
  data,
  showContactIcons = false,
  justifyBullets = false,
  additionalSectionLabels,
}) => {
  const { personalInfo, summary, workExperience, education, personalProjects, additional } = data;

  // Get sorted visible sections
  const sortedSections = getSortedSections(data);

  // Icon mapping for contact types
  const contactIcons: Record<string, React.ReactNode> = {
    Email: <Mail size={12} />,
    Phone: <Phone size={12} />,
    Location: <MapPin size={12} />,
    Website: <Globe size={12} />,
    LinkedIn: <Linkedin size={12} />,
    GitHub: <Github size={12} />,
  };

  // Helper function to render contact details
  const renderContactDetail = (label: string, value?: string, hrefPrefix: string = '') => {
    if (!value) return null;

    let finalHrefPrefix = hrefPrefix;
    if (
      ['Website', 'LinkedIn', 'GitHub'].includes(label) &&
      !value.startsWith('http') &&
      !value.startsWith('//')
    ) {
      finalHrefPrefix = 'https://';
    }

    const href = finalHrefPrefix + value;
    const isLink =
      finalHrefPrefix.startsWith('http') ||
      finalHrefPrefix.startsWith('mailto:') ||
      finalHrefPrefix.startsWith('tel:');

    let displayText = value;
    if (isLink && (label === 'LinkedIn' || label === 'GitHub' || label === 'Website')) {
      displayText = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }

    return (
      <span className="inline-flex items-center gap-1">
        {showContactIcons && contactIcons[label]}
        {isLink ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseStyles['resume-link']} hover:underline`}
          >
            {displayText}
          </a>
        ) : (
          <span style={{ color: 'var(--resume-text-primary)' }}>{displayText}</span>
        )}
      </span>
    );
  };

  // Render a section based on its key
  const renderSection = (section: SectionMeta) => {
    switch (section.key) {
      case 'personalInfo':
        // Personal info is the header - handled separately
        return null;

      case 'summary':
        if (!summary) return null;
        return (
          <div
            key={section.id}
            className={baseStyles['resume-section']}
            style={getSectionFontSizeStyle(section)}
          >
            <h3 className={styles['section-title-accent']}>{section.displayName}</h3>
            <p className={`text-justify ${baseStyles['resume-text-sm']}`}>{summary}</p>
          </div>
        );

      case 'workExperience':
        if (!workExperience || workExperience.length === 0) return null;
        return (
          <div
            key={section.id}
            className={baseStyles['resume-section']}
            style={getSectionFontSizeStyle(section)}
          >
            <h3 className={styles['section-title-accent']}>{section.displayName}</h3>
            <div className={baseStyles['resume-items']}>
              {workExperience.map((exp) => (
                <div key={exp.id} className={baseStyles['resume-item']}>
                  <div
                    className={`flex justify-between items-baseline ${baseStyles['resume-row-tight']}`}
                  >
                    <h4 className={baseStyles['resume-item-title']}>{exp.title}</h4>
                    <span className={`${baseStyles['resume-date']} ml-4`}>
                      {formatDateRange(exp.years)}
                    </span>
                  </div>
                  {exp.secondaryYears && (
                    <div className="flex justify-end">
                      <span className={baseStyles['resume-date']}>
                        {formatDateRange(exp.secondaryYears)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex justify-between items-center ${baseStyles['resume-row']} ${baseStyles['resume-item-subtitle']}`}
                  >
                    <span>{exp.company}</span>
                    {exp.location && <span>{exp.location}</span>}
                  </div>
                  {exp.description && exp.description.length > 0 && (
                    <ul
                      className={`ml-4 ${baseStyles['resume-list']} ${baseStyles['resume-text-sm']}`}
                    >
                      {exp.description.map((desc, index) => (
                        <li key={index} className="flex">
                          <span className="mr-1.5 flex-shrink-0">•&nbsp;</span>
                          <span className={justifyBullets ? 'text-justify' : undefined}>
                            <SafeHtml html={desc} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'personalProjects':
        if (!personalProjects || personalProjects.length === 0) return null;
        return (
          <div
            key={section.id}
            className={baseStyles['resume-section']}
            style={getSectionFontSizeStyle(section)}
          >
            <h3 className={styles['section-title-accent']}>{section.displayName}</h3>
            <div className={baseStyles['resume-items']}>
              {personalProjects.map((project) => (
                <div key={project.id} className={baseStyles['resume-item']}>
                  <div
                    className={`flex justify-between items-baseline ${baseStyles['resume-row-tight']}`}
                  >
                    <div className="flex items-baseline gap-2">
                      <h4 className={baseStyles['resume-item-title']}>{project.name}</h4>
                      {(project.github || project.website) && (
                        <span className="flex gap-1.5">
                          {project.github && (
                            <a
                              href={
                                project.github.startsWith('http')
                                  ? project.github
                                  : `https://${project.github}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className={baseStyles['resume-link-pill']}
                            >
                              <Github size={10} />
                              {project.github
                                .replace(/^https?:\/\//, '')
                                .replace(/^www\./, '')
                                .replace(/\/$/, '')}
                            </a>
                          )}
                          {project.website && (
                            <a
                              href={
                                project.website.startsWith('http')
                                  ? project.website
                                  : `https://${project.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className={baseStyles['resume-link-pill']}
                            >
                              <ExternalLink size={10} />
                              {project.website
                                .replace(/^https?:\/\//, '')
                                .replace(/^www\./, '')
                                .replace(/\/$/, '')}
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                    {project.years && (
                      <span className={`${baseStyles['resume-date']} ml-4`}>
                        {formatDateRange(project.years)}
                      </span>
                    )}
                  </div>
                  {project.role && (
                    <div
                      className={`${baseStyles['resume-row']} ${baseStyles['resume-item-subtitle']}`}
                    >
                      <span>{project.role}</span>
                    </div>
                  )}
                  {project.description && project.description.length > 0 && (
                    <ul
                      className={`ml-4 ${baseStyles['resume-list']} ${baseStyles['resume-text-sm']}`}
                    >
                      {project.description.map((desc, index) => (
                        <li key={index} className="flex">
                          <span className="mr-1.5 flex-shrink-0">•&nbsp;</span>
                          <span className={justifyBullets ? 'text-justify' : undefined}>
                            <SafeHtml html={desc} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        if (!education || education.length === 0) return null;
        return (
          <div
            key={section.id}
            className={baseStyles['resume-section']}
            style={getSectionFontSizeStyle(section)}
          >
            <h3 className={styles['section-title-accent']}>{section.displayName}</h3>
            <div className={baseStyles['resume-items']}>
              {education.map((edu) => (
                <div key={edu.id} className={baseStyles['resume-item']}>
                  <div
                    className={`flex justify-between items-baseline ${baseStyles['resume-row-tight']}`}
                  >
                    <h4 className={baseStyles['resume-item-title']}>{edu.institution}</h4>
                    <span className={`${baseStyles['resume-date']} ml-4`}>
                      {formatDateRange(edu.years)}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between ${baseStyles['resume-item-subtitle']} ${edu.note ? '' : baseStyles['resume-row-tight']}`}
                  >
                    <span>{edu.degree}</span>
                  </div>
                  {edu.note && (
                    <p
                      className={`italic ${baseStyles['resume-text-sm']} ${baseStyles['resume-row-tight']}`}
                    >
                      {edu.note}
                    </p>
                  )}
                  {edu.description && (
                    <p className={baseStyles['resume-text-sm']}>{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'additional':
        if (!additional) return null;
        return (
          <AdditionalSection
            key={section.id}
            additional={additional}
            displayName={section.displayName}
            labels={additionalSectionLabels}
            style={getSectionFontSizeStyle(section)}
          />
        );

      default:
        // Custom section - render using DynamicResumeSection
        if (!section.isDefault) {
          return (
            <DynamicResumeSectionModern
              key={section.id}
              sectionMeta={section}
              resumeData={data}
              justifyBullets={justifyBullets}
            />
          );
        }
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Section - Centered Layout (always first) */}
      {personalInfo && (
        <header className={`text-center ${baseStyles['resume-header']}`}>
          {/* Name - Centered */}
          {personalInfo.name && (
            <h1 className={`${baseStyles['resume-name']} tracking-tight uppercase mb-1`}>
              {personalInfo.name}
            </h1>
          )}

          {/* Decorative accent underline under name */}
          <div className={styles['name-underline']} aria-hidden="true" />

          {/* Title - Centered, below name */}
          {personalInfo.title && (
            <h2
              className={`${baseStyles['resume-title']} ${baseStyles['resume-meta']} tracking-wide uppercase mt-3 mb-3`}
            >
              {personalInfo.title}
            </h2>
          )}

          {/* Contact - Own line, centered */}
          <div
            className={`flex flex-wrap justify-center gap-x-1 gap-y-1 ${baseStyles['resume-meta']}`}
          >
            {renderContactDetail('Email', personalInfo.email, 'mailto:')}
            {personalInfo.phone && (
              <>
                <span className={baseStyles['text-muted']}>,</span>
                {renderContactDetail('Phone', personalInfo.phone, 'tel:')}
              </>
            )}
            {personalInfo.location && (
              <>
                <span className={baseStyles['text-muted']}>,</span>
                {renderContactDetail('Location', personalInfo.location)}
              </>
            )}
            {personalInfo.website && (
              <>
                <span className={baseStyles['text-muted']}>,</span>
                {renderContactDetail('Website', personalInfo.website)}
              </>
            )}
            {personalInfo.linkedin && (
              <>
                <span className={baseStyles['text-muted']}>,</span>
                {renderContactDetail('LinkedIn', personalInfo.linkedin)}
              </>
            )}
            {personalInfo.github && (
              <>
                <span className={baseStyles['text-muted']}>,</span>
                {renderContactDetail('GitHub', personalInfo.github)}
              </>
            )}
          </div>
        </header>
      )}

      {/* Render sections in order based on sectionMeta */}
      {sortedSections
        .filter((section) => section.key !== 'personalInfo')
        .map((section) => renderSection(section))}
    </div>
  );
};

/**
 * Additional info section (skills, languages, certifications, awards)
 */
const AdditionalSection: React.FC<{
  additional: ResumeData['additional'];
  displayName?: string;
  labels?: Partial<AdditionalSectionLabels>;
  style?: React.CSSProperties;
}> = ({ additional, displayName = 'Skills & Awards', labels, style }) => {
  if (!additional) return null;

  const {
    technicalSkills: rawTechnicalSkills = [],
    languages: rawLanguages = [],
    certificationsTraining: rawCertificationsTraining = [],
    awards: rawAwards = [],
  } = additional;

  // Drop blank/whitespace-only entries so empty lines (e.g. from editing in the
  // builder) never render in the resume or PDF (issue #763).
  const technicalSkills = rawTechnicalSkills.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
  const languages = rawLanguages.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
  const certificationsTraining = rawCertificationsTraining.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
  const awards = rawAwards.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
  const additionalGroups = getVisibleAdditionalGroups(additional.additionalGroups);

  const mergedLabels: AdditionalSectionLabels = {
    technicalSkills: labels?.technicalSkills ?? 'Technical Skills:',
    languages: labels?.languages ?? 'Languages:',
    certifications: labels?.certifications ?? 'Certifications:',
    awards: labels?.awards ?? 'Awards:',
  };

  const hasContent =
    technicalSkills.length > 0 ||
    additionalGroups.length > 0 ||
    languages.length > 0 ||
    certificationsTraining.length > 0 ||
    awards.length > 0;

  if (!hasContent) return null;

  return (
    <div className={baseStyles['resume-section']} style={style}>
      <h3 className={styles['section-title-accent']}>{displayName}</h3>
      <div className={`${baseStyles['resume-stack']} ${baseStyles['resume-text-sm']}`}>
        {technicalSkills.length > 0 && (
          <div className="flex gap-2">
            <span className="font-bold shrink-0 whitespace-nowrap">
              {mergedLabels.technicalSkills}
            </span>
            <span>{technicalSkills.join(', ')}</span>
          </div>
        )}
        {additionalGroups.map((group) => (
          <div className="flex gap-2" key={group.id}>
            <span className="font-bold shrink-0 whitespace-nowrap">{group.label}:</span>
            <span>{group.items.join(', ')}</span>
          </div>
        ))}
        {languages.length > 0 && (
          <div className="flex gap-2">
            <span className="font-bold shrink-0 whitespace-nowrap">{mergedLabels.languages}</span>
            <span>{languages.join(', ')}</span>
          </div>
        )}
        {certificationsTraining.length > 0 && (
          <div className="flex gap-2">
            <span className="font-bold shrink-0 whitespace-nowrap">
              {mergedLabels.certifications}
            </span>
            <span>{certificationsTraining.join(', ')}</span>
          </div>
        )}
        {awards.length > 0 && (
          <div className="flex gap-2">
            <span className="font-bold shrink-0 whitespace-nowrap">{mergedLabels.awards}</span>
            <span>{awards.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Dynamic section wrapper for Modern template
 * Uses accent-colored section titles
 */
const DynamicResumeSectionModern: React.FC<{
  sectionMeta: SectionMeta;
  resumeData: ResumeData;
  justifyBullets?: boolean;
}> = ({ sectionMeta, resumeData, justifyBullets = false }) => {
  // Get the custom section data
  const customSection = resumeData.customSections?.[sectionMeta.key];

  if (!customSection) return null;

  // Check if section has content
  const hasContent = (() => {
    switch (sectionMeta.sectionType) {
      case 'text':
        return Boolean(customSection.text?.trim());
      case 'itemList':
        return Boolean(customSection.items?.length);
      case 'stringList':
        return (
          Boolean(customSection.strings?.length) ||
          getVisibleAdditionalGroups(customSection.additionalGroups).length > 0
        );
      default:
        return false;
    }
  })();

  if (!hasContent) return null;

  return (
    <div className={baseStyles['resume-section']} style={getSectionFontSizeStyle(sectionMeta)}>
      <h3 className={styles['section-title-accent']}>{sectionMeta.displayName}</h3>
      {renderDynamicContent(sectionMeta.sectionType, customSection, justifyBullets)}
    </div>
  );
};

/**
 * Render dynamic section content based on type
 */
function renderDynamicContent(
  sectionType: SectionMeta['sectionType'],
  customSection: NonNullable<ResumeData['customSections']>[string],
  justifyBullets: boolean
) {
  switch (sectionType) {
    case 'text':
      if (!customSection.text?.trim()) return null;
      return <p className={`text-justify ${baseStyles['resume-text-sm']}`}>{customSection.text}</p>;

    case 'itemList':
      if (!customSection.items?.length) return null;
      return (
        <div className={baseStyles['resume-items']}>
          {customSection.items.map((item) => (
            <div key={item.id} className={baseStyles['resume-item']}>
              <div
                className={`flex justify-between items-baseline ${baseStyles['resume-row-tight']}`}
              >
                <h4 className={baseStyles['resume-item-title']}>{item.title}</h4>
                {item.years && (
                  <span className={`${baseStyles['resume-meta-sm']} shrink-0 ml-4`}>
                    {formatDateRange(item.years)}
                  </span>
                )}
              </div>
              {(item.subtitle || item.location) && (
                <div
                  className={`flex justify-between items-center ${baseStyles['resume-row']} ${baseStyles['resume-meta']}`}
                >
                  {item.subtitle && <span>{item.subtitle}</span>}
                  {item.location && <span>{item.location}</span>}
                </div>
              )}
              {item.description && item.description.length > 0 && (
                <ul className={`ml-4 ${baseStyles['resume-list']} ${baseStyles['resume-text-sm']}`}>
                  {item.description.map((desc, index) => (
                    <li key={index} className="flex">
                      <span className="mr-1.5 flex-shrink-0">•&nbsp;</span>
                      <span className={justifyBullets ? 'text-justify' : undefined}>
                        <SafeHtml html={desc} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );

    case 'stringList': {
      const visibleGroups = getVisibleAdditionalGroups(customSection.additionalGroups);
      if (!customSection.strings?.length && visibleGroups.length === 0) return null;
      return (
        <div className={`${baseStyles['resume-stack']} ${baseStyles['resume-text-sm']}`}>
          {customSection.strings?.length ? <div>{customSection.strings.join(', ')}</div> : null}
          {visibleGroups.length > 0 && (
            <div className="grid grid-cols-[max-content_1fr] gap-x-2 gap-y-1">
              {visibleGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <span className="font-bold whitespace-nowrap">{group.label}:</span>
                  <span>{group.items.join(', ')}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

export default ResumeModern;
