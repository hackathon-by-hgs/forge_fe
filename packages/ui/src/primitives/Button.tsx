import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

const button = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap',
    'rounded-lg border',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-accent-500 border-accent-500 text-white hover:bg-accent-600 hover:border-accent-600',
        secondary: 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300',
        ghost: 'bg-transparent border-transparent text-neutral-700 hover:bg-neutral-100',
        danger: 'bg-danger-500 border-danger-500 text-white hover:bg-danger-600 hover:border-danger-600',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonVariants = VariantProps<typeof button>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, leadingIcon, trailingIcon, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      disabled={disabled ?? loading}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
