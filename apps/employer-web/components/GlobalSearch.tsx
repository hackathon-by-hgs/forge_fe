'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from '@forge/ui';
import { IconSearch } from '@forge/ui/icons';
import { fetchDashboardSearch } from '../lib/dashboardSearch';

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q, 250);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const enabled = open && debounced.trim().length > 0;

  const search = useQuery({
    queryKey: ['search', debounced.trim()],
    queryFn: () => fetchDashboardSearch(debounced.trim()),
    enabled,
  });

  const sections = useMemo(() => {
    const data = search.data;
    if (!data) return [];
    return [
      { title: 'Jobs', items: data.jobs },
      { title: 'Workers', items: data.workers },
      { title: 'Transactions', items: data.transactions },
    ].filter((s) => s.items.length > 0);
  }, [search.data]);

  return (
    <div className="min-w-0 flex-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex max-w-md flex-1 items-center justify-end gap-2 sm:justify-start">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted sm:hidden"
          aria-label="Open search"
        >
          <IconSearch className="!h-5 !w-5" />
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden w-full max-w-md sm:block"
          aria-label="Open search"
        >
          <Input
            readOnly
            type="search"
            placeholder="Search jobs, workers, transactions…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            trailingIcon={
              <kbd className="hidden items-center gap-1 rounded border border-outline bg-surface-container-high px-1.5 py-0.5 font-mono text-[10px] text-ink-muted lg:inline-flex">
                ⌘K
              </kbd>
            }
            className="w-full cursor-pointer"
          />
        </button>
      </div>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Type to search across jobs, workers, and transactions.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          <Input
            autoFocus
            type="search"
            placeholder="Search…"
            leadingIcon={<IconSearch className="!h-4 !w-4" />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="mt-4 max-h-[50vh] overflow-y-auto">
            {search.isLoading && enabled ? (
              <p className="text-xs text-ink-muted">Searching…</p>
            ) : null}
            {search.isError ? (
              <div className="rounded-md border border-outline-variant bg-surface-container px-3 py-2">
                <p className="text-xs font-medium text-danger-600">Search unavailable</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {search.error instanceof Error ? search.error.message : 'Unknown error'}
                </p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => void search.refetch()}>
                  Retry
                </Button>
              </div>
            ) : null}
            {!enabled ? (
              <p className="text-xs text-ink-muted">Start typing to search.</p>
            ) : sections.length === 0 && search.isSuccess ? (
              <p className="text-xs text-ink-muted">No matches.</p>
            ) : null}

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    {section.title}
                  </p>
                  <ul className="mt-2 divide-y divide-outline-variant rounded-md border border-outline-variant">
                    {section.items.map((item) => {
                      const label = item.title ?? item.name ?? item.fullName ?? item.id;
                      const href =
                        item.href ??
                        (section.title === 'Jobs'
                          ? `/jobs/${item.id}`
                          : section.title === 'Workers'
                            ? `/workers/${item.id}`
                            : `/payments/transactions`);
                      return (
                        <li key={`${section.title}-${item.id}`}>
                          <Link
                            href={href}
                            className="block px-3 py-2 text-sm hover:bg-surface-container"
                            onClick={() => setOpen(false)}
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </div>
  );
}
