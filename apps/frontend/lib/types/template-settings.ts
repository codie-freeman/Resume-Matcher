/**
 * Resume Template Settings
 *
 * Defines the structure for template selection and formatting controls.
 * These settings affect both the live preview and PDF generation.
 */

export type TemplateType =
  | 'swiss-single'
  | 'swiss-two-column'
  | 'modern'
  | 'modern-two-column'
  | 'latex'
  | 'clean'
  | 'vivid'
  | 'custom';

export type PageSize = 'A4' | 'LETTER';

export type AccentColor = 'blue' | 'green' | 'orange' | 'red';

export type SpacingLevel = 1 | 2 | 3 | 4 | 5;

export type HeaderFontFamily = 'serif' | 'sans-serif' | 'mono';
export type BodyFontFamily = 'serif' | 'sans-serif' | 'mono';

export interface MarginSettings {
  top: number; // 5-25mm
  bottom: number;
  left: number;
  right: number;
}

export interface SpacingSettings {
  section: SpacingLevel; // Gap between major sections
  item: SpacingLevel; // Gap between items within sections
  lineHeight: SpacingLevel; // Text line height
}

export interface FontSizeSettings {
  base: SpacingLevel; // Overall text scale
  headerScale: SpacingLevel; // Header size multiplier (section headers + tagline)
  nameSize: SpacingLevel; // Name heading size, independent of Headers/Base
  contactSize: SpacingLevel; // Contact details (phone/email/location) size, independent of Headers/Base
  headerFont: HeaderFontFamily; // Header font family
  bodyFont: BodyFontFamily; // Body text font family
}

export interface TemplateSettings {
  template: TemplateType;
  pageSize: PageSize;
  margins: MarginSettings;
  spacing: SpacingSettings;
  fontSize: FontSizeSettings;
  compactMode: boolean; // Apply tighter spacing across the board
  showContactIcons: boolean; // Show icons next to contact info
  justifyBullets: boolean; // Justify bullet-point text (ragged-right by default)
  accentColor: AccentColor; // Accent color for Modern template
}

/**
 * Default template settings
 */
export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  template: 'swiss-single',
  pageSize: 'A4',
  margins: { top: 10, bottom: 10, left: 10, right: 10 },
  spacing: { section: 3, item: 2, lineHeight: 3 },
  fontSize: {
    base: 3,
    headerScale: 3,
    nameSize: 3,
    contactSize: 3,
    headerFont: 'serif',
    bodyFont: 'sans-serif',
  },
  compactMode: false,
  showContactIcons: false,
  justifyBullets: false,
  accentColor: 'blue',
};

/**
 * Deep-merges a partial/saved TemplateSettings (from localStorage or a
 * loaded resume) over the defaults, so settings saved before a newer
 * formatting knob existed fall back cleanly instead of leaving nested
 * objects undefined.
 */
export function mergeTemplateSettings(saved: Partial<TemplateSettings>): TemplateSettings {
  return {
    ...DEFAULT_TEMPLATE_SETTINGS,
    ...saved,
    margins: { ...DEFAULT_TEMPLATE_SETTINGS.margins, ...saved.margins },
    spacing: { ...DEFAULT_TEMPLATE_SETTINGS.spacing, ...saved.spacing },
    fontSize: { ...DEFAULT_TEMPLATE_SETTINGS.fontSize, ...saved.fontSize },
  };
}

/**
 * Page size dimensions for display
 */
export const PAGE_SIZE_INFO: Record<PageSize, { name: string; dimensions: string }> = {
  A4: { name: 'A4', dimensions: '210 × 297 mm' },
  LETTER: { name: 'US Letter', dimensions: '8.5 × 11 in' },
};

/**
 * CSS Variable mappings for spacing levels
 */
export const SECTION_SPACING_MAP: Record<SpacingLevel, string> = {
  1: '0.375rem', // 6px
  2: '0.625rem', // 10px
  3: '1rem', // 16px - default
  4: '1.25rem', // 20px
  5: '1.5rem', // 24px
};

export const ITEM_SPACING_MAP: Record<SpacingLevel, string> = {
  1: '0.125rem', // 2px
  2: '0.25rem', // 4px - default
  3: '0.5rem', // 8px
  4: '0.75rem', // 12px
  5: '1rem', // 16px
};

export const LINE_HEIGHT_MAP: Record<SpacingLevel, number> = {
  1: 1.15, // tight
  2: 1.25,
  3: 1.35, // default
  4: 1.45,
  5: 1.55, // loose
};

