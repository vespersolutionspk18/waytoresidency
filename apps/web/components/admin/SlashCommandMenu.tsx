'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { Editor, Range } from '@tiptap/core';
import { cn } from '@/lib/utils';

export type SlashItem = {
  title: string;
  desc: string;
  hint?: string; // shortcut hint like "##"
  icon: React.ReactNode;
  searchTerms: string[];
  command: (args: { editor: Editor; range: Range }) => void;
};

type Props = {
  items: SlashItem[];
  command: (item: SlashItem) => void;
};

export type SlashHandle = {
  onKeyDown: (event: { event: KeyboardEvent }) => boolean;
};

export const SlashCommandMenu = forwardRef<SlashHandle, Props>(function SlashCommandMenu(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  // scroll selected into view
  useLayoutEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowDown') {
        setSelected((s) => (items.length === 0 ? 0 : (s + 1) % items.length));
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelected((s) => (items.length === 0 ? 0 : (s - 1 + items.length) % items.length));
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selected];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div>
        <div className="px-3 py-2 text-[12.5px] text-mute serif-italic">No commands match.</div>
      </div>
    );
  }

  return (
    <div ref={listRef}>
      <div className="px-3 py-2 border-b border-rule">
        <span className="eyebrow text-[10px]">Insert block</span>
      </div>
      <div className="max-h-[440px] overflow-y-auto py-1">
        {items.map((item, i) => (
          <button
            key={item.title}
            type="button"
            data-index={i}
            onMouseDown={(e) => {
              e.preventDefault();
              command(item);
            }}
            onMouseEnter={() => setSelected(i)}
            className={cn(
              'w-full text-left flex items-center gap-3 px-3 py-1.5 transition-colors',
              i === selected ? 'bg-apothecary text-paper' : 'text-ink-2 hover:bg-paper-2',
            )}
          >
            <span
              className={cn(
                'w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-md border text-[15px]',
                i === selected
                  ? 'bg-apothecary-2 border-apothecary-2 text-paper'
                  : 'bg-paper border-rule text-ink-2',
              )}
            >
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'text-[13.5px] truncate',
                  i === selected ? 'text-paper' : 'text-ink',
                )}
              >
                {item.title}
              </div>
              <div
                className={cn(
                  'text-[11.5px] truncate',
                  i === selected ? 'text-paper/80' : 'text-mute',
                )}
              >
                {item.desc}
              </div>
            </div>
            {item.hint && (
              <span
                className={cn(
                  'shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded',
                  i === selected
                    ? 'bg-paper/15 text-paper'
                    : 'bg-paper-2 text-mute border border-rule',
                )}
              >
                {item.hint}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});
