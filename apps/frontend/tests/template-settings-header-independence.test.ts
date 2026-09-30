import { describe, expect, it } from 'vitest';
import {
  NAME_FONT_SIZE_MAP,
  SECTION_HEADER_FONT_SIZE_MAP,
  CONTACT_FONT_SIZE_MAP,
  FONT_SIZE_MAP,
  DEFAULT_TEMPLATE_SETTINGS,
  settingsToCssVars,
  type SpacingLevel,
} from '@/lib/types/template-settings';

describe('NAME_FONT_SIZE_MAP / SECTION_HEADER_FONT_SIZE_MAP', () => {
  it('never equals the body text size, so a header never collapses to look like body copy', () => {
    for (const level of [1, 2, 3, 4, 5] as SpacingLevel[]) {
      const sectionHeaderPx = parseFloat(SECTION_HEADER_FONT_SIZE_MAP[level]);
      const bodyPx = parseFloat(FONT_SIZE_MAP[level]);
      expect(sectionHeaderPx).toBeGreaterThan(bodyPx);
    }
  });

  it('still scales up with each level', () => {
    const levels: SpacingLevel[] = [1, 2, 3, 4, 5];
    const nameSizes = levels.map((l) => parseFloat(NAME_FONT_SIZE_MAP[l]));
    const sectionSizes = levels.map((l) => parseFloat(SECTION_HEADER_FONT_SIZE_MAP[l]));
    const contactSizes = levels.map((l) => parseFloat(CONTACT_FONT_SIZE_MAP[l]));
    for (let i = 1; i < levels.length; i++) {
      expect(nameSizes[i]).toBeGreaterThan(nameSizes[i - 1]);
      expect(sectionSizes[i]).toBeGreaterThan(sectionSizes[i - 1]);
      expect(contactSizes[i]).toBeGreaterThan(contactSizes[i - 1]);
    }
  });
});

describe('settingsToCssVars: Base, Headers, Name, and Contact are fully independent', () => {
  const buildSettings = (overrides: Partial<typeof DEFAULT_TEMPLATE_SETTINGS.fontSize>) => ({
    ...DEFAULT_TEMPLATE_SETTINGS,
    fontSize: { ...DEFAULT_TEMPLATE_SETTINGS.fontSize, ...overrides },
  });

  it('changing Base alone never changes the computed section-header, name, or contact size', () => {
    const sizesAcrossBase = ([1, 2, 3, 4, 5] as SpacingLevel[]).map((base) => {
      const cssVars = settingsToCssVars(buildSettings({ base })) as Record<string, unknown>;
      return {
        sectionHeader: cssVars['--section-header-font-size'],
        name: cssVars['--name-font-size'],
        contact: cssVars['--contact-font-size'],
      };
    });

    for (const entry of sizesAcrossBase) {
      expect(entry.sectionHeader).toBe(sizesAcrossBase[0].sectionHeader);
      expect(entry.name).toBe(sizesAcrossBase[0].name);
      expect(entry.contact).toBe(sizesAcrossBase[0].contact);
    }
  });

  it('changing Headers alone never changes the computed body, name, or contact size', () => {
    const sizesAcrossHeaders = ([1, 2, 3, 4, 5] as SpacingLevel[]).map((headerScale) => {
      const cssVars = settingsToCssVars(buildSettings({ headerScale })) as Record<string, unknown>;
      return {
        body: cssVars['--font-size-base'],
        name: cssVars['--name-font-size'],
        contact: cssVars['--contact-font-size'],
      };
    });

    for (const entry of sizesAcrossHeaders) {
      expect(entry.body).toBe(sizesAcrossHeaders[0].body);
      expect(entry.name).toBe(sizesAcrossHeaders[0].name);
      expect(entry.contact).toBe(sizesAcrossHeaders[0].contact);
    }
  });

  it('changing Name alone never changes the computed body, section-header, or contact size', () => {
    const sizesAcrossName = ([1, 2, 3, 4, 5] as SpacingLevel[]).map((nameSize) => {
      const cssVars = settingsToCssVars(buildSettings({ nameSize })) as Record<string, unknown>;
      return {
        body: cssVars['--font-size-base'],
        sectionHeader: cssVars['--section-header-font-size'],
        contact: cssVars['--contact-font-size'],
      };
    });

    for (const entry of sizesAcrossName) {
      expect(entry.body).toBe(sizesAcrossName[0].body);
      expect(entry.sectionHeader).toBe(sizesAcrossName[0].sectionHeader);
      expect(entry.contact).toBe(sizesAcrossName[0].contact);
    }
  });

  it('changing Contact alone never changes the computed body, section-header, or name size', () => {
    const sizesAcrossContact = ([1, 2, 3, 4, 5] as SpacingLevel[]).map((contactSize) => {
      const cssVars = settingsToCssVars(buildSettings({ contactSize })) as Record<string, unknown>;
      return {
        body: cssVars['--font-size-base'],
        sectionHeader: cssVars['--section-header-font-size'],
        name: cssVars['--name-font-size'],
      };
    });

    for (const entry of sizesAcrossContact) {
      expect(entry.body).toBe(sizesAcrossContact[0].body);
      expect(entry.sectionHeader).toBe(sizesAcrossContact[0].sectionHeader);
      expect(entry.name).toBe(sizesAcrossContact[0].name);
    }
  });

  it('Name and Contact resolve to their own dedicated maps', () => {
    const cssVars = settingsToCssVars(buildSettings({ nameSize: 5, contactSize: 1 })) as Record<
      string,
      unknown
    >;
    expect(cssVars['--name-font-size']).toBe(NAME_FONT_SIZE_MAP[5]);
    expect(cssVars['--contact-font-size']).toBe(CONTACT_FONT_SIZE_MAP[1]);
  });
});
