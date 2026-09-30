import { describe, expect, it } from 'vitest';
import { looksLikeHtml, plainTextToHtml, stripHtml, toRichTextHtml } from '@/lib/utils/rich-text';

describe('looksLikeHtml', () => {
  it('detects the rich text editor tags', () => {
    expect(looksLikeHtml('<p>Hello</p>')).toBe(true);
    expect(looksLikeHtml('Some <strong>bold</strong> text')).toBe(true);
  });

  it('treats legacy plain text as not HTML', () => {
    expect(looksLikeHtml('Dear Hiring Manager,\n\nI am writing to apply.')).toBe(false);
  });
});

describe('plainTextToHtml', () => {
  it('wraps each non-empty line in its own paragraph', () => {
    const html = plainTextToHtml(
      'Dear Hiring Manager,\n\nI am writing to apply.\nSincerely,\nJane'
    );
    expect(html).toBe(
      '<p>Dear Hiring Manager,</p><p>I am writing to apply.</p><p>Sincerely,</p><p>Jane</p>'
    );
  });

  it('escapes HTML special characters from legacy content', () => {
    const html = plainTextToHtml('Reviewing <script>alert(1)</script> & such');
    expect(html).toBe('<p>Reviewing &lt;script&gt;alert(1)&lt;/script&gt; &amp; such</p>');
  });

  it('drops blank lines', () => {
    expect(plainTextToHtml('a\n\n\nb')).toBe('<p>a</p><p>b</p>');
  });
});

describe('toRichTextHtml', () => {
  it('passes through content that already looks like HTML', () => {
    const html = '<p><strong>Hi</strong></p>';
    expect(toRichTextHtml(html)).toBe(html);
  });

  it('converts legacy plain text to HTML', () => {
    expect(toRichTextHtml('Hello there')).toBe('<p>Hello there</p>');
  });

  it('returns empty string for empty content', () => {
    expect(toRichTextHtml('')).toBe('');
  });
});

describe('stripHtml', () => {
  it('removes tags and decodes common entities', () => {
    expect(stripHtml('<p><strong>Hi</strong> &amp; welcome</p>')).toBe('Hi & welcome');
  });

  it('collapses whitespace left behind by stripped tags', () => {
    expect(stripHtml('<p>a</p><p>b</p>')).toBe('a b');
  });
});
