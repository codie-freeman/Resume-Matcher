import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { RichTextToolbar } from '@/components/ui/rich-text-toolbar';

// A minimal fluent stand-in for Tiptap's Editor — enough surface for the
// toolbar to call chain().focus().<command>().run() and read back state.
function makeFakeEditor(overrides: { fontSize?: string | null; isActive?: boolean } = {}) {
  const calls: string[][] = [];
  const chain = () => {
    const step =
      (name: string) =>
      (...args: unknown[]) => {
        calls.push([name, ...args.map(String)]);
        return proxy;
      };
    const proxy: Record<string, unknown> = {
      focus: step('focus'),
      toggleBold: step('toggleBold'),
      toggleItalic: step('toggleItalic'),
      toggleUnderline: step('toggleUnderline'),
      setFontSize: step('setFontSize'),
      unsetFontSize: step('unsetFontSize'),
      run: () => {
        calls.push(['run']);
        return true;
      },
    };
    return proxy;
  };

  const editor = {
    chain,
    isActive: () => overrides.isActive ?? false,
    getAttributes: () => ({ fontSize: overrides.fontSize ?? null }),
  } as unknown as Editor;

  return { editor, calls };
}

describe('RichTextToolbar font size control', () => {
  it('is hidden by default', () => {
    const { editor } = makeFakeEditor();
    render(<RichTextToolbar editor={editor} onLinkClick={vi.fn()} />);
    expect(screen.queryByLabelText('Font size')).not.toBeInTheDocument();
  });

  it('shows Normal selected when there is no fontSize mark', () => {
    const { editor } = makeFakeEditor({ fontSize: null });
    render(<RichTextToolbar editor={editor} onLinkClick={vi.fn()} extended />);
    expect(screen.getByLabelText('Font size')).toHaveValue('');
  });

  it('shows the current preset selected', () => {
    const { editor } = makeFakeEditor({ fontSize: '20px' });
    render(<RichTextToolbar editor={editor} onLinkClick={vi.fn()} extended />);
    expect(screen.getByLabelText('Font size')).toHaveValue('20px');
  });

  it('calls setFontSize with the preset pixel value on selection', () => {
    const { editor, calls } = makeFakeEditor();
    render(<RichTextToolbar editor={editor} onLinkClick={vi.fn()} extended />);

    fireEvent.change(screen.getByLabelText('Font size'), { target: { value: '20px' } });

    expect(calls).toContainEqual(['setFontSize', '20px']);
    expect(calls).not.toContainEqual(expect.arrayContaining(['unsetFontSize']));
  });

  it('calls unsetFontSize when switching back to Normal', () => {
    const { editor, calls } = makeFakeEditor({ fontSize: '20px' });
    render(<RichTextToolbar editor={editor} onLinkClick={vi.fn()} extended />);

    fireEvent.change(screen.getByLabelText('Font size'), { target: { value: '' } });

    expect(calls.map((c) => c[0])).toContain('unsetFontSize');
  });
});
