'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Top-of-viewport progress bar that animates while a route transition is in
 * flight. Triggers on path/query changes and on user-initiated link clicks
 * so it appears even during the brief window before the new segment renders.
 */
export function RouteProgress() {
  const pathname = usePathname();

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  const start = () => {
    if (hideRef.current) clearTimeout(hideRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    setActive(true);
    setProgress(8);
    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const step = (95 - p) * 0.08;
        return Math.min(92, p + Math.max(0.6, step));
      });
    }, 120);
  };

  const finish = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 280);
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = (event.target as HTMLElement | null)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (target.target && target.target !== '_self') return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }
      start();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    start();
    const settle = setTimeout(finish, 350);
    return () => clearTimeout(settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
    >
      <div
        className="h-full bg-gradient-to-r from-accent-400 via-accent-500 to-accent-700 shadow-[0_0_8px_rgba(14,105,95,0.6)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: active ? 1 : 0,
        }}
      />
    </div>
  );
}
