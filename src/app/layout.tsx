import type { Metadata } from 'next';
import Script from 'next/script';
import {
  Cormorant_Garamond,
  JetBrains_Mono,
  Noto_Serif_Tamil,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { StudioProvider } from '@/src/context/StudioContext';
import { StudioToaster } from '@/src/components/StudioToaster';
import { getStudioState } from '@/src/server/studioStore';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cormorant',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
});

const notoSerifTamil = Noto_Serif_Tamil({
  subsets: ['latin', 'tamil'],
  weight: ['500', '600', '700'],
  variable: '--font-tamil-serif',
});

export const metadata: Metadata = {
  title: 'GK STUDIOS — Creating Memories | South Indian Wedding & Event Photography',
  description:
    'GK STUDIOS (Creating Memories) — Premier South Indian wedding, Iyer wedding, temple ceremony, Kaathu Kuthi, and candid event photography & 4K videography at Chennai Highway, Kandarakkottai, Panruti.',
  openGraph: {
    title: 'GK STUDIOS — Creating Memories',
    description:
      'South Indian wedding, temple ceremony, Kaathu Kuthi, and milestone photography & videography studio at Chennai Highway, Kandarakkottai, Panruti.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/gk-favicon.svg',
    shortcut: '/gk-favicon.svg',
    apple: '/gk-favicon.svg',
  },
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = await getStudioState();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${cormorant.variable} ${jetbrainsMono.variable} ${notoSerifTamil.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <Script id="gk-public-theme-init" strategy="beforeInteractive">
          {`if (location.pathname === '/') {
            try {
              const stored = localStorage.getItem('gk-studios-public-preferences');
              if (stored && JSON.parse(stored).theme === 'light') {
                document.documentElement.dataset.gkPublicTheme = 'light';
              }
            } catch (error) {
              console.error('Unable to restore the public theme before rendering.', error);
            }
          }`}
        </Script>
      </head>
      <body className="bg-[#092E2B] text-[#E6ECEB] antialiased selection:bg-[#C5B378]/30 selection:text-white">
        <StudioProvider initialState={initialState}>
          <StudioToaster />
          {children}
        </StudioProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
