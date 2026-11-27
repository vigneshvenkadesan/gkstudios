'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Baby,
  Flame,
  Home,
  Users,
  Crown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { StudioEvent, StudioPackage } from '@/src/types/studio';
import { Button } from '@/src/components/ui/button';

export type SessionPlan = 'single-3h' | 'half' | 'full';
export type GuestScale = 'intimate' | 'classic' | 'grand';
export type ShootSetting = 'indoor' | 'outdoor' | 'indoor-outdoor';

export const SHOOT_SETTING_OPTIONS: { id: ShootSetting; label: string }[] = [
  { id: 'indoor', label: 'Indoor' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'indoor-outdoor', label: 'Indoor & Outdoor' },
];

export function isOutdoorShootEvent(eventName?: string): boolean {
  const normalizedName = (eventName || '').toLowerCase();
  return normalizedName.includes('outdoor') || normalizedName.includes('shoot');
}

interface FastIntakeWizardProps {
  events: StudioEvent[];
  packages: StudioPackage[];
  selectedCategoryId: string;
  onChangeCategory: (catId: string) => void;
  selectedEventId: string;
  onChangeEvent: (eventId: string) => void;
  onSwitchToStandardGrid: () => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  wedding: <Heart className="h-4 w-4" />,
  'baby-kids': <Baby className="h-4 w-4" />,
  outdoor: <Sparkles className="h-4 w-4" />,
  'family-milestones': <Flame className="h-4 w-4" />,
};

export const GUEST_SCALES = [
  {
    id: 'intimate' as GuestScale,
    title: 'Intimate Gathering',
    label: '<200 Guests',
    badge: '<200',
    description: 'Small gathering with discreet, non-intrusive camera presence.',
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: 'classic' as GuestScale,
    title: 'Classic Celebration',
    label: '200-600 Guests',
    badge: '200-600',
    description: 'Medium celebration with balanced coverage and natural candid reactions.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'grand' as GuestScale,
    title: 'Grand Event',
    label: '>600 Guests',
    badge: '>600',
    description: 'Large celebration with multi-camera crew and broad event coverage.',
    icon: <Crown className="h-5 w-5" />,
  },
];

