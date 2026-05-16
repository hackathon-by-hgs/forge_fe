import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FormFieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  /** Renders to the right of the label — useful for inline links like "Forgot password?". */
  endAdornment?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  endAdornment,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label || endAdornment ? (
        <div className="flex items-center justify-between gap-3">
          {label ? (
            <label
              htmlFor={htmlFor}
              className="text-[12px] font-medium tracking-[-0.005em] text-ink-muted"
            >
              {label}
              {required ? (
                <span className="ml-0.5 text-danger-500" aria-hidden>
                  *
                </span>
              ) : null}
            </label>
          ) : (
            <span />
          )}
          {endAdornment}
        </div>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs leading-relaxed text-danger-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
