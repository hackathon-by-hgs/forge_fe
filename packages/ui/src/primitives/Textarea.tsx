import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm',
          'focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20',
          'disabled:opacity-50 placeholder:text-neutral-400',
          invalid && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...rest}
      />
    );
  },
);
