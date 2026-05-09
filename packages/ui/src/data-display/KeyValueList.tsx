import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface KeyValueRow {
  label: string;
  value: ReactNode;
  hint?: string;
}

export interface KeyValueListProps {
  items: readonly KeyValueRow[];
  className?: string;
  layout?: 'rows' | 'grid';
}

export function KeyValueList({ items, className, layout = 'rows' }: KeyValueListProps) {
  if (layout === 'grid') {
    return (
      <dl className={cn('grid grid-cols-2 gap-x-6 gap-y-3', className)}>
        {items.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium text-neutral-500">{row.label}</dt>
            <dd className="mt-0.5 text-sm text-neutral-900" data-numeric>
              {row.value}
            </dd>
            {row.hint ? (
              <p className="mt-0.5 text-xs text-neutral-400">{row.hint}</p>
            ) : null}
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className={cn('divide-y divide-neutral-100', className)}>
      {items.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-6 py-2.5">
          <dt className="text-xs text-neutral-500">{row.label}</dt>
          <dd className="text-right text-sm font-medium text-neutral-900" data-numeric>
            {row.value}
            {row.hint ? (
              <p className="text-xs font-normal text-neutral-400">{row.hint}</p>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
