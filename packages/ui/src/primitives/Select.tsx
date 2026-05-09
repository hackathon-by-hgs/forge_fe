import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectOption[];
  invalid?: boolean;
  placeholder?: string;
}

/**
 * Native `<select>` for now. Sufficient for filters and form fields. Can be
 * upgraded to a Radix Select if we need a custom listbox UI.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, invalid, placeholder, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full appearance-none rounded-md border border-neutral-200 bg-white pl-3 pr-8 text-sm',
        'bg-[url("data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%2020%2020\'%20fill=\'none\'%20stroke=\'%23737373\'%20stroke-width=\'2\'%3e%3cpath%20d=\'M6%208l4%204%204-4\'/%3e%3c/svg%3e")] bg-[length:14px_14px] bg-[right_0.5rem_center] bg-no-repeat',
        'focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20',
        'disabled:opacity-50',
        invalid && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});
