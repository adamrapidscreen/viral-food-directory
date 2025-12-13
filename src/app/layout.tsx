import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import PortalFix from '@/components/PortalFix';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Viral Eats MY | Malaysia's Halal Food Discovery",
  description:
    "Map-first app. Find trending halal restaurants, hawker stalls, cafes across Malaysia.",
  keywords: [
    'halal food',
    'malaysia restaurants',
    'hawker stalls',
    'food discovery',
    'trending food',
    'malaysia food',
  ],
  authors: [{ name: 'Viral Eats MY' }],
  openGraph: {
    type: 'website',
    locale: 'en_MY',
    siteName: 'Viral Eats MY',
    title: "Viral Eats MY | Malaysia's Halal Food Discovery",
    description:
      "Map-first app. Find trending halal restaurants, hawker stalls, cafes across Malaysia.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Viral Eats MY | Malaysia's Halal Food Discovery",
    description:
      "Map-first app. Find trending halal restaurants, hawker stalls, cafes across Malaysia.",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D9488' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} bg-gray-50 font-sans text-gray-900 antialiased dark:bg-slate-900 dark:text-gray-50`}
      >
        <ToastProvider>
          {children}
          <ToastContainer />
          <PortalFix />
        </ToastProvider>
      </body>
    </html>
  );
}
