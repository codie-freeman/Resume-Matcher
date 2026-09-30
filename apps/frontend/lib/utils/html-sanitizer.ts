import DOMPurify from 'isomorphic-dompurify';

/**
 * Whitelist of allowed HTML tags for rich text content
 */
const ALLOWED_TAGS = ['strong', 'em', 'u', 'a'];

/**
 * Whitelist of allowed HTML attributes
 */
const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Sanitizes HTML content using DOMPurify with a strict whitelist.
 * Only allows bold, italic, underline, and link formatting.
 * Uses isomorphic-dompurify which works in both browser and Node.js.
 *
 * @param dirty - The unsanitized HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: true,
  });
}

/**
 * Whitelist of allowed HTML tags for the cover-letter rich text editor:
 * everything sanitizeHtml() allows, plus paragraphs and a font-size span.
 */
const RICH_TEXT_ALLOWED_TAGS = [...ALLOWED_TAGS, 'span', 'p', 'ul', 'ol', 'li'];
const RICH_TEXT_ALLOWED_ATTR = [...ALLOWED_ATTR, 'style'];

// Only ever allow a single font-size or line-height declaration, within a
// sane numeric range — covers whatever the toolbar's presets produce
// without needing this list kept in lockstep with lib/tiptap/font-size.ts.
const FONT_SIZE_RE = /^font-size:\s*([0-9]{1,2})px;?$/;
const LINE_HEIGHT_RE = /^line-height:\s*([0-9](?:\.[0-9]+)?);?$/;

function restrictStyleToFontSize(
  _node: unknown,
  data: { attrName: string; attrValue: string }
): void {
  if (data.attrName !== 'style') return;
  const value = data.attrValue.trim();

  const fontSizeMatch = FONT_SIZE_RE.exec(value);
  if (fontSizeMatch) {
    const px = Number(fontSizeMatch[1]);
    data.attrValue = px >= 8 && px <= 72 ? `font-size: ${px}px` : '';
    return;
  }

  const lineHeightMatch = LINE_HEIGHT_RE.exec(value);
  if (lineHeightMatch) {
    const ratio = Number(lineHeightMatch[1]);
    data.attrValue = ratio >= 0.5 && ratio <= 3 ? `line-height: ${lineHeightMatch[1]}` : '';
    return;
  }

  data.attrValue = '';
}

/**
 * Sanitizes cover-letter HTML from the rich text editor. Same XSS defense as
 * sanitizeHtml(), plus a `style` attribute restricted (via hook) to a bare
 * font-size or line-height declaration in a sane range — never arbitrary CSS.
 */
export function sanitizeRichText(dirty: string): string {
  DOMPurify.addHook('uponSanitizeAttribute', restrictStyleToFontSize);
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
      ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
      FORCE_BODY: true,
    });
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute');
  }
}
