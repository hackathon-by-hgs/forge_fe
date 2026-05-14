import type { components } from '@forge/types/api';

export type NotificationKind =
  | 'application'
  | 'loan'
  | 'payment'
  | 'system';

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
  // Phase 4 (risk-flagging cron) added `loan_at_risk` and `loan_defaulted`
  // which aren't in the generated DTO union yet — collapse them into 'loan'.
  const raw = kind as string;
  if (raw === 'loan' || raw === 'loan_at_risk' || raw === 'loan_defaulted') return 'loan';
  if (raw === 'application_update') return 'application';
  if (raw === 'payment') return 'payment';
  return 'system';
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
