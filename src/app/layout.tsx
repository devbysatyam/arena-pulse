import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

/** GA4 Measurement ID — set via environment variable */
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NexArena | Smart Stadium Companion',
  description:
    'AI-powered stadium assistant for cricket fans. Real-time crowd heatmaps, smart navigation, food ordering, and a Gemini-powered concierge.',
  keywords: 'stadium, smart venue, AR navigation, crowd heatmap, food ordering, AI assistant, cricket, Gemini',
  authors: [{ name: 'NexArena' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexArena',
  },
  openGraph: {
    title: 'NexArena — Smart Stadium Companion',
    description: 'Live crowd intelligence, AR navigation, and food ordering for modern stadiums.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0b14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plusJakarta.variable}`}>
      <head>
        {/* Material Symbols icon font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />

        {/* Google Analytics 4 — only loads if GA_ID is configured */}
        {GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </head>

      <body className="bg-[#0a0b14] text-white font-sans antialiased" suppressHydrationWarning>
        {/* Skip Navigation — WCAG 2.1 Success Criterion 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:text-black focus:bg-[#00ff9d]"
        >
          Skip to main content
        </a>

        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
