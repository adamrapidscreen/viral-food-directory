import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import { HoursProvider } from '@/contexts/HoursContext';
import ToastContainer from '@/components/ToastContainer';
import PortalFix from '@/components/PortalFix';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
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
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${playfairDisplay.variable} ${dmSans.variable} bg-slate-950 font-sans text-slate-100 antialiased`}
      >
        <ToastProvider>
          <HoursProvider>
            {children}
            <ToastContainer />
            <PortalFix />
          </HoursProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
