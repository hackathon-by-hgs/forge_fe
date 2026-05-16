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
import type { components } from '@forge/types/api';
import { fetchDashboardSearch } from '../lib/dashboardSearch';

type SearchJobHitDto = components['schemas']['SearchJobHitDto'];
type SearchWorkerHitDto = components['schemas']['SearchWorkerHitDto'];
type SearchTransactionHitDto = components['schemas']['SearchTransactionHitDto'];

type SearchSection =
  | { title: 'Jobs'; items: SearchJobHitDto[] }
  | { title: 'Workers'; items: SearchWorkerHitDto[] }
  | { title: 'Transactions'; items: SearchTransactionHitDto[] };

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

  const sections: SearchSection[] = useMemo(() => {
    const data = search.data;
    if (!data) return [];
    const out: SearchSection[] = [];
    if (data.jobs.length) out.push({ title: 'Jobs', items: data.jobs });
    if (data.workers.length) out.push({ title: 'Workers', items: data.workers });
    if (data.transactions.length) out.push({ title: 'Transactions', items: data.transactions });
    return out;
  }, [search.data]);

  const trimmed = debounced.trim();

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
            <DialogDescription className="block">Type to search across jobs, workers, and transactions.</DialogDescription>
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
                <p className="text-xs text-ink-muted">Start typing…</p>
              ) : sections.length === 0 && search.isSuccess ? (
                <p className="text-xs text-ink-muted">No matches for &apos;{trimmed}&apos;.</p>
              ) : null}

              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.title}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      {section.title}
                    </p>
                    <ul className="mt-2 divide-y divide-outline-variant rounded-md border border-outline-variant">
                      {section.title === 'Jobs'
                        ? section.items.map((item) => (
                            <li key={`job-${item.id}`}>
                              <Link
                                href={item.href}
                                className="block px-3 py-2 text-sm hover:bg-surface-container"
                                onClick={() => setOpen(false)}
                              >
                                {item.title}
                              </Link>
                            </li>
                          ))
                        : null}
                      {section.title === 'Workers'
                        ? section.items.map((item) => (
                            <li key={`worker-${item.id}`}>
                              <Link
                                href={item.href}
                                className="block px-3 py-2 text-sm hover:bg-surface-container"
                                onClick={() => setOpen(false)}
                              >
                                {item.fullName}
                              </Link>
                            </li>
                          ))
                        : null}
                      {section.title === 'Transactions'
                        ? section.items.map((item) => (
                            <li key={`txn-${item.id}`}>
                              <Link
                                href={item.href}
                                className="block px-3 py-2 text-sm hover:bg-surface-container"
                                onClick={() => setOpen(false)}
                              >
                                {item.title}
                              </Link>
                            </li>
                          ))
                        : null}
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
