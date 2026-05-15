import type { Metadata } from 'next';
import { Onest, JetBrains_Mono } from 'next/font/google';
import { type ReactNode } from 'react';
import { ThemeProvider, ThemeScript, Toaster } from '@forge/ui';
import { SessionProvider } from '../lib/auth/SessionProvider';
import './globals.css';

const sans = Onest({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bank Dashboard — Forge',
  description: 'Decide with confidence. Credit, risk, and portfolio dashboard for banks on the Forge platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
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
