'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Video,
  Download,
  CheckCircle2,
  Layers,
  Volume2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CAMERA_CREW_DEMO_ITEMS,
  CameraCrewDemoItem,
  ShowcaseMediaItem,
} from '@/src/config/cameraDemoShowcase';
import { Button } from '@/src/components/ui/button';

interface CameraDemoShowcaseSectionProps {
  className?: string;
  defaultExpandedId?: string | null;
  title?: string;
  subtitle?: string;
}

export function CameraDemoShowcaseSection({
  className = '',
  defaultExpandedId = null,
  title = 'Camera Styles, Crew & Heirloom Albums',
  subtitle = 'Tap any element to explore multiple sample photos, cinema videos & album spreads',
}: CameraDemoShowcaseSectionProps) {
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
    <section className={`space-y-4 ${className}`}>
      {/* ─── Header: Minimal Visual First ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C5B378]/20 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
            <Camera className="h-3.5 w-3.5 text-[#D8C78E]" />
            <span>{title}</span>
          </div>
          <p className="text-[11px] text-[#E6ECEB]/70 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#C5B378]/15 text-[#D8C78E] border border-[#C5B378]/30">
            8 Styles • 24 Visual Samples
          </span>
        </div>
      </div>

      {/* ─── Collapsible Grid: 8 Camera & Crew Styles (Collapsed by Default) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              {/* ─── Compact Header Card (Always Visible) ─── */}
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
                className="w-full text-left p-3.5 cursor-pointer select-none space-y-2.5 transition-colors"
              >
                {/* Media Thumbnail + Badge Row */}
                <div className="relative aspect-[16/10] w-full rounded-sm overflow-hidden border border-[#C5B378]/25 bg-black">
                  <img
                    src={firstMedia?.thumbnailUrl || '/images/guide/traditional-photo-stage.jpg'}
                    alt={item.enTitle}
                    className="h-full w-full object-cover transform hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C5B378] text-[#061E1C] shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/60 text-[#D8C78E] border border-[#C5B378]/30 backdrop-blur-xs">
                      <Layers className="h-2.5 w-2.5" />
                      {item.media.length} Samples
                    </span>
                  </div>

                  {/* Bottom Tagline on Image */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10px] font-medium text-[#E6ECEB]/90 drop-shadow truncate">
                      {item.shortTagline}
                    </p>
                  </div>
                </div>

                {/* Title & Tamil Subtitle + Chevron */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="font-serif text-sm font-bold text-white truncate">
                      {item.enTitle}
                    </h5>
                    <p className="text-[11px] text-[#D8C78E] font-medium leading-tight truncate">
                      {item.taSubtitle}
                    </p>
                  </div>
                  <div className="shrink-0 p-1 rounded bg-[#0E423E]/60 text-[#D8C78E] border border-[#C5B378]/20">
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
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
                    className="border-t border-[#C5B378]/20 p-3.5 space-y-3 bg-[#072421]/90"
                  >
                    {/* Collapsed/Expanded Description */}
                    <p className="text-xs text-[#E6ECEB]/85 leading-relaxed">
                      {item.description}
                    </p>

                    {item.gearUsed && (
                      <div className="text-[10px] text-[#D8C78E]/90 bg-[#0E423E]/50 border border-[#C5B378]/20 p-2 rounded">
                        <strong className="text-white block mb-0.5">Studio Gear:</strong>
                        {item.gearUsed}
                      </div>
                    )}

                    {/* Multi-Media Gallery Strip: 3 Samples */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]">
                          Visual Samples (Tap to Maximize)
                        </span>
                        <span className="text-[9px] text-[#E6ECEB]/60">3 Items</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {item.media.map((media, idx) => {
                          const isVideo = media.type === 'video';
                          const isPdf = media.type === 'pdf';

                          return (
                            <button
                              key={media.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(item, idx);
                              }}
                              className="group relative aspect-square rounded overflow-hidden border border-[#C5B378]/25 bg-black hover:border-[#D8C78E] transition-all"
                            >
                              <img
                                src={media.thumbnailUrl}
                                alt={media.title}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />

                              {/* Overlay Indicator */}
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                {isVideo ? (
                                  <div className="h-6 w-6 rounded-full bg-[#D8C78E]/90 text-[#061E1C] flex items-center justify-center shadow">
                                    <Play className="h-3 w-3 fill-current ml-0.5" />
                                  </div>
                                ) : isPdf ? (
                                  <div className="h-6 w-6 rounded-full bg-[#0E423E]/90 text-[#D8C78E] flex items-center justify-center border border-[#C5B378]/40 shadow">
                                    <BookOpen className="h-3 w-3" />
                                  </div>
                                ) : (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full bg-black/70 text-[#D8C78E] flex items-center justify-center">
                                    <Maximize2 className="h-3 w-3" />
                                  </div>
                                )}
                              </div>

                              {/* Type Label Tag */}
                              <div className="absolute bottom-1 left-1 right-1">
                                <span className="block text-[8px] font-bold text-center uppercase tracking-tight text-white bg-black/75 px-1 py-0.5 rounded truncate">
                                  {isPdf ? 'E-Book / PDF' : isVideo ? 'Cinema 4K' : 'Photo'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Lightbox Action Button */}
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLightbox(item, 0)}
                        className="w-full text-xs font-semibold border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#D8C78E] hover:text-[#061E1C] transition-colors py-1.5 h-auto"
                      >
                        <Maximize2 className="h-3 w-3 mr-1" />
                        Explore Samples in Lightbox
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]">
                  {crewItem.enTitle}
                </span>
                <span className="text-[10px] text-[#E6ECEB]/60">•</span>
                <span className="text-[10px] text-[#D8C78E] font-medium truncate">
                  {crewItem.taSubtitle}
                </span>
              </div>
              <h4 className="font-serif text-sm sm:text-base font-bold text-white truncate">
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
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
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
            className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-[#D8C78E] text-[#D8C78E] hover:text-[#061E1C] border border-[#C5B378]/30 transition-all shadow-lg"
            aria-label="Previous sample"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-[#D8C78E] text-[#D8C78E] hover:text-[#061E1C] border border-[#C5B378]/30 transition-all shadow-lg"
            aria-label="Next sample"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* ═════════ MEDIA DISPLAY ═════════ */}
          {/* CASE 1: Printed Album / E-Book Spread Viewer */}
          {isPdfOrAlbum ? (
            <div className="w-full max-w-4xl space-y-4 flex flex-col items-center">
              {/* Tab Switcher for Album Demo */}
              <div className="flex items-center gap-2 bg-[#092E2B] border border-[#C5B378]/30 p-1 rounded-sm text-xs">
                <button
                  type="button"
                  onClick={() => setAlbumViewTab('spread')}
                  className={`px-3 py-1 rounded transition-colors font-semibold ${
                    albumViewTab === 'spread'
                      ? 'bg-[#D8C78E] text-[#061E1C]'
                      : 'text-[#E6ECEB]/70 hover:text-white'
                  }`}
                >
                  18×24 Lay-Flat Spread (Seamless)
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumViewTab('cover')}
                  className={`px-3 py-1 rounded transition-colors font-semibold ${
                    albumViewTab === 'cover'
                      ? 'bg-[#D8C78E] text-[#061E1C]'
                      : 'text-[#E6ECEB]/70 hover:text-white'
                  }`}
                >
                  Velvet Foil Cover
                </button>
                <button
                  type="button"
                  onClick={() => setAlbumViewTab('box')}
                  className={`px-3 py-1 rounded transition-colors font-semibold ${
                    albumViewTab === 'box'
                      ? 'bg-[#D8C78E] text-[#061E1C]'
                      : 'text-[#E6ECEB]/70 hover:text-white'
                  }`}
                >
                  Acrylic Glass & Box
                </button>
              </div>

              {/* Spread Viewer Display */}
              <div className="relative w-full max-w-3xl aspect-[16/10] sm:aspect-[16/9] rounded border border-[#C5B378]/30 overflow-hidden bg-[#092E2B] shadow-2xl">
                <img
                  src={
                    albumViewTab === 'cover'
                      ? '/images/guide/album-cover-velvet.jpg'
                      : albumViewTab === 'box'
                      ? '/images/guide/album-acrylic-box.jpg'
                      : '/images/guide/album-spread-panoramic.jpg'
                  }
                  alt="Heirloom Album Presentation"
                  className="h-full w-full object-cover"
                />

                {albumViewTab === 'spread' && (
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-black/20 shadow-[0_0_12px_rgba(0,0,0,0.4)] pointer-events-none" />
                )}

                {/* Overlay Badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/80 backdrop-blur-xs border border-[#C5B378]/25 p-2 rounded text-[11px]">
                  <span className="text-[#D8C78E] font-medium">
                    {albumViewTab === 'spread'
                      ? 'Panoramic 18×24 Lay-Flat Spread • 100% Seamless Archival Matte Paper'
                      : albumViewTab === 'cover'
                      ? 'Handcrafted Velvet with Gold Foil Personalized Typography'
                      : 'Diamond Polish Acrylic Glass Cover with Walnut Presentation Box'}
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
                  <img
                    src={currentMedia.mediaUrl}
                    alt={currentMedia.title}
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
                      <span>4K Vertical 60fps</span>
                      <span>Audio Teaser Sync</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* 16:9 / 2.39:1 Cinema Video Player */
                <div className="relative w-full max-w-3xl aspect-[16/9] rounded border border-[#C5B378]/30 overflow-hidden bg-black shadow-2xl">
                  <img
                    src={currentMedia.mediaUrl}
                    alt={currentMedia.title}
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
                      {currentMedia.details?.resolution || 'Cinema 4K UHD'}
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
                      className="h-14 w-14 rounded-full bg-[#D8C78E]/90 hover:bg-[#D8C78E] text-[#061E1C] flex items-center justify-center shadow-xl hover:scale-105 transition-all"
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
            <div className="relative max-w-4xl max-h-[60vh] sm:max-h-[70vh] flex items-center justify-center">
              <img
                src={currentMedia.mediaUrl}
                alt={currentMedia.title}
                className="max-h-[60vh] sm:max-h-[70vh] w-auto max-w-full object-contain rounded border border-[#C5B378]/30 shadow-2xl"
              />
            </div>
          )}
        </div>

        {/* ─── Modal Bottom Details & Thumbnails Strip ─── */}
        <div className="border-t border-[#C5B378]/20 p-4 bg-[#092E2B]/95 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs text-[#E6ECEB]/90 font-medium">
                {currentMedia.caption || crewItem.shortTagline}
              </p>
              {currentMedia.details?.deliveryFormat && (
                <p className="text-[10px] text-[#D8C78E] mt-0.5">
                  Delivery format: {currentMedia.details.deliveryFormat}
                </p>
              )}
            </div>

            {/* Quick Action Button */}
            {isPdfOrAlbum && (
              <a
                href="/images/guide/album-spread-panoramic.jpg"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#D8C78E] text-[#061E1C] font-semibold text-xs hover:bg-[#F4E8C1] transition-colors self-start sm:self-auto shrink-0"
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
                  <img src={m.thumbnailUrl} alt={m.title} className="h-full w-full object-cover" />
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