export const FONT_SIZE_MAP: Record<SpacingLevel, string> = {
  1: '11px',
  2: '12px',
  3: '14px', // default
  4: '15px',
  5: '16px',
};

// Name heading font size (the person's name at the top of the résumé, plus its
// tagline/title line). Independent of FONT_SIZE_MAP (Base) and headerScale on
// purpose — the Name control must never move when Base or Headers change, and
// vice versa. Level 3 (28px) matches the old default of 14px base × 2
// header-scale, so the default look is unchanged; every other level is now a
// fixed size rather than a multiplier of Base.
export const NAME_FONT_SIZE_MAP: Record<SpacingLevel, string> = {
  1: '22px',
  2: '25px',
  3: '28px', // default
  4: '32px',
  5: '36px',
};

// Contact details font size (phone, email, location, links). Independent of
// every other font-size control for the same reason as NAME_FONT_SIZE_MAP.
// Level 3 (11px) approximates the old default (~40-47% of the 28px name size,
// depending on template), so the default look is largely unchanged.
export const CONTACT_FONT_SIZE_MAP: Record<SpacingLevel, string> = {
  1: '9px',
  2: '10px',
  3: '11px', // default
  4: '12px',
  5: '13px',
};

// Section header font size (SUMMARY, EXPERIENCE, etc.) - slightly smaller
// than the name. Same independence rationale as NAME_FONT_SIZE_MAP; level
// 3 (17px) matches the old default of 14px base × 1.2 section-header-scale.
export const SECTION_HEADER_FONT_SIZE_MAP: Record<SpacingLevel, string> = {
  1: '14px',
  2: '15px',
  3: '17px', // default
  4: '18px',
  5: '20px',
};

// Header font family mapping
export const HEADER_FONT_MAP: Record<HeaderFontFamily, string> = {
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  'sans-serif': 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};

export const BODY_FONT_MAP: Record<BodyFontFamily, string> = {
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  'sans-serif': 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};

/**
 * The signature serif face for templates with a Merriweather-based look — what
 * "Serif" resolves to for LaTeX and Custom, instead of the generic system serif
 * stack. The Header/Body Font controls stay live (picking Sans or Mono still
 * switches away from it); only the "Serif" choice's underlying typeface differs
 * for these templates. `--font-merriweather` is loaded via next/font/google in
 * the root layout.
 */
const MERRIWEATHER_SERIF_FONT_STACK =
  'var(--font-merriweather), Georgia, Cambria, "Times New Roman", Times, serif';

const MERRIWEATHER_SERIF_TEMPLATES: ReadonlySet<TemplateType> = new Set(['latex', 'custom']);

function resolveHeaderFont(font: HeaderFontFamily, template: TemplateType): string {
  if (MERRIWEATHER_SERIF_TEMPLATES.has(template) && font === 'serif')
    return MERRIWEATHER_SERIF_FONT_STACK;
  return HEADER_FONT_MAP[font];
}

function resolveBodyFont(font: BodyFontFamily, template: TemplateType): string {
  if (MERRIWEATHER_SERIF_TEMPLATES.has(template) && font === 'serif')
    return MERRIWEATHER_SERIF_FONT_STACK;
  return BODY_FONT_MAP[font];
}

/**
 * Accent color mapping for Modern template
 */
export const ACCENT_COLOR_MAP: Record<
  AccentColor,
  { primary: string; light: string; name: string }
> = {
  blue: { primary: '#1D4ED8', light: '#DBEAFE', name: 'Blue' },
  green: { primary: '#15803D', light: '#DCFCE7', name: 'Green' },
  orange: { primary: '#EA580C', light: '#FED7AA', name: 'Orange' },
  red: { primary: '#DC2626', light: '#FEE2E2', name: 'Red' },
};

// Compact mode multiplier (applied to spacing values only, NOT line-height)
export const COMPACT_MULTIPLIER = 0.6;

// Line height gets a gentler reduction in compact mode
export const COMPACT_LINE_HEIGHT_MULTIPLIER = 0.92;

/**
 * Convert TemplateSettings to CSS custom properties
 */
