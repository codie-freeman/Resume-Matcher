import { describe, expect, it } from 'vitest';
import {
  TEMPLATE_OPTIONS,
  applyTemplatePreset,
  settingsToCssVars,
  DEFAULT_TEMPLATE_SETTINGS,
  type TemplateType,
  type TemplateSettings,
} from '@/lib/types/template-settings';

describe('template registration', () => {
  it('includes all eight templates with non-empty metadata', () => {
    const ids = TEMPLATE_OPTIONS.map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining<TemplateType>([
        'swiss-single',
        'swiss-two-column',
        'modern',
        'modern-two-column',
        'latex',
        'clean',
        'vivid',
        'custom',
      ])
    );
    expect(ids).toHaveLength(8);

    for (const opt of TEMPLATE_OPTIONS) {
      expect(opt.name.length).toBeGreaterThan(0);
      expect(opt.description.length).toBeGreaterThan(0);
    }
  });

  it('has unique template ids', () => {
    const ids = TEMPLATE_OPTIONS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('applyTemplatePreset', () => {
  it('seeds signature fonts for single-typeface templates', () => {
    const clean = applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'clean');
    expect(clean.template).toBe('clean');
    expect(clean.fontSize.headerFont).toBe('sans-serif');
    expect(clean.fontSize.bodyFont).toBe('sans-serif');

    const latex = applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'latex');
    expect(latex.template).toBe('latex');
    expect(latex.fontSize.headerFont).toBe('serif');
    expect(latex.fontSize.bodyFont).toBe('serif');

    const custom = applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'custom');
    expect(custom.template).toBe('custom');
    expect(custom.fontSize.headerFont).toBe('serif');
    expect(custom.fontSize.bodyFont).toBe('serif');
  });

  it('leaves fonts untouched for templates without a preset', () => {
    const custom: TemplateSettings = {
      ...DEFAULT_TEMPLATE_SETTINGS,
      fontSize: { ...DEFAULT_TEMPLATE_SETTINGS.fontSize, headerFont: 'mono', bodyFont: 'mono' },
    };
    const modern = applyTemplatePreset(custom, 'modern');
    expect(modern.template).toBe('modern');
    expect(modern.fontSize.headerFont).toBe('mono');
    expect(modern.fontSize.bodyFont).toBe('mono');
  });

  it('preserves unrelated settings when applying a preset', () => {
    const custom: TemplateSettings = {
      ...DEFAULT_TEMPLATE_SETTINGS,
      pageSize: 'LETTER',
      compactMode: true,
    };
    const clean = applyTemplatePreset(custom, 'clean');
    expect(clean.pageSize).toBe('LETTER');
    expect(clean.compactMode).toBe(true);
    expect(clean.margins).toEqual(custom.margins);
  });
});

describe('custom template resolves Serif to Merriweather', () => {
  it('resolves --header-font and --body-font to the Merriweather stack, unlike Clean', () => {
    const customSettings = applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'custom');
    const cssVars = settingsToCssVars(customSettings) as Record<string, string>;
    expect(cssVars['--header-font']).toContain('var(--font-merriweather)');
    expect(cssVars['--body-font']).toContain('var(--font-merriweather)');

    const cleanSettings = applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'clean');
    const cleanCssVars = settingsToCssVars(cleanSettings) as Record<string, string>;
    expect(cleanCssVars['--header-font']).not.toContain('var(--font-merriweather)');
    expect(cleanCssVars['--body-font']).not.toContain('var(--font-merriweather)');
  });

  it('only resolves to Merriweather when the font is Serif, not Sans or Mono', () => {
    const monoSettings: TemplateSettings = {
      ...DEFAULT_TEMPLATE_SETTINGS,
      template: 'custom',
      fontSize: { ...DEFAULT_TEMPLATE_SETTINGS.fontSize, headerFont: 'mono', bodyFont: 'mono' },
    };
    const cssVars = settingsToCssVars(monoSettings) as Record<string, string>;
    expect(cssVars['--header-font']).not.toContain('var(--font-merriweather)');
    expect(cssVars['--body-font']).not.toContain('var(--font-merriweather)');
  });
});
