import { cn } from '../utils/cn';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-12 w-12 text-sm',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const cls = cn(
    'inline-flex items-center justify-center overflow-hidden rounded-full',
    'bg-neutral-200 font-semibold text-neutral-700',
    sizeMap[size],
    className,
  );
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={cls} />
    );
  }
  return (
    <span className={cls} aria-label={name}>
      {initials(name)}
    </span>
  );
}
