'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useStudio } from '@/src/context/StudioContext';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { MandalaCorner } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import { localizePortfolioText, translate } from '@/src/i18n/translations';

interface HeroSectionProps {
  onCheckAvailability: () => void;
  onExploreWork: () => void;
}

export function HeroSection({ onCheckAvailability, onExploreWork }: HeroSectionProps) {
  const { portfolio } = useStudio();
  const { locale } = usePublicPreferences();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const prefersReducedMotion = useReducedMotion();

  const featuredSlides = portfolio.filter((item) => item.isVisible && item.isHeroFeatured);
  const slides = featuredSlides.length > 0 ? featuredSlides : portfolio.filter((p) => p.isVisible);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6800);
    return () => window.clearInterval(timer);
  }, [slides.length]);

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
      className="relative min-h-[92svh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-[#061E1C] border-b border-[#C5B378]/18"
    >
      {/* Full-Bleed Cinematic Photography Stage */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="sync">
          {activeSlide && !failedImages[activeSlide.id] ? (
            <motion.div
              key={activeSlide.id}
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.0, ease: 'easeInOut' },
                scale: { duration: 7.5, ease: [0.16, 1, 0.3, 1] },
              }}
              className="absolute inset-0"
            >
              <img
                src={activeSlide.imageUrl}
                alt={activeSlideTitle}
                loading="eager"
                referrerPolicy="no-referrer"
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

        {/* Measured Editorial Contrast Scrims */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#051B19]/88 via-[#072421]/55 to-[#061E1C]/25"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#061E1C]/95 via-transparent to-[#061E1C]/60"
        />
      </div>

      {/* Delicate South Indian Mandala Corner Heritage Accents */}
      <MandalaCorner className="pointer-events-none absolute -top-6 -left-6 z-10 h-32 w-32 sm:h-40 sm:w-40 opacity-30" />
      <MandalaCorner className="pointer-events-none absolute -top-6 -right-6 z-10 h-32 w-32 sm:h-40 sm:w-40 rotate-90 opacity-30" />

      {/* Top Spacer for Fixed Transparent Navbar */}
      <div className="h-20 sm:h-24 shrink-0" aria-hidden="true" />

      {/* Main Editorial Center Content — Minimal & Confident */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-3xl space-y-6">
          {/* Brand Name */}
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-[#D8C78E]"
          >
            {STUDIO_INFO.name}
          </motion.p>

          {/* Dominant Display Headline */}
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[6.25rem] font-semibold tracking-[-0.025em] text-white leading-[0.98]"
          >
            {t('hero.heading')}
          </motion.h1>

          {/* Concise Supporting Line */}
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-xl font-normal tracking-[0.02em] text-[#E6ECEB]/90"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <Button size="lg" onClick={onCheckAvailability}>
              <Calendar className="h-4 w-4" />
              Check Availability
            </Button>
            <Button size="lg" variant="outline" onClick={onExploreWork}>
              {t('hero.explore')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Minimal Bottom Film Strip Bar */}
      <div className="relative z-10 border-t border-[#C5B378]/15 bg-[#061E1C]/60 backdrop-blur-sm">
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
              className="hidden sm:inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-[#E6ECEB]/75 hover:text-[#D8C78E] transition-colors cursor-pointer"
            >
              <span>{t('hero.scroll')}</span>
              <motion.span
                animate={prefersReducedMotion ? undefined : { y: [0, 3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown className="h-3.5 w-3.5 text-[#D8C78E]" />
              </motion.span>
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
