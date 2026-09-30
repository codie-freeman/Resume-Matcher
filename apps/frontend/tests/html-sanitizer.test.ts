import { describe, expect, it } from 'vitest';
import { sanitizeHtml, sanitizeRichText } from '@/lib/utils/html-sanitizer';

/**
 * sanitizeHtml guards every `dangerouslySetInnerHTML` sink (rich-text bullets,
 * LLM output). Whitelist: strong/em/u/a + href/target/rel. Anything else must go.
 */

describe('sanitizeHtml', () => {
  it('keeps whitelisted formatting tags', () => {
    const out = sanitizeHtml('<strong>bold</strong> <em>italic</em> <u>under</u>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<em>italic</em>');
    expect(out).toContain('<u>under</u>');
  });

  it('keeps anchor href', () => {
    const out = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('link');
  });

  it('strips <script> entirely (tag + content)', () => {
    const out = sanitizeHtml('<script>alert(1)</script>safe');
    expect(out).not.toContain('script');
    expect(out).not.toContain('alert');
    expect(out).toContain('safe');
  });

  it('strips event-handler attributes but keeps the element text', () => {
    const out = sanitizeHtml('<a href="https://x.com" onclick="evil()">click</a>');
    expect(out).not.toContain('onclick');
    expect(out).toContain('click');
  });

  it('removes a non-whitelisted tag while keeping its text', () => {
    const out = sanitizeHtml('<div>plain text</div>');
    expect(out).not.toContain('<div>');
    expect(out).toContain('plain text');
  });

  it('drops dangerous tags like <img onerror>', () => {
    const out = sanitizeHtml('<img src=x onerror="alert(1)">');
    expect(out).not.toContain('img');
    expect(out).not.toContain('onerror');
  });
});

/**
 * sanitizeRichText guards the cover-letter editor's dangerouslySetInnerHTML
 * sinks. Whitelist: strong/em/u/a/span/p + href/target/rel/style, where
 * style is restricted to exactly one of the font-size presets.
 */
describe('sanitizeRichText', () => {
  it('keeps paragraphs and whitelisted inline formatting', () => {
    const out = sanitizeRichText('<p><strong>bold</strong> <em>italic</em> <u>under</u></p>');
    expect(out).toContain('<p>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<em>italic</em>');
    expect(out).toContain('<u>under</u>');
  });

  it('keeps a span with an allowed font-size style', () => {
    const out = sanitizeRichText('<span style="font-size: 20px">big</span>');
    expect(out).toContain('style="font-size: 20px"');
    expect(out).toContain('big');
  });

  it('accepts the trailing semicolon the browser/Tiptap actually serializes', () => {
    const out = sanitizeRichText('<span style="font-size: 20px;">big</span>');
    expect(out).toContain('style="font-size: 20px"');
  });

  it('strips a style attribute that is not an allowed font-size', () => {
    const out = sanitizeRichText('<span style="font-size: 999px">x</span>');
    expect(out).not.toContain('999px');

    const out2 = sanitizeRichText('<span style="color: red; font-size: 20px">x</span>');
    expect(out2).not.toContain('color');
    expect(out2).not.toContain('20px');
  });

  it('strips unrelated CSS smuggled into the style attribute', () => {
    const out = sanitizeRichText(
      '<span style="font-size: 20px; background: url(javascript:alert(1))">x</span>'
    );
    expect(out).not.toContain('url(');
    expect(out).not.toContain('background');
  });

  it('still strips <script> and event handlers', () => {
    const out = sanitizeRichText('<p onclick="evil()"><script>alert(1)</script>safe</p>');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('script');
    expect(out).toContain('safe');
  });

  it('does not leak the style restriction hook into sanitizeHtml', () => {
    // sanitizeRichText registers/unregisters its hook around each call; a
    // later plain sanitizeHtml() call must not allow `style` through at all.
    sanitizeRichText('<span style="font-size: 20px">x</span>');
    const out = sanitizeHtml('<span style="font-size: 20px">x</span>');
    expect(out).not.toContain('style');
    expect(out).not.toContain('span');
  });
});
