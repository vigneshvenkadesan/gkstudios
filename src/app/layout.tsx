import type { Metadata } from 'next';
import { Cormorant_Garamond, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'GK STUDIOS — Creating Memories | South Indian Wedding & Event Photography',
  description:
    'GK STUDIOS (Creating Memories) — Premier South Indian wedding, Iyer wedding, temple ceremony, Kaathu Kuthi, and candid event photography & 4K videography at Chennai Highway, Kandarakkottai.',
  openGraph: {
    title: 'GK STUDIOS — Creating Memories',
    description:
      'South Indian wedding, temple ceremony, Kaathu Kuthi, and milestone photography & videography studio at Chennai Highway, Kandarakkottai.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
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
      className={`${plusJakarta.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#092E2B] text-[#E6ECEB] antialiased selection:bg-[#C5B378]/30 selection:text-white">
        <StudioProvider initialState={initialState}>
          <StudioToaster />
          {children}
        </StudioProvider>
      </body>
    </html>
  );
}
