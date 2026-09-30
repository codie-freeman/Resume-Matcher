'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Underline, Link, List, ListOrdered } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { FONT_SIZE_PRESETS, LINE_HEIGHT_PRESETS } from '@/lib/tiptap/font-size';

interface RichTextToolbarProps {
  editor: Editor;
  onLinkClick: () => void;
  /** Show font size / line spacing / bullet & numbered list controls. */
  extended?: boolean;
}

/**
 * Rich Text Toolbar Component
 *
 * Swiss International Style formatting toolbar with B/I/U/Link buttons
 * (plus font size / line spacing / lists when `extended`).
 * Active states shown with Hyper Blue background.
 */
export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  editor,
  onLinkClick,
  extended = false,
}) => {
  const tools = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      shortcut: 'Ctrl+B',
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      shortcut: 'Ctrl+I',
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
      shortcut: 'Ctrl+U',
    },
    {
      icon: Link,
      label: 'Link',
      action: onLinkClick,
      isActive: editor.isActive('link'),
      shortcut: 'Ctrl+K',
    },
    ...(extended
      ? [
          {
            icon: List,
            label: 'Bullet List',
            action: () => editor.chain().focus().toggleBulletList().run(),
            isActive: editor.isActive('bulletList'),
            shortcut: '',
          },
          {
            icon: ListOrdered,
            label: 'Numbered List',
            action: () => editor.chain().focus().toggleOrderedList().run(),
            isActive: editor.isActive('orderedList'),
            shortcut: '',
          },
        ]
      : []),
  ];

  const currentFontSize = editor.getAttributes('textStyle').fontSize ?? '';
  const currentLineHeight = editor.getAttributes('textStyle').lineHeight ?? '';

  return (
    <div className="flex items-center gap-1 p-1 border border-black bg-secondary flex-wrap">
      {tools.map((tool) => (
        <Button
          key={tool.label}
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            tool.action();
          }}
          aria-label={tool.label}
          aria-pressed={tool.isActive}
          title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
          className={cn(
            'h-7 w-7 rounded-none',
            tool.isActive && 'bg-blue-700 text-white hover:bg-blue-800 hover:text-white'
          )}
        >
          <tool.icon className="w-4 h-4" />
        </Button>
      ))}
      {extended && (
        <>
          <select
            value={currentFontSize}
            onChange={(e) => {
              const size = e.target.value;
              if (size) {
                editor.chain().focus().setFontSize(size).run();
              } else {
                editor.chain().focus().unsetFontSize().run();
              }
            }}
            aria-label="Font size"
            title="Font size"
            className="h-7 border border-black bg-white px-1 font-mono text-xs rounded-none focus:outline-none focus:ring-1 focus:ring-blue-700"
          >
            {FONT_SIZE_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <select
            value={currentLineHeight}
            onChange={(e) => {
              const lineHeight = e.target.value;
              if (lineHeight) {
                editor.chain().focus().setLineHeight(lineHeight).run();
              } else {
                editor.chain().focus().unsetLineHeight().run();
              }
            }}
            aria-label="Line spacing"
            title="Line spacing (applies to the current selection)"
            className="h-7 border border-black bg-white px-1 font-mono text-xs rounded-none focus:outline-none focus:ring-1 focus:ring-blue-700"
          >
            {LINE_HEIGHT_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};
