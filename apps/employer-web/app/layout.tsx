import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { type ReactNode } from 'react';
import { ThemeProvider, ThemeScript, Toaster } from '@forge/ui';
import { AppChrome } from '../components/AppChrome';
import { Providers } from './providers';
// @ts-ignore
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Employer Dashboard — Forge',
  description: 'Hire, dispatch, pay. Operational dashboard for businesses on the Forge platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <Providers>
            <AppChrome>{children}</AppChrome>
          </Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
