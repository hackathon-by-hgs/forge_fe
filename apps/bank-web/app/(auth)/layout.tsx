import { type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        {children}
      </div>
    </main>
  );
}
