import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Forge — Powering the Informal Economy',
  description:
    'Forge connects employers with reliable informal workers, automates payroll, and unlocks credit — all in one platform built for Nigeria\u2019s real economy.',
  keywords: [
    'informal economy',
    'workforce management',
    'Nigeria payroll',
    'worker hiring platform',
    'credit scoring',
    'informal workers',
  ],
  openGraph: {
    title: 'Forge — Powering the Informal Economy',
    description:
      'Hire workers, manage payroll, and access credit. The all-in-one platform built for Nigeria\u2019s real economy.',
    type: 'website',
    locale: 'en_NG',
    siteName: 'Forge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forge — Powering the Informal Economy',
    description:
      'Hire workers, manage payroll, and access credit. Built for Nigeria\u2019s real economy.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
