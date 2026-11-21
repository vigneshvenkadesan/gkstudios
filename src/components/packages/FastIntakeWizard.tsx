'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Baby,
  Cake,
  Flame,
  Briefcase,
  Clock,
  SunMedium,
  CalendarDays,
  Home,
  Users,
  Crown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EVENT_CATEGORY_GROUPS, StudioEvent, StudioPackage } from '@/src/types/studio';
import { Button } from '@/src/components/ui/button';

export type SessionPlan = 'single' | 'half' | 'full';
export type GuestScale = 'intimate' | 'classic' | 'grand';

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
  'baby-maternity': <Baby className="h-4 w-4" />,
  'birthday-kids': <Cake className="h-4 w-4" />,
  'family-traditional': <Flame className="h-4 w-4" />,
  'corporate-business': <Briefcase className="h-4 w-4" />,
};

function matchesCategory(eventCategory?: string, groupId?: string): boolean {
  if (!eventCategory || !groupId) return false;
  const evCat = eventCategory.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const grp = groupId.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (evCat === grp) return true;
  if (grp.includes('wedding') && evCat.includes('wedding')) return true;
  if ((grp.includes('baby') || grp.includes('maternity')) && (evCat.includes('baby') || evCat.includes('maternity'))) return true;
  if ((grp.includes('birthday') || grp.includes('kid')) && (evCat.includes('birthday') || evCat.includes('kid'))) return true;
  if ((grp.includes('family') || grp.includes('traditional')) && (evCat.includes('family') || evCat.includes('traditional'))) return true;
  if ((grp.includes('corporate') || grp.includes('business')) && (evCat.includes('corporate') || evCat.includes('business'))) return true;
  return false;
}

export const SESSION_PLANS = [
  {
    id: 'single' as SessionPlan,
    title: 'Single Session',
    label: 'Single Session • 4h',
    badge: '4 Hours',
    description: 'Focused ceremony or intimate gathering (e.g. Kaathu Kuthi, Seemantham, Housewarming).',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    id: 'half' as SessionPlan,
    title: 'Half-Day Celebration',
    label: 'Half-Day • 6h',
    badge: '6 Hours',
    description: 'Traditional rituals + family feast / reception (e.g. Engagement, Muhurtham, 60th Birthday).',
    icon: <SunMedium className="h-5 w-5" />,
  },
  {
    id: 'full' as SessionPlan,
    title: 'Full-Day / Multi-Session',
    label: 'Full-Day • Multi-Session',
    badge: '1.5–2 Days',
    description: 'Complete multi-ceremony festivities (e.g. Janavasam + Muhurtham, Sangeet + Wedding).',
    icon: <CalendarDays className="h-5 w-5" />,
  },
];

