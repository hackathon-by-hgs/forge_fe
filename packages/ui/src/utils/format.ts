import { format, formatDistanceToNowStrict } from 'date-fns';

const NAIRA = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const NAIRA_COMPACT = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const PCT = new Intl.NumberFormat('en-NG', {
  style: 'percent',
  maximumFractionDigits: 1,
});

const NUM = new Intl.NumberFormat('en-NG');

export function formatCurrency(amount: number, opts?: { compact?: boolean }): string {
  return (opts?.compact ? NAIRA_COMPACT : NAIRA).format(amount);
}

export function formatNumber(value: number): string {
  return NUM.format(value);
}

/** Pass a 0..1 ratio. */
export function formatPercent(value: number): string {
  return PCT.format(value);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)}km`;
}

/**
 * Returns a valid Date or null. Guards against the `RangeError: Invalid time value`
 * that date-fns throws when handed `new Date(undefined | '' | null | 'garbage')`.
 * Bad timestamps from upstream APIs would otherwise crash whichever component
 * is rendering them — including the layout-level NotificationsPopover.
 */
function toValidDate(input: string | Date | null | undefined): Date | null {
  if (input == null || input === '') return null;
  const d = typeof input === 'string' ? new Date(input) : input;
  return Number.isFinite(d.getTime()) ? d : null;
}

export function formatRelativeTime(input: string | Date | null | undefined): string {
  const d = toValidDate(input);
  if (!d) return '—';
  return `${formatDistanceToNowStrict(d, { addSuffix: false })} ago`;
}

export function formatAbsoluteDate(input: string | Date | null | undefined): string {
  const d = toValidDate(input);
  if (!d) return '—';
  return format(d, 'd MMM yyyy, HH:mm');
}

export function formatShortDate(input: string | Date | null | undefined): string {
  const d = toValidDate(input);
  if (!d) return '—';
  return format(d, 'd MMM');
}

/** Truncated mono-font display for long IDs. e.g. `txn_4f8a…2c1b`. */
export function formatTransactionId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function formatDelta(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
