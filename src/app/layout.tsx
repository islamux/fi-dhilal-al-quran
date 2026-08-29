import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ThemeProvider } from '../context/ThemeContext';

const SITE_URL = process.env.SITE_URL || 'https://fi-dhilal-al-quran.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'في ظلال القرآن — خلوة التدبّر والتفسير الأدبي',
    template: '%s — في ظلال القرآن',
  },
  description: 'تفسير في ظلال القرآن - سيد قطب',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Tajawal:wght@300;400;500;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ErrorBoundary>
          <ThemeProvider>{children}</ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
