'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  LayoutGrid,
  Layers,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useStudio } from '@/src/context/StudioContext';
import { PackageDeliverables, StudioPackage, StudioEvent } from '@/src/types/studio';
import {
  buildWhatsAppUrl,
  formatINR,
  removeAlbumPhotoSelectionNote,
} from '@/src/lib/utils';
import {
  calculatePackageBasePrice,
  getDynamicPackageDisplaySections,
  sanitizePackageDeliverables,
} from '@/src/lib/pricing';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { Button } from '@/src/components/ui/button';
import { getPackageCopy, translate } from '@/src/i18n/translations';
import { useEvents } from '@/src/hooks/useEvents';
import { EventCategoryTabs } from './packages/EventCategoryTabs';
import { PackageCardSkeleton } from './packages/PackageCardSkeleton';
import { FastIntakeWizard } from './packages/FastIntakeWizard';
import { SHIMMER_BLUR_DATA_URL } from '@/src/lib/imageBlur';
import { ComplementaryHighlightText } from '@/src/components/ComplementaryHighlightText';
import { PackageGridShareActions } from '@/src/components/packages/PackageGridShareActions';

interface PackagesSectionProps {
  selectedPackageId: string;
  onSelectPackage: (pkg: StudioPackage, eventId?: string) => void;
  preselectedEventId?: string;
}

interface CategorizedDeliverable {
  category: string;
  text: string;
}

function parseDeliverables(
  deliverables: PackageDeliverables | string[] | undefined | null
): CategorizedDeliverable[] {
  if (!deliverables) return [];

  if (Array.isArray(deliverables)) {
    return deliverables.map((item) => {
      if (item.includes(':')) {
        const [cat, ...rest] = item.split(':');
        return { category: cat.trim(), text: rest.join(':').trim() };
      }
      return { category: 'Inclusions', text: item };
    });
  }

  if (typeof deliverables === 'object') {
    return Object.entries(deliverables)
      .filter(([_, val]) => Boolean(val && typeof val === 'string' && val.trim()))
      .map(([cat, val]) => ({ category: cat, text: String(val).trim() }));
  }

  return [];
}

