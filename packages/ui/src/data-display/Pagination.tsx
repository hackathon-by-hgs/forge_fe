'use client';

import { cn } from '../utils/cn';
import { Button } from '../primitives/Button';
import { Select } from '../primitives/Select';
import { IconChevronLeft, IconChevronRight } from '../icons';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  /** Singular noun for display — e.g. "transaction", "job". Defaults to "result". */
  itemLabel?: string;
}

/**
 * Footer pagination control. Renders a "Showing X–Y of Z" range, optional
 * page-size selector, and prev/next buttons with up to 5 numbered page
 * shortcuts. Ellipses bridge gaps.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  className,
  itemLabel = 'result',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(total, safePage * pageSize);
  const plural = total === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 text-xs text-neutral-600',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span data-numeric>
          Showing{' '}
          <span className="font-medium text-neutral-900 tabular-nums">{start}</span>–
          <span className="font-medium text-neutral-900 tabular-nums">{end}</span> of{' '}
          <span className="font-medium text-neutral-900 tabular-nums">{total}</span> {plural}
        </span>
        {pageSizeOptions && onPageSizeChange ? (
          <label className="flex items-center gap-2 text-neutral-500">
            Per page
            <Select
              aria-label="Rows per page"
              options={pageSizeOptions.map((n) => ({ label: String(n), value: String(n) }))}
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="!h-7 w-16 !py-0 !text-xs"
            />
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          leadingIcon={<IconChevronLeft className="!h-4 !w-4" />}
          aria-label="Previous page"
        >
          Prev
        </Button>
        <PageNumbers page={safePage} totalPages={totalPages} onPageChange={onPageChange} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          trailingIcon={<IconChevronRight className="!h-4 !w-4" />}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

interface PageNumbersProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function PageNumbers({ page, totalPages, onPageChange }: PageNumbersProps) {
  const pages: (number | 'ellipsis-l' | 'ellipsis-r')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis-l');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (page < totalPages - 2) pages.push('ellipsis-r');
    pages.push(totalPages);
  }

  return (
    <div className="hidden items-center gap-0.5 sm:flex">
      {pages.map((p) =>
        p === 'ellipsis-l' || p === 'ellipsis-r' ? (
          <span key={p} className="px-1 text-neutral-400" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-xs font-medium transition-colors tabular-nums',
              p === page
                ? 'bg-accent-50 text-accent-700'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
            )}
            data-numeric
          >
            {p}
          </button>
        ),
      )}
    </div>
  );
}

/**
 * Convenience hook that paginates an in-memory array. Pages are 1-indexed.
 */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): readonly T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
