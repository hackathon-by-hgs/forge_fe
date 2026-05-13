import type { components } from '@forge/types/api';

export type NotificationKind =
  | 'application'
  | 'worker_late'
  | 'job_completed'
  | 'payment_processed'
  | 'credit_update'
  | 'payout_review'
  | 'rate_your_worker';

export type DashboardNotificationDto = components['schemas']['NotificationDto'];

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href?: string;
  occurredAt: string;
  unread: boolean;
  /** Optional preview image — BE attaches it on `clock_out_pending_review`. */
  imageUrl?: string;
}

/**
 * BE adds `clock_out_pending_review` for §11.7 review-queue notifications.
 * The generated NotificationDto union doesn't include it yet, so accept it
 * via a widened string here and narrow before falling through to defaults.
 */
function mapKind(kind: string): NotificationKind {
  switch (kind) {
    case 'application_update':
      return 'application';
    case 'new_job':
      return 'job_completed';
    case 'payment':
      return 'payment_processed';
    case 'loan':
      return 'credit_update';
    case 'clock_out_pending_review':
      return 'payout_review';
    case 'rate_your_worker':
      return 'rate_your_worker';
    case 'system':
    default:
      return 'application';
  }
}

function deeplinkToHref(deeplink: DashboardNotificationDto['deeplink']): string | undefined {
  if (deeplink == null) return undefined;
  if (typeof deeplink === 'string') return deeplink;
  return undefined;
}

function imageUrlFrom(row: DashboardNotificationDto): string | undefined {
  // BE may attach a preview image as `imageUrl` or `image_url` on the row.
  // Until the generated types add the field, read it dynamically.
  const raw = row as unknown as Record<string, unknown>;
  const candidate = raw.imageUrl ?? raw.image_url;
  return typeof candidate === 'string' && candidate ? candidate : undefined;
}

export function mapDashboardNotification(row: DashboardNotificationDto): AppNotification {
  return {
    id: row.id,
    kind: mapKind(row.kind),
    title: row.title,
    detail: row.body,
    href: deeplinkToHref(row.deeplink),
    occurredAt: row.timestamp,
    unread: row.unread,
    imageUrl: imageUrlFrom(row),
  };
}
