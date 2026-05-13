import type { components } from '@forge/types/api';

export type NotificationKind =
  | 'application'
  | 'worker_late'
  | 'job_completed'
  | 'payment_processed'
  | 'credit_update';

export type DashboardNotificationDto = components['schemas']['NotificationDto'];

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href?: string;
  occurredAt: string;
  unread: boolean;
}

function mapKind(kind: DashboardNotificationDto['kind']): NotificationKind {
  switch (kind) {
    case 'application_update':
      return 'application';
    case 'new_job':
      return 'job_completed';
    case 'payment':
      return 'payment_processed';
    case 'loan':
      return 'credit_update';
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

export function mapDashboardNotification(row: DashboardNotificationDto): AppNotification {
  return {
    id: row.id,
    kind: mapKind(row.kind),
    title: row.title,
    detail: row.body,
    href: deeplinkToHref(row.deeplink),
    occurredAt: row.timestamp,
    unread: row.unread,
  };
}