export function settingsToCssVars(settings?: TemplateSettings): React.CSSProperties {
  const s = settings || DEFAULT_TEMPLATE_SETTINGS;
  const compact = s.compactMode ? COMPACT_MULTIPLIER : 1;

  // Margins remain literal; compact mode only affects spacing/line-height.
  const marginTop = s.margins.top;
  const marginBottom = s.margins.bottom;
  const marginLeft = s.margins.left;
  const marginRight = s.margins.right;

  // Get accent colors for Modern template
  const accentColors = ACCENT_COLOR_MAP[s.accentColor];

  return {
    '--section-gap': s.compactMode
      ? `calc(${SECTION_SPACING_MAP[s.spacing.section]} * ${compact})`
      : SECTION_SPACING_MAP[s.spacing.section],
    '--item-gap': s.compactMode
      ? `calc(${ITEM_SPACING_MAP[s.spacing.item]} * ${compact})`
      : ITEM_SPACING_MAP[s.spacing.item],
    // Line-height uses a gentler multiplier to avoid text overlap
    '--line-height': s.compactMode
      ? LINE_HEIGHT_MAP[s.spacing.lineHeight] * COMPACT_LINE_HEIGHT_MULTIPLIER
      : LINE_HEIGHT_MAP[s.spacing.lineHeight],
    '--font-size-base': FONT_SIZE_MAP[s.fontSize.base],
    '--name-font-size': NAME_FONT_SIZE_MAP[s.fontSize.nameSize],
    '--contact-font-size': CONTACT_FONT_SIZE_MAP[s.fontSize.contactSize],
    '--section-header-font-size': SECTION_HEADER_FONT_SIZE_MAP[s.fontSize.headerScale],
    '--header-font': resolveHeaderFont(s.fontSize.headerFont, s.template),
    '--body-font': resolveBodyFont(s.fontSize.bodyFont, s.template),
    '--margin-top': `${marginTop}mm`,
    '--margin-bottom': `${marginBottom}mm`,
    '--margin-left': `${marginLeft}mm`,
    '--margin-right': `${marginRight}mm`,
    // Accent colors for Modern template
    '--resume-accent-primary': accentColors.primary,
    '--resume-accent-light': accentColors.light,
  } as React.CSSProperties;
}

/**
 * Template metadata for UI display
 */
export interface TemplateInfo {
  id: TemplateType;
  name: string;
  description: string;
}

export const TEMPLATE_OPTIONS: TemplateInfo[] = [
  {
    id: 'swiss-single',
    name: 'Single Column',
    description: 'Traditional full-width layout with maximum content density',
  },
  {
    id: 'swiss-two-column',
    name: 'Two Column',
    description: 'Experience-focused main column with sidebar for skills',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Colorful accents with customizable theme colors',
  },
  {
    id: 'modern-two-column',
    name: 'Modern Two Column',
    description: 'Two-column layout with modern colorful accents and themes',
  },
  {
    id: 'latex',
    name: 'LaTeX',
    description: 'Classic serif academic layout with ruled section headers',
  },
  {
    id: 'clean',
    name: 'Clean',
    description: 'Minimal sans layout with large understated section headers',
  },
  {
    id: 'vivid',
    name: 'Vivid',
    description: 'Colorful two-column layout with accent headers and arrow bullets',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Clean layout set in the Merriweather serif typeface',
  },
];

/**
 * Signature font presets for single-typeface templates.
 *
 * LaTeX, Clean, and Custom bind their headers to `--header-font` and body to `--body-font`,
 * so both font controls are live. Selecting one of these templates applies its signature
 * fonts (so it matches its reference look by default); the user can then override either
 * control. Templates not listed here keep the current font settings on selection.
 */
export const TEMPLATE_FONT_PRESETS: Partial<
  Record<TemplateType, { headerFont: HeaderFontFamily; bodyFont: BodyFontFamily }>
> = {
  latex: { headerFont: 'serif', bodyFont: 'serif' },
  clean: { headerFont: 'sans-serif', bodyFont: 'sans-serif' },
  custom: { headerFont: 'serif', bodyFont: 'serif' },
};

/**
 * Return settings with the given template applied, seeding the template's signature
 * fonts when it has a preset. Use this at every template-change entry point so the
 * single-typeface templates render their reference look by default.
 */
export function applyTemplatePreset(
  settings: TemplateSettings,
  template: TemplateType
): TemplateSettings {
  const preset = TEMPLATE_FONT_PRESETS[template];
  if (!preset) return { ...settings, template };
  return {
    ...settings,
    template,
    fontSize: { ...settings.fontSize, headerFont: preset.headerFont, bodyFont: preset.bodyFont },
  };
}
