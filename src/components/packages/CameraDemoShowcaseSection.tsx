'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Camera,
  Film,
  Sparkles,
  Eye,
  X,
  Play,
  Pause,
  Maximize2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Smartphone,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CAMERA_CREW_DEMO_ITEMS,
  CameraCrewDemoItem,
  ShowcaseMediaItem,
} from '@/src/config/cameraDemoShowcase';
import { Button } from '@/src/components/ui/button';
import { SHIMMER_BLUR_DATA_URL } from '@/src/lib/imageBlur';

interface CameraDemoShowcaseSectionProps {
  className?: string;
  defaultExpandedId?: string | null;
  title?: string;
  subtitle?: string;
}

export function CameraDemoShowcaseSection({
  className = '',
  defaultExpandedId = null,
  title = 'Curious What Traditional Coverage Looks Like?',
  subtitle = 'Explore real examples of our photography styles, crew and heirloom albums.',
}: CameraDemoShowcaseSectionProps) {
  const [isShowcaseExpanded, setIsShowcaseExpanded] = useState(false);

  // Expanded crew cards (collapsed by default as requested)
  const [expandedIds, setExpandedIds] = useState<string[]>(
    defaultExpandedId ? [defaultExpandedId] : []
  );

  // Active item in the Lightbox Maximize modal
  const [lightboxState, setLightboxState] = useState<{
    crewItem: CameraCrewDemoItem;
    mediaIndex: number;
  } | null>(null);

  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Lightbox
  const openLightbox = (crewItem: CameraCrewDemoItem, mediaIndex: number = 0) => {
    setLightboxState({ crewItem, mediaIndex });
  };

  // Close Lightbox
  const closeLightbox = () => {
    setLightboxState(null);
  };

  // Lightbox Next / Previous navigation
  const navigateLightbox = useCallback((direction: 'next' | 'prev') => {
    setLightboxState((current) => {
      if (!current) return null;
      const mediaList = current.crewItem.media;
      const total = mediaList.length;
      let newIndex = direction === 'next' ? current.mediaIndex + 1 : current.mediaIndex - 1;

      if (newIndex >= total) {
        newIndex = 0;
      } else if (newIndex < 0) {
        newIndex = total - 1;
      }

      return {
        ...current,
        mediaIndex: newIndex,
      };
    });
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        navigateLightbox('next');
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState, navigateLightbox]);

  return (
    <section className={`space-y-4 content-auto ${className}`}>
      <button
        type="button"
        onClick={() => setIsShowcaseExpanded((expanded) => !expanded)}
        aria-expanded={isShowcaseExpanded}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C5B378]/20 pb-3 text-left focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#D8C78E]"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
            <Camera className="h-3.5 w-3.5 text-[#D8C78E]" />
            <span>{title}</span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#E6ECEB]/70 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-[#C5B378]/15 text-[#D8C78E] border border-[#C5B378]/30">
            8 Styles • 24 Samples
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#D8C78E]">
            {isShowcaseExpanded ? 'Hide samples' : 'Explore styles'}
          </span>
          {isShowcaseExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#D8C78E]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#D8C78E]" />
          )}
        </div>
      </button>

      {/* ─── Responsive Grid: 8 Camera & Crew Styles (Stacked Mobile, 2-Column Desktop) ─── */}
      <div
        className={`${isShowcaseExpanded ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5`}
      >
        {CAMERA_CREW_DEMO_ITEMS.map((item) => {
          const isExpanded = expandedIds.includes(item.id);
          const firstMedia = item.media[0];

          return (
            <div
              key={item.id}
              className={`rounded-sm border transition-all overflow-hidden flex flex-col ${
                isExpanded
                  ? 'border-[#D8C78E] bg-[#0A3330] shadow-[0_8px_24px_rgba(4,20,18,0.5)]'
                  : 'border-[#C5B378]/20 bg-[#061E1C]/90 hover:border-[#C5B378]/50 hover:bg-[#092E2B]'
              }`}
            >
              {/* ─── Compact Header Card (Always Visible, Clickable Tap Target) ─── */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(item.id);
                  }
                }}
                className="w-full text-left p-4 sm:p-5 cursor-pointer select-none space-y-3.5 transition-colors focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#D8C78E]"
                aria-expanded={isExpanded}
              >
                {/* Media Thumbnail Container with Clean Non-Overlapping Overlays */}
                <div className="relative aspect-[16/9] w-full rounded-sm overflow-hidden border border-[#C5B378]/25 bg-black">
                  <Image
                    src={firstMedia?.thumbnailUrl || '/images/guide/traditional-photo-stage.jpg'}
                    alt={item.enTitle}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    decoding="async"
                    loading="lazy"
                    className="h-full w-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Left Badge: e.g. "Essential Base" */}
                  {item.badge && (
                    <div className="absolute top-2.5 left-2.5 pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C5B378] text-[#061E1C] shadow-md">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Top Right Sample Counter Badge */}
                  <div className="absolute top-2.5 right-2.5 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-black/75 text-[#D8C78E] border border-[#C5B378]/35 backdrop-blur-xs shadow-md">
                      <Layers className="h-3 w-3 text-[#D8C78E]" />
                      <span>{item.media.length} Samples</span>
                    </span>
                  </div>
                </div>

                {/* Natural Flow Content Row (Zero Overlaps, Zero Clipping) */}
                <div className="flex items-start justify-between gap-3 min-h-[48px]">
                  {/* Left Info: English Title, Tamil Subtitle & Storytelling Tagline */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-serif text-base sm:text-lg font-bold text-white leading-snug break-words">
                      {item.enTitle}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#D8C78E] font-medium leading-relaxed break-words">
                      {item.taSubtitle}
                    </p>
                    <p className="text-xs text-[#E6ECEB]/75 leading-relaxed break-words pt-0.5">
                      {item.shortTagline}
                    </p>
                  </div>

                  {/* Right Control: Dedicated Expand/Collapse Chevron Button */}
                  <div className="shrink-0 flex items-center justify-center pt-0.5">
                    <div
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded flex items-center justify-center border transition-all ${
                        isExpanded
                          ? 'bg-[#D8C78E] text-[#061E1C] border-[#D8C78E] shadow-[0_0_12px_rgba(216,199,142,0.3)]'
                          : 'bg-[#0E423E]/70 text-[#D8C78E] border-[#C5B378]/30 hover:border-[#D8C78E]'
                      }`}
                      aria-hidden="true"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Collapsible Details + Multi-Media Gallery (Collapsed by Default) ─── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-[#C5B378]/20 p-4 sm:p-5 space-y-4 bg-[#072421]/95"
                  >
                    {/* Storytelling Outcome Description */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]/90">
                        Client Story & Experience
                      </span>
                      <p className="text-xs sm:text-sm text-[#E6ECEB]/90 leading-relaxed break-words">
                        {item.description}
                      </p>
                    </div>

                    {/* Best Suited For Highlight */}
                    {item.bestFor && (
                      <div className="flex items-start gap-2.5 text-xs text-[#D8C78E] bg-[#0E423E]/50 border border-[#C5B378]/25 p-3 rounded-sm">
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-[#D8C78E]" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-white mr-1.5">Best Suited For:</span>
                          <span className="text-[#E6ECEB]/85 leading-relaxed break-words">
                            {item.bestFor}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Visual Samples Section */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                          Interactive Samples ({item.media.length})
                        </span>
                        <span className="text-[10px] text-[#E6ECEB]/60">
                          Tap to maximize & explore
                        </span>
                      </div>

                      {/* 3 Samples Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {item.media.map((media, idx) => {
                          const isVideo = media.type === 'video';
                          const isPdf = media.type === 'pdf';

                          return (
                            <div
                              key={media.id}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(item, idx);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                openLightbox(item, idx);
                              }
                            }}
                            className="group relative flex flex-col rounded-sm overflow-hidden border border-[#C5B378]/25 bg-[#041614] hover:border-[#D8C78E] hover:bg-[#072421] transition-all cursor-pointer select-none focus:outline-hidden focus-visible:ring-1 focus-visible:ring-[#D8C78E]"
                          >
                            {/* Media Aspect Box */}
                            <div className="relative aspect-video w-full overflow-hidden bg-black">
                              <Image
                                src={media.thumbnailUrl}
                                alt={media.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 33vw"
                                placeholder="blur"
                                blurDataURL={SHIMMER_BLUR_DATA_URL}
                                decoding="async"
                                loading="lazy"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

                              {/* Top Left Media Type Tag */}
                              <div className="absolute top-1.5 left-1.5">
                                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/80 text-white border border-white/20 backdrop-blur-xs">
                                  {isPdf ? 'E-Book / PDF' : isVideo ? 'Cinema Video' : 'Photo'}
                                </span>
                              </div>

                              {/* Top Right Dedicated Maximize Icon Button (Never Collides with Captions) */}
                              <div className="absolute top-1.5 right-1.5">
                                <div className="h-6 w-6 rounded bg-black/75 hover:bg-[#D8C78E] text-[#D8C78E] hover:text-[#061E1C] border border-[#C5B378]/30 flex items-center justify-center transition-colors shadow">
                                  <Maximize2 className="h-3 w-3" />
                                </div>
                              </div>

                              {/* Center Play / Book Indicator */}
                              {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="h-8 w-8 rounded-full bg-[#D8C78E]/90 text-[#061E1C] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Play className="h-4 w-4 fill-current ml-0.5" />
                                  </div>
                                </div>
                              )}
                              {isPdf && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="h-8 w-8 rounded-full bg-[#0E423E]/90 text-[#D8C78E] flex items-center justify-center border border-[#C5B378]/40 shadow-lg group-hover:scale-110 transition-transform">
                                    <BookOpen className="h-4 w-4" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Dedicated Caption Area with Natural Flow (Zero Collision) */}
                            <div className="p-2 sm:p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                              <div>
                                <h6 className="text-[11px] font-semibold text-white leading-snug line-clamp-1">
                                  {media.title}
                                </h6>
                                {media.caption && (
                                  <p className="text-[10px] text-[#E6ECEB]/70 leading-relaxed line-clamp-2 mt-0.5">
                                    {media.caption}
                                  </p>
                                )}
                              </div>
                              <div className="pt-1.5 flex items-center justify-between text-[9px] text-[#D8C78E] font-medium border-t border-[#C5B378]/15 mt-1">
                                <span>{media.details?.resolution || media.details?.dimensions || 'View Sample'}</span>
                                <span className="flex items-center gap-0.5 text-white/60 group-hover:text-[#D8C78E] transition-colors">
                                  Maximize <Maximize2 className="h-2.5 w-2.5 ml-0.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explore in Lightbox Primary Action Button */}
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openLightbox(item, 0)}
                      className="w-full text-xs font-semibold border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#D8C78E] hover:text-[#061E1C] transition-colors py-2.5 h-auto min-h-[44px]"
                    >
                      <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
                      Explore All {item.media.length} Samples in High-Res Lightbox
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>

    {/* ─── Interactive Lightbox Maximize / Fullscreen Modal ─── */}
    <AnimatePresence>
      {lightboxState && (
        <CameraMediaLightboxModal
          crewItem={lightboxState.crewItem}
          initialIndex={lightboxState.mediaIndex}
          onClose={closeLightbox}
          onSelectOtherItem={(newIndex) =>
            setLightboxState((prev) => (prev ? { ...prev, mediaIndex: newIndex } : null))
          }
        />
      )}
    </AnimatePresence>
  </section>
);
}

// ═══════════════════════════════════════════════════════════════════════
// LIGHTBOX MAXIMIZE & ALBUM COVER / SPREAD / VIDEO VIEWER MODAL
// ═══════════════════════════════════════════════════════════════════════

interface CameraMediaLightboxModalProps {
  crewItem: CameraCrewDemoItem;
  initialIndex: number;
  onClose: () => void;
  onSelectOtherItem: (index: number) => void;
}

function CameraMediaLightboxModal({
  crewItem,
  initialIndex,
  onClose,
  onSelectOtherItem,
}: CameraMediaLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlayingSimulated, setIsPlayingSimulated] = useState(true);
  const [albumViewTab, setAlbumViewTab] = useState<'spread' | 'cover' | 'box'>('spread');

  const mediaList = crewItem.media;
  const currentMedia: ShowcaseMediaItem = mediaList[currentIndex] || mediaList[0];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % mediaList.length;
    setCurrentIndex(nextIdx);
    onSelectOtherItem(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + mediaList.length) % mediaList.length;
    setCurrentIndex(prevIdx);
    onSelectOtherItem(prevIdx);
  };

  const isVideo = currentMedia.type === 'video';
  const isPdfOrAlbum = currentMedia.type === 'pdf' || crewItem.id === 'printed-albums';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-sm border border-[#C5B378]/35 bg-[#072421] text-[#E6ECEB] shadow-2xl flex flex-col"
      >
        {/* ─── Modal Top Navigation Bar ─── */}
        <div className="flex items-center justify-between border-b border-[#C5B378]/20 px-4 py-3 bg-[#092E2B]/90">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <div className="h-8 w-8 rounded bg-[#C5B378]/15 border border-[#C5B378]/30 flex items-center justify-center shrink-0 text-[#D8C78E]">
              {isPdfOrAlbum ? (
                <BookOpen className="h-4 w-4" />
              ) : isVideo ? (
                <Film className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]">
                  {crewItem.enTitle}
                </span>
                <span className="text-[10px] text-[#E6ECEB]/60">•</span>
                <span className="text-[10px] text-[#D8C78E] font-medium leading-relaxed break-words">
                  {crewItem.taSubtitle}
                </span>
              </div>
              <h4 className="font-serif text-sm sm:text-base font-bold text-white break-words">
                {currentMedia.title}
              </h4>
            </div>
          </div>

          {/* Right Controls: Item Counter & Close */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-[#D8C78E] font-semibold bg-[#0E423E] border border-[#C5B378]/30 px-2 py-0.5 rounded">
              {currentIndex + 1} / {mediaList.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── Main Content Stage ─── */}
        <div className="relative flex-1 overflow-y-auto bg-black flex flex-col items-center justify-center p-3 sm:p-6 min-h-[320px] sm:min-h-[460px]">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-[#D8C78E] text-[#D8C78E] hover:text-[#061E1C] border border-[#C5B378]/30 transition-all shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Previous sample"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-[#D8C78E] text-[#D8C78E] hover:text-[#061E1C] border border-[#C5B378]/30 transition-all shadow-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Next sample"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* ═════════ MEDIA DISPLAY ═════════ */}
          {/* CASE 1: Printed Album / E-Book Spread Viewer */}
          {isPdfOrAlbum ? (
            <div className="w-full max-w-4xl space-y-4 flex flex-col items-center">
              {/* Tab Switcher for Album Demo */}
              <div className="flex items-center gap-2 bg-[#092E2B] border border-[#C5B378]/30 p-1 rounded-sm text-xs flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => setAlbumViewTab('spread')}
                  className={`px-3 py-1.5 rounded transition-colors font-semibold min-h-[38px] ${
                    albumViewTab === 'spread'
                      ? 'bg-[#D8C78E] text-[#061E1C]'
                      : 'text-[#E6ECEB]/70 hover:text-white'
                  }`}
                >
                  Panoramic Lay-Flat Spread (Seamless)
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumViewTab('cover')}
                  className={`px-3 py-1.5 rounded transition-colors font-semibold min-h-[38px] ${
                    albumViewTab === 'cover'
                      ? 'bg-[#D8C78E] text-[#061E1C]'
                      : 'text-[#E6ECEB]/70 hover:text-white'
                  }`}
                >
                  Royal Velvet Foil Cover
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumViewTab('box')}
                  className={`px-3 py-1.5 rounded transition-colors font-semibold min-h-[38px] ${
                    albumViewTab === 'box'
                      ? 'bg-[#D8C78E] text-[#061E1C]'
                      : 'text-[#E6ECEB]/70 hover:text-white'
                  }`}
                >
                  Acrylic Glass & Keepsake Box
                </button>
              </div>

              {/* Spread Viewer Display */}
              <div className="relative w-full max-w-3xl aspect-[16/10] sm:aspect-[16/9] rounded border border-[#C5B378]/30 overflow-hidden bg-[#092E2B] shadow-2xl">
                <Image
                  src={
                    albumViewTab === 'cover'
                      ? '/images/guide/album-cover-velvet.jpg'
                      : albumViewTab === 'box'
                      ? '/images/guide/album-acrylic-box.jpg'
                      : '/images/guide/album-spread-panoramic.jpg'
                  }
                  alt="Heirloom Album Presentation"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                  placeholder="blur"
                  blurDataURL={SHIMMER_BLUR_DATA_URL}
                  className="h-full w-full object-cover"
                />

                {albumViewTab === 'spread' && (
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-black/20 shadow-[0_0_12px_rgba(0,0,0,0.4)] pointer-events-none" />
                )}

                {/* Overlay Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/85 backdrop-blur-xs border border-[#C5B378]/25 p-2 rounded text-[11px]">
                  <span className="text-[#D8C78E] font-medium">
                    {albumViewTab === 'spread'
                      ? 'Panoramic Lay-Flat Spread • 100% Seamless Archival Matte Paper'
                      : albumViewTab === 'cover'
                      ? 'Handcrafted Royal Velvet with Personalized Gold Foil Calligraphy'
                      : 'Diamond Polish Acrylic Glass Cover with Handcrafted Keepsake Box'}
                  </span>
                  <span className="text-white/60 hidden sm:inline">60 Pages / 30 Spreads</span>
                </div>
              </div>
            </div>
          ) : isVideo ? (
            /* CASE 2: Video Player Simulator */
            <div className="w-full max-w-4xl space-y-3 flex flex-col items-center">
              {currentMedia.aspectRatio === '9:16' ? (
                /* 9:16 Vertical Reel Player */
                <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] rounded-2xl border-4 border-[#C5B378]/40 overflow-hidden bg-black shadow-2xl">
                  <Image
                    src={currentMedia.mediaUrl}
                    alt={currentMedia.title}
                    fill
                    priority
                    sizes="320px"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  {/* Reel Overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white">
                    <span className="inline-flex items-center gap-1 font-semibold bg-black/50 px-2 py-0.5 rounded-full border border-white/20">
                      <Smartphone className="h-3 w-3 text-[#D8C78E]" />
                      9:16 Social Reel
                    </span>
                    <span className="text-[10px] text-[#D8C78E]">Instagram & WhatsApp</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    <p className="font-serif text-sm font-bold text-white drop-shadow">
                      {currentMedia.title}
                    </p>
                    <p className="text-[11px] text-[#E6ECEB]/80 drop-shadow line-clamp-2">
                      {currentMedia.caption}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#D8C78E] pt-1 border-t border-white/20">
                      <span>4K Vertical</span>
                      <span>Music-Synced Teaser</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* 16:9 / 2.39:1 Cinema Video Player */
                <div className="relative w-full max-w-3xl aspect-[16/9] rounded border border-[#C5B378]/30 overflow-hidden bg-black shadow-2xl">
                  <Image
                    src={currentMedia.mediaUrl}
                    alt={currentMedia.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 800px"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    className="h-full w-full object-cover"
                  />

                  {/* 2.39:1 Letterbox Bar simulation */}
                  {currentMedia.aspectRatio === '2.39:1' && (
                    <>
                      <div className="absolute top-0 inset-x-0 h-[8%] bg-black" />
                      <div className="absolute bottom-0 inset-x-0 h-[8%] bg-black" />
                    </>
                  )}

                  {/* Cinema Specs Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/70 text-[#D8C78E] border border-[#C5B378]/30 text-[10px] font-bold">
                      {currentMedia.details?.resolution || 'Cinema 4K'}
                    </span>
                    {currentMedia.details?.fps && (
                      <span className="px-2 py-0.5 rounded bg-black/70 text-white/80 border border-white/20 text-[10px]">
                        {currentMedia.details.fps}
                      </span>
                    )}
                  </div>

                  {/* Play / Pause Toggle Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setIsPlayingSimulated((prev) => !prev)}
                      className="h-14 w-14 rounded-full bg-[#D8C78E]/90 hover:bg-[#D8C78E] text-[#061E1C] flex items-center justify-center shadow-xl hover:scale-105 transition-all min-w-[56px] min-h-[56px]"
                      aria-label={isPlayingSimulated ? 'Pause preview' : 'Play preview'}
                    >
                      {isPlayingSimulated ? (
                        <Pause className="h-6 w-6 fill-current" />
                      ) : (
                        <Play className="h-6 w-6 fill-current ml-1" />
                      )}
                    </button>
                  </div>

                  {/* Bottom Video Progress Simulation */}
                  <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-xs border border-[#C5B378]/25 p-2 rounded text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-[#D8C78E]">
                      <span className="font-semibold">{currentMedia.title}</span>
                      <span>{currentMedia.details?.timecode || '02:30 / 03:45'}</span>
                    </div>
                    {/* Simulated Timeline Bar */}
                    <div className="w-full h-1 bg-white/20 rounded overflow-hidden">
                      <div className="h-full bg-[#D8C78E] w-2/3" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CASE 3: Standard High-Res Image View */
            <div className="relative w-full max-w-4xl h-[60vh] sm:h-[70vh] flex items-center justify-center">
              <Image
                src={currentMedia.mediaUrl}
                alt={currentMedia.title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR_DATA_URL}
                className="h-full w-full object-contain rounded border border-[#C5B378]/30 shadow-2xl"
              />
            </div>
          )}
        </div>

        {/* ─── Modal Bottom Details & Thumbnails Strip ─── */}
        <div className="border-t border-[#C5B378]/20 p-4 bg-[#092E2B]/95 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs text-[#E6ECEB]/90 font-medium leading-relaxed">
                {currentMedia.caption || crewItem.shortTagline}
              </p>
              {currentMedia.details?.deliveryFormat && (
                <p className="text-[10px] text-[#D8C78E] mt-0.5">
                  Delivery: {currentMedia.details.deliveryFormat}
                </p>
              )}
            </div>

            {/* Quick Action Button */}
            {isPdfOrAlbum && (
              <a
                href="/images/guide/album-spread-panoramic.jpg"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#D8C78E] text-[#061E1C] font-semibold text-xs hover:bg-[#F4E8C1] transition-colors self-start sm:self-auto shrink-0 min-h-[36px]"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View Full-Res Spread</span>
              </a>
            )}
          </div>

          {/* Thumbnails Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {mediaList.map((m, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    onSelectOtherItem(idx);
                  }}
                  className={`group relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 rounded overflow-hidden border transition-all ${
                    isSelected
                      ? 'border-[#D8C78E] ring-2 ring-[#D8C78E] scale-105'
                      : 'border-[#C5B378]/25 opacity-60 hover:opacity-100 hover:border-[#D8C78E]/60'
                  }`}
                >
                  <Image
                    src={m.thumbnailUrl}
                    alt={m.title}
                    fill
                    sizes="96px"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent" />
                  <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[8px] font-bold text-center text-white bg-black/70 px-0.5 rounded truncate">
                    {m.type === 'pdf' ? 'Album Spread' : m.type === 'video' ? 'Video' : 'Photo'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
