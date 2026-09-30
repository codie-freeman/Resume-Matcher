// Helpers for cover-letter content, which can be either legacy plain text
// (pre-rich-text saves, and every AI-generated draft — the backend prompt
// still outputs plain text on purpose) or HTML from the rich text editor.

const HTML_TAG_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (char) => HTML_TAG_ENTITIES[char]);
}

/** True if the content already contains one of the rich-text editor's own tags. */
export function looksLikeHtml(content: string): boolean {
  return /<(p|strong|em|u|a|span)[\s/>]/i.test(content);
}

/** Converts legacy plain text (one paragraph per line) into `<p>` HTML. */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

/** Content as HTML, converting legacy plain text on the fly if needed. */
export function toRichTextHtml(content: string): string {
  if (!content) return '';
  return looksLikeHtml(content) ? content : plainTextToHtml(content);
}

/** Strips tags for word/char counts and empty-content checks. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
