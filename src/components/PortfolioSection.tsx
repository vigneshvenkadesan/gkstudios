'use client';

import React, { useMemo, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Expand, MapPin } from 'lucide-react';
import { useStudio } from '@/src/context/StudioContext';
import { EVENT_CATEGORIES, EventCategory, PortfolioItem } from '@/src/types/studio';
import { MandalaDivider } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';

interface PortfolioSectionProps {
  onBookCategory: (category: EventCategory) => void;
}

type FilterOption = 'All Events' | EventCategory;

const FILTER_OPTIONS: FilterOption[] = ['All Events', ...EVENT_CATEGORIES];

export function PortfolioSection({ onBookCategory }: PortfolioSectionProps) {
  const { portfolio } = useStudio();
  const [selectedCategory, setSelectedCategory] = useState<FilterOption>('All Events');
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visiblePortfolio = useMemo(
    () => portfolio.filter((item) => item.isVisible),
    [portfolio]
  );

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All Events') return visiblePortfolio;
    return visiblePortfolio.filter((item) => item.category === selectedCategory);
  }, [visiblePortfolio, selectedCategory]);

  const activeLightboxIndex = lightboxItem
    ? filteredItems.findIndex((i) => i.id === lightboxItem.id)
    : -1;

  const navigateLightbox = (direction: -1 | 1) => {
    if (filteredItems.length <= 1 || activeLightboxIndex === -1) return;
    const nextIdx = (activeLightboxIndex + direction + filteredItems.length) % filteredItems.length;
    setLightboxItem(filteredItems[nextIdx]);
  };

  return (
    <section id="portfolio" className="bg-[#072421] py-16 sm:py-20 border-b border-[#C5B378]/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#D8C78E]">
            CURATED CEREMONIAL ARCHIVE
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Stories Across South Indian Traditions
          </h2>
          <p className="text-base text-[#E6ECEB]/80">
            Explore authentic moments across Iyer weddings, sacred temple vows, multi-faith unions,
            Kaathu Kuthi blessings, milestone birthdays, and golden-hour outdoor portraits.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex max-w-full flex-wrap items-center gap-2 rounded-xl border border-[#C5B378]/20 bg-[#092E2B] p-2">
          {FILTER_OPTIONS.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] ${
                  isActive
                    ? 'bg-[#C5B378] text-[#072421] font-semibold'
                    : 'text-[#E6ECEB]/80 hover:bg-[#0E423E] hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Masonry / Bento Grid */}
        {filteredItems.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#C5B378]/20 bg-[#0E423E]/50 p-12 text-center">
            <Camera className="mx-auto h-10 w-10 text-[#C5B378]" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              No photographs currently published in {selectedCategory}
            </h3>
            <p className="mt-2 text-sm text-[#E6ECEB]/75">
              Select another event category to view published moments.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => setSelectedCategory('All Events')}
            >
              Show All Events
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const isWide = item.aspect === 'wide' && selectedCategory === 'All Events';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxItem(item)}
                  className={`group relative block w-full overflow-hidden rounded-2xl border border-[#C5B378]/25 bg-[#0E423E] text-left transition-all duration-200 hover:border-[#D8C78E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] cursor-pointer ${
                    isWide ? 'lg:col-span-2 aspect-[16/10]' : 'aspect-[4/3]'
                  }`}
                >
                  {!failedImages[item.id] ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="eager"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0E423E] to-[#072421] p-6 text-center">
                      <Camera className="h-8 w-8 text-[#C5B378]" />
                      <span className="text-sm font-medium text-white">{item.title}</span>
                    </div>
                  )}

                  {/* Measured contrast scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041715]/90 via-[#041715]/25 to-transparent" />

                  <div className="absolute top-3.5 right-3.5 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-[#072421]/75 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <Expand className="h-4 w-4" />
                  </div>

                  {/* Clean unboxed text metadata with typographic separator */}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-xs font-medium text-[#D8C78E] truncate">
                      {item.category} · {item.location}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-white leading-snug">
                      {item.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <MandalaDivider className="mt-16" />
      </div>

      {/* Fullscreen Lightbox Modal */}
      <Dialog open={Boolean(lightboxItem)} onOpenChange={(open) => !open && setLightboxItem(null)}>
        <DialogContent className="max-w-4xl border-[#C5B378]/35 bg-[#072421] p-0 overflow-hidden">
          {lightboxItem && (
            <div>
              <div className="relative aspect-[16/10] w-full bg-[#041715]">
                {!failedImages[lightboxItem.id] ? (
                  <img
                    src={lightboxItem.imageUrl}
                    alt={lightboxItem.title}
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
                      aria-label="Previous photograph"
                      className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#C5B378]/40 bg-[#072421]/85 text-white hover:border-[#D8C78E] cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateLightbox(1)}
                      aria-label="Next photograph"
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#C5B378]/40 bg-[#072421]/85 text-white hover:border-[#D8C78E] cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              <div className="p-6 space-y-4">
                <DialogHeader>
                  <p className="text-xs font-medium text-[#D8C78E]">
                    {lightboxItem.category} · {lightboxItem.dateLabel}
                  </p>
                  <DialogTitle className="font-serif text-2xl text-white">
                    {lightboxItem.title}
                  </DialogTitle>
                  <DialogDescription className="text-[#E6ECEB]/85 leading-relaxed pt-1">
                    {lightboxItem.shootNotes}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#C5B378]/20 pt-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#E6ECEB]/75">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#D8C78E]" />
                      {lightboxItem.location}
                    </span>
                    <span className="font-mono tabular-nums text-[#D8C78E]/90">
                      {lightboxItem.exif}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      const cat = lightboxItem.category;
                      setLightboxItem(null);
                      onBookCategory(cat);
                    }}
                  >
                    Book Similar Shoot
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
