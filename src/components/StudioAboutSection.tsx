'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Camera } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { translate } from '@/src/i18n/translations';
import { SHIMMER_BLUR_DATA_URL } from '@/src/lib/imageBlur';
import { MandalaImagePlaceholder } from '@/src/components/MandalaLoader';

interface StudioAboutSectionProps {
  onMeetStudio?: () => void;
}

const STUDIO_HIGHLIGHTS = [
  {
    primary: '250+',
    secondary: 'Celebrations',
  },
  {
    primary: '7+ Years',
    secondary: 'Experience',
  },
  {
    primary: 'Photography',
    secondary: '& 4K Cinema',
  },
] as const;

export function StudioAboutSection({ onMeetStudio }: StudioAboutSectionProps) {
  const { locale } = usePublicPreferences();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section
      id="studio-story"
      className="scroll-mt-16 sm:scroll-mt-[72px] bg-[#092E2B] py-20 sm:py-24 border-b border-[#C5B378]/18 content-auto"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 lg:items-center">
          {/* Left Editorial Photograph + Photographer Signature */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="group relative aspect-[4/3] sm:aspect-[4/4] lg:aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#061E1C]">
              {!imageFailed ? (
                <>
                  {!imageLoaded && <MandalaImagePlaceholder />}
                  <Image
                    src="/images/portfolio/temple_wedding_gopuram_1794972485937.jpg"
                    alt={t('about.photoAlt')}
                    fill
                    loading="lazy"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={90}
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageFailed(true)}
                    className={`h-full w-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#072421] p-8 text-center">
                  <Camera className="h-10 w-10 text-[#C5B378]/70" />
                  <p className="font-serif text-lg text-white">{STUDIO_INFO.name}</p>
                </div>
              )}
            </div>

            {/* Minimal Photographer Profile Strip */}
            {/* <div className="flex items-center gap-4 pt-1">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-sm border border-[#C5B378]/25 bg-[#061E1C]">
                <img
                  src="/assets/aistudio/image_777005f0.png"
                  alt={t('about.emblemAlt')}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.22em] text-white">
                  G KRISHNA
                </p>
                <p className="text-xs text-[#D8C78E] mt-0.5">{t('about.photographer')}</p>
                <p className="font-serif italic text-sm text-[#E6ECEB]/80 mt-0.5">
                  &ldquo;{t('about.signature')}&rdquo;
                </p>
              </div>
            </div> */}
          </motion.div>

          {/* Right Editorial Story Column */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 lg:pl-6 space-y-9"
          >
            <div className="space-y-5">
              <p className="text-xs font-semibold tracking-[0.26em] text-[#D8C78E]">
                {t('about.eyebrow')}
              </p>

              <h2
                className={`font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold tracking-[-0.015em] text-white ${
                  locale === 'ta' ? 'leading-[1.35]' : 'leading-[1.06]'
                }`}
              >
                {t('about.heading')}
              </h2>

              <p className="max-w-lg text-base sm:text-lg leading-relaxed text-[#E6ECEB]/82">
                {t('about.description')}
              </p>
            </div>

            {/* Three Compact Studio Highlights */}
            <div className="grid grid-cols-3 gap-5 border-y border-[#C5B378]/20 py-7">
              {STUDIO_HIGHLIGHTS.map((highlight) => (
                <div key={highlight.primary} className="space-y-1">
                  <p className="font-serif text-xl sm:text-2xl lg:text-[1.75rem] font-semibold text-[#D8C78E] leading-tight tabular-nums">
                    {locale === 'ta' && highlight.primary === '7+ Years'
                      ? '7+ ஆண்டுகள்'
                      : locale === 'ta' && highlight.primary === 'Photography'
                        ? t('about.photography')
                        : highlight.primary}
                  </p>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/75 leading-snug">
                    {highlight.secondary === 'Celebrations'
                      ? t('about.celebrations')
                      : highlight.secondary === 'Experience'
                        ? t('about.experience')
                        : locale === 'ta'
                          ? t('about.cinema')
                          : highlight.secondary}
                  </p>
                </div>
              ))}
            </div>

            {/* Single Refined Editorial CTA */}
            <div>
              <button
                type="button"
                onClick={onMeetStudio}
                className="group inline-flex items-center gap-3 border-b border-[#C5B378]/65 pb-2 text-sm sm:text-base font-medium tracking-[0.04em] text-white transition-colors duration-200 hover:border-[#D8C78E] hover:text-[#D8C78E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#092E2B] cursor-pointer"
              >
                <span>{t('about.meet')}</span>
                <ArrowRight className="h-4 w-4 text-[#D8C78E] transition-transform duration-200 group-hover:translate-x-1.5 motion-reduce:group-hover:translate-x-0" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
