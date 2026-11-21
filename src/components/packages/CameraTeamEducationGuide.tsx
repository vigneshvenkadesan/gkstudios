'use client';

import React, { useState } from 'react';
import {
  Camera,
  Film,
  Sparkles,
  Eye,
  X,
  Play,
  Pause,
  Tv,
  CheckCircle2,
  Sliders,
  Volume2,
  Smartphone,
  Maximize2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CAMERA_TEAM_GUIDES, CameraTeamMemberGuide } from '@/src/config/cameraGuide';
import { Button } from '@/src/components/ui/button';

export function CameraTeamEducationGuide() {
  const [activeModalGuide, setActiveModalGuide] = useState<CameraTeamMemberGuide | null>(null);

  // Interactive Photo Comparison Mode: 'traditional' vs 'candid'
  const [photoComparisonTab, setPhotoComparisonTab] = useState<'traditional' | 'candid'>('candid');

  // Interactive Video Player Simulator State
  const [videoMode, setVideoMode] = useState<'cinema' | 'traditional'>('cinema');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isVerticalReel, setIsVerticalReel] = useState(false);

  const traditionalGuide = CAMERA_TEAM_GUIDES.find((g) => g.id === 'traditional-photo')!;
  const candidGuide = CAMERA_TEAM_GUIDES.find((g) => g.id === 'candid-photo')!;

  return (
    <div className="space-y-12">
      {/* ─── Header: Eyebrow & Title ─── */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C5B378]/15 border border-[#C5B378]/35 px-3 py-1 text-xs font-semibold text-[#D8C78E]">
          <Sparkles className="h-3.5 w-3.5 text-[#D8C78E]" />
          <span>Visual Education & Crew Guide</span>
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">
          Understand Your Camera Team — How Each Element Lights Up Your Event
        </h3>
        <p className="text-sm text-[#E6ECEB]/75 max-w-3xl leading-relaxed">
          Photography terms can feel confusing. Explore our visual side-by-side comparisons below to see the exact difference between Traditional vs. Candid, and full ceremony documentary video vs. cinematic Reels.
        </p>
      </div>

      {/* ─── INTERACTIVE MODULE 1: Traditional vs Candid Photography Visual Comparison ─── */}
      <div className="rounded-sm border border-[#C5B378]/30 bg-gradient-to-br from-[#0E423E] via-[#092E2B] to-[#072421] p-6 sm:p-8 space-y-6 shadow-[0_12px_36px_rgba(4,20,18,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C5B378]/20 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8C78E]">
              Interactive Photo Style Comparison
            </span>
            <h4 className="font-serif text-2xl font-semibold text-white">
              Traditional Stage Photography vs. Candid Storytelling
            </h4>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center gap-1.5 rounded-full bg-[#061E1C] border border-[#C5B378]/30 p-1 self-start sm:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setPhotoComparisonTab('traditional')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                photoComparisonTab === 'traditional'
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow'
                  : 'text-[#E6ECEB]/70 hover:text-white'
              }`}
            >
              Traditional (Stage & Guests)
            </button>
            <button
              type="button"
              onClick={() => setPhotoComparisonTab('candid')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                photoComparisonTab === 'candid'
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow'
                  : 'text-[#E6ECEB]/70 hover:text-white'
              }`}
            >
              Candid (Emotions & Art)
            </button>
          </div>
        </div>

        {/* Side-by-Side Visual Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Traditional Photo */}
          <div
            className={`rounded-sm border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ${
              photoComparisonTab === 'traditional'
                ? 'border-[#D8C78E] bg-[#114A45]/80 ring-2 ring-[#D8C78E]/40 shadow-[0_8px_30px_rgba(216,199,142,0.2)]'
                : 'border-[#C5B378]/25 bg-[#061E1C]/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="space-y-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-[#041513] border border-[#C5B378]/25">
                <img
                  src={traditionalGuide.previewImage}
                  alt="Traditional Stage Group Photo"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="rounded-full bg-[#072421]/90 border border-[#C5B378]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#D8C78E] uppercase tracking-wider backdrop-blur-sm shadow">
                    Traditional Photo
                  </span>
                </div>
                <div className="absolute bottom-2.5 right-2.5">
                  <span className="rounded-sm bg-black/75 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-400/30">
                    Flash TTL · 24-70mm f/8
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h5 className="font-serif text-lg font-semibold text-white">
                  Every Guest, Stage Ritual & Elder Blessing
                </h5>
                <p className="text-xs text-[#E6ECEB]/80 leading-relaxed">
                  Clean, bright, even flash lighting where everyone looks at the camera. Guaranteed sharpness from the first row to the back row.
                </p>
              </div>

              <ul className="text-xs text-[#E6ECEB]/75 space-y-1.5 pt-1">
                {traditionalGuide.keyDifferences.map((diff, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#D8C78E] shrink-0 mt-0.5" />
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-[#C5B378]/15 mt-4 text-[11px] text-[#D8C78E] font-medium">
              💡 Essential for: Physical heirloom albums & identifying every attending relative.
            </div>
          </div>

          {/* Card 2: Candid Photo */}
          <div
            className={`rounded-sm border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ${
              photoComparisonTab === 'candid'
                ? 'border-[#D8C78E] bg-[#114A45]/80 ring-2 ring-[#D8C78E]/40 shadow-[0_8px_30px_rgba(216,199,142,0.2)]'
                : 'border-[#C5B378]/25 bg-[#061E1C]/60 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="space-y-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-[#041513] border border-[#C5B378]/25">
                <img
                  src={candidGuide.previewImage}
                  alt="Candid Emotional Bride Portrait"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="rounded-full bg-gradient-to-r from-[#C5B378] to-[#D8C78E] px-2.5 py-0.5 text-[10px] font-bold text-[#061E1C] uppercase tracking-wider shadow">
                    Candid Storytelling
                  </span>
                </div>
                <div className="absolute bottom-2.5 right-2.5">
                  <span className="rounded-sm bg-black/75 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-400/30">
                    Natural Light · 85mm f/1.4 Bokeh
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h5 className="font-serif text-lg font-semibold text-white">
                  Unscripted Tears, Laughter & Magazine Portraits
                </h5>
                <p className="text-xs text-[#E6ECEB]/80 leading-relaxed">
                  Captured without posing or interrupting the rituals. Creamy bokeh background blur, golden warm tones, and genuine human emotion.
                </p>
              </div>

              <ul className="text-xs text-[#E6ECEB]/75 space-y-1.5 pt-1">
                {candidGuide.keyDifferences.map((diff, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#D8C78E] shrink-0 mt-0.5" />
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-[#C5B378]/15 mt-4 text-[11px] text-[#D8C78E] font-medium">
              💡 Essential for: Living room wall canvas enlargements, Instagram & album hero covers.
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE MODULE 2: Video Comparison (Traditional vs Candid Cinematography & Reels) ─── */}
      <div className="rounded-sm border border-[#C5B378]/30 bg-[#0E423E] p-6 sm:p-8 space-y-6 shadow-[0_12px_36px_rgba(4,20,18,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C5B378]/20 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8C78E]">
              Interactive Video Style Player
            </span>
            <h4 className="font-serif text-2xl font-semibold text-white">
              Traditional Full Ceremony Video vs. 4K Cinematic Teaser & Reels
            </h4>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-[#061E1C] border border-[#C5B378]/30 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setVideoMode('cinema');
                setIsVerticalReel(false);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                videoMode === 'cinema' && !isVerticalReel
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow'
                  : 'text-[#E6ECEB]/70 hover:text-white'
              }`}
            >
              4K Cinema Highlight (2.39:1)
            </button>
            <button
              type="button"
              onClick={() => {
                setVideoMode('cinema');
                setIsVerticalReel(true);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                videoMode === 'cinema' && isVerticalReel
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow'
                  : 'text-[#E6ECEB]/70 hover:text-white'
              }`}
            >
              9:16 Instagram Reel
            </button>
            <button
              type="button"
              onClick={() => {
                setVideoMode('traditional');
                setIsVerticalReel(false);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                videoMode === 'traditional'
                  ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow'
                  : 'text-[#E6ECEB]/70 hover:text-white'
              }`}
            >
              Traditional Archive (16:9)
            </button>
          </div>
        </div>

        {/* Video Player Simulator Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Player Screen Mockup (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div
              className={`relative overflow-hidden rounded-sm bg-[#041513] border-2 border-[#C5B378]/40 shadow-[0_16px_40px_rgba(0,0,0,0.7)] transition-all duration-300 w-full ${
                isVerticalReel
                  ? 'max-w-[280px] aspect-[9/16]'
                  : videoMode === 'cinema'
                  ? 'aspect-[21/9]'
                  : 'aspect-[16/9]'
              }`}
            >
              <img
                src={
                  videoMode === 'cinema'
                    ? candidGuide.previewImage
                    : '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg'
                }
                alt="Video Simulation Preview"
                className="h-full w-full object-cover transition-transform duration-700 ease-out"
              />

              {/* Cinematic Letterbox Bars */}
              {videoMode === 'cinema' && !isVerticalReel && (
                <>
                  <div className="absolute top-0 inset-x-0 h-4 bg-black/80" />
                  <div className="absolute bottom-0 inset-x-0 h-4 bg-black/80" />
                </>
              )}

              {/* Ambient Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

              {/* Top Camera HUD */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between text-[11px] font-mono text-white/90">
                <span className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  {videoMode === 'cinema' ? '4K 120FPS SLOW-MO' : 'FULL HD 1080P'}
                </span>
                <span className="bg-black/60 px-2 py-0.5 rounded border border-white/20">
                  {videoMode === 'cinema' ? 'CINEMA LOG' : 'BROADCAST REC'}
                </span>
              </div>

              {/* Center Play Button Simulator */}
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="absolute inset-0 flex items-center justify-center group"
                aria-label="Toggle Play Simulator"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#061E1C]/80 border-2 border-[#D8C78E] text-[#D8C78E] group-hover:scale-110 group-hover:bg-[#061E1C] transition-all shadow-[0_0_24px_rgba(216,199,142,0.4)]">
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current ml-1" />
                  )}
                </div>
              </button>

              {/* Bottom Video Progress & Sound wave Info */}
              <div className="absolute bottom-3 inset-x-3 space-y-1.5 text-xs text-white">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#F4E8C1] truncate max-w-[200px]">
                    {videoMode === 'cinema'
                      ? isVerticalReel
                        ? '60s Instagram Reel · Music Cut'
                        : '4K Cinema Teaser (3–5 Mins)'
                      : 'Ceremony Archive (Full 2.5 Hrs)'}
                  </span>
                  <span className="font-mono text-white/70">
                    {videoMode === 'cinema' ? '02:45 / 04:12' : '01:24:18'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D8C78E] transition-all duration-300"
                    style={{ width: videoMode === 'cinema' ? '65%' : '40%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Video Description & Audio Guidance (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-xs text-[#E6ECEB]/85">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#D8C78E] tracking-wider">
                {videoMode === 'cinema'
                  ? isVerticalReel
                    ? '📱 Social Media Ready'
                    : '🎬 Cinema Production'
                  : '📼 Archival Documentation'}
              </span>
              <h5 className="font-serif text-xl font-bold text-white">
                {videoMode === 'cinema'
                  ? isVerticalReel
                    ? 'Vertical 9:16 Reels for Instagram & WhatsApp'
                    : 'Cinematic Teaser & Highlight Film'
                  : 'Traditional Full Ceremony Video Archive'}
              </h5>
            </div>

            <p className="leading-relaxed">
              {videoMode === 'cinema'
                ? 'Filmed on 3-axis motorized Ronin gimbals with 4K 120fps slow-motion cameras. Edited to curated music with heartfelt vows, poetic rhythm, and color grading styled like high-budget movie trailers.'
                : 'Continuous documentary recording capturing every single mantra, elder speech, kanyadaanam, and welcoming ritual in crystal clear Full HD with directional audio.'}
            </p>

            <div className="rounded-sm bg-[#061E1C]/70 border border-[#C5B378]/20 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Volume2 className="h-4 w-4 text-[#D8C78E]" />
                <span>Audio Mixing Experience:</span>
              </div>
              <p className="text-[11px] text-[#E6ECEB]/75 leading-relaxed">
                {videoMode === 'cinema'
                  ? 'Emotive instrumental score layered with real-time vows, priest chants, and laughter.'
                  : 'Live wireless lapel microphones on the groom & priest capturing full sacred Sanskrit / Tamil mantras.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#D8C78E]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {videoMode === 'cinema'
                  ? 'Included in Signature & Royal packages; available as an add-on.'
                  : 'Standard in all multi-camera ceremony bookings.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODULE 3: 6-Element Crew Cards Grid ─── */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="font-serif text-xl sm:text-2xl font-semibold text-white">
            All 6 Photography & Video Elements Explained
          </h4>
          <p className="text-xs text-[#E6ECEB]/70">
            Click on any card to see camera setups, visual samples, and styling differences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAMERA_TEAM_GUIDES.map((guide) => {
            return (
              <motion.div
                key={guide.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="group flex flex-col justify-between overflow-hidden rounded-sm border border-[#C5B378]/25 bg-[#092E2B] transition-all duration-300 hover:border-[#D8C78E]/60 hover:bg-[#0E423E]/90 hover:shadow-[0_12px_32px_rgba(4,20,18,0.35)]"
              >
                {/* Image Preview with Sample Badge */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#041513]">
                  <img
                    src={guide.previewImage}
                    alt={guide.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#092E2B] via-transparent to-black/30" />

                  <div className="absolute top-2.5 right-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#072421]/90 border border-[#C5B378]/40 px-2.5 py-0.5 text-[10px] font-semibold text-[#D8C78E] backdrop-blur-sm shadow">
                      {guide.tagline}
                    </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-serif text-xl font-semibold text-white group-hover:text-[#F4E8C1] transition-colors">
                      {guide.title}
                    </h4>
                    {guide.tamilTitle && (
                      <p className="text-xs text-[#D8C78E] font-medium leading-snug">
                        {guide.tamilTitle}
                      </p>
                    )}
                    <p className="text-xs text-[#E6ECEB]/80 leading-relaxed pt-1">
                      <strong className="text-[#D8C78E] font-semibold">How it lights up your event: </strong>
                      {guide.howItLightsUp}
                    </p>
                  </div>

                  {/* Best For Tag & Preview Trigger */}
                  <div className="pt-3 border-t border-[#C5B378]/15 space-y-3">
                    <p className="text-[11px] text-[#E6ECEB]/65">
                      <strong className="text-white">Best for:</strong> {guide.bestFor}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveModalGuide(guide)}
                      className="w-full gap-2 border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#C5B378]/15 hover:text-white text-xs h-9"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>See Visual Sample & Difference</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Detailed Sample Modal with Paired Counterparts ─── */}
      <AnimatePresence>
        {activeModalGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-sm border border-[#C5B378]/35 bg-[#072421] text-[#E6ECEB] shadow-[0_24px_60px_rgba(0,0,0,0.8)] my-8"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-[#C5B378] via-[#D8C78E] to-[#F4E8C1]" />

              <button
                type="button"
                onClick={() => setActiveModalGuide(null)}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#0E423E]/80 border border-[#C5B378]/30 text-[#E6ECEB]/70 hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="space-y-1.5 pr-8">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E]">
                    Visual Element Spotlight
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                    {activeModalGuide.title}
                  </h3>
                  <p className="text-xs text-[#D8C78E] font-medium">
                    {activeModalGuide.tamilTitle}
                  </p>
                </div>

                {/* Hero Sample Photo */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-[#C5B378]/30 bg-[#041513]">
                  <img
                    src={activeModalGuide.previewImage}
                    alt={activeModalGuide.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-xs text-white/90">
                    <p className="font-medium text-[#F4E8C1]">{activeModalGuide.tagline}</p>
                    <p className="text-[11px] text-white/70">{activeModalGuide.bestFor}</p>
                  </div>
                </div>

                {/* Why It Is Essential */}
                <div className="rounded-sm bg-[#0E423E]/80 border border-[#C5B378]/25 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    How It Elevates Your Event
                  </h4>
                  <p className="text-xs sm:text-sm text-white leading-relaxed">
                    {activeModalGuide.howItLightsUp}
                  </p>
                </div>

                {/* Key Bullet Differences */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E] block">
                    Distinguishing Characteristics:
                  </span>
                  <ul className="text-xs text-[#E6ECEB]/85 space-y-1.5 pl-1">
                    {activeModalGuide.keyDifferences.map((k, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#D8C78E] shrink-0 mt-0.5" />
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technical / Gear Spotlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-sm bg-[#061E1C] border border-[#C5B378]/20 p-3.5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#D8C78E]">
                      Camera & Lens Setup
                    </span>
                    <p className="text-white font-medium">{activeModalGuide.gearUsed}</p>
                  </div>

                  {activeModalGuide.comparisonNote && (
                    <div className="rounded-sm bg-[#061E1C] border border-[#C5B378]/20 p-3.5 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#D8C78E]">
                        Style Distinction
                      </span>
                      <p className="text-white/85">{activeModalGuide.comparisonNote}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveModalGuide(null)}
                    className="bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold text-xs px-6"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
