import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Forge - Powering the Informal Economy',
  description:
    "Forge connects employers with reliable informal workers, automates payroll, and unlocks credit in one platform built for Nigeria's real economy.",
  keywords: [
    'informal economy',
    'workforce management',
    'Nigeria payroll',
    'worker hiring platform',
    'credit scoring',
    'informal workers',
  ],
  openGraph: {
    title: 'Forge - Powering the Informal Economy',
    description:
      "Hire workers, manage payroll, and access credit. The all-in-one platform built for Nigeria's real economy.",
    type: 'website',
    locale: 'en_NG',
    siteName: 'Forge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forge - Powering the Informal Economy',
    description:
      "Hire workers, manage payroll, and access credit. Built for Nigeria's real economy.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="bg-black font-sans antialiased">{children}</body>
    </html>
  );
}
