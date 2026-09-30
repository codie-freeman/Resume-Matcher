// Cover-letter toolbar presets. The actual Tiptap extensions are the
// official ones bundled with @tiptap/extension-text-style (font-size /
// line-height subpaths) — imported directly where the editor is built.

export const FONT_SIZE_PRESETS = [
  { value: '', label: 'Normal' },
  { value: '12px', label: 'Small' },
  { value: '20px', label: 'Large' },
  { value: '24px', label: 'X-Large' },
] as const;

export const LINE_HEIGHT_PRESETS = [
  { value: '', label: 'Normal' },
  { value: '1.15', label: 'Tight' },
  { value: '1.5', label: '1.5x' },
  { value: '2', label: 'Double' },
] as const;
