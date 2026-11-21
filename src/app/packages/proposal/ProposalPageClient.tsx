'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Check,
  Plus,
  Minus,
  Sparkles,
  Camera,
  BookOpen,
  Film,
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  LayoutGrid,
  Star,
  ShieldCheck,
  Crown,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  HelpCircle,
  Eye,
  X,
  Clock,
  HardDriveDownload,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { useEvents } from '@/src/hooks/useEvents';
import { PackageDeliverables, StudioPackage } from '@/src/types/studio';
import { PROPOSAL_ADDONS, ProposalAddon } from '@/src/config/packageAddons';
import { CAMERA_TEAM_GUIDES, CameraTeamMemberGuide } from '@/src/config/cameraGuide';
import { buildWhatsAppUrl, formatINR, toISODate } from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { Button } from '@/src/components/ui/button';

function parseDeliverables(
  deliverables: PackageDeliverables | string[] | undefined | null
): { category: string; text: string }[] {
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

export function ProposalPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { packages, submitBooking } = useStudio();
  const { activeEvents } = useEvents();

  // URL Query Params: ?event=<id>&plan=<single|half|full>&guests=<intimate|classic|grand>&tier=<2|3>&addons=<id1,id2>
  const eventIdParam = searchParams.get('event') || 'wedding';
  const planParam = searchParams.get('plan') || 'half';
  const guestsParam = searchParams.get('guests') || 'classic';
  const tierParam = parseInt(searchParams.get('tier') || '2', 10);
  const initialAddonsParam = searchParams.get('addons')
    ? searchParams.get('addons')!.split(',').filter(Boolean)
    : [];

  // Active custom add-ons state
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(initialAddonsParam);

  // Accordion open states (Camera styles EXPANDED by default as requested)
  const [isVisualGuideOpen, setIsVisualGuideOpen] = useState(true);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(false);
  const [isSlaAccordionOpen, setIsSlaAccordionOpen] = useState(false);
  const [isCompareTiersOpen, setIsCompareTiersOpen] = useState(false);
  const [isPolicyAccordionOpen, setIsPolicyAccordionOpen] = useState(false);

  // Active modal for single camera pill preview
  const [activePillModal, setActivePillModal] = useState<CameraTeamMemberGuide | null>(null);

  // Tooltip helper state for add-on info
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Drawer / Order Modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Booking Form State
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const today = toISODate(new Date());
    return today > '2026-11-28' ? today : '2026-11-28';
  });
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Active Event Object
  const currentEvent = useMemo(() => {
    return (
      activeEvents.find((e) => e.id === eventIdParam) ||
      activeEvents.find((e) => e.id === 'wedding') ||
      activeEvents[0]
    );
  }, [activeEvents, eventIdParam]);

  // Packages for this event
  const eventPackages = useMemo(() => {
    return packages
      .filter((p) => (p.status ?? 'active') === 'active' && p.displayOnPortfolio !== false)
      .filter((p) => (p.eventId || 'wedding') === (currentEvent?.id || 'wedding'))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages, currentEvent]);

  // Recommended base package matching tierParam (2 = Signature, 3 = Premium)
  const basePackage = useMemo(() => {
    if (eventPackages.length === 0) return null;

    let targetOrder = tierParam === 3 ? 3 : 2;
    let match = eventPackages.find((p) => p.sortOrder === targetOrder);

    if (!match) {
      if (targetOrder === 3) {
        match = eventPackages[eventPackages.length - 1];
      } else {
        match = eventPackages.find((p) => p.highlighted) || eventPackages[0];
      }
    }
    return match || eventPackages[0];
  }, [eventPackages, tierParam]);

  // Available add-ons for the recommended package
  const availableAddons = useMemo(() => {
    if (basePackage?.customizer?.addons && basePackage.customizer.addons.length > 0) {
      return basePackage.customizer.addons.map((addon) => {
        const isDowngrade = addon.type === 'downgrade' || addon.priceDelta < 0;
        return {
          id: addon.id,
          shortTitle: addon.label,
          name: addon.label,
          badge: addon.priceDelta > 0 ? `+${formatINR(addon.priceDelta)}` : formatINR(addon.priceDelta),
          priceDelta: addon.priceDelta,
          type: (isDowngrade ? 'remove' : 'add') as 'add' | 'remove',
          description: isDowngrade
            ? 'Digital-only / cost reduction option without physical printing.'
            : `Add ${addon.label} to your package.`,
        };
      });
    }

    if (!basePackage) return PROPOSAL_ADDONS;
    return PROPOSAL_ADDONS.filter((addon) => {
      if (!addon.applicableIf) return true;
      return addon.applicableIf(basePackage);
    });
  }, [basePackage]);

  // Active Addon Objects & Dynamic Pricing Calculation
  const { activeAddonsList, totalDelta, finalPrice } = useMemo(() => {
    const active = availableAddons.filter((a) => selectedAddonIds.includes(a.id));
    const delta = active.reduce((sum, curr) => sum + curr.priceDelta, 0);
    const base = basePackage?.price || 0;
    return {
      activeAddonsList: active,
      totalDelta: delta,
      finalPrice: Math.max(0, base + delta),
    };
  }, [availableAddons, selectedAddonIds, basePackage?.price]);

  // Sync active add-ons to URL for shareability
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => {
      const next = prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId];
      const url = new URL(window.location.href);
      if (next.length > 0) {
        url.searchParams.set('addons', next.join(','));
      } else {
        url.searchParams.delete('addons');
      }
      window.history.replaceState({}, '', url.toString());
      return next;
    });
  };

  // Copy shareable proposal link
  const handleShareLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied! Ready to share with family.');
    } else {
      toast.info('Share URL: ' + url);
    }
  };

  // Short Human-readable labels
  const planShortLabel =
    planParam === 'single'
      ? 'Single Session (4h)'
      : planParam === 'full'
      ? 'Full-Day (1.5–2d)'
      : 'Half-Day (5–6h)';

  const guestsShortLabel =
    guestsParam === 'intimate'
      ? '< 100 Guests'
      : guestsParam === 'grand'
      ? '300+ Guests'
      : '100–300 Guests';

  // Build WhatsApp payload
  const buildWhatsAppMessage = () => {
    const lines = [
      `Vanakkam GK Studios! 📸`,
      `Here is our tailored proposal for our celebration:`,
      ``,
      `✨ Event: ${currentEvent?.name || 'Celebration'}${
        currentEvent?.tamilName ? ` (${currentEvent.tamilName})` : ''
      }`,
      `⏱️ Plan: ${planShortLabel} • ${guestsShortLabel}`,
      `📦 Base Tier: ${basePackage?.name || 'Custom Plan'} (${formatINR(basePackage?.price || 0)})`,
    ];

    if (activeAddonsList.length > 0) {
      lines.push(``);
      lines.push(`🛠️ Selected Options:`);
      activeAddonsList.forEach((a) => {
        lines.push(`  • ${a.shortTitle || a.name} (${a.badge})`);
      });
    }

    lines.push(``);
    lines.push(`💰 Total Investment: ${formatINR(finalPrice)}`);

    if (clientName.trim()) lines.push(`👤 Client: ${clientName.trim()}`);
    if (phone.trim()) lines.push(`📞 Phone: ${phone.trim()}`);
    if (eventDate) lines.push(`📅 Preferred Date: ${eventDate}`);
    if (venue.trim()) lines.push(`📍 Venue: ${venue.trim()}`);
    if (notes.trim()) lines.push(`📝 Notes: ${notes.trim()}`);

    lines.push(``);
    lines.push(`Please confirm our date availability and next steps.`);
    return lines.join('\n');
  };

  const handleWhatsAppSend = () => {
    const message = buildWhatsAppMessage();
    const url = buildWhatsAppUrl(STUDIO_INFO.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim() || !eventDate || !venue.trim()) {
      toast.error('Please fill in your name, phone, date, and venue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const addonNotes = activeAddonsList.map((a) => `${a.shortTitle} (${a.badge})`).join(', ');
      const combinedNotes = [
        `Proposal for ${currentEvent?.name || 'Event'} (${planShortLabel}, ${guestsShortLabel})`,
        `Base Package: ${basePackage?.name} (${formatINR(basePackage?.price || 0)})`,
        addonNotes ? `Options: ${addonNotes}` : '',
        `Estimated Total: ${formatINR(finalPrice)}`,
        notes ? `Client Notes: ${notes}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await submitBooking({
        clientName: clientName.trim(),
        phone: phone.trim(),
        eventType: (currentEvent?.name || 'Weddings') as any,
        preferredDate: eventDate,
        venue: venue.trim(),
        packageId: basePackage?.id || 'pkg-custom',
        packageName: `${basePackage?.name || 'Custom Proposal'} (Total: ${formatINR(finalPrice)})`,
        quotedAmount: finalPrice,
        notes: combinedNotes,
        status: 'Pending',
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: '1.0',
      });

      setIsSubmitted(true);
      toast.success('Inquiry submitted! We will check date availability shortly.');
    } catch (err) {
      console.error('Failed to submit proposal:', err);
      toast.error('Failed to submit online. Please use WhatsApp option.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#072421] text-[#E6ECEB] selection:bg-[#C5B378]/30 selection:text-white pb-24 lg:pb-12">
      {/* ─── Top Minimal Bar ─── */}
      <header className="sticky top-0 z-40 bg-[#072421]/95 backdrop-blur-md border-b border-[#C5B378]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            href="/#packages"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D8C78E] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="gap-1.5 border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#C5B378]/15 text-xs h-8 px-3"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share Link</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ─── A. Minimal Top Header Bar (Zero Walls of Text) ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#C5B378]/15">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {currentEvent?.name || 'Milestone'} Proposal
            </h1>
            {currentEvent?.tamilName && (
              <span className="text-sm font-sans text-[#D8C78E] font-medium">
                ({currentEvent.tamilName})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0E423E] border border-[#C5B378]/30 px-3 py-1 text-xs text-[#E6ECEB]/90 font-medium">
              <span>{planShortLabel}</span>
              <span className="text-[#C5B378]">•</span>
              <span>{guestsShortLabel}</span>
            </span>

            <Link
              href="/#packages"
              className="text-xs font-semibold text-[#D8C78E] hover:text-white underline underline-offset-4 ml-1 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* ─── Split Screen Layout: Left 65% / Right 35% Sticky ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ══════════ LEFT COLUMN (65% on Desktop) ══════════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* ─── B. Camera Styles & Crew Elements (Expanded by Default & All 6 Styles Shown) ─── */}
            <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    Camera Styles & Crew Elements
                  </span>
                  <p className="text-xs text-[#E6ECEB]/70">
                    See how each camera element lights up your celebration
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsVisualGuideOpen((prev) => !prev)}
                  className="text-xs font-semibold text-[#D8C78E] hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-[#0E423E]/60 border border-[#C5B378]/20"
                >
                  <span>{isVisualGuideOpen ? 'Collapse' : 'Expand All Styles'}</span>
                  {isVisualGuideOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Quick Jump Thumbnail Pills for Mobile & Desktop */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
                {CAMERA_TEAM_GUIDES.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActivePillModal(g)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-[#C5B378]/30 bg-[#0E423E]/80 hover:bg-[#114A45] hover:border-[#D8C78E] px-3 py-1 text-left transition-all duration-200 group"
                  >
                    <div className="h-5 w-5 rounded-full overflow-hidden bg-black shrink-0 border border-[#C5B378]/40">
                      <img src={g.previewImage} alt={g.title} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs font-medium text-white group-hover:text-[#F4E8C1] whitespace-nowrap">
                      {g.title.replace('Photography', 'Photo').replace('Cinematography', 'Cinema').replace(' (Full Ceremony)', '')}
                    </span>
                  </button>
                ))}
              </div>

              {/* Expanded View: All 6 Camera Styles in Mobile-Friendly Grid */}
              <AnimatePresence>
                {isVisualGuideOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-2 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {CAMERA_TEAM_GUIDES.map((guide) => (
                        <div
                          key={guide.id}
                          className="group rounded-sm border border-[#C5B378]/20 bg-[#061E1C]/80 hover:border-[#D8C78E]/60 hover:bg-[#0E423E]/90 transition-all duration-200 p-3.5 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-2.5">
                            {/* Sample Visual Image */}
                            <div className="relative aspect-[16/10] w-full rounded overflow-hidden bg-black border border-[#C5B378]/20">
                              <img
                                src={guide.previewImage}
                                alt={guide.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                              <div className="absolute top-2 left-2">
                                <span className="rounded-full bg-[#072421]/90 border border-[#C5B378]/40 px-2 py-0.5 text-[10px] font-bold text-[#D8C78E] uppercase tracking-wider backdrop-blur-sm shadow">
                                  {guide.sampleType === 'photo' || guide.sampleType === 'candid-photo'
                                    ? 'Photo'
                                    : guide.sampleType === 'drone'
                                    ? 'Aerial Drone'
                                    : guide.sampleType === 'led-wall'
                                    ? 'Live LED'
                                    : 'Video'}
                                </span>
                              </div>

                              <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[10px] font-semibold text-[#F4E8C1] drop-shadow line-clamp-1">
                                  {guide.tagline}
                                </span>
                              </div>
                            </div>

                            {/* Title & Explanations */}
                            <div className="space-y-1">
                              <h5 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-[#F4E8C1] transition-colors leading-snug">
                                {guide.title}
                              </h5>
                              {guide.tamilTitle && (
                                <p className="text-[11px] text-[#D8C78E] font-medium leading-tight line-clamp-1">
                                  {guide.tamilTitle}
                                </p>
                              )}
                              <p className="text-xs text-[#E6ECEB]/80 leading-relaxed pt-1">
                                {guide.howItLightsUp}
                              </p>
                            </div>
                          </div>

                          {/* Action Button & Best For */}
                          <div className="pt-2 border-t border-[#C5B378]/15 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-[#E6ECEB]/65 truncate">
                              <strong className="text-white">Best:</strong> {guide.bestFor.split(',')[0]}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActivePillModal(guide)}
                              className="shrink-0 text-xs font-semibold text-[#D8C78E] hover:text-white flex items-center gap-0.5 transition-colors"
                            >
                              <span>Specs & Sample</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── C. Recommended Package Card (Scannable Chips + Collapsible Full List) ─── */}
            {basePackage && (
              <div className="rounded-sm border-2 border-[#D8C78E] bg-[#0E423E] p-5 sm:p-6 space-y-4 shadow-[0_12px_36px_rgba(216,199,142,0.15)]">
                {/* Header */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#C5B378]/20 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                        Recommended Base Plan
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#072421] border border-[#D8C78E]/40 px-2 py-0.5 text-[10px] font-bold text-[#D8C78E]">
                        {basePackage.sortOrder === 3 ? '👑 Royal Tier' : '⭐ Signature Tier'}
                      </span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {basePackage.name}
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#D8C78E]">Starting Rate</span>
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {formatINR(basePackage.price)}
                    </p>
                  </div>
                </div>

                {/* Scannable At-a-Glance Icon Chips (Max 4 items) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="flex items-center gap-2 rounded-sm bg-[#061E1C]/60 border border-[#C5B378]/20 px-3 py-2 text-xs">
                    <Camera className="h-4 w-4 text-[#D8C78E] shrink-0" />
                    <span className="font-medium text-white truncate">
                      {basePackage.customizer?.included
                        ? basePackage.customizer.included.traditionalPhoto && basePackage.customizer.included.candidPhoto
                          ? 'Traditional + Candid Photo'
                          : basePackage.customizer.included.candidPhoto
                          ? 'Lead Candid Photo'
                          : 'Traditional Photo'
                        : basePackage.sortOrder === 3
                        ? 'Dual Candid + Trad'
                        : 'Traditional + Candid'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-sm bg-[#061E1C]/60 border border-[#C5B378]/20 px-3 py-2 text-xs">
                    <Film className="h-4 w-4 text-[#D8C78E] shrink-0" />
                    <span className="font-medium text-white truncate">
                      {basePackage.customizer?.included
                        ? basePackage.customizer.included.traditionalVideo && basePackage.customizer.included.candidVideo
                          ? 'Traditional + Candid Cinema'
                          : basePackage.customizer.included.candidVideo
                          ? 'Candid Cinema & Film'
                          : basePackage.customizer.included.traditionalVideo
                          ? 'Full HD Video'
                          : 'Digital Highlights'
                        : basePackage.sortOrder === 3
                        ? '4K Cinema + Teaser'
                        : 'Full HD Video'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-sm bg-[#061E1C]/60 border border-[#C5B378]/20 px-3 py-2 text-xs">
                    <BookOpen className="h-4 w-4 text-[#D8C78E] shrink-0" />
                    <span className="font-medium text-white truncate">
                      {basePackage.customizer?.included
                        ? basePackage.customizer.included.printedAlbum
                          ? basePackage.sortOrder === 3
                            ? '70-Sheet Box Album'
                            : '30-Sheet Karizma Album'
                          : 'Digital-Only (No Album)'
                        : basePackage.sortOrder === 3
                        ? '70-Sheet Box Album'
                        : '50-Sheet Album'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-sm bg-[#061E1C]/60 border border-[#C5B378]/20 px-3 py-2 text-xs">
                    <HardDriveDownload className="h-4 w-4 text-[#D8C78E] shrink-0" />
                    <span className="font-medium text-white truncate">
                      {basePackage.customizer?.included
                        ? basePackage.customizer.included.drone
                          ? 'Drone Aerial Included'
                          : basePackage.customizer.included.ledWall
                          ? 'Live LED Wall Included'
                          : basePackage.customizer.included.outdoorShoot
                          ? 'Outdoor Shoot Included'
                          : 'Full Raw Data Drive'
                        : 'Full Raw Data Drive'}
                    </span>
                  </div>
                </div>

                {/* Collapsed by Default Full Deliverable Accordion */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeliverablesOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D8C78E] hover:text-white transition-colors"
                  >
                    <span>
                      {isDeliverablesOpen
                        ? 'Hide detailed deliverable breakdown'
                        : 'View full deliverable breakdown ▾'}
                    </span>
                    {isDeliverablesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <AnimatePresence>
                    {isDeliverablesOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-3 space-y-2 text-xs"
                      >
                        {parseDeliverables(basePackage.deliverables).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 rounded-sm bg-[#061E1C]/40 border border-[#C5B378]/15 px-3 py-2"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#D8C78E] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-[#D8C78E] uppercase text-[10px] mr-1.5">
                                {item.category}:
                              </span>
                              <span className="text-white">{item.text}</span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ─── D. Clean "Customize Your Plan" Toggle Pills ─── */}
            <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                  Customize Your Plan (Add-ons & Swaps)
                </span>
                <span className="text-[11px] text-[#E6ECEB]/60">Tap to toggle</span>
              </div>

              {/* Single-line Interactive Toggle Cards */}
              <div className="space-y-2">
                {availableAddons.map((addon) => {
                  const isActive = selectedAddonIds.includes(addon.id);
                  const isRemoval = addon.type === 'remove' || (addon as any).type === 'downgrade' || addon.priceDelta < 0;

                  return (
                    <div
                      key={addon.id}
                      className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-sm border transition-all duration-200 ${
                        isActive
                          ? isRemoval
                            ? 'border-rose-400/50 bg-rose-950/30'
                            : 'border-[#D8C78E] bg-[#114A45] shadow-[0_2px_12px_rgba(216,199,142,0.15)] ring-1 ring-[#D8C78E]'
                          : 'border-[#C5B378]/20 bg-[#061E1C]/60 hover:border-[#C5B378]/50 hover:bg-[#0E423E]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleAddon(addon.id)}
                        className="flex-1 flex items-center gap-2.5 text-left"
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                            isActive
                              ? isRemoval
                                ? 'border-rose-400 bg-rose-500 text-white'
                                : 'border-[#D8C78E] bg-[#D8C78E] text-[#061E1C]'
                              : 'border-[#C5B378]/40 bg-transparent'
                          }`}
                        >
                          {isActive && (isRemoval ? <Minus className="h-3 w-3 stroke-[3]" /> : <Check className="h-3 w-3 stroke-[3]" />)}
                        </div>

                        <span
                          className={`text-xs font-semibold ${
                            isActive
                              ? isRemoval
                                ? 'text-rose-200'
                                : 'text-white'
                              : 'text-[#E6ECEB]/90 group-hover:text-white'
                          }`}
                        >
                          {addon.shortTitle}
                        </span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* 1-line Info Tooltip */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveTooltipId((curr) => (curr === addon.id ? null : addon.id))
                            }
                            onMouseEnter={() => setActiveTooltipId(addon.id)}
                            onMouseLeave={() => setActiveTooltipId(null)}
                            className="text-[#E6ECEB]/40 hover:text-[#D8C78E] p-1"
                            aria-label="Info"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>

                          {activeTooltipId === addon.id && (
                            <div className="absolute right-0 bottom-full mb-1 z-30 w-56 rounded bg-[#041513] border border-[#C5B378]/40 p-2 text-[10px] text-white shadow-lg pointer-events-none">
                              {addon.description}
                            </div>
                          )}
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? isRemoval
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-[#D8C78E] text-[#061E1C]'
                              : isRemoval
                              ? 'text-rose-400 bg-rose-950/40 border border-rose-500/30'
                              : 'text-[#D8C78E] bg-[#072421] border border-[#C5B378]/30'
                          }`}
                        >
                          {addon.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ─── E. Collapsed Trust, SLA & Policy Accordions (Closed by Default) ─── */}
            <div className="space-y-2 pt-2">
              {/* Accordion 1: Delivery Timelines & Studio Guarantees */}
              <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsSlaAccordionOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white hover:bg-[#0E423E]/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#D8C78E]" />
                    <span>Delivery Timelines & Studio Guarantees ▾</span>
                  </span>
                  {isSlaAccordionOpen ? <ChevronUp className="h-3.5 w-3.5 text-[#D8C78E]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#D8C78E]" />}
                </button>

                <AnimatePresence>
                  {isSlaAccordionOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 border-t border-[#C5B378]/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[#D8C78E] font-bold block">48h Sneak Peeks</span>
                        <p className="text-[11px] text-[#E6ECEB]/70 leading-tight">
                          25+ highlights in 2 days.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[#D8C78E] font-bold block">7d Raw & Gallery</span>
                        <p className="text-[11px] text-[#E6ECEB]/70 leading-tight">
                          Full high-res cloud backup.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[#D8C78E] font-bold block">30d Album & Film</span>
                        <p className="text-[11px] text-[#E6ECEB]/70 leading-tight">
                          Turnaround after selection.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[#D8C78E] font-bold block">Dual-Card Backup</span>
                        <p className="text-[11px] text-[#E6ECEB]/70 leading-tight">
                          Zero data loss guarantee.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Compare All 3 Base Tiers */}
              <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsCompareTiersOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white hover:bg-[#0E423E]/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-[#D8C78E]" />
                    <span>Compare All 3 Base Tiers ▾</span>
                  </span>
                  {isCompareTiersOpen ? <ChevronUp className="h-3.5 w-3.5 text-[#D8C78E]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#D8C78E]" />}
                </button>

                <AnimatePresence>
                  {isCompareTiersOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 border-t border-[#C5B378]/20 overflow-x-auto"
                    >
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#C5B378]/20 text-[#D8C78E]">
                            <th className="pb-2 font-bold">Tier</th>
                            <th className="pb-2 font-bold">Price</th>
                            <th className="pb-2 font-bold">Duration</th>
                            <th className="pb-2 font-bold">Key Inclusions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C5B378]/10 text-[#E6ECEB]/85">
                          {eventPackages.map((p) => (
                            <tr key={p.id} className={p.id === basePackage?.id ? 'bg-[#0E423E]/60' : ''}>
                              <td className="py-2.5 font-bold text-white">
                                {p.name} {p.id === basePackage?.id && '(Selected)'}
                              </td>
                              <td className="py-2.5 font-mono font-semibold text-[#D8C78E]">
                                {formatINR(p.price)}
                              </td>
                              <td className="py-2.5 text-[11px]">{p.duration}</td>
                              <td className="py-2.5 text-[11px] text-[#E6ECEB]/70 max-w-[200px] truncate">
                                {p.audience}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 3: Booking & Reschedule Policy */}
              <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsPolicyAccordionOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white hover:bg-[#0E423E]/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#D8C78E]" />
                    <span>Booking & Reschedule Policy ▾</span>
                  </span>
                  {isPolicyAccordionOpen ? <ChevronUp className="h-3.5 w-3.5 text-[#D8C78E]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#D8C78E]" />}
                </button>

                <AnimatePresence>
                  {isPolicyAccordionOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 border-t border-[#C5B378]/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[#D8C78E] font-bold">20% Advance Lock</span>
                        <p className="text-[11px] text-[#E6ECEB]/70 leading-tight">
                          Locks crew date instantly.
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[#D8C78E] font-bold">Free Date Change</span>
                        <p className="text-[11px] text-[#E6ECEB]/70 leading-tight">
                          Free reschedule up to 14 days before.
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[#D8C78E] font-bold">Zero Hidden Fees</span>
                        <p className="text-[11px] text-[#E6ECEB]/70 leading-tight">
                          Per-hour overtime transparent upfront.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT COLUMN (35% Sticky Summary Card) ══════════ */}
          <div className="lg:col-span-4 hidden lg:block sticky top-20 space-y-4">
            <div className="rounded-sm border-2 border-[#D8C78E]/60 bg-[#0E423E] p-6 space-y-5 shadow-[0_16px_45px_rgba(4,20,18,0.5)]">
              {/* Total Price */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D8C78E]">
                  Estimated Investment
                </span>
                <div className="flex items-baseline justify-between">
                  <motion.div
                    key={finalPrice}
                    initial={{ scale: 0.96 }}
                    animate={{ scale: 1 }}
                    className="font-serif text-4xl font-bold text-white tracking-tight"
                  >
                    {formatINR(finalPrice)}
                  </motion.div>
                </div>
              </div>

              {/* Compact Breakdown Chip */}
              <div className="rounded-sm bg-[#061E1C]/80 border border-[#C5B378]/20 p-3 space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-white">{basePackage?.name || 'Base Plan'}</span>
                  <span className="text-[#D8C78E]">{formatINR(basePackage?.price || 0)}</span>
                </div>

                {activeAddonsList.length > 0 && (
                  <div className="pt-1.5 border-t border-[#C5B378]/15 space-y-1">
                    {activeAddonsList.map((a) => (
                      <div key={a.id} className="flex justify-between text-[11px] text-[#E6ECEB]/80">
                        <span>{a.priceDelta < 0 ? '− ' : '+ '}{a.shortTitle}</span>
                        <span className="font-semibold text-[#D8C78E]">{a.badge}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 1-Line SLA Trust Badge */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#D8C78E]">
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span>48h Sneak Peeks & Dual-Card Safety Included</span>
              </div>

              {/* Primary & Secondary Action CTAs */}
              <div className="space-y-2.5 pt-1">
                <Button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="w-full gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold hover:brightness-105 shadow-[0_4px_16px_rgba(216,199,142,0.35)] py-3 text-sm"
                >
                  <span>Check Date & Book</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWhatsAppSend}
                  className="w-full gap-2 border-[#25D366]/50 bg-[#25D366]/10 text-emerald-300 hover:bg-[#25D366]/20 text-xs py-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Share on WhatsApp</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── F. Sticky Mobile Bottom Bar ─── */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#061E1C]/95 backdrop-blur-md border-t border-[#C5B378]/30 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#D8C78E] truncate max-w-[130px]">
              {basePackage?.name || currentEvent?.name}
            </p>
            <p className="font-serif text-xl font-bold text-white tracking-tight">
              {formatINR(finalPrice)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="p-2.5 rounded-sm bg-[#25D366] text-[#061E1C] hover:brightness-105"
              aria-label="WhatsApp Quote"
            >
              <MessageCircle className="h-4 w-4 fill-[#061E1C]" />
            </button>

            <Button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold shadow px-4 py-2 text-xs"
            >
              <span>Check Date & Book</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Modal 1: Single Camera Pill Preview / Difference ─── */}
      <AnimatePresence>
        {activePillModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-sm border border-[#C5B378]/35 bg-[#072421] text-[#E6ECEB] shadow-2xl p-5 sm:p-6 space-y-4"
            >
              <button
                type="button"
                onClick={() => setActivePillModal(null)}
                className="absolute top-3.5 right-3.5 text-white/70 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-0.5 pr-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]">
                  Camera Element
                </span>
                <h4 className="font-serif text-xl font-bold text-white">{activePillModal.title}</h4>
                <p className="text-xs text-[#D8C78E] font-medium">{activePillModal.tagline}</p>
              </div>

              <div className="aspect-[16/10] w-full rounded overflow-hidden border border-[#C5B378]/25 bg-black">
                <img
                  src={activePillModal.previewImage}
                  alt={activePillModal.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="text-xs text-[#E6ECEB]/85 leading-relaxed">
                <strong className="text-white">How it lights up your event: </strong>
                {activePillModal.howItLightsUp}
              </p>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setActivePillModal(null)}
                  className="bg-[#D8C78E] text-[#061E1C] font-semibold text-xs"
                >
                  Got It
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal 2: Check Date & Book Drawer / Dialog ─── */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xl overflow-hidden rounded-sm border border-[#C5B378]/35 bg-[#072421] text-[#E6ECEB] shadow-2xl p-6 space-y-5 my-8"
            >
              <div className="h-1.5 absolute top-0 inset-x-0 bg-gradient-to-r from-[#C5B378] to-[#D8C78E]" />

              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {!isSubmitted ? (
                <>
                  <div className="space-y-1 pr-6 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]">
                      Availability & Booking
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-white">
                      Check Date & Lock Custom Plan
                    </h3>
                    <p className="text-xs text-[#E6ECEB]/70">
                      Cross-checks your celebration with lead photographer G Krishna’s calendar.
                    </p>
                  </div>

                  {/* Summary Bar */}
                  <div className="rounded-sm bg-[#0E423E] border border-[#C5B378]/25 p-3 flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-white">{currentEvent?.name} · {basePackage?.name}</span>
                      <p className="text-[11px] text-[#D8C78E]">{planShortLabel} • {guestsShortLabel}</p>
                    </div>
                    <span className="font-serif text-2xl font-bold text-white">{formatINR(finalPrice)}</span>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/90">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Vignesh & Sneha"
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/90">Phone / WhatsApp *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 98401 12233"
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/90">Event Date *</label>
                        <input
                          type="date"
                          required
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/90">Venue & City *</label>
                        <input
                          type="text"
                          required
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          placeholder="e.g. SV Mahal, Panruti"
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/90">Notes (Optional)</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Early morning Muhurtham at 6 AM"
                        className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={handleWhatsAppSend}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-[#25D366] px-4 py-2.5 text-xs font-bold text-[#061E1C] hover:brightness-105"
                      >
                        <MessageCircle className="h-4 w-4 fill-[#061E1C]" />
                        <span>Send on WhatsApp</span>
                      </button>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold text-xs py-2.5"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span>Submit Online</span>
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#114A45] text-[#D8C78E] border border-[#D8C78E]/40">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-white">Inquiry Received!</h4>
                  <p className="text-xs text-[#E6ECEB]/75 max-w-sm mx-auto">
                    We will review your date ({eventDate}) and get back to you shortly.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="bg-[#D8C78E] text-[#061E1C] text-xs"
                  >
                    Close
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
