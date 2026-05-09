import { cn } from '../utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZE = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6' } as const;

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-neutral-400',
        SIZE[size],
        className,
      )}
    />
  );
}
