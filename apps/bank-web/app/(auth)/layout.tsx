import { type ReactNode } from 'react';
import { ThemeToggle } from '@forge/ui';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-surface text-ink">
      {/* <AmbientBackground /> */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="relative z-10 min-h-screen">{children}</div>
    </main>
  );
}

