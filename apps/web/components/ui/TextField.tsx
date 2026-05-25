import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, hint, error, className, id, ...rest }, ref) {
    const inputId = id ?? `tf-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="eyebrow text-[10.5px] text-ink-2"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-surface text-ink',
            'px-3.5 py-2.5',
            'border border-rule rounded-md',
            'placeholder:text-mute placeholder:font-normal',
            'transition-shadow duration-150',
            'focus-ring',
            error && 'border-wrong',
            className,
          )}
          {...rest}
        />
        {error ? (
          <p className="text-xs text-wrong serif-italic mt-0.5">{error}</p>
        ) : hint ? (
          <p className="text-xs text-mute mt-0.5">{hint}</p>
        ) : null}
      </div>
    );
  },
);
