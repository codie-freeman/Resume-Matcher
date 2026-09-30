import React from 'react';
import {
  ResumeSingleColumn,
  ResumeTwoColumn,
  ResumeModern,
  ResumeModernTwoColumn,
  ResumeLatex,
  ResumeClean,
  ResumeVivid,
  ResumeCustom,
} from '@/components/resume';
import {
  type TemplateSettings,
  type TemplateType,
  type SpacingLevel,
  DEFAULT_TEMPLATE_SETTINGS,
  settingsToCssVars,
} from '@/lib/types/template-settings';
import baseStyles from '@/components/resume/styles/_base.module.css';

export interface PersonalInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface Experience {
  id: number;
  title?: string;
  company?: string;
  location?: string;
  years?: string;
  // A second, non-contiguous employment period at the same role/company
  // (e.g. left and later rejoined). Rendered as an extra date line below
  // the primary `years` range; omitted when there's only one period.
  secondaryYears?: string;
  description?: string[];
}

export interface Education {
  id: number;
  institution?: string;
  degree?: string;
  years?: string;
  description?: string;
  note?: string; // Short italic footnote under the entry (e.g. justifying an extended duration)
}

export interface Project {
  id: number;
  name?: string;
  role?: string;
  years?: string;
  github?: string;
  website?: string;
  description?: string[];
}

// A freeform named section (e.g. "Publications", "Volunteer Work", another
// "Languages" group) rendered inline within the Skills & Awards block,
// alongside the fixed technicalSkills/languages/certifications/awards fields.
export interface AdditionalGroup {
  id: string;
  label: string;
  items: string[];
}

export interface AdditionalInfo {
  technicalSkills?: string[];
  additionalGroups?: AdditionalGroup[];
  languages?: string[];
  certificationsTraining?: string[];
  awards?: string[];
}

export interface AdditionalSectionLabels {
  technicalSkills: string;
  languages: string;
  certifications: string;
  awards: string;
}

export interface ResumeSectionHeadings {
  summary: string;
  experience: string;
  education: string;
  projects: string;
  certifications: string;
  skills: string;
  languages: string;
  awards: string;
  links: string;
}

export interface ResumeFallbackLabels {
  name: string;
}

// Section Type for dynamic sections
export type SectionType = 'personalInfo' | 'text' | 'itemList' | 'stringList';

// Section Metadata for dynamic section management
export interface SectionMeta {
  id: string; // Unique identifier (e.g., "summary", "custom_1")
  key: string; // Data key (matches ResumeData field or customSections key)
  displayName: string; // User-visible name
  sectionType: SectionType; // Type of section
  isDefault: boolean; // True for built-in sections
  isVisible: boolean; // Whether to show in resume
  order: number; // Display order (0 = first after personalInfo)
  fontSize?: SpacingLevel; // Optional override of the global Base size for this section's content only
}

// Generic item for custom item-based sections
export interface CustomSectionItem {
  id: number;
  title?: string; // Primary title
  subtitle?: string; // Secondary info (company, institution, etc.)
  location?: string;
  years?: string;
  description?: string[];
}

// Custom section data container
export interface CustomSection {
  sectionType: SectionType;
  items?: CustomSectionItem[]; // For itemList type
  strings?: string[]; // For stringList type
  additionalGroups?: AdditionalGroup[]; // Freeform named sub-lists (stringList type only)
  text?: string; // For text type
}

export interface ResumeData {
  personalInfo?: PersonalInfo;
  summary?: string;
  workExperience?: Experience[];
  education?: Education[];
  personalProjects?: Project[];
  additional?: AdditionalInfo;
  // NEW: Section metadata and custom sections
  sectionMeta?: SectionMeta[];
  customSections?: Record<string, CustomSection>;
  // Template/formatting config, persisted with the resume so it survives
  // Save and shows correctly anywhere the resume is opened or downloaded
  // from (not just the same browser's Builder session).
  templateSettings?: TemplateSettings;
}

interface ResumeProps {
  resumeData: ResumeData;
  template?: TemplateType;
  settings?: TemplateSettings;
  additionalSectionLabels?: Partial<AdditionalSectionLabels>;
  sectionHeadings?: Partial<ResumeSectionHeadings>;
  fallbackLabels?: Partial<ResumeFallbackLabels>;
}

/**
 * Resume Component
 *
 * Main wrapper component that delegates rendering to template-specific components.
 * Applies CSS custom properties from settings for consistent styling.
 *
 * Templates:
 * - swiss-single: Traditional single-column layout (default)
 * - swiss-two-column: Two-column layout with experience sidebar
 * - modern: Single-column with user-selectable accent colors
 * - modern-two-column: Two-column layout with modern colorful accents
 * - custom: Clean layout set in the Merriweather serif typeface
 */
const Resume: React.FC<ResumeProps> = ({
  resumeData,
  template = 'swiss-single',
  settings,
  additionalSectionLabels,
  sectionHeadings,
  fallbackLabels,
}) => {
  // Merge provided settings with defaults
  const mergedSettings: TemplateSettings = {
    ...DEFAULT_TEMPLATE_SETTINGS,
    ...settings,
    margins: { ...DEFAULT_TEMPLATE_SETTINGS.margins, ...settings?.margins },
    spacing: { ...DEFAULT_TEMPLATE_SETTINGS.spacing, ...settings?.spacing },
    fontSize: { ...DEFAULT_TEMPLATE_SETTINGS.fontSize, ...settings?.fontSize },
  };

  // If template is provided as prop but not in settings, use the prop
  if (template && !settings?.template) {
    mergedSettings.template = template;
  }

  // Convert settings to CSS variables
  const cssVars = settingsToCssVars(mergedSettings);

  return (
    <div
      className={`${baseStyles['resume-body']} bg-white text-black w-full mx-auto resume-template-${mergedSettings.template}`}
      style={cssVars}
    >
      {mergedSettings.template === 'swiss-single' && (
        <ResumeSingleColumn
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          additionalSectionLabels={additionalSectionLabels}
        />
      )}
      {mergedSettings.template === 'swiss-two-column' && (
        <ResumeTwoColumn
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          sectionHeadings={sectionHeadings}
        />
      )}
      {mergedSettings.template === 'modern' && (
        <ResumeModern
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          additionalSectionLabels={additionalSectionLabels}
        />
      )}
      {mergedSettings.template === 'modern-two-column' && (
        <ResumeModernTwoColumn
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          sectionHeadings={sectionHeadings}
          fallbackLabels={fallbackLabels}
        />
      )}
      {mergedSettings.template === 'latex' && (
        <ResumeLatex
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          additionalSectionLabels={additionalSectionLabels}
        />
      )}
      {mergedSettings.template === 'clean' && (
        <ResumeClean
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          additionalSectionLabels={additionalSectionLabels}
        />
      )}
      {mergedSettings.template === 'vivid' && (
        <ResumeVivid
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          sectionHeadings={sectionHeadings}
          fallbackLabels={fallbackLabels}
        />
      )}
      {mergedSettings.template === 'custom' && (
        <ResumeCustom
          data={resumeData}
          showContactIcons={mergedSettings.showContactIcons}
          justifyBullets={mergedSettings.justifyBullets}
          additionalSectionLabels={additionalSectionLabels}
        />
      )}
    </div>
  );
};

export default Resume;
