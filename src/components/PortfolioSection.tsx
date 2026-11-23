'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, ChevronLeft, ChevronRight, Expand, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useStudio } from '@/src/context/StudioContext';
import {
  CoreEventCategory,
  EVENT_CATEGORIES,
  EventCategory,
  normalizeEventCategory,
  PortfolioItem,
} from '@/src/types/studio';
import { MandalaDivider } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';
import { usePublicPreferences } from '@/src/context/PublicPreferencesContext';
import {
  formatLocalizedMonthLabel,
  localizePortfolioText,
  translate,
  translateCategory,
  TranslationKey,
} from '@/src/i18n/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { SHIMMER_BLUR_DATA_URL, usePreloadImagesOnApproach } from '@/src/lib/imageBlur';

interface PortfolioSectionProps {
  onBookCategory: (category: EventCategory) => void;
  externalCategoryFilter?: EventCategory | null;
}

type FilterOption = 'All Events' | CoreEventCategory;

const FILTER_OPTIONS: FilterOption[] = ['All Events', ...EVENT_CATEGORIES];

const FILTER_LABEL_KEYS: Record<FilterOption, TranslationKey> = {
  'All Events': 'portfolio.all',
  Weddings: 'portfolio.weddings',
  'Traditional Ceremonies': 'portfolio.ceremonies',
  'Family Celebrations': 'portfolio.family',
  'Portraits & Outdoor Shoots': 'portfolio.outdoor',
  'Corporate Events': 'portfolio.corporate',
};

