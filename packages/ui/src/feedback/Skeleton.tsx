import { cn } from '../utils/cn';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,theme(colors.neutral.100)_0%,theme(colors.neutral.200)_50%,theme(colors.neutral.100)_100%)] bg-[length:200%_100%]',
        className,
      )}
    />
  );
}
