import { type LabelHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs font-medium text-neutral-700', className)}
      {...rest}
    />
  );
}
