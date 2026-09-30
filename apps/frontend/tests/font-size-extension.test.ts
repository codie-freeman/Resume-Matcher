import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontSize } from '@tiptap/extension-text-style/font-size';

// Headless Tiptap editor (no React, no contenteditable interaction needed) —
// exercises the actual setFontSize/unsetFontSize commands and HTML output.
function makeEditor(content: string) {
  return new Editor({
    extensions: [StarterKit, TextStyle, FontSize],
    content,
  });
}

describe('FontSize tiptap extension', () => {
  it('wraps the selection in a span with the requested inline font-size', () => {
    const editor = makeEditor('<p>Hello world</p>');
    editor.commands.selectAll();
    editor.commands.setFontSize('20px');

    expect(editor.getHTML()).toBe('<p><span style="font-size: 20px;">Hello world</span></p>');
    editor.destroy();
  });

  it('unsetFontSize removes the style and the now-empty span', () => {
    const editor = makeEditor('<p>Hello world</p>');
    editor.commands.selectAll();
    editor.commands.setFontSize('20px');
    editor.commands.unsetFontSize();

    expect(editor.getHTML()).toBe('<p>Hello world</p>');
    editor.destroy();
  });

  it('reads the fontSize attribute back out for the toolbar to display', () => {
    const editor = makeEditor('<p><span style="font-size: 12px">small</span></p>');
    editor.commands.setTextSelection(2);

    expect(editor.getAttributes('textStyle').fontSize).toBe('12px');
    editor.destroy();
  });
});