export function FastIntakeWizard({
  events,
  packages,
  selectedCategoryId,
  onChangeCategory,
  selectedEventId,
  onChangeEvent,
  onSwitchToStandardGrid,
}: FastIntakeWizardProps) {
  const router = useRouter();

  // Wizard step: 1 (Event), 2 (Guest Count or Shoot Setting)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Intake selections
  const sessionPlan: SessionPlan = 'half';
  const [guestScale, setGuestScale] = useState<GuestScale>('classic');
  const [shootSetting, setShootSetting] = useState<ShootSetting | null>(null);
  const [isBuildingProposal, setIsBuildingProposal] = useState(false);

  // Filter active events for current category
  const activeEvents = useMemo(() => {
    return events.filter((e) => (e.status ?? 'active') === 'active');
  }, [events]);

  const filteredEvents = useMemo(() => {
    return activeEvents
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [activeEvents]);

  const currentEvent = useMemo(() => {
    return (
      activeEvents.find((e) => e.id === selectedEventId) ||
      filteredEvents[0] ||
      activeEvents[0]
    );
  }, [activeEvents, selectedEventId, filteredEvents]);
  const asksForShootSetting = isOutdoorShootEvent(currentEvent?.name);

  // Smart recommendation routing: large guest counts and combined indoor/outdoor shoots use Premium.
  const recommendedTier = useMemo(() => {
    if (guestScale === 'grand' || (asksForShootSetting && shootSetting === 'indoor-outdoor')) {
      return 3;
    }
    return 2;
  }, [guestScale, asksForShootSetting, shootSetting]);

  const handleBuildProposal = () => {
    if (asksForShootSetting && !shootSetting) {
      toast.error('Please choose Indoor, Outdoor, or Indoor & Outdoor.');
      return;
    }

    setIsBuildingProposal(true);
    const eventId = selectedEventId || currentEvent?.id || 'wedding';
    const tierParam = recommendedTier;
    const params = new URLSearchParams({
      event: eventId,
      plan: sessionPlan,
      guests: guestScale,
      tier: String(tierParam),
    });
    if (asksForShootSetting && shootSetting) {
      params.set('shootSetting', shootSetting);
    }

    router.push(`/packages/proposal?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Wizard Step Progress Tracker */}
      <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2)}
              className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D8C78E] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold tracking-widest text-[#D8C78E]/80 uppercase">
              Quick Start
            </span>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[#D8C78E] font-medium">Question {currentStep} of 2</span>
            <span className="text-[#E6ECEB]/40">·</span>
            <span className="text-[#E6ECEB]/85 font-medium">
              {currentStep === 1
                ? 'Milestone Event'
                : asksForShootSetting
                  ? 'Shoot Setting'
                  : 'Guest Scale'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 relative h-1.5 w-full overflow-hidden rounded-full bg-[#0E423E] border border-[#C5B378]/20">
          <motion.div
            className="h-full bg-gradient-to-r from-[#C5B378] via-[#D8C78E] to-[#F4E8C1]"
            initial={false}
            animate={{ width: `${(currentStep / 2) * 100}%` }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* ─── Question 1: What is the event? ─── */}
        {currentStep === 1 && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-[#D8C78E] uppercase">
                Question 1
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                What are you celebrating?
              </h3>
              <p className="text-sm text-[#E6ECEB]/75 leading-relaxed max-w-2xl">
                Choose your event.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredEvents.map((ev) => {
                const isSelected = selectedEventId === ev.id;
                const catIcon =
                  CATEGORY_ICONS[ev.category] ||
                  CATEGORY_ICONS[selectedCategoryId] ||
                  <Sparkles className="h-4 w-4" />;

                return (
                  <motion.button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      onChangeCategory(ev.category);
                      onChangeEvent(ev.id);
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`gk-wizard-card flex items-center justify-between text-left p-2.5 sm:p-3.5 rounded-sm border transition-all ${
                      isSelected
                        ? 'gk-wizard-card--active border-[#D8C78E] bg-[#114A45] shadow-[0_4px_16px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                        : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 ${isSelected ? 'gk-wizard-active-icon text-[#F4E8C1]' : 'text-[#D8C78E]'}`}>
                        {catIcon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-serif text-xs sm:text-sm font-semibold text-white leading-tight truncate">
                          {ev.name}
                        </h4>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-[#D8C78E] shrink-0 ml-1" />}
                  </motion.button>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#C5B378]/20">
              <span className="text-xs text-[#E6ECEB]/70">
                Selected: <strong className="text-white font-medium">{currentEvent?.name}</strong>
              </span>

              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold hover:brightness-105 shadow px-6"
              >
                <span>{asksForShootSetting ? 'Next: Shoot Location' : 'Next: Guest Count'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        {/* ─── Question 2: Guest scale or shoot setting ─── */}
        {currentStep === 2 && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-[#D8C78E] uppercase">
                Question 2
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                {asksForShootSetting
                  ? 'Where will the shoot take place?'
                  : 'How many guests are joining the celebration?'}
              </h3>
              <p className="text-sm text-[#E6ECEB]/75 leading-relaxed max-w-2xl">
                {asksForShootSetting
                  ? 'Choose whether your shoot will be indoors, outdoors, or both.'
                  : 'We calibrate crew numbers so stage rites and guest emotions are documented concurrently without missing any candid interactions.'}
              </p>
            </div>

            {asksForShootSetting ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                {SHOOT_SETTING_OPTIONS.map((option) => {
                  const isSelected = shootSetting === option.id;

                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setShootSetting(option.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`gk-wizard-card flex items-center justify-between text-left p-3.5 sm:p-4 rounded-sm border transition-all ${
                        isSelected
                          ? 'gk-wizard-card--active border-[#D8C78E] bg-[#114A45] shadow-[0_4px_16px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                          : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                      }`}
                    >
                      <span className="font-semibold text-sm text-white">{option.label}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-[#D8C78E] shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                {GUEST_SCALES.map((scale) => {
                  const isSelected = guestScale === scale.id;

                  return (
                    <motion.button
                      key={scale.id}
                      type="button"
                      onClick={() => setGuestScale(scale.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`gk-wizard-card flex sm:flex-col items-center sm:items-start justify-between text-left p-3.5 sm:p-4 rounded-sm border transition-all gap-2.5 ${
                        isSelected
                          ? 'gk-wizard-card--active border-[#D8C78E] bg-[#114A45] shadow-[0_4px_16px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                          : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                      }`}
                    >
                      <div className="flex sm:flex-col items-center sm:items-start gap-2.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-sm shrink-0 transition-colors ${
                            isSelected ? 'gk-wizard-icon-active bg-[#D8C78E] text-[#061E1C]' : 'bg-[#0E423E] text-[#D8C78E]'
                          }`}
                        >
                          {scale.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs sm:text-sm text-white block truncate">
                            {scale.label}
                          </span>
                          <p className="text-[11px] text-[#E6ECEB]/70 hidden sm:block pt-0.5 line-clamp-2">
                            {scale.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected
                            ? 'gk-wizard-badge-active bg-[#061E1C]/40 text-[#F4E8C1]'
                            : 'bg-[#072421] text-[#D8C78E] border border-[#C5B378]/30'
                        }`}
                      >
                        {scale.badge}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Recommendation Preview Banner & Full-width CTA */}
            <div className="gk-wizard-preview rounded-sm border border-[#D8C78E]/40 bg-gradient-to-r from-[#0E423E] to-[#092E2B] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D8C78E]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                    {recommendedTier === 3 ? 'Recommended: 👑 Premium Royal Collection' : 'Recommended: ⭐ Signature Plan'}
                  </span>
                </div>
                <p className="text-xs text-[#E6ECEB]/80 max-w-xl">
                  {recommendedTier === 3
                    ? 'Recommended for events with over 600 guests or coverage across indoor and outdoor locations.'
                    : 'Our most loved configuration: dedicated candid storytelling, complete ritual coverage & a heirloom Karizma photo album.'}
                </p>
              </div>

              <Button
                type="button"
                disabled={isBuildingProposal}
                aria-busy={isBuildingProposal}
                onClick={handleBuildProposal}
                className="w-full sm:w-auto shrink-0 gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold hover:brightness-105 shadow-[0_4px_16px_rgba(216,199,142,0.35)] px-7 py-3 text-sm"
              >
                {isBuildingProposal && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isBuildingProposal ? 'Building your plan...' : 'See My Custom Plan →'}</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback View Toggle */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#C5B378]/15 text-xs text-[#E6ECEB]/70">
        <span>Build a custom package, or browse ready-made options.</span>

        <button
          type="button"
          onClick={onSwitchToStandardGrid}
          className="group inline-flex items-center gap-1.5 font-semibold text-[#D8C78E] hover:text-white underline underline-offset-4 transition-colors"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Browse standard packages</span>
        </button>
      </div>
    </div>
  );
}
