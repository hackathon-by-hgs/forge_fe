'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Skeleton } from '../feedback/Skeleton';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  /** When provided, the column is sortable using this accessor. */
  sortBy?: (row: T) => string | number;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Tailwind class fragment for the cell. Useful to reach for `tabular-nums`. */
  cellClassName?: string;
}

export interface DataTableProps<T> {
  data: readonly T[];
  columns: readonly DataTableColumn<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  density?: 'comfortable' | 'compact';
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Lightweight sortable table. Plain `<table>` for now — no virtualization,
 * no row selection. Upgrade to TanStack Table when a screen needs more.
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading,
  emptyTitle = 'No results',
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRowClick,
  className,
  density = 'comfortable',
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortBy) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = col.sortBy!(a);
      const bv = col.sortBy!(b);
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [data, sort, columns]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  const cellPad = density === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2.5';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200 bg-white',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50/60">
            <tr>
              {columns.map((col) => {
                const sortable = !!col.sortBy;
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      cellPad,
                      'text-xs font-medium uppercase tracking-wide text-neutral-500',
                      ALIGN[col.align ?? 'left'],
                      sortable && 'cursor-pointer select-none hover:text-neutral-900',
                    )}
                    onClick={() => {
                      if (!sortable) return;
                      setSort((prev) =>
                        prev?.key === col.key
                          ? prev.dir === 'asc'
                            ? { key: col.key, dir: 'desc' }
                            : null
                          : { key: col.key, dir: 'asc' },
                      );
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {sortable ? (
                        <span aria-hidden className="text-[8px]">
                          {isSorted ? (sort?.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sorted.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && 'cursor-pointer transition-colors hover:bg-neutral-50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      cellPad,
                      'text-neutral-800',
                      ALIGN[col.align ?? 'left'],
                      col.cellClassName,
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
