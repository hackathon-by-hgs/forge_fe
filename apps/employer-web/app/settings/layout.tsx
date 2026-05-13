import { Suspense, type ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="border-b border-outline bg-surface-container px-6 py-5">
          <div className="h-8 w-48 animate-pulse rounded bg-surface-container-high" />
          <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-surface-container-high" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
