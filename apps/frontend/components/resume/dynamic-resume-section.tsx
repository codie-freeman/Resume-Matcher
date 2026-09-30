import React from 'react';
import type {
  ResumeData,
  SectionMeta,
  CustomSection,
  CustomSectionItem,
  AdditionalGroup,
} from '@/components/dashboard/resume-component';
import { getVisibleAdditionalGroups } from '@/lib/utils/additional-groups';
import { getSectionFontSizeStyle } from '@/lib/utils/section-helpers';
import { formatDateRange } from '@/lib/utils';
import { SafeHtml } from './safe-html';
import baseStyles from './styles/_base.module.css';

interface DynamicResumeSectionProps {
  sectionMeta: SectionMeta;
  resumeData: ResumeData;
  justifyBullets?: boolean;
}

/**
 * DynamicResumeSection Component
 *
 * Renders custom sections in resume templates based on section type.
 * Uses the same CSS classes as built-in sections for consistent styling.
 */
export const DynamicResumeSection: React.FC<DynamicResumeSectionProps> = ({
  sectionMeta,
  resumeData,
  justifyBullets = false,
}) => {
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
      <h3 className={baseStyles['resume-section-title']}>{sectionMeta.displayName}</h3>
      {renderContent(sectionMeta.sectionType, customSection, justifyBullets)}
    </div>
  );
};

/**
 * Render section content based on type
 */
function renderContent(
  sectionType: SectionMeta['sectionType'],
  customSection: CustomSection,
  justifyBullets: boolean
) {
  switch (sectionType) {
    case 'text':
      return <TextSectionContent text={customSection.text || ''} />;
    case 'itemList':
      return (
        <ItemListSectionContent items={customSection.items || []} justifyBullets={justifyBullets} />
      );
    case 'stringList':
      return (
        <StringListSectionContent
          strings={customSection.strings || []}
          additionalGroups={customSection.additionalGroups}
        />
      );
    default:
      return null;
  }
}

/**
 * Text Section Content (like Summary)
 */
const TextSectionContent: React.FC<{ text: string }> = ({ text }) => {
  if (!text.trim()) return null;

  return <p className={`text-justify ${baseStyles['resume-text-sm']}`}>{text}</p>;
};

/**
 * Item List Section Content (like Experience)
 */
const ItemListSectionContent: React.FC<{
  items: CustomSectionItem[];
  justifyBullets?: boolean;
}> = ({ items, justifyBullets = false }) => {
  if (items.length === 0) return null;

  return (
    <div className={baseStyles['resume-items']}>
      {items.map((item) => (
        <div key={item.id} className={baseStyles['resume-item']}>
          {/* Title and Years Row */}
          <div className={`flex justify-between items-baseline ${baseStyles['resume-row-tight']}`}>
            <h4 className={baseStyles['resume-item-title']}>{item.title}</h4>
            {item.years && (
              <span className={`${baseStyles['resume-meta-sm']} shrink-0 ml-4`}>
                {formatDateRange(item.years)}
              </span>
            )}
          </div>

          {/* Subtitle and Location Row */}
          {(item.subtitle || item.location) && (
            <div
              className={`flex justify-between items-center ${baseStyles['resume-row']} ${baseStyles['resume-item-subtitle']}`}
            >
              {item.subtitle && <span>{item.subtitle}</span>}
              {item.location && <span>{item.location}</span>}
            </div>
          )}

          {/* Description Points */}
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
};

/**
 * String List Section Content (like Skills)
 *
 * A flat comma-joined list, plus any freeform named sub-lists added via the
 * same "+ Add Section" mechanism used in Skills & Awards — each rendered as
 * its own bold, auto-width (never-wrapping) label followed by its items.
 */
const StringListSectionContent: React.FC<{
  strings: string[];
  additionalGroups?: AdditionalGroup[];
}> = ({ strings, additionalGroups }) => {
  const visibleGroups = getVisibleAdditionalGroups(additionalGroups);

  if (strings.length === 0 && visibleGroups.length === 0) return null;

  return (
    <div className={`${baseStyles['resume-stack']} ${baseStyles['resume-text-sm']}`}>
      {strings.length > 0 && <div>{strings.join(', ')}</div>}
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
};

export default DynamicResumeSection;
