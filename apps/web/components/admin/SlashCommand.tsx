import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import {
  SlashCommandMenu,
  type SlashHandle,
  type SlashItem,
} from './SlashCommandMenu';

export const SLASH_COMMANDS: SlashItem[] = [
  {
    title: 'Heading 1',
    desc: 'Large section heading',
    hint: '#',
    icon: <H1Icon />,
    searchTerms: ['h1', 'heading', 'title', 'big'],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 1 })
        .run(),
  },
  {
    title: 'Heading 2',
    desc: 'Medium section heading',
    hint: '##',
    icon: <H2Icon />,
    searchTerms: ['h2', 'heading', 'subhead'],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 2 })
        .run(),
  },
  {
    title: 'Heading 3',
    desc: 'Small section heading',
    hint: '###',
    icon: <H3Icon />,
    searchTerms: ['h3', 'heading'],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleHeading({ level: 3 })
        .run(),
  },
  {
    title: 'Paragraph',
    desc: 'Plain body text',
    icon: <ParaIcon />,
    searchTerms: ['p', 'paragraph', 'text', 'plain'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Bulleted list',
    desc: 'Simple unordered list',
    hint: '-',
    icon: <BulletIcon />,
    searchTerms: ['bullet', 'list', 'ul'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    desc: 'Ordered list with numbers',
    hint: '1.',
    icon: <NumberedIcon />,
    searchTerms: ['number', 'ordered', 'list', 'ol'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    desc: 'Pull-out blockquote',
    hint: '>',
    icon: <QuoteIcon />,
    searchTerms: ['quote', 'blockquote', 'cite'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code block',
    desc: 'Monospaced fenced code',
    hint: '```',
    icon: <CodeIcon />,
    searchTerms: ['code', 'pre', 'block', 'monospace'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    desc: 'Horizontal rule between sections',
    hint: '---',
    icon: <DividerIcon />,
    searchTerms: ['hr', 'divider', 'rule', 'line', 'separator'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Table',
    desc: '3×3 table with a header row',
    hint: '▦',
    icon: <TableIcon />,
    searchTerms: ['table', 'grid', 'rows', 'columns'],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: 'Inline code',
    desc: 'Toggle monospace on the selection',
    hint: '`',
    icon: <InlineCodeIcon />,
    searchTerms: ['code', 'inline', 'monospace'],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCode().run(),
  },
];

function filter(query: string): SlashItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.searchTerms.some((t) => t.toLowerCase().includes(q)),
  );
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashItem;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => filter(query),
        render: () => {
          let component: ReactRenderer<SlashHandle, { items: SlashItem[]; command: (i: SlashItem) => void }>;
          let popup: HTMLDivElement | null = null;

          function position(rect: () => DOMRect | null) {
            if (!popup) return;
            const r = rect();
            if (!r) {
              popup.style.display = 'none';
              return;
            }
            popup.style.display = 'block';
            popup.style.position = 'absolute';

            // Clamp horizontally so the popup never spills outside the viewport
            // on phones — `.slash-popup` width is min(320, vw-32).
            const popupWidth = popup.offsetWidth || 320;
            const desiredLeft = r.left;
            const maxLeft = window.innerWidth - popupWidth - 8;
            const clampedLeft = Math.max(8, Math.min(desiredLeft, maxLeft));
            popup.style.left = `${window.scrollX + clampedLeft}px`;

            const popupHeight = popup.offsetHeight || 320;
            const overflowsBottom = r.bottom + popupHeight + 8 > window.innerHeight;
            popup.style.top = overflowsBottom
              ? `${window.scrollY + r.top - popupHeight - 6}px`
              : `${window.scrollY + r.bottom + 6}px`;
            popup.style.zIndex = '60';
          }

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props: {
                  items: props.items,
                  command: (item: SlashItem) =>
                    props.command(item as unknown as { [key: string]: unknown }),
                },
                editor: props.editor,
              });
              popup = document.createElement('div');
              popup.className = 'slash-popup'; // applies the white bg + border + shadow defined in globals.css
              popup.appendChild(component.element);
              document.body.appendChild(popup);
              position(props.clientRect ?? (() => null));
            },
            onUpdate: (props) => {
              component.updateProps({
                items: props.items,
                command: (item: SlashItem) =>
                  props.command(item as unknown as { [key: string]: unknown }),
              });
              position(props.clientRect ?? (() => null));
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                if (popup) popup.style.display = 'none';
                return true;
              }
              return component.ref?.onKeyDown({ event: props.event }) ?? false;
            },
            onExit: () => {
              popup?.remove();
              popup = null;
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});

// ---------- Icons (inline SVG, match editorial palette) ----------

function H1Icon() {
  return <span className="font-display text-[13px]" style={{ fontWeight: 600 }}>H1</span>;
}
function H2Icon() {
  return <span className="font-display text-[13px]" style={{ fontWeight: 550 }}>H2</span>;
}
function H3Icon() {
  return <span className="font-display text-[12px]" style={{ fontWeight: 500 }}>H3</span>;
}
function ParaIcon() {
  return <span className="font-serif text-[15px] italic">¶</span>;
}
function BulletIcon() {
  return <span className="text-[14px]">•</span>;
}
function NumberedIcon() {
  return <span className="font-mono text-[10.5px]">1.</span>;
}
function QuoteIcon() {
  return <span className="text-[15px] leading-none">❝</span>;
}
function CodeIcon() {
  return <span className="font-mono text-[10px]">{'</>'}</span>;
}
function DividerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function TableIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <rect x="1.5" y="2.5" width="11" height="9" />
      <path d="M1.5 6h11M5 2.5v9" />
    </svg>
  );
}
function InlineCodeIcon() {
  return <span className="font-mono text-[10.5px]">{'</>'}</span>;
}
