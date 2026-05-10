import { z } from 'zod';

export type NotificationKind =
  | 'application'
  | 'worker_late'
  | 'job_completed'
  | 'payment_processed'
  | 'credit_update';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href?: string;
  occurredAt: string;
  unread: boolean;
}

const NotificationRowSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    body: z.string().optional(),
    detail: z.string().optional(),
    message: z.string().optional(),
    occurredAt: z.string().optional(),
    createdAt: z.string().optional(),
    timestamp: z.string().optional(),
    unread: z.boolean().optional(),
    read: z.boolean().optional(),
    href: z.string().optional(),
    link: z.string().optional(),
    deeplink: z.union([z.string(), z.record(z.unknown()), z.null()]).optional(),
  })
  .passthrough();

const NotificationsListEnvelopeSchema = z
  .object({
    data: z.array(NotificationRowSchema).optional(),
    items: z.array(NotificationRowSchema).optional(),
    notifications: z.array(NotificationRowSchema).optional(),
  })
  .passthrough();

export function parseNotificationRows(raw: unknown): z.infer<typeof NotificationRowSchema>[] {
  const paginated = z.object({ data: z.array(NotificationRowSchema) }).safeParse(raw);
  if (paginated.success) return paginated.data.data;

  const parsed = NotificationsListEnvelopeSchema.safeParse(raw);
  if (!parsed.success) return [];
  const v = parsed.data;
  return v.data ?? v.items ?? v.notifications ?? [];
}

const UnreadCountSchema = z.union([
  z.object({ unreadCount: z.number() }),
  z.object({ count: z.number() }),
]);

export function parseUnreadCount(raw: unknown): number {
  const parsed = UnreadCountSchema.safeParse(raw);
  if (!parsed.success) return 0;
  if ('unreadCount' in parsed.data) return parsed.data.unreadCount;
  return parsed.data.count;
}

function inferKind(title: string): NotificationKind {
  const t = title.toLowerCase();
  if (t.includes('late')) return 'worker_late';
  if (t.includes('application') || t.includes('applied')) return 'application';
  if (t.includes('complete')) return 'job_completed';
  if (t.includes('pay') || t.includes('payout') || t.includes('₦')) return 'payment_processed';
  if (t.includes('credit')) return 'credit_update';
  return 'application';
}

export function mapApiNotification(row: z.infer<typeof NotificationRowSchema>): AppNotification {
  const occurredAt = row.occurredAt ?? row.createdAt ?? row.timestamp ?? new Date().toISOString();
  const detail = row.body ?? row.detail ?? row.message ?? '';
  const unread = row.unread ?? (row.read === undefined ? true : !row.read);
  const href = row.href ?? row.link ?? (typeof row.deeplink === 'string' ? row.deeplink : undefined);
  return {
    id: row.id,
    kind: inferKind(row.title),
    title: row.title,
    detail,
    href,
    occurredAt,
    unread,
  };
}
