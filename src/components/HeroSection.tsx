'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Camera, ChevronLeft, ChevronRight, MapPin, Phone } from 'lucide-react';
import { useStudio } from '@/src/context/StudioContext';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { MandalaCorner } from '@/src/components/MandalaAccents';
import { Button } from '@/src/components/ui/button';

interface HeroSectionProps {
  onCheckAvailability: () => void;
  onExplorePackages: () => void;
}

export function HeroSection({ onCheckAvailability, onExplorePackages }: HeroSectionProps) {
  const { portfolio } = useStudio();
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
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[currentIndex];

  const handlePrev = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden border-b border-[#C5B378]/20 bg-[#092E2B] studio-pattern-bg"
    >
      {/* Ornate South Indian Mandala Corner Accents matching brand banner */}
      <MandalaCorner className="pointer-events-none absolute -top-4 -left-4 h-36 w-36 sm:h-48 sm:w-48 opacity-65" />
      <MandalaCorner className="pointer-events-none absolute -top-4 -right-4 h-36 w-36 sm:h-48 sm:w-48 rotate-90 opacity-65" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
          {/* Left Typographic Identity Column */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-8 py-2">
            <div className="space-y-6">
              {/* Clean Unboxed Studio Contact & Location Line */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#D8C78E]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{STUDIO_INFO.address}</span>
                </span>
                <span aria-hidden="true" className="text-[#C5B378]/50">
                  ·
                </span>
                <a
                  href={`tel:+91${STUDIO_INFO.phone}`}
                  className="inline-flex items-center gap-1.5 font-mono tabular-nums text-white hover:text-[#D8C78E] transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-[#D8C78E]" />
                  <span>{STUDIO_INFO.phone}</span>
                </a>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[0.14em] text-white leading-[1.08]">
                  GK STUDIOS
                </h1>
                <p className="text-sm sm:text-base font-medium tracking-[0.28em] text-[#D8C78E]">
                  CREATING MEMORIES
                </p>
              </div>

              <p className="max-w-xl text-base sm:text-lg leading-relaxed text-[#E6ECEB]/90">
                Timeless South Indian wedding photography and 4K cinema films rooted in sacred
                rituals—from traditional Iyer Oonjal and sunrise temple Muhurthams to Kaathu Kuthi
                blessings, multi-faith celebrations, and golden-hour couple portraits.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button size="lg" onClick={onCheckAvailability}>
                  <Calendar className="h-4 w-4" />
                  Check Availability &amp; Book
                </Button>
                <Button size="lg" variant="outline" onClick={onExplorePackages}>
                  Explore Packages
                </Button>
              </div>
            </div>

            <div className="border-t border-[#C5B378]/20 pt-5 text-xs sm:text-sm text-[#E6ECEB]/75">
              <span>Led by </span>
              <span className="font-semibold text-white">{STUDIO_INFO.leadPhotographer}</span>
              <span className="mx-2 text-[#C5B378]/50" aria-hidden="true">
                ·
              </span>
              <span>{STUDIO_INFO.serviceRegion}</span>
            </div>
          </div>

          {/* Right Showcase Carousel Column */}
          <div className="lg:col-span-6 flex">
            <div className="relative h-[360px] sm:h-[440px] lg:h-auto lg:min-h-[460px] w-full overflow-hidden rounded-2xl border border-[#C5B378]/35 bg-[#0E423E] shadow-2xl">
              {activeSlide ? (
                <>
                  {!failedImages[activeSlide.id] ? (
                    <img
                      src={activeSlide.imageUrl}
                      alt={activeSlide.title}
                      loading="eager"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [activeSlide.id]: true }))
                      }
                      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0E423E] to-[#072421] p-8 text-center">
                      <Camera className="h-10 w-10 text-[#C5B378]" />
                      <p className="text-base font-medium text-white">{activeSlide.title}</p>
                    </div>
                  )}

                  {/* Measured Contrast Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#051B19]/90 via-[#051B19]/25 to-transparent" />

                  {/* Bottom Showcase Caption & Carousel Controls */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-medium text-[#D8C78E] truncate">
                        {activeSlide.category} · {activeSlide.location}
                      </p>
                      <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white leading-snug">
                        {activeSlide.title}
                      </h2>
                    </div>

                    {slides.length > 1 && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handlePrev}
                          aria-label="Previous showcase photograph"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#C5B378]/40 bg-[#072421]/80 text-white hover:border-[#D8C78E] hover:bg-[#0E423E] transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          aria-label="Next showcase photograph"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#C5B378]/40 bg-[#072421]/80 text-white hover:border-[#D8C78E] hover:bg-[#0E423E] transition-colors cursor-pointer"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subtle slide index dots */}
                  {slides.length > 1 && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-md bg-[#072421]/75 px-2.5 py-1.5 border border-[#C5B378]/25">
                      {slides.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-label={`View featured slide ${idx + 1}`}
                          onClick={() => setCurrentIndex(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === currentIndex
                              ? 'w-5 bg-[#D8C78E]'
                              : 'w-1.5 bg-white/40 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <Camera className="h-10 w-10 text-[#C5B378]" />
                  <p className="text-sm text-[#E6ECEB]/75">
                    Feature photographs in Studio Admin to display them here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width Proof & Studio Capabilities Strip Below Hero Split */}
        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-[#C5B378]/20 pt-8 lg:grid-cols-4">
          <div>
            <p className="font-mono text-2xl font-semibold text-[#D8C78E] tabular-nums">650+</p>
            <p className="mt-1 text-sm text-[#E6ECEB]/80">South Indian Weddings &amp; Rituals</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-[#D8C78E] tabular-nums">12+ Yrs</p>
            <p className="mt-1 text-sm text-[#E6ECEB]/80">Heritage &amp; Temple Coverage</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-[#D8C78E] tabular-nums">4K Cinema</p>
            <p className="mt-1 text-sm text-[#E6ECEB]/80">Dual-Unit Teasers &amp; Drone</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold text-[#D8C78E] tabular-nums">Karizma</p>
            <p className="mt-1 text-sm text-[#E6ECEB]/80">Archival Metallic Photo Albums</p>
          </div>
        </div>
      </div>
    </section>
  );
}