export function PackagesSection({
  selectedPackageId,
  onSelectPackage,
  preselectedEventId,
}: PackagesSectionProps) {
  const { packages, services, isLoading: isStudioLoading } = useStudio();
  const { events, activeEvents, isLoading: isEventsLoading, error: eventsError, refresh: refreshEvents } = useEvents();

  // Mode: 'intake' (2-Question Intake) vs 'grid' (Classic All Packages Grid)
  const [viewMode, setViewMode] = useState<'intake' | 'grid'>('grid');
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  const [isAdminSession, setIsAdminSession] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('wedding');
  const [selectedEventId, setSelectedEventId] = useState<string>('wedding');

  const t = (key: Parameters<typeof translate>[1]) => translate('en', key);
  const prefersReducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    let isCurrent = true;

    void fetch('/api/admin/auth', { cache: 'no-store', credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Admin session check failed (${response.status}).`);
        }
        return (await response.json()) as { authenticated?: boolean };
      })
      .then((data) => {
        if (isCurrent) setIsAdminSession(data.authenticated === true);
      })
      .catch((error: unknown) => {
        console.error('Unable to verify admin session for package sharing:', error);
        if (isCurrent) setIsAdminSession(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Sync preselectedEventId if passed from outside
  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
      const ev = events.find((e) => e.id === preselectedEventId);
      if (ev && ev.category) {
        setSelectedCategoryId(ev.category);
      }
    }
  }, [preselectedEventId, events]);

  useEffect(() => {
    if (!activeEvents.length || activeEvents.some((event) => event.id === selectedEventId)) return;
    setSelectedEventId(activeEvents[0].id);
    setSelectedCategoryId(activeEvents[0].category);
  }, [activeEvents, selectedEventId]);

  // Current selected event object
  const currentEvent = useMemo(() => {
    return (
      events.find((e) => e.id === selectedEventId) ||
      events.find((e) => e.id === 'wedding') ||
      events[0]
    );
  }, [events, selectedEventId]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const selectedEvent = activeEvents.find((event) => event.id === eventId);
    if (selectedEvent?.category) {
      setSelectedCategoryId(selectedEvent.category);
    }
  };

  // Show packages for the selected ceremony.
  const matchingPackages = useMemo(() => {
    return packages
      .filter((pkg) => (pkg.status ?? 'active') === 'active' && pkg.displayOnPortfolio !== false)
      .filter((pkg) => pkg.eventId === selectedEventId)
      .map((pkg) => {
        const dynamicPrice = calculatePackageBasePrice(pkg, services);
        return {
          ...pkg,
          price: dynamicPrice,
          priceLabel: formatINR(dynamicPrice),
        };
      })
      .sort(
        (a, b) =>
          (a.eventSortOrder ?? Number.MAX_SAFE_INTEGER) - (b.eventSortOrder ?? Number.MAX_SAFE_INTEGER) ||
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );
  }, [packages, services, selectedEventId]);

  const whatsappUrl = buildWhatsAppUrl(
    STUDIO_INFO.phone,
    `Vanakkam GK Studios! I am inquiring about photography packages for ${currentEvent?.name || 'our event'}. Please share details.`
  );

  const isLoading = (isStudioLoading || isEventsLoading) && packages.length === 0;

  return (
    <section
      id="packages"
      className="gk-content-120 scroll-mt-16 sm:scroll-mt-[72px] bg-[#072421] py-16 sm:py-24 border-b border-[#C5B378]/18"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Editorial Header with View Mode Switcher */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
        >
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-[#D8C78E]">
              {t('packages.eyebrow')}
            </p>
            <h2 className="font-serif text-3xl font-semibold tracking-[-0.015em] text-white leading-[1.06] sm:text-4xl lg:text-5xl">
              {viewMode === 'intake'
                ? 'Customize Your Package'
                : t('packages.heading')}
            </h2>
            <p className="text-sm leading-relaxed text-[#E6ECEB]/78 sm:text-base">
              {viewMode === 'intake'
                ? 'Choose your event and a few details.'
                : t('packages.included')}
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#0E423E] border border-[#C5B378]/30 p-1 self-start lg:self-auto shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('intake')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'intake'
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow-sm'
                  : 'text-[#E6ECEB]/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Customize</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow-sm'
                  : 'text-[#E6ECEB]/75 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Standard Packages</span>
            </button>
          </div>
        </motion.div>

        {/* Error State with Retry */}
        {eventsError && (
          <div className="rounded-sm border border-rose-400/30 bg-rose-950/20 p-4 text-center">
            <p className="text-sm text-rose-200">
              Unable to refresh event categories. Showing available collections.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshEvents}
              className="mt-3 gap-2 border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#C5B378]/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connecting
            </Button>
          </div>
        )}

        {/* ─── View Mode 1: Fast 2-Question Intake Wizard ─── */}
        {viewMode === 'intake' ? (
          isLoading ? (
            <PackageCardSkeleton />
          ) : (
            <FastIntakeWizard
              events={activeEvents}
              packages={packages}
              selectedCategoryId={selectedCategoryId}
              onChangeCategory={setSelectedCategoryId}
              selectedEventId={selectedEventId}
              onChangeEvent={setSelectedEventId}
              onSwitchToStandardGrid={() => setViewMode('grid')}
            />
          )
        ) : (
          /* ─── View Mode 2: Classic 3-Tier Grid with Live Event Selector ─── */
          <div className="space-y-8">
            {/* Event Category Tabs */}
            <EventCategoryTabs
              events={activeEvents}
              packages={packages}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              isLoading={isEventsLoading}
              showCategories={false}
              showEvents
            />

            {/* Loading Skeletons */}
            {isLoading ? (
              <PackageCardSkeleton />
            ) : matchingPackages.length === 0 ? (
              /* Empty State for Event with no packages */
              <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] p-10 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D8C78E]/30 bg-[#0E423E] text-[#D8C78E]">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif text-2xl font-semibold text-white">
                    Bespoke Collections for {currentEvent?.name || 'This Event'}
                  </h4>
                  <p className="text-sm text-[#E6ECEB]/70 max-w-lg mx-auto leading-relaxed">
                    Every {currentEvent?.name || 'event'} is unique. We provide tailored photography and 4K cinematic video services designed around your exact venue and schedule.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-sm bg-[#C5B378] px-6 py-2.5 text-xs font-semibold text-[#061E1C] transition-colors hover:bg-[#D8C78E]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Get Custom Quote via WhatsApp
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const weddingEvent = activeEvents.find((event) => event.category === 'wedding');
                      const firstEvent = weddingEvent || activeEvents[0];
                      if (firstEvent) {
                        setSelectedCategoryId(firstEvent.category);
                        setSelectedEventId(firstEvent.id);
                      }
                    }}
                    className="border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#C5B378]/10"
                  >
                    Browse Events
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isAdminSession && (
                  <div className="flex justify-end">
                    <PackageGridShareActions
                      packages={matchingPackages}
                      eventName={currentEvent?.name || 'Event'}
                      services={services}
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-stretch justify-center gap-5 content-auto">
                  {matchingPackages.map((pkg, idx) => {
                    const copy = getPackageCopy(pkg);
                    const isSelected = selectedPackageId === pkg.id;
                    const isRecommended = Boolean(pkg.highlighted || pkg.featured);

                    const pkgImg = pkg.imageUrl || pkg.image;
                    const dynamicSections = getDynamicPackageDisplaySections(
                      pkg.includedServices,
                      services,
                      pkg.durationTier,
                      copy.deliverables
                    );
                    const packageDeliverableItems = parseDeliverables(
                      sanitizePackageDeliverables(copy.deliverables)
                    );
                    const standardDeliverables = [
                      dynamicSections.deliverables,
                      ...packageDeliverableItems.map((item) => {
                        const text = removeAlbumPhotoSelectionNote(item.text);
                        if (!text) return '';
                        return item.category.toLowerCase() === 'deliverables'
                          ? text
                          : `${item.category}: ${text}`;
                      }),
                    ]
                      .filter(Boolean)
                      .join(', ');
                    const parsedDeliverables = [
                      ...(dynamicSections.coverage
                        ? [{ category: 'Event Coverage & Crew', text: dynamicSections.coverage }]
                        : []),
                      ...(dynamicSections.albums
                        ? [{ category: 'Albums', text: dynamicSections.albums }]
                        : []),
                      ...(standardDeliverables
                        ? [{ category: 'Deliverables', text: standardDeliverables }]
                        : []),
                    ];

                    return (
                      <motion.article
                        key={pkg.id}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.15 }}
                        transition={{
                          duration: 0.5,
                          delay: idx * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={`group relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-xl border transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out hover:-translate-y-1 motion-reduce:hover:translate-y-0 sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[calc(25%-15px)] ${
                          isSelected
                            ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_18px_45px_rgba(4,20,18,0.45)] ring-2 ring-[#D8C78E]'
                            : isRecommended
                              ? 'z-10 border-2 border-[#D8C78E] bg-[#0E423E] shadow-[0_16px_45px_rgba(216,199,142,0.2)] ring-1 ring-[#D8C78E]/35 xl:-translate-y-1'
                              : 'border-[#C5B378]/20 bg-[#092E2B] shadow-[0_10px_28px_rgba(4,20,18,0.24)] hover:border-[#C5B378]/55 hover:bg-[#0C3935] hover:shadow-[0_16px_36px_rgba(4,20,18,0.35)]'
                        }`}
                      >
                        <div
                          aria-hidden="true"
                          className={`h-1 w-full ${
                            isRecommended
                              ? 'bg-gradient-to-r from-[#C5B378] via-[#F4E8C1] to-[#C5B378]'
                              : 'bg-gradient-to-r from-transparent via-[#C5B378]/45 to-transparent'
                          }`}
                        />

                        {pkgImg && (
                          <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[#C5B378]/15 bg-[#041513]">
                            <Image
                              src={pkgImg}
                              alt={copy.name}
                              fill
                              decoding="async"
                              loading={idx < 2 ? 'eager' : 'lazy'}
                              priority={idx < 2}
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              quality={90}
                              placeholder="blur"
                              blurDataURL={SHIMMER_BLUR_DATA_URL}
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#092E2B] via-transparent to-black/20" />
                            {isRecommended && (
                              <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C5B378] to-[#E8D79F] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#061E1C] shadow-[0_2px_12px_rgba(216,199,142,0.4)]">
                                <Sparkles className="h-3 w-3 fill-[#061E1C]" />
                                Recommended
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono tabular-nums text-[#D8C78E]/70">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            {!pkgImg && isRecommended && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D8C78E] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#061E1C]">
                                <Sparkles className="h-3 w-3 fill-[#061E1C]" />
                                Recommended
                              </span>
                            )}
                          </div>

                          <div className="mt-4 space-y-1.5">
                            <h3 className="font-serif text-xl font-semibold leading-snug text-white sm:text-2xl">
                              {copy.name}
                            </h3>
                            <p className="text-xs text-[#D8C78E]/90">{copy.audience}</p>
                            <p className="text-xs leading-relaxed text-[#E6ECEB]/75">{copy.duration}</p>
                          </div>

                          <div className="mt-5 border-b border-[#C5B378]/20 pb-5">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E6ECEB]/55">
                              {t('packages.starting')}
                            </p>
                            <span className="text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
                              {formatINR(pkg.price)}
                            </span>
                          </div>

                          {/* Categorized Deliverables Breakdown */}
                          <div className="mt-5 flex-1 space-y-4">
                            {parsedDeliverables.map((item, dIdx) => {
                              const isCrew =
                                item.category.toLowerCase().includes('crew') ||
                                item.category.toLowerCase().includes('coverage');
                              const isAlbum =
                                item.category.toLowerCase().includes('album') ||
                                item.category.toLowerCase().includes('frame');
                              const isDeliverables = item.category
                                .toLowerCase()
                                .includes('deliverable');
                              const deliverablesText = item.text.replace(/\s*\+\s*/g, ', ');
                              const listItems = isCrew
                                ? item.text.split(/\s*(?:\+|,|&)\s*/).filter(Boolean)
                                : isAlbum
                                  ? [item.text]
                                  : isDeliverables
                                    ? deliverablesText.split(/\s*,\s*/).filter(Boolean)
                                    : null;

                              return (
                                <div key={dIdx} className="space-y-1.5">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D8C78E]">
                                    {item.category}
                                  </p>
                                  {listItems ? (
                                    <ul className="space-y-1.5 text-xs leading-relaxed text-[#E6ECEB]/88">
                                      {listItems.map((listItem, listIndex) => (
                                        <li key={`${listIndex}-${listItem}`} className="flex gap-2">
                                          <span aria-hidden="true" className="text-[#D8C78E]">•</span>
                                          <ComplementaryHighlightText text={listItem} />
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs leading-relaxed text-[#E6ECEB]/88">
                                      <ComplementaryHighlightText text={item.text} />
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-6 border-t border-[#C5B378]/20 pt-4">
                            <Button
                              className={`w-full justify-between transition-all duration-200 ${
                                isSelected || isRecommended
                                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] font-bold text-[#061E1C] shadow-[0_4px_16px_rgba(216,199,142,0.2)] hover:brightness-105'
                                  : 'border border-[#C5B378]/50 text-white hover:border-[#D8C78E] hover:bg-[#C5B378]/10'
                              }`}
                              variant={isSelected || isRecommended ? 'default' : 'outline'}
                              disabled={pendingPackageId !== null}
                              aria-busy={pendingPackageId === pkg.id}
                              onClick={() => {
                                setPendingPackageId(pkg.id);
                                onSelectPackage(pkg, pkg.eventId || selectedEventId);
                              }}
                            >
                              {pendingPackageId === pkg.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Opening plan...</span>
                                </>
                              ) : (
                                <>
                                  <span>{t(isSelected ? 'packages.selected' : 'packages.select')}</span>
                                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-sm border border-[#C5B378]/25 bg-[#0E423E] p-4 text-xs">
            <div className="flex items-center gap-2 text-[#E6ECEB]/90">
              <Sparkles className="h-4 w-4 text-[#D8C78E] shrink-0" />
              <span>Need a custom package?</span>
            </div>
            <Button
              size="sm"
              onClick={() => setViewMode('intake')}
              className="gap-1.5 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold text-xs"
            >
              <span>Customize</span>
            </Button>
          </div>
        )}

        {/* Guidance & Direct Contact Banner */}
        <div className="mt-8 flex flex-col gap-5 rounded-sm border border-[#C5B378]/25 bg-[#0E423E] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <h3 className="font-serif text-xl font-semibold text-white sm:text-2xl">
              {t('packages.guidanceHeading')}
            </h3>
            <p className="text-sm leading-relaxed text-[#E6ECEB]/75">
              {t('packages.guidanceDescription')}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <a
              href="tel:+917418543123"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#C5B378] px-6 text-sm font-semibold tracking-[0.02em] text-[#061E1C] shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-all duration-200 hover:bg-[#D8C78E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] sm:w-auto"
            >
              <Phone className="h-4 w-4" />
              {t('packages.call')}
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-[#C5B378]/50 bg-transparent px-6 text-sm font-medium tracking-[0.02em] text-white transition-all duration-200 hover:border-[#D8C78E] hover:bg-[#C5B378]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8C78E] sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 text-[#D8C78E]" />
              {t('packages.whatsapp')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
