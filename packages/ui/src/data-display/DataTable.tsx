'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Skeleton } from '../feedback/Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

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

export interface DataTablePaginationConfig {
  /** Initial page size. Default 25. */
  defaultPageSize?: number;
  /** If provided, renders a per-page selector. */
  pageSizeOptions?: readonly number[];
  /** Singular noun used in "Showing X–Y of Z {label}s". Default "result". */
  itemLabel?: string;
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
  /** When provided, renders a footer pager and slices `data` to the current page. */
  pagination?: DataTablePaginationConfig | true;
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const DEFAULT_PAGE_SIZE = 25;

/**
 * Lightweight sortable, optionally paginated table. Plain `<table>` for now —
 * no virtualization, no row selection. Upgrade to TanStack Table when a
 * screen needs more.
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
  pagination,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const paginationConfig: DataTablePaginationConfig | null = pagination
    ? pagination === true
      ? {}
      : pagination
    : null;
  const initialPageSize = paginationConfig?.defaultPageSize ?? DEFAULT_PAGE_SIZE;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Reset to page 1 if data shrinks below the current page or sort/filter changes.
  useEffect(() => {
    setPage(1);
  }, [data, sort, pageSize]);

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

  const visible = useMemo(() => {
    if (!paginationConfig) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, paginationConfig, page, pageSize]);

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
        'overflow-hidden rounded-xl border border-outline bg-surface-container',
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
            {visible.map((row) => (
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
      {paginationConfig ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={sorted.length}
          onPageChange={setPage}
          pageSizeOptions={paginationConfig.pageSizeOptions}
          onPageSizeChange={
            paginationConfig.pageSizeOptions ? setPageSize : undefined
          }
          itemLabel={paginationConfig.itemLabel}
        />
      ) : null}
    </div>
  );
}
