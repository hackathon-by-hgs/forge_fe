/**
 * Inline script rendered before paint to apply the stored theme class on
 * `<html>` BEFORE React hydrates. Without this, users would see a flash of
 * the wrong theme on first load (FOUC). Drop into `app/layout.tsx`'s
 * `<head>` ahead of `<body>`.
 *
 * Server component — no 'use client'.
 */
const SCRIPT = `(function(){try{var s=localStorage.getItem('forge-theme');var t=s==='dark'||s==='light'?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var r=document.documentElement;r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
