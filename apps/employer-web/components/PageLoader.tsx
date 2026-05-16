'use client';
export interface PageLoaderProps {
  title?: string;
  description?: string;
}

export function PageLoader({
  title = 'Forge',
  description = 'Preparing your workspace…',
}: PageLoaderProps) {
  return (
    <div className="relative flex min-h-[60vh] w-full items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.accent.50/.5),transparent_60%)]"
      />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <p className="mt-6 text-sm font-semibold tracking-tight text-ink">{title}</p>
        <p
          role="status"
          aria-live="polite"
          className="mt-1 text-xs text-ink-muted"
        >
          {description}
        </p>

        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-surface-container-high">
          <span className="forge-loader-bar block h-full w-1/3 rounded-full bg-gradient-to-r from-accent-400 via-accent-500 to-accent-700" />
        </div>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden>
          <span className="forge-loader-dot h-1.5 w-1.5 rounded-full bg-accent-500" />
          <span
            className="forge-loader-dot h-1.5 w-1.5 rounded-full bg-accent-500"
            style={{ animationDelay: '160ms' }}
          />
          <span
            className="forge-loader-dot h-1.5 w-1.5 rounded-full bg-accent-500"
            style={{ animationDelay: '320ms' }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes forge-loader-bar {
          0% { transform: translateX(-110%); }
          50% { transform: translateX(120%); }
          100% { transform: translateX(320%); }
        }
        @keyframes forge-loader-dot {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
        .forge-loader-bar {
          animation: forge-loader-bar 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .forge-loader-dot {
          animation: forge-loader-dot 1.1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