export function PortfolioSection({
  onBookCategory,
  externalCategoryFilter,
}: PortfolioSectionProps) {
  const { portfolio } = useStudio();
  const { locale } = usePublicPreferences();
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [selectedCategory, setSelectedCategory] = useState<FilterOption>('All Events');
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (externalCategoryFilter) {
      setSelectedCategory(normalizeEventCategory(externalCategoryFilter));
    }
  }, [externalCategoryFilter]);

  const visiblePortfolio = useMemo(
    () => portfolio.filter((item) => item.isVisible),
    [portfolio]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    visiblePortfolio.forEach((item) => {
      const normalized = normalizeEventCategory(item.category);
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
    return counts;
  }, [visiblePortfolio]);

  const filteredItems = useMemo(() => {
    const categoryItems =
      selectedCategory === 'All Events'
        ? visiblePortfolio
        : visiblePortfolio.filter(
      (item) => normalizeEventCategory(item.category) === selectedCategory
    );
    return Array.from(new Map(categoryItems.map((item) => [item.id, item])).values());
  }, [visiblePortfolio, selectedCategory]);

  const activeLightboxIndex = lightboxItem
    ? filteredItems.findIndex((i) => i.id === lightboxItem.id)
    : -1;

  const navigateLightbox = useCallback(
    (direction: -1 | 1) => {
      if (filteredItems.length <= 1 || activeLightboxIndex === -1) return;
      const nextIdx =
        (activeLightboxIndex + direction + filteredItems.length) % filteredItems.length;
      setLightboxItem(filteredItems[nextIdx]);
    },
    [filteredItems, activeLightboxIndex]
  );

  useEffect(() => {
    if (!lightboxItem) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateLightbox(1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxItem, navigateLightbox]);

  const getEditorialLayoutClass = (item: PortfolioItem, index: number): string => {
    if (selectedCategory !== 'All Events') {
      return 'aspect-[4/3]';
    }
    if (index === 0 || item.aspect === 'wide') {
      return 'md:col-span-2 aspect-[16/10]';
    }
    if (index === 1) {
      return 'aspect-[4/3] md:aspect-auto md:h-full min-h-[300px]';
    }
    if (index === 2 || index === 3) {
      return 'aspect-[4/5] sm:aspect-[4/4]';
    }
    return 'aspect-[4/3]';
  };

  const preloadUrls = useMemo(
    () => filteredItems.slice(0, 6).map((i) => i.imageUrl),
    [filteredItems]
  );
  usePreloadImagesOnApproach(sectionRef, preloadUrls, '600px 0px');

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="scroll-mt-16 sm:scroll-mt-[72px] bg-[#092E2B] py-16 sm:py-24 border-b border-[#C5B378]/18 content-auto"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Minimal Editorial Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.24em] text-[#D8C78E]">
              {t('portfolio.eyebrow')}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-[-0.015em] text-white leading-[1.06]">
              {t('portfolio.heading')}
            </h2>
            <p className="text-sm sm:text-base text-[#E6ECEB]/78">
              {t('portfolio.subtitle')}
            </p>
          </div>

        </motion.div>

        {/* Compact Category Filter Bar */}
        <div
          role="tablist"
          aria-label={t('portfolio.filterLabel')}
          className="mt-10 flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#C5B378]/15"
        >
          {FILTER_OPTIONS.map((category) => {
            const isActive = selectedCategory === category;
            const count =
              category === 'All Events'
                ? visiblePortfolio.length
                : categoryCounts.get(category) || 0;

            return (
              <button
                key={category}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap shrink-0 rounded-sm px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] ${
                  isActive
                    ? 'bg-[#C5B378] text-[#061E1C] font-semibold'
                    : 'text-[#E6ECEB]/75 hover:bg-[#0E423E] hover:text-white'
                }`}
              >
                <span>{t(FILTER_LABEL_KEYS[category])}</span>
                {count > 0 && (
                  <span
                    className={`ml-1.5 font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-[#061E1C]/75' : 'text-[#D8C78E]/70'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Asymmetrical Editorial Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="mt-12 rounded-sm border border-[#C5B378]/20 bg-[#072421] p-12 text-center">
            <Camera className="mx-auto h-8 w-8 text-[#C5B378]/75" />
            <h3 className="mt-4 font-serif text-2xl font-semibold text-white">
              {t('portfolio.empty', {
                category:
                  selectedCategory === 'All Events'
                    ? t('portfolio.all')
                    : translateCategory(locale, selectedCategory),
              })}
            </h3>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory('All Events')}
              >
                {t('portfolio.viewAll')}
              </Button>
              {selectedCategory !== 'All Events' && (
                <Button size="sm" onClick={() => onBookCategory(selectedCategory)}>
                  {t('portfolio.inquire')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, idx) => (
              <motion.button
                key={item.id}
                type="button"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{
                  duration: 0.55,
                  delay: Math.min(idx * 0.09, 0.45),
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => setLightboxItem(item)}
                className={`group relative block w-full overflow-hidden rounded-sm border border-[#C5B378]/18 bg-[#072421] text-left transition-colors duration-300 hover:border-[#D8C78E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] cursor-pointer ${getEditorialLayoutClass(
                  item,
                  idx
                )}`}
              >
                {!failedImages[item.id] ? (
                  <Image
                    src={item.imageUrl}
                    alt={`${localizePortfolioText(locale, item.id, 'title', item.title)} — ${translateCategory(locale, item.category)} · ${localizePortfolioText(locale, item.id, 'location', item.location)}`}
                    fill
                    priority={idx < 3}
                    loading={idx < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={90}
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                    }
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0E423E] to-[#061E1C] p-6 text-center">
                    <Camera className="h-8 w-8 text-[#C5B378]" />
                    <span className="font-serif text-base text-white">
                      {localizePortfolioText(locale, item.id, 'title', item.title)}
                    </span>
                  </div>
                )}

                {/* Measured Contrast Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#051B19]/90 via-[#051B19]/20 to-transparent transition-opacity duration-300 group-hover:from-[#051B19]/95" />

                {/* Subtle Expand Affordance */}
                <div className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-white/25 bg-[#061E1C]/75 text-white opacity-0 transition-all duration-200 group-hover:opacity-100">
                  <Expand className="h-4 w-4" />
                </div>

                {/* Short Editorial Caption */}
                <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0 sm:p-6">
                  <p className="text-xs font-medium text-[#D8C78E] truncate">
                    {translateCategory(locale, item.category)} · {localizePortfolioText(locale, item.id, 'location', item.location)}
                  </p>
                  <h3 className="mt-1 font-serif text-xl sm:text-2xl font-semibold text-white leading-snug">
                    {localizePortfolioText(locale, item.id, 'title', item.title)}
                  </h3>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <MandalaDivider className="mt-12" />
      </div>

      {/* Fullscreen Editorial Lightbox Modal */}
      <Dialog open={Boolean(lightboxItem)} onOpenChange={(open) => !open && setLightboxItem(null)}>
        <DialogContent
          closeLabel={t('common.close')}
          className="h-[100dvh] max-h-none w-screen max-w-none gap-0 overflow-hidden rounded-none border-0 bg-[#061E1C] p-0"
        >
          {lightboxItem && (
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
              <div className="relative min-h-0 w-full bg-[#041412]">
                {!failedImages[lightboxItem.id] ? (
                  <Image
                    src={lightboxItem.imageUrl}
                    alt={lightboxItem.title}
                    fill
                    priority
                    sizes="100vw"
                    quality={90}
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#C5B378]">
                    <Camera className="h-12 w-12" />
                  </div>
                )}

                {filteredItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigateLightbox(-1)}
                      aria-label={t('portfolio.previous')}
                      className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-[#C5B378]/40 bg-[#061E1C]/85 text-white hover:border-[#D8C78E] hover:bg-[#0E423E] transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateLightbox(1)}
                      aria-label={t('portfolio.next')}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-[#C5B378]/40 bg-[#061E1C]/85 text-white hover:border-[#D8C78E] hover:bg-[#0E423E] transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 rounded-sm bg-[#061E1C]/85 border border-[#C5B378]/25 px-2.5 py-1 font-mono text-xs tabular-nums text-[#D8C78E]">
                      {String(activeLightboxIndex + 1).padStart(2, '0')} /{' '}
                      {String(filteredItems.length).padStart(2, '0')}
                    </div>
                  </>
                )}
              </div>

              <div className="max-h-[34dvh] overflow-y-auto px-5 py-4 sm:px-8 sm:py-5">
                <DialogHeader>
                  <p className="text-xs font-medium text-[#D8C78E]">
                    {translateCategory(locale, lightboxItem.category)} · {formatLocalizedMonthLabel(lightboxItem.dateLabel, locale)}
                  </p>
                  <DialogTitle className="font-serif text-xl font-semibold text-white sm:text-2xl">
                    {localizePortfolioText(locale, lightboxItem.id, 'title', lightboxItem.title)}
                  </DialogTitle>
                  <DialogDescription className="hidden text-sm leading-relaxed text-[#E6ECEB]/82 pt-1 sm:block">
                    {localizePortfolioText(locale, lightboxItem.id, 'notes', lightboxItem.shootNotes)}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#C5B378]/18 pt-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#E6ECEB]/75">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#D8C78E]" />
                      {localizePortfolioText(locale, lightboxItem.id, 'location', lightboxItem.location)}
                    </span>
                    <span className="font-mono tabular-nums text-[#D8C78E]/90">
                      {lightboxItem.exif}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      const cat = normalizeEventCategory(lightboxItem.category);
                      setLightboxItem(null);
                      onBookCategory(cat);
                    }}
                  >
                    {t('portfolio.bookSimilar')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
