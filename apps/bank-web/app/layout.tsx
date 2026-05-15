import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { type ReactNode } from 'react';
import { ThemeProvider, ThemeScript, Toaster } from '@forge/ui';
import { SessionProvider } from '../lib/auth/SessionProvider';
// @ts-expect-error No type declarations for CSS imports in this project
import './globals.css';

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Bank Dashboard — Forge',
  description:
    'Decide with confidence. Credit, risk, and portfolio dashboard for banks on the Forge platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
