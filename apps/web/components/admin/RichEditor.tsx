'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { useEffect, useRef, useState } from 'react';
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from 'emoji-picker-react';
import { SlashCommand } from './SlashCommand';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function RichEditor({
  value,
  onChange,
  placeholder = 'Start typing… use the toolbar or type / for headings, lists, and code.',
  minHeight = 280,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading';
          return placeholder;
        },
        emptyEditorClass: 'is-editor-empty',
        showOnlyCurrent: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      Typography,
      Table.configure({ resizable: false, HTMLAttributes: { class: 'tiptap-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      SlashCommand,
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose-content tiptap-editor focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor in sync if `value` is replaced externally
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-rule rounded-md bg-surface overflow-hidden focus-within:border-apothecary focus-within:shadow-[0_0_0_3px_rgba(41,74,61,0.15)]">
      <Toolbar editor={editor} />
      <TableToolbar editor={editor} />
      <div
        className="px-5 py-4 cursor-text"
        style={{ minHeight }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
      <div className="border-t border-rule px-4 py-2 bg-paper-2 text-[11.5px] text-mute flex items-center gap-3 flex-wrap">
        <span>
          Type <kbd className="px-1 py-0.5 font-mono text-[10.5px] bg-paper border border-rule rounded">/</kbd> for blocks ·
        </span>
        <span>
          <kbd className="px-1 py-0.5 font-mono text-[10.5px] bg-paper border border-rule rounded">#</kbd>{' '}
          space → heading ·
        </span>
        <span>
          <kbd className="px-1 py-0.5 font-mono text-[10.5px] bg-paper border border-rule rounded">**</kbd>bold,{' '}
          <kbd className="px-1 py-0.5 font-mono text-[10.5px] bg-paper border border-rule rounded">*</kbd>italic
        </span>
        <span className="text-[10.5px]">· click into a table for row/column controls</span>
      </div>
    </div>
  );
}


function Toolbar({ editor }: { editor: Editor }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const emojiRef = useRef<HTMLDivElement>(null);

  // close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return;
    function onDoc(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showEmoji]);

  function pickEmoji(e: EmojiClickData) {
    editor.chain().focus().insertContent(e.emoji).run();
    setShowEmoji(false);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^(https?:|mailto:)/.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setShowLink(false);
    setLinkUrl('');
  }

  const can = editor.can();

  return (
    <div className="flex items-center gap-px border-b border-rule bg-paper-2 px-1.5 py-1.5 flex-wrap relative">
      <Group>
        <Btn
          label="Bold"
          shortcut="⌘B"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={!can.chain().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </Btn>
        <Btn
          label="Italic"
          shortcut="⌘I"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <span className="italic font-serif">I</span>
        </Btn>
        <Btn
          label="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <span className="line-through">S</span>
        </Btn>
        <Btn
          label="Inline code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          <span className="font-mono text-[11px]">{'</>'}</span>
        </Btn>
      </Group>
      <Divider />
      <Group>
        <Btn
          label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <span className="font-display" style={{ fontWeight: 500 }}>
            H2
          </span>
        </Btn>
        <Btn
          label="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <span className="font-display text-[12.5px]" style={{ fontWeight: 500 }}>
            H3
          </span>
        </Btn>
        <Btn
          label="Heading 4"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          active={editor.isActive('heading', { level: 4 })}
        >
          <span className="font-display text-[12px]" style={{ fontWeight: 500 }}>
            H4
          </span>
        </Btn>
      </Group>
      <Divider />
      <Group>
        <Btn
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          •
        </Btn>
        <Btn
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <span className="text-[10.5px]">1.</span>
        </Btn>
        <Btn
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <span className="text-[14px]">❝</span>
        </Btn>
        <Btn
          label="Code block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        >
          <span className="font-mono text-[10px]">{`{ }`}</span>
        </Btn>
        <Btn
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ―
        </Btn>
        <Btn
          label="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
            <rect x="1.5" y="2.5" width="11" height="9" />
            <path d="M1.5 6h11M5 2.5v9" />
          </svg>
        </Btn>
      </Group>
      <Divider />
      <Group>
        <Btn
          label="Add link"
          onClick={() => {
            const prev = editor.getAttributes('link').href as string | undefined;
            setLinkUrl(prev ?? '');
            setShowLink(true);
          }}
          active={editor.isActive('link')}
        >
          <span className="text-[12px]">🔗</span>
        </Btn>
        <Btn
          label="Insert emoji"
          onClick={() => setShowEmoji((v) => !v)}
          active={showEmoji}
        >
          <span className="text-[13px]">😀</span>
        </Btn>
      </Group>
      <div className="ml-auto pr-1 text-[11px] text-mute">
        markdown shortcuts work: **bold**, *italic*, # H2, - list
      </div>

      {showLink && (
        <div className="absolute top-full left-2 mt-1 z-30 bg-surface border border-rule rounded-md shadow-md p-2 flex gap-1 items-center">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyLink();
              if (e.key === 'Escape') setShowLink(false);
            }}
            placeholder="https://…"
            className="h-8 w-[260px] px-2 text-[13px] border border-rule rounded bg-paper focus:border-apothecary outline-none"
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-8 px-2.5 text-[12px] font-medium rounded bg-apothecary text-paper hover:bg-apothecary-2"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLink(false);
              setLinkUrl('');
            }}
            className="h-8 px-2 text-[12px] text-mute hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      {showEmoji && (
        <div ref={emojiRef} className="absolute top-full right-2 mt-1 z-30 shadow-md">
          <EmojiPicker
            onEmojiClick={pickEmoji}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.LIGHT}
            width={320}
            height={380}
            previewConfig={{ showPreview: false }}
            searchPlaceholder="Search emoji…"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Renders a contextual second row of buttons when the cursor is inside a table.
 * Add/remove rows + columns, delete table.
 */
function TableToolbar({ editor }: { editor: Editor }) {
  const [inTable, setInTable] = useState(false);

  // Subscribe to selection updates so the toolbar appears/disappears as the
  // cursor moves in and out of a table.
  useEffect(() => {
    function check() {
      setInTable(editor.isActive('table'));
    }
    editor.on('selectionUpdate', check);
    editor.on('transaction', check);
    check();
    return () => {
      editor.off('selectionUpdate', check);
      editor.off('transaction', check);
    };
  }, [editor]);

  if (!inTable) return null;

  return (
    <div className="flex items-center gap-px border-b border-rule bg-apothecary-soft/40 px-1.5 py-1.5 flex-wrap">
      <span className="eyebrow text-[9.5px] text-apothecary mr-2 pl-1">Table</span>
      <Group>
        <Btn label="Add row above" onClick={() => editor.chain().focus().addRowBefore().run()}>
          <span className="text-[11px]">↑ row</span>
        </Btn>
        <Btn label="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
          <span className="text-[11px]">↓ row</span>
        </Btn>
        <Btn label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
          <span className="text-[11px]">✕ row</span>
        </Btn>
      </Group>
      <Divider />
      <Group>
        <Btn label="Add column left" onClick={() => editor.chain().focus().addColumnBefore().run()}>
          <span className="text-[11px]">← col</span>
        </Btn>
        <Btn label="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
          <span className="text-[11px]">→ col</span>
        </Btn>
        <Btn label="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
          <span className="text-[11px]">✕ col</span>
        </Btn>
      </Group>
      <Divider />
      <Group>
        <Btn label="Toggle header row" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
          <span className="text-[11px]">Hdr</span>
        </Btn>
        <Btn label="Merge / split cells" onClick={() => editor.chain().focus().mergeOrSplit().run()}>
          <span className="text-[11px]">⤫ cell</span>
        </Btn>
        <Btn
          label="Delete table"
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          <span className="text-[11px] text-wrong">✕ table</span>
        </Btn>
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-px">{children}</div>;
}

function Divider() {
  return <span className="w-px h-5 bg-rule mx-1.5" aria-hidden />;
}

function Btn({
  children,
  onClick,
  active,
  disabled,
  label,
  shortcut,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded text-[12.5px]',
        'transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-ink text-paper'
          : 'text-ink-2 hover:bg-paper hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