export const GUEST_SCALES = [
  {
    id: 'intimate' as GuestScale,
    title: 'Intimate Gathering',
    label: '< 100 Guests',
    badge: '< 100 Guests',
    description: 'Home or small hall with discreet, non-intrusive camera presence.',
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: 'classic' as GuestScale,
    title: 'Classic Celebration',
    label: '100–300 Guests',
    badge: '100–300 Guests',
    description: 'Marriage hall with balanced traditional coverage & natural candid reactions.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'grand' as GuestScale,
    title: 'Grand Event',
    label: '300+ Guests',
    badge: '300+ Guests',
    description: 'Large mandapam with multi-camera crew & simultaneous stage and drone coverage.',
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

  // Wizard step: 1 (Event), 2 (Session Plan), 3 (Guest Count)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Intake selections
  const [sessionPlan, setSessionPlan] = useState<SessionPlan>('half');
  const [guestScale, setGuestScale] = useState<GuestScale>('classic');

  // Filter active events for current category
  const activeEvents = useMemo(() => {
    return events.filter((e) => (e.status ?? 'active') === 'active');
  }, [events]);

  const filteredEvents = useMemo(() => {
    return activeEvents
      .filter((e) => matchesCategory(e.category, selectedCategoryId))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [activeEvents, selectedCategoryId]);

  const currentEvent = useMemo(() => {
    return (
      activeEvents.find((e) => e.id === selectedEventId) ||
      filteredEvents[0] ||
      activeEvents[0]
    );
  }, [activeEvents, selectedEventId, filteredEvents]);

  // Smart Recommendation Routing Logic
  // Never show "budget" button upfront:
  // - Full-Day or Grand (300+) => Recommend Premium (sortOrder: 3)
  // - Otherwise (Single / Half-Day + Intimate/Classic) => Default to Signature (sortOrder: 2)
  const recommendedTier = useMemo(() => {
    if (sessionPlan === 'full' || guestScale === 'grand') {
      return 3;
    }
    return 2;
  }, [sessionPlan, guestScale]);

  const handleBuildProposal = () => {
    const eventIdParam = encodeURIComponent(selectedEventId || currentEvent?.id || 'wedding');
    const planParam = encodeURIComponent(sessionPlan);
    const guestsParam = encodeURIComponent(guestScale);
    const tierParam = recommendedTier;

    router.push(`/packages/proposal?event=${eventIdParam}&plan=${planParam}&guests=${guestsParam}&tier=${tierParam}`);
  };

  return (
    <div className="space-y-8">
      {/* Wizard Step Progress Tracker */}
      <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3)}
              className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D8C78E] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold tracking-widest text-[#D8C78E]/80 uppercase">
              3-Question Intake
            </span>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[#D8C78E] font-medium">Question {currentStep} of 3</span>
            <span className="text-[#E6ECEB]/40">·</span>
            <span className="text-[#E6ECEB]/85 font-medium">
              {currentStep === 1
                ? 'Milestone Event'
                : currentStep === 2
                ? 'Celebration Duration'
                : 'Guest Scale'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 relative h-1.5 w-full overflow-hidden rounded-full bg-[#0E423E] border border-[#C5B378]/20">
          <motion.div
            className="h-full bg-gradient-to-r from-[#C5B378] via-[#D8C78E] to-[#F4E8C1]"
            initial={false}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
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
                What milestone celebration are we capturing?
              </h3>
              <p className="text-sm text-[#E6ECEB]/75 leading-relaxed max-w-2xl">
                Select your event type. We pair custom camera crew, lens packages, and albums specifically calibrated to your rituals.
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
              {EVENT_CATEGORY_GROUPS.map((group) => {
                const isSelected = selectedCategoryId === group.id;
                const icon = CATEGORY_ICONS[group.id] || <Sparkles className="h-4 w-4" />;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      onChangeCategory(group.id);
                      const first = activeEvents.find((e) => matchesCategory(e.category, group.id));
                      if (first) onChangeEvent(first.id);
                    }}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] shadow-[0_4px_16px_rgba(216,199,142,0.3)] ring-1 ring-[#F4E8C1]'
                        : 'bg-[#0E423E]/80 text-[#E6ECEB]/80 border border-[#C5B378]/25 hover:border-[#D8C78E]/60 hover:text-white'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{group.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Event Cards Grid - Compact Mobile 2-col, Icon + Name + Tamil Name */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredEvents.map((ev) => {
                const isSelected = selectedEventId === ev.id;
                const catIcon = CATEGORY_ICONS[selectedCategoryId] || <Sparkles className="h-4 w-4" />;

                return (
                  <motion.button
                    key={ev.id}
                    type="button"
                    onClick={() => onChangeEvent(ev.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between text-left p-2.5 sm:p-3.5 rounded-sm border transition-all ${
                      isSelected
                        ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_4px_16px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                        : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 ${isSelected ? 'text-[#F4E8C1]' : 'text-[#D8C78E]'}`}>
                        {catIcon}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-serif text-xs sm:text-sm font-semibold text-white leading-tight truncate">
                          {ev.name}
                        </h4>
                        {ev.tamilName && (
                          <p className="text-[10px] sm:text-[11px] text-[#D8C78E] font-medium tracking-wide truncate">
                            {ev.tamilName}
                          </p>
                        )}
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
                <span>Next: Event Duration</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Question 2: How is the event planned? ─── */}
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
                How is {currentEvent?.name || 'the event'} planned?
              </h3>
              <p className="text-sm text-[#E6ECEB]/75 leading-relaxed max-w-2xl">
                Choose the schedule duration. This determines our crew shift timing, lighting setups, and camera battery rotations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
              {SESSION_PLANS.map((plan) => {
                const isSelected = sessionPlan === plan.id;

                return (
                  <motion.button
                    key={plan.id}
                    type="button"
                    onClick={() => setSessionPlan(plan.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex sm:flex-col items-center sm:items-start justify-between text-left p-3.5 sm:p-4 rounded-sm border transition-all gap-2.5 ${
                      isSelected
                        ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_4px_16px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                        : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                    }`}
                  >
                    <div className="flex sm:flex-col items-center sm:items-start gap-2.5 min-w-0">
                      <div
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-sm shrink-0 transition-colors ${
                          isSelected ? 'bg-[#D8C78E] text-[#061E1C]' : 'bg-[#0E423E] text-[#D8C78E]'
                        }`}
                      >
                        {plan.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs sm:text-sm text-white block truncate">
                          {plan.label}
                        </span>
                        <p className="text-[11px] text-[#E6ECEB]/70 hidden sm:block pt-0.5 line-clamp-2">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-[#061E1C]/40 text-[#F4E8C1]'
                          : 'bg-[#072421] text-[#D8C78E] border border-[#C5B378]/30'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#C5B378]/20">
              <span className="text-xs text-[#E6ECEB]/70">
                Plan: <strong className="text-white font-medium">{sessionPlan}</strong>
              </span>

              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold hover:brightness-105 shadow px-6"
              >
                <span>Next: Guest Count</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Question 3: How many guests are joining? ─── */}
        {currentStep === 3 && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-[#D8C78E] uppercase">
                Question 3
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                How many guests are joining the celebration?
              </h3>
              <p className="text-sm text-[#E6ECEB]/75 leading-relaxed max-w-2xl">
                We calibrate crew numbers so stage rites and guest emotions are documented concurrently without missing any candid interactions.
              </p>
            </div>

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
                    className={`flex sm:flex-col items-center sm:items-start justify-between text-left p-3.5 sm:p-4 rounded-sm border transition-all gap-2.5 ${
                      isSelected
                        ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_4px_16px_rgba(4,20,18,0.4)] ring-1 ring-[#D8C78E]'
                        : 'border-[#C5B378]/20 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                    }`}
                  >
                    <div className="flex sm:flex-col items-center sm:items-start gap-2.5 min-w-0">
                      <div
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-sm shrink-0 transition-colors ${
                          isSelected ? 'bg-[#D8C78E] text-[#061E1C]' : 'bg-[#0E423E] text-[#D8C78E]'
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
                          ? 'bg-[#061E1C]/40 text-[#F4E8C1]'
                          : 'bg-[#072421] text-[#D8C78E] border border-[#C5B378]/30'
                      }`}
                    >
                      {scale.badge}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Recommendation Preview Banner & Full-width CTA */}
            <div className="rounded-sm border border-[#D8C78E]/40 bg-gradient-to-r from-[#0E423E] to-[#092E2B] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#D8C78E]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                    {recommendedTier === 3 ? 'Recommended: 👑 Premium Royal Collection' : 'Recommended: ⭐ Signature Plan'}
                  </span>
                </div>
                <p className="text-xs text-[#E6ECEB]/80 max-w-xl">
                  {recommendedTier === 3
                    ? 'Engineered for full-day or high-attendance weddings with cinema operators & drone coverage.'
                    : 'Our most loved configuration: dedicated candid storytelling, complete ritual coverage & a heirloom Karizma photo album.'}
                </p>
              </div>

              <Button
                type="button"
                onClick={handleBuildProposal}
                className="w-full sm:w-auto shrink-0 gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold hover:brightness-105 shadow-[0_4px_16px_rgba(216,199,142,0.35)] px-7 py-3 text-sm"
              >
                <span>See My Custom Plan →</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback View Toggle */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#C5B378]/15 text-xs text-[#E6ECEB]/70">
        <span>No pricing walls — tailor your crew elements and deliverables interactively.</span>

        <button
          type="button"
          onClick={onSwitchToStandardGrid}
          className="group inline-flex items-center gap-1.5 font-semibold text-[#D8C78E] hover:text-white underline underline-offset-4 transition-colors"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Prefer to browse? View all standard packages</span>
        </button>
      </div>
    </div>
  );
}
