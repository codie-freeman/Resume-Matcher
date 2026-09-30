import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATE_SETTINGS, mergeTemplateSettings } from '@/lib/types/template-settings';

describe('mergeTemplateSettings', () => {
  it('returns the defaults unchanged when nothing is saved', () => {
    expect(mergeTemplateSettings({})).toEqual(DEFAULT_TEMPLATE_SETTINGS);
  });

  it('carries over a saved template/format choice instead of resetting to the default', () => {
    const saved = {
      template: 'latex' as const,
      accentColor: 'green' as const,
      justifyBullets: true,
    };
    const merged = mergeTemplateSettings(saved);
    expect(merged.template).toBe('latex');
    expect(merged.accentColor).toBe('green');
    expect(merged.justifyBullets).toBe(true);
  });

  it('fills in a missing nested field (e.g. a margin added after the resume was last saved) from defaults, without discarding sibling fields the user did set', () => {
    const saved = {
      margins: {
        top: 20,
        bottom: 20,
        left: 20,
      } as unknown as (typeof DEFAULT_TEMPLATE_SETTINGS)['margins'],
    };
    const merged = mergeTemplateSettings(saved);
    expect(merged.margins.top).toBe(20);
    expect(merged.margins.bottom).toBe(20);
    expect(merged.margins.left).toBe(20);
    // `right` was never saved — falls back to the default rather than becoming undefined.
    expect(merged.margins.right).toBe(DEFAULT_TEMPLATE_SETTINGS.margins.right);
  });

  it('does not mutate DEFAULT_TEMPLATE_SETTINGS', () => {
    const before = JSON.stringify(DEFAULT_TEMPLATE_SETTINGS);
    mergeTemplateSettings({ template: 'vivid', spacing: { section: 5, item: 5, lineHeight: 5 } });
    expect(JSON.stringify(DEFAULT_TEMPLATE_SETTINGS)).toBe(before);
  });
});
