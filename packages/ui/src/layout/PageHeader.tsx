import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('border-b border-neutral-200 bg-white px-6 py-5', className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2 text-xs text-neutral-500">
          <ol className="flex items-center gap-1.5">
            {breadcrumbs.map((item, idx) => (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                {item.href ? (
                  <a href={item.href} className="hover:text-neutral-900">
                    {item.label}
                  </a>
                ) : (
                  <span>{item.label}</span>
                )}
                {idx < breadcrumbs.length - 1 ? (
                  <span className="text-neutral-300">/</span>
                ) : null}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
