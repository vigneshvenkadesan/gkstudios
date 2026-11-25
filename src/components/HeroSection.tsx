'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useStudio } from '@/src/context/StudioContext';
import { MandalaCorner } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { localizePortfolioText, translate } from '@/src/i18n/translations';
import { SHIMMER_BLUR_DATA_URL, preloadImage } from '@/src/lib/imageBlur';

interface HeroSectionProps {
  onViewPackages: () => void;
  onExploreWork: () => void;
}

export function HeroSection({ onViewPackages, onExploreWork }: HeroSectionProps) {
  const { portfolio } = useStudio();
  const { locale } = usePublicPreferences();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const prefersReducedMotion = useReducedMotion();

  const uniquePortfolio = Array.from(
    new Map(portfolio.map((item) => [item.id, item])).values()
  );
  const featuredSlides = uniquePortfolio.filter((item) => item.isVisible && item.isHeroFeatured);
  const slides = featuredSlides.length > 0 ? featuredSlides : uniquePortfolio.filter((p) => p.isVisible);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  useEffect(() => {
    if (slides.length <= 1 || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6800);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, slides.length]);

  // Pre-warm the next slide's image 
  useEffect(() => {
    if (slides.length > 1) {
      const nextSlide = slides[(currentIndex + 1) % slides.length];
      if (nextSlide?.imageUrl) {
        preloadImage(nextSlide.imageUrl);
      }
    }
  }, [currentIndex, slides]);

  const activeSlide = slides[currentIndex];
  const activeSlideTitle = activeSlide
    ? localizePortfolioText(locale, activeSlide.id, 'title', activeSlide.title)
    : '';

  const handlePrev = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const slideIndexLabel = String(currentIndex + 1).padStart(2, '0');
  const totalSlidesLabel = String(slides.length).padStart(2, '0');

  return (
    <section
      id="hero"
      className="relative h-[100svh] min-h-[100svh] sm:h-auto sm:min-h-screen flex flex-col justify-between overflow-hidden bg-[#061E1C] border-b border-[#C5B378]/18"
    >
      {/* Full-Bleed Cinematic Photography Stage */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="sync">
          {activeSlide && !failedImages[activeSlide.id] ? (
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: prefersReducedMotion ? 1 : 1.045 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.0, ease: 'easeInOut' },
                scale: { duration: 8, ease: [0.16, 1, 0.3, 1] },
              }}
              className="absolute inset-0"
            >
              <Image
                src={activeSlide.imageUrl}
                alt={activeSlideTitle}
                fill
                priority
                sizes="100vw"
                quality={90}
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR_DATA_URL}
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [activeSlide.id]: true }))
                }
                className="h-full w-full object-cover object-center"
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#092E2B]">
              <Camera className="h-12 w-12 text-[#C5B378]/40" />
            </div>
          )}
        </AnimatePresence>

        {/* Soft editorial light and contrast layers */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#051B19]/48 via-[#072421]/24 to-[#061E1C]/5 sm:from-[#051B19]/58 sm:via-[#072421]/30 sm:to-[#061E1C]/8"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#061E1C]/78 via-transparent to-[#061E1C]/20"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_20%,rgba(216,199,142,0.12),transparent_55%)]"
        />
      </div>

      {/* Delicate South Indian Mandala Corner Heritage Accents */}
      <MandalaCorner className="pointer-events-none absolute -top-6 -left-6 z-10 h-32 w-32 sm:h-40 sm:w-40 opacity-30" />
      <MandalaCorner className="pointer-events-none absolute -top-6 -right-6 z-10 h-32 w-32 sm:h-40 sm:w-40 rotate-90 opacity-30" />

      {/* Top Spacer for Fixed Transparent Navbar */}
      <div className="h-16 sm:h-24 shrink-0" aria-hidden="true" />

      {/* Main Editorial Center Content — Minimal & Confident */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:block sm:flex-none sm:px-6 sm:py-16 lg:px-8">
        <div className="flex h-full flex-col justify-between gap-8 sm:block">
          <div className="max-w-3xl">
            {/* Dominant Display Headline */}
            <motion.h1
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[6.25rem] font-semibold tracking-[-0.025em] text-white leading-[0.98] [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]"
            >
              <svg
                aria-hidden="true"
                width="0.7em"
                height="0.7em"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-[0.35em] inline-block align-baseline text-current"
                style={{ verticalAlign: '-0.1em' }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
              </svg>
              {t('hero.heading')}
            </motion.h1>
          </div>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:pt-4"
          >
            <Button
              size="lg"
              variant="default"
              onClick={onViewPackages}
              aria-label={t('nav.packages')}
              className="h-12 w-full gap-2.5 rounded-sm border border-[#F4E8C1]/70 bg-gradient-to-r from-[#D8C78E] to-[#F0DFA8] px-5 text-sm font-bold text-[#061E1C] shadow-[0_8px_28px_rgba(216,199,142,0.42)] transition-all hover:-translate-y-0.5 hover:from-[#F0DFA8] hover:to-[#D8C78E] hover:shadow-[0_12px_34px_rgba(216,199,142,0.55)] active:translate-y-0 sm:w-auto sm:px-7"
            >
              {t('nav.packages')}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onExploreWork}
              aria-label={t('hero.explore')}
              className="h-12 w-full gap-2.5 rounded-sm border border-[#F0DFA8]/80 bg-[#061E1C]/75 px-5 text-sm font-semibold text-white shadow-[0_6px_22px_rgba(0,0,0,0.32)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#F4E8C1] hover:bg-[#0E423E]/95 hover:text-[#F4E8C1] hover:shadow-[0_10px_28px_rgba(0,0,0,0.45)] active:translate-y-0 sm:w-auto sm:px-7"
            >
              <span>{t('hero.explore')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Minimal Bottom Film Strip Bar */}
      <div className="relative z-10 border-t border-[#C5B378]/15 bg-[#061E1C]/45 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 min-w-0">
            {slides.length > 0 && (
              <span className="font-mono text-xs tabular-nums text-[#D8C78E] shrink-0">
                {slideIndexLabel} / {totalSlidesLabel}
              </span>
            )}
            {activeSlide && (
              <p className="font-serif text-sm sm:text-base text-white/95 truncate">
                {activeSlideTitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={onExploreWork}
              className="group hidden sm:inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-[#E6ECEB]/75 hover:text-[#D8C78E] transition-colors cursor-pointer"
            >
              <span>{t('hero.scroll')}</span>
              <ArrowDown className="h-3.5 w-3.5 text-[#D8C78E] transition-transform duration-300 ease-out group-hover:translate-y-0.5 motion-reduce:group-hover:translate-y-0" />
            </button>

            {slides.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label={t('hero.previous')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#C5B378]/30 bg-[#092E2B]/80 text-white hover:border-[#D8C78E] hover:bg-[#134E49] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label={t('hero.next')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[#C5B378]/30 bg-[#092E2B]/80 text-white hover:border-[#D8C78E] hover:bg-[#134E49] transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
