import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  /** Render as a larger, premium-looking input (h-11). Defaults to compact (h-9). */
  size?: 'sm' | 'md';
}

const base = [
  'w-full rounded-xl border bg-surface text-sm text-ink',
  'border-outline shadow-[0_1px_0_rgb(var(--color-ink)/0.02)]',
  'placeholder:text-ink-muted/70',
  'transition-[border-color,box-shadow,background-color] duration-150',
  'focus:border-accent-500 focus:outline-none focus:ring-4 focus:ring-accent-500/15',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'autofill:bg-surface',
].join(' ');

const wrapperBase = [
  'flex w-full items-center gap-2 rounded-xl border bg-surface text-sm text-ink',
  'border-outline shadow-[0_1px_0_rgb(var(--color-ink)/0.02)]',
  'transition-[border-color,box-shadow,background-color] duration-150',
  'focus-within:border-accent-500 focus-within:ring-4 focus-within:ring-accent-500/15',
].join(' ');

const sizeMap = {
  sm: { input: 'h-9 px-3', wrapper: 'h-9 px-3' },
  md: { input: 'h-11 px-3.5', wrapper: 'h-11 px-3.5' },
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leadingIcon, trailingIcon, size = 'md', ...rest },
  ref,
) {
  if (leadingIcon || trailingIcon) {
    return (
      <div
        className={cn(
          wrapperBase,
          sizeMap[size].wrapper,
          invalid &&
            'border-danger-500 focus-within:border-danger-500 focus-within:ring-danger-500/20',
          className,
        )}
      >
        {leadingIcon ? (
          <span className="flex shrink-0 text-ink-muted">{leadingIcon}</span>
        ) : null}
        <input
          ref={ref}
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-muted/70 disabled:opacity-50"
          aria-invalid={invalid || undefined}
          {...rest}
        />
        {trailingIcon ? (
          <span className="flex shrink-0 text-ink-muted">{trailingIcon}</span>
        ) : null}
      </div>
    );
  }
  return (
    <input
      ref={ref}
      className={cn(
        base,
        sizeMap[size].input,
        invalid && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});
