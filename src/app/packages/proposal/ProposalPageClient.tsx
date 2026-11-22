'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  RotateCcw,
  Sliders,
  SunMedium,
  CalendarDays,
  Home,
  Users,
  Heart,
  Baby,
  Cake,
  Flame,
  Briefcase,
  Monitor,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { useEvents } from '@/src/hooks/useEvents';
import {
  EVENT_CATEGORY_GROUPS,
  PackageDeliverables,
  PackageIncludedFeatures,
  StudioPackage,
} from '@/src/types/studio';
import { PROPOSAL_ADDONS } from '@/src/config/packageAddons';
import { CAMERA_TEAM_GUIDES, CameraTeamMemberGuide } from '@/src/config/cameraGuide';
import { CameraDemoShowcaseSection } from '@/src/components/packages/CameraDemoShowcaseSection';
import { buildWhatsAppUrl, formatINR, toISODate } from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { Button } from '@/src/components/ui/button';
import {
  SESSION_PLANS,
  GUEST_SCALES,
  SessionPlan,
  GuestScale,
} from '@/src/components/packages/FastIntakeWizard';

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

interface FeatureMeta {
  key: keyof PackageIncludedFeatures;
  label: string;
  tamilLabel?: string;
  defaultDeduction: number;
  description: string;
  downgradeLabel: string;
}

const BASE_FEATURE_DEFINITIONS: Record<string, FeatureMeta> = {
  traditionalPhoto: {
    key: 'traditionalPhoto',
    label: 'Traditional Photography',
    tamilLabel: 'பாரம்பரியப் புகைப்படம்',
    defaultDeduction: -5000,
    description: 'Stage group photos, sacred rituals & complete attendance archive.',
    downgradeLabel: 'Opt-out of Traditional Photo',
  },
  traditionalVideo: {
    key: 'traditionalVideo',
    label: 'Traditional Video (Full Ceremony)',
    tamilLabel: 'பாரம்பரிய வீடியோ பதிவு',
    defaultDeduction: -6000,
    description: 'Full-length Full HD recording of all rituals, mantras & speeches.',
    downgradeLabel: 'Opt-out of Traditional Video',
  },
  candidPhoto: {
    key: 'candidPhoto',
    label: 'Candid Photography',
    tamilLabel: 'கேன்டிட் புகைப்படம்',
    defaultDeduction: -8000,
    description: 'Unposed emotions, magazine portraits & soft background blur.',
    downgradeLabel: 'Opt-out of Candid Photo',
  },
  candidVideo: {
    key: 'candidVideo',
    label: 'Candid Cinematography & Reels',
    tamilLabel: 'சினிமாடிக் வீடியோ & ரீல்ஸ்',
    defaultDeduction: -10000,
    description: '3–5 min emotional highlight movie on gimbal + 60s Instagram reels.',
    downgradeLabel: 'Opt-out of Candid Cinema',
  },
  printedAlbum: {
    key: 'printedAlbum',
    label: 'Printed Heirloom Album & Presentation Box',
    tamilLabel: 'அச்சு ஆல்பம் & பெட்டி',
    defaultDeduction: -4000,
    description: 'Layflat Karizma album with presentation keepsake box.',
    downgradeLabel: 'Digital-Only (Remove Printed Album)',
  },
  drone: {
    key: 'drone',
    label: 'Drone Aerial Coverage',
    tamilLabel: 'ட்ரோன் வான்வழிப் படப்பிடிப்பு',
    defaultDeduction: -8000,
    description: '4K aerial flyovers of venue, grand entries & crowd scale.',
    downgradeLabel: 'Opt-out of Drone Aerial',
  },
  ledWall: {
    key: 'ledWall',
    label: 'Live LED Wall Screen',
    tamilLabel: 'நேரடி எல்.ஈ.டி திரை',
    defaultDeduction: -10000,
    description: 'Live stage broadcast across the hall for all guests.',
    downgradeLabel: 'Opt-out of Live LED Wall',
  },
  outdoorShoot: {
    key: 'outdoorShoot',
    label: 'Outdoor Couple Shoot',
    tamilLabel: 'அவுட்டோர் ஜோடி படப்பிடிப்பு',
    defaultDeduction: -5000,
    description: 'Pre/post celebration couple portrait session.',
    downgradeLabel: 'Opt-out of Outdoor Shoot',
  },
};

const TIME_SLOT_PRESETS = [
  {
    id: 'muhurtham',
    label: 'Early Morning Muhurtham (6:00 AM)',
    time: '06:00',
    value: 'Early Morning Muhurtham (6:00 AM)',
  },
  {
    id: 'morning',
    label: 'Morning Session (9:00 AM)',
    time: '09:00',
    value: 'Morning Session (9:00 AM)',
  },
  {
    id: 'evening',
    label: 'Evening Reception (6:00 PM)',
    time: '18:00',
    value: 'Evening Reception (6:00 PM)',
  },
  {
    id: 'full-day',
    label: 'Full-Day / Multi-Session',
    time: '',
    value: 'Full-Day / Multi-Session',
  },
  {
    id: 'unsure',
    label: 'Unsure yet — confirm later',
    time: '',
    value: 'To be confirmed',
  },
];

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

  // URL Query Params detection for Fallback / Standalone mode
  const rawEventParam = searchParams.get('event');
  const rawPlanParam = searchParams.get('plan');
  const rawGuestsParam = searchParams.get('guests');
  const rawTierParam = searchParams.get('tier');
  const hasQueryParams = Boolean(rawEventParam || rawPlanParam);

  const parsePlanParam = (param: string | null): SessionPlan => {
    if (param === 'single-3h' || param === 'single-4h' || param === 'single') return 'single-3h';
    if (param === 'full') return 'full';
    return 'half';
  };

  // Active intake states
  const [activeEventId, setActiveEventId] = useState<string>(rawEventParam || 'wedding');
  const [activePlan, setActivePlan] = useState<SessionPlan>(parsePlanParam(rawPlanParam));
  const [activeGuests, setActiveGuests] = useState<GuestScale>(
    (rawGuestsParam as GuestScale) || 'classic'
  );
  const [isEditingIntake, setIsEditingIntake] = useState(!hasQueryParams);
  const [intakeCategory, setIntakeCategory] = useState<string>('wedding');

  // Sync state if query params change
  useEffect(() => {
    if (rawEventParam) setActiveEventId(rawEventParam);
    if (rawPlanParam) setActivePlan(parsePlanParam(rawPlanParam));
    if (rawGuestsParam) setActiveGuests(rawGuestsParam as GuestScale);
  }, [rawEventParam, rawPlanParam, rawGuestsParam]);

  // Recommended tier based on intake plan and guests scale
  const intakeRecommendedTier = useMemo(() => {
    if (activePlan === 'full' || activeGuests === 'grand') return 3;
    return 2;
  }, [activePlan, activeGuests]);

  // Selected tier order (1 = Essential, 2 = Signature, 3 = Premium)
  const [selectedTierOrder, setSelectedTierOrder] = useState<number>(() => {
    if (rawTierParam) return parseInt(rawTierParam, 10);
    return activePlan === 'full' || activeGuests === 'grand' ? 3 : 2;
  });

  // Sync state if query params change
  useEffect(() => {
    if (rawEventParam) setActiveEventId(rawEventParam);
    if (rawPlanParam) setActivePlan(rawPlanParam as SessionPlan);
    if (rawGuestsParam) setActiveGuests(rawGuestsParam as GuestScale);
    if (rawTierParam) setSelectedTierOrder(parseInt(rawTierParam, 10));
  }, [rawEventParam, rawPlanParam, rawGuestsParam, rawTierParam]);

  // Helper to sync URL state smoothly
  const updateUrlParams = (
    eventId: string,
    plan: string,
    guests: string,
    tier: number,
    removedKeys: string[],
    addonIds: string[]
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set('event', eventId);
    url.searchParams.set('plan', plan);
    url.searchParams.set('guests', guests);
    url.searchParams.set('tier', String(tier));
    if (removedKeys.length > 0) {
      url.searchParams.set('removed', removedKeys.join(','));
    } else {
      url.searchParams.delete('removed');
    }
    if (addonIds.length > 0) {
      url.searchParams.set('addons', addonIds.join(','));
    } else {
      url.searchParams.delete('addons');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Customizer checkbox states
  const initialRemoved = searchParams.get('removed')
    ? searchParams.get('removed')!.split(',').filter(Boolean)
    : [];
  const initialAddons = searchParams.get('addons')
    ? searchParams.get('addons')!.split(',').filter(Boolean)
    : [];

  const [unselectedIncludedIds, setUnselectedIncludedIds] = useState<string[]>(
    initialRemoved.map((k) => `inc-${k}`)
  );
  const [selectedUpgradeIds, setSelectedUpgradeIds] = useState<string[]>(initialAddons);

  // Accordion open states
  const [expandedCameraIds, setExpandedCameraIds] = useState<string[]>([]);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(false);
  const [isSlaAccordionOpen, setIsSlaAccordionOpen] = useState(false);
  const [isCompareTiersOpen, setIsCompareTiersOpen] = useState(false);
  const [isPolicyAccordionOpen, setIsPolicyAccordionOpen] = useState(false);

  // Active modal for single camera preview
  const [activePillModal, setActivePillModal] = useState<CameraTeamMemberGuide | null>(null);

  // Tooltip helper state for add-on info
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Order / Booking Drawer state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Booking Form State
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const today = toISODate(new Date());
    return today > '2026-11-28' ? today : '2026-11-28';
  });
  const [endDate, setEndDate] = useState('');
  const [nextDayTiming, setNextDayTiming] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(() =>
    activePlan === 'full' ? 'Full-Day / Multi-Session' : 'Early Morning Muhurtham (6:00 AM)'
  );
  const [customTime, setCustomTime] = useState<string>(() =>
    activePlan === 'full' ? '' : '06:00'
  );
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto-default based on intake plan (e.g. multi-session)
  useEffect(() => {
    if (activePlan === 'full') {
      setSelectedTimeSlot('Full-Day / Multi-Session');
      setCustomTime('');
    }
  }, [activePlan]);

  // Compute effective event time representation
  const effectiveEventTime = useMemo(() => {
    if (selectedTimeSlot && selectedTimeSlot !== 'custom') {
      return selectedTimeSlot;
    }
    if (customTime) {
      const [hStr, mStr] = customTime.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const displayM = m < 10 ? `0${m}` : m;
        return `${displayH}:${displayM} ${ampm}`;
      }
      return customTime;
    }
    return 'To be confirmed';
  }, [selectedTimeSlot, customTime]);

  // Current active event object
  const currentEvent = useMemo(() => {
    return (
      activeEvents.find((e) => e.id === activeEventId) ||
      activeEvents.find((e) => e.id === 'wedding') ||
      activeEvents[0]
    );
  }, [activeEvents, activeEventId]);

  // Packages for this event
  const eventPackages = useMemo(() => {
    return packages
      .filter((p) => (p.status ?? 'active') === 'active' && p.displayOnPortfolio !== false)
      .filter((p) => (p.eventId || 'wedding') === (currentEvent?.id || 'wedding'))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages, currentEvent]);

  // Base package matching selectedTierOrder (1 = Essential, 2 = Signature, 3 = Premium)
  const basePackage = useMemo(() => {
    if (eventPackages.length === 0) return null;

    let match = eventPackages.find((p) => (p.sortOrder ?? 2) === selectedTierOrder);

    if (!match) {
      if (selectedTierOrder === 3) {
        match = eventPackages[eventPackages.length - 1];
      } else if (selectedTierOrder === 1) {
        match = eventPackages[0];
      } else {
        match = eventPackages.find((p) => p.highlighted) || eventPackages[0];
      }
    }
    return match || eventPackages[0];
  }, [eventPackages, selectedTierOrder]);

  // ─── 1. Base Included Elements (Default Checked) ───
  const baseIncludedElements = useMemo(() => {
    if (!basePackage) return [];

    const incMap = basePackage.customizer?.included;
    const keys: (keyof PackageIncludedFeatures)[] = [
      'traditionalPhoto',
      'traditionalVideo',
      'candidPhoto',
      'candidVideo',
      'printedAlbum',
      'drone',
      'ledWall',
      'outdoorShoot',
    ];

    const results: {
      id: string;
      featureKey: string;
      label: string;
      tamilLabel?: string;
      description: string;
      isBaseIncluded: boolean;
      priceDelta: number;
      downgradeLabel: string;
    }[] = [];

    keys.forEach((k) => {
      let isIncluded = false;
      if (incMap) {
        isIncluded = Boolean(incMap[k]);
      } else {
        if (basePackage.sortOrder === 3) {
          isIncluded = ['traditionalPhoto', 'traditionalVideo', 'candidPhoto', 'candidVideo', 'printedAlbum', 'drone'].includes(k);
        } else if (basePackage.sortOrder === 2) {
          isIncluded = ['traditionalPhoto', 'traditionalVideo', 'candidPhoto', 'printedAlbum'].includes(k);
        } else {
          isIncluded = ['traditionalPhoto', 'traditionalVideo', 'printedAlbum'].includes(k);
        }
      }

      if (isIncluded) {
        const meta = BASE_FEATURE_DEFINITIONS[k];
        let deduction = meta.defaultDeduction;

        if (k === 'printedAlbum' && basePackage.customizer?.addons) {
          const removeAddon = basePackage.customizer.addons.find(
            (a) => a.id === 'remove-album' || a.type === 'downgrade' || a.priceDelta < 0
          );
          if (removeAddon) {
            deduction = -Math.abs(removeAddon.priceDelta);
          }
        }

        results.push({
          id: `inc-${k}`,
          featureKey: k,
          label: meta.label,
          tamilLabel: meta.tamilLabel,
          description: meta.description,
          isBaseIncluded: true,
          priceDelta: deduction,
          downgradeLabel: meta.downgradeLabel,
        });
      }
    });

    return results;
  }, [basePackage]);

  // ─── 2. Available Upgrades (Default Unchecked) ───
  const availableUpgrades = useMemo(() => {
    if (!basePackage) return [];

    const incKeys = baseIncludedElements.map((b) => b.featureKey);

    if (basePackage.customizer?.addons && basePackage.customizer.addons.length > 0) {
      return basePackage.customizer.addons
        .filter((a) => a.type === 'upgrade' || a.priceDelta > 0)
        .filter((a) => {
          if (a.id.includes('candid-photo') && incKeys.includes('candidPhoto')) return false;
          if (a.id.includes('candid-video') && incKeys.includes('candidVideo')) return false;
          if (a.id.includes('drone') && incKeys.includes('drone')) return false;
          if (a.id.includes('led') && incKeys.includes('ledWall')) return false;
          return true;
        })
        .map((a) => ({
          id: a.id,
          label: a.label,
          description: `Add ${a.label} to your package coverage.`,
          isBaseIncluded: false,
          priceDelta: Math.abs(a.priceDelta),
          badge: `+${formatINR(Math.abs(a.priceDelta))}`,
        }));
    }

    return PROPOSAL_ADDONS
      .filter((a) => a.type === 'add')
      .filter((a) => (!a.applicableIf ? true : a.applicableIf(basePackage)))
      .filter((a) => {
        if (a.id.includes('candid-photo') && incKeys.includes('candidPhoto')) return false;
        if (a.id.includes('candid-cinema') && incKeys.includes('candidVideo')) return false;
        if (a.id.includes('drone') && incKeys.includes('drone')) return false;
        if (a.id.includes('led') && incKeys.includes('ledWall')) return false;
        return true;
      })
      .map((a) => ({
        id: a.id,
        label: a.shortTitle || a.name,
        description: a.description,
        isBaseIncluded: false,
        priceDelta: Math.abs(a.priceDelta),
        badge: `+${formatINR(Math.abs(a.priceDelta))}`,
      }));
  }, [basePackage, baseIncludedElements]);

  // ─── 3. Custom Plan Detection & Pricing Calculation ───
  const isCustomModified = unselectedIncludedIds.length > 0 || selectedUpgradeIds.length > 0;

  const { finalPrice, totalDelta, customizedModifications } = useMemo(() => {
    const base = basePackage?.price || 0;
    const mods: { id: string; label: string; badge: string; isDeduction: boolean; amount: number }[] = [];

    let deductionSum = 0;
    baseIncludedElements.forEach((el) => {
      if (unselectedIncludedIds.includes(el.id)) {
        deductionSum += el.priceDelta; // negative number
        mods.push({
          id: el.id,
          label: el.downgradeLabel,
          badge: formatINR(el.priceDelta),
          isDeduction: true,
          amount: el.priceDelta,
        });
      }
    });

    let additionSum = 0;
    availableUpgrades.forEach((el) => {
      if (selectedUpgradeIds.includes(el.id)) {
        additionSum += el.priceDelta; // positive number
        mods.push({
          id: el.id,
          label: el.label,
          badge: `+${formatINR(el.priceDelta)}`,
          isDeduction: false,
          amount: el.priceDelta,
        });
      }
    });

    const delta = deductionSum + additionSum;
    return {
      finalPrice: Math.max(0, base + delta),
      totalDelta: delta,
      customizedModifications: mods,
    };
  }, [basePackage?.price, baseIncludedElements, unselectedIncludedIds, availableUpgrades, selectedUpgradeIds]);

  // ─── 4. Derive Active Features & At-a-Glance Chips Dynamically (Zero Hardcoded Chips) ───
  const { baseFeatures, activeFeatures, activeChips } = useMemo(() => {
    if (!basePackage) {
      return {
        baseFeatures: {} as Record<string, boolean>,
        activeFeatures: {} as Record<string, boolean>,
        activeChips: [] as { id: string; label: string; icon: React.ReactNode; isAdded?: boolean }[],
      };
    }

    const incMap = basePackage.customizer?.included;

    // Standard fallback by tier if customizer.included is not defined
    const tierOrder = basePackage.sortOrder ?? 2;
    const fallbackIncluded: Record<string, boolean> = {
      traditionalPhoto: true,
      traditionalVideo: true,
      candidPhoto: tierOrder >= 2,
      candidVideo: tierOrder >= 3,
      printedAlbum: true,
      drone: tierOrder >= 3,
      ledWall: false,
      outdoorShoot: tierOrder >= 2,
    };

    const isBaseKey = (k: string): boolean => {
      if (incMap && typeof incMap[k] === 'boolean') {
        return Boolean(incMap[k]);
      }
      return Boolean(fallbackIncluded[k]);
    };

    const baseFlags = {
      traditionalPhoto: isBaseKey('traditionalPhoto'),
      traditionalVideo: isBaseKey('traditionalVideo'),
      candidPhoto: isBaseKey('candidPhoto'),
      candidVideo: isBaseKey('candidVideo'),
      printedAlbum: isBaseKey('printedAlbum'),
      drone: isBaseKey('drone'),
      ledWall: isBaseKey('ledWall'),
      outdoorShoot: isBaseKey('outdoorShoot'),
    };

    const hasUpgrade = (patterns: string[]): boolean => {
      return selectedUpgradeIds.some((id) =>
        patterns.some((p) => id.toLowerCase().includes(p.toLowerCase()))
      );
    };

    // Live toggles
    // 1. Photo coverage
    let traditionalPhoto =
      baseFlags.traditionalPhoto && !unselectedIncludedIds.includes('inc-traditionalPhoto');
    if (hasUpgrade(['traditional-photo'])) traditionalPhoto = true;

    let candidPhoto =
      baseFlags.candidPhoto && !unselectedIncludedIds.includes('inc-candidPhoto');
    if (hasUpgrade(['candid-photo', 'candidphoto'])) candidPhoto = true;

    // 2. Video coverage
    let traditionalVideo =
      baseFlags.traditionalVideo && !unselectedIncludedIds.includes('inc-traditionalVideo');
    if (hasUpgrade(['traditional-video'])) traditionalVideo = true;

    let candidVideo =
      baseFlags.candidVideo && !unselectedIncludedIds.includes('inc-candidVideo');
    if (hasUpgrade(['candid-video', 'candid-cinema', 'candidvideo'])) candidVideo = true;

    // 3. Album
    let printedAlbum =
      baseFlags.printedAlbum && !unselectedIncludedIds.includes('inc-printedAlbum');
    if (hasUpgrade(['remove-album'])) printedAlbum = false;
    if (hasUpgrade(['album', 'extra-album'])) printedAlbum = true;

    // 4. Drone
    let drone = baseFlags.drone && !unselectedIncludedIds.includes('inc-drone');
    if (hasUpgrade(['drone'])) drone = true;

    // 5. LED Wall
    let ledWall = baseFlags.ledWall && !unselectedIncludedIds.includes('inc-ledWall');
    if (hasUpgrade(['remove-led-wall'])) ledWall = false;
    if (hasUpgrade(['led-wall', 'ledwall', 'led'])) ledWall = true;

    // 6. Outdoor shoot
    let outdoorShoot =
      baseFlags.outdoorShoot && !unselectedIncludedIds.includes('inc-outdoorShoot');
    if (hasUpgrade(['outdoor-shoot', 'outdoorshoot', 'outdoor'])) outdoorShoot = true;

    const currentFeatures = {
      traditionalPhoto,
      traditionalVideo,
      candidPhoto,
      candidVideo,
      printedAlbum,
      drone,
      ledWall,
      outdoorShoot,
    };

    // Build Accurate, Dynamic At-a-Glance Chips
    interface ChipItem {
      id: string;
      label: string;
      icon: React.ReactNode;
      isAdded?: boolean;
    }

    const chips: ChipItem[] = [];

    // Photo Coverage Chip
    if (traditionalPhoto && candidPhoto) {
      chips.push({
        id: 'photo',
        label: 'Trad + Candid Photo',
        icon: <Camera className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
        isAdded: !baseFlags.candidPhoto && candidPhoto,
      });
    } else if (candidPhoto) {
      chips.push({
        id: 'photo',
        label: 'Candid Photo Only',
        icon: <Camera className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
        isAdded: !baseFlags.candidPhoto,
      });
    } else if (traditionalPhoto) {
      chips.push({
        id: 'photo',
        label: 'Traditional Photo',
        icon: <Camera className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
      });
    }

    // Video Coverage Chip
    if (traditionalVideo && candidVideo) {
      chips.push({
        id: 'video',
        label: 'Full HD + Cinema Film',
        icon: <Film className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
        isAdded: !baseFlags.candidVideo && candidVideo,
      });
    } else if (candidVideo) {
      chips.push({
        id: 'video',
        label: 'Cinematic Highlight Film',
        icon: <Film className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
        isAdded: !baseFlags.candidVideo,
      });
    } else if (traditionalVideo) {
      chips.push({
        id: 'video',
        label: 'Full HD Traditional Video',
        icon: <Film className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
      });
    }

    // Album Chip
    if (printedAlbum) {
      chips.push({
        id: 'album',
        label: 'Printed Album Included',
        icon: <BookOpen className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
      });
    } else {
      chips.push({
        id: 'album',
        label: 'Digital-Only Delivery',
        icon: <HardDriveDownload className="h-3.5 w-3.5 text-[#D8C78E]/70 shrink-0" />,
      });
    }

    // Special Add-On Chips (Show ONLY when true)
    if (drone) {
      chips.push({
        id: 'drone',
        label: 'Drone Aerial Included',
        icon: <Sparkles className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
        isAdded: !baseFlags.drone,
      });
    }

    if (ledWall) {
      chips.push({
        id: 'led',
        label: 'Live LED Wall Included',
        icon: <Monitor className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
        isAdded: !baseFlags.ledWall,
      });
    }

    if (outdoorShoot) {
      chips.push({
        id: 'outdoor',
        label: 'Outdoor Shoot Included',
        icon: <SunMedium className="h-3.5 w-3.5 text-[#D8C78E] shrink-0" />,
        isAdded: !baseFlags.outdoorShoot,
      });
    }

    return {
      baseFeatures: baseFlags,
      activeFeatures: currentFeatures,
      activeChips: chips,
    };
  }, [basePackage, unselectedIncludedIds, selectedUpgradeIds]);

  // Handlers for tier switching and toggles
  const handleSwitchTier = (tierOrder: number) => {
    setSelectedTierOrder(tierOrder);
    setUnselectedIncludedIds([]);
    setSelectedUpgradeIds([]);
    updateUrlParams(
      activeEventId,
      activePlan,
      activeGuests,
      tierOrder,
      [],
      []
    );
    const tierName = tierOrder === 1 ? 'Essential' : tierOrder === 3 ? 'Premium' : 'Signature';
    toast.success(`Switched to ${tierName} tier preset.`);
  };

  const handleToggleBaseIncluded = (id: string) => {
    const next = unselectedIncludedIds.includes(id)
      ? unselectedIncludedIds.filter((item) => item !== id)
      : [...unselectedIncludedIds, id];
    setUnselectedIncludedIds(next);
    const removedKeys = next.map((i) => i.replace('inc-', ''));
    updateUrlParams(
      activeEventId,
      activePlan,
      activeGuests,
      selectedTierOrder,
      removedKeys,
      selectedUpgradeIds
    );
  };

  const handleToggleUpgrade = (id: string) => {
    const next = selectedUpgradeIds.includes(id)
      ? selectedUpgradeIds.filter((item) => item !== id)
      : [...selectedUpgradeIds, id];
    setSelectedUpgradeIds(next);
    const removedKeys = unselectedIncludedIds.map((i) => i.replace('inc-', ''));
    updateUrlParams(
      activeEventId,
      activePlan,
      activeGuests,
      selectedTierOrder,
      removedKeys,
      next
    );
  };

  const handleResetToDefault = () => {
    setUnselectedIncludedIds([]);
    setSelectedUpgradeIds([]);
    updateUrlParams(
      activeEventId,
      activePlan,
      activeGuests,
      selectedTierOrder,
      [],
      []
    );
    toast.success('Reset package to standard preset.');
  };

  const toggleCameraExpanded = (id: string) => {
    setExpandedCameraIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShareLink = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Custom proposal link copied! Ready to share with family.');
    } else {
      toast.info('Share URL: ' + url);
    }
  };

  // Human-readable labels
  const planShortLabel =
    activePlan === 'single-3h' || (activePlan as string) === 'single' || (activePlan as string) === 'single-4h'
      ? 'Single Session (3h)'
      : activePlan === 'full'
      ? 'Full-Day (1.5–2d)'
      : 'Half-Day (6h)';

  const guestsShortLabel =
    activeGuests === 'intimate'
      ? '< 100 Guests'
      : activeGuests === 'grand'
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
      `📦 Base Plan: ${basePackage?.name || 'Custom Plan'} (${formatINR(basePackage?.price || 0)})`,
    ];

    if (customizedModifications.length > 0) {
      lines.push(``);
      lines.push(`🛠️ Custom Adjustments:`);
      customizedModifications.forEach((m) => {
        lines.push(`  • ${m.label} (${m.badge})`);
      });
    }

    lines.push(``);
    lines.push(`💰 Total Investment: ${formatINR(finalPrice)}`);

    if (clientName.trim()) lines.push(`👤 Client: ${clientName.trim()}`);
    if (phone.trim()) lines.push(`📞 Phone: ${phone.trim()}`);

    const timeDisplay = effectiveEventTime || 'To be finalized';
    if (eventDate) {
      lines.push(`📅 Date & Time: ${eventDate} at ${timeDisplay}`);
      if (activePlan === 'full' && endDate) {
        lines.push(`📅 Multi-day through: ${endDate}${nextDayTiming ? ` (${nextDayTiming})` : ''}`);
      }
    } else {
      lines.push(`📅 Date & Time: To be finalized`);
    }

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
      const customNotes = customizedModifications.map((m) => `${m.label} (${m.badge})`).join(', ');
      const timingNote = effectiveEventTime ? `Timing: ${effectiveEventTime}` : '';
      const multiDayNote =
        activePlan === 'full' && endDate
          ? `End Date: ${endDate}${nextDayTiming ? ` (${nextDayTiming})` : ''}`
          : '';
      const combinedNotes = [
        `Proposal for ${currentEvent?.name || 'Event'} (${planShortLabel}, ${guestsShortLabel})`,
        timingNote,
        multiDayNote,
        `Base Package: ${basePackage?.name} (${formatINR(basePackage?.price || 0)})`,
        customNotes ? `Customizations: ${customNotes}` : '',
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
        endDate: activePlan === 'full' && endDate ? endDate : undefined,
        eventTime: effectiveEventTime || 'To be confirmed',
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
            <span>Studio Home</span>
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
              <span>Share Quote</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ─── 3. Fallback / Direct Intake Mode (Rendered when no query params or when editing) ─── */}
        <AnimatePresence>
          {isEditingIntake && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-sm border-2 border-[#D8C78E]/60 bg-[#0E423E] p-4 sm:p-6 space-y-5 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#C5B378]/20 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Interactive Proposal Selector
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                    Customize Your 3 Celebration Questions
                  </h3>
                </div>

                {hasQueryParams && (
                  <button
                    type="button"
                    onClick={() => setIsEditingIntake(false)}
                    className="text-xs text-[#E6ECEB]/70 hover:text-white flex items-center gap-1 bg-[#061E1C] px-2.5 py-1 rounded border border-[#C5B378]/30"
                  >
                    <span>Close</span>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Question 1: Milestone Event */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                  1. What milestone are we capturing?
                </label>
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {EVENT_CATEGORY_GROUPS.map((group) => {
                    const isSelected = intakeCategory === group.id;
                    const icon = CATEGORY_ICONS[group.id] || <Sparkles className="h-3.5 w-3.5" />;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          setIntakeCategory(group.id);
                          const first = activeEvents.find((e) => matchesCategory(e.category, group.id));
                          if (first) setActiveEventId(first.id);
                        }}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#D8C78E] text-[#061E1C] font-bold shadow'
                            : 'bg-[#092E2B] text-[#E6ECEB]/80 border border-[#C5B378]/25 hover:text-white'
                        }`}
                      >
                        {icon}
                        <span>{group.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Event Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                  {activeEvents
                    .filter((e) => matchesCategory(e.category, intakeCategory))
                    .map((ev) => {
                      const isSelected = activeEventId === ev.id;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setActiveEventId(ev.id)}
                          className={`flex items-center justify-between text-left p-2.5 rounded border text-xs transition-all ${
                            isSelected
                              ? 'border-[#D8C78E] bg-[#114A45] text-white font-semibold shadow ring-1 ring-[#D8C78E]'
                              : 'border-[#C5B378]/20 bg-[#092E2B]/80 text-[#E6ECEB]/80 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{ev.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#D8C78E] shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Question 2: Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                  2. Celebration Duration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {SESSION_PLANS.map((plan) => {
                    const isSelected = activePlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setActivePlan(plan.id)}
                        className={`flex items-center justify-between p-3 rounded border text-xs transition-all ${
                          isSelected
                            ? 'border-[#D8C78E] bg-[#114A45] text-white font-semibold ring-1 ring-[#D8C78E]'
                            : 'border-[#C5B378]/20 bg-[#092E2B]/80 text-[#E6ECEB]/80 hover:text-white'
                        }`}
                      >
                        <span>{plan.label}</span>
                        <span className="text-[10px] text-[#D8C78E] font-bold">{plan.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 3: Guest Scale */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                  3. Expected Guest Count
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {GUEST_SCALES.map((scale) => {
                    const isSelected = activeGuests === scale.id;
                    return (
                      <button
                        key={scale.id}
                        type="button"
                        onClick={() => setActiveGuests(scale.id)}
                        className={`flex items-center justify-between p-3 rounded border text-xs transition-all ${
                          isSelected
                            ? 'border-[#D8C78E] bg-[#114A45] text-white font-semibold ring-1 ring-[#D8C78E]'
                            : 'border-[#C5B378]/20 bg-[#092E2B]/80 text-[#E6ECEB]/80 hover:text-white'
                        }`}
                      >
                        <span>{scale.label}</span>
                        <span className="text-[10px] text-[#D8C78E] font-bold">{scale.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditingIntake(false);
                    const targetTier = activePlan === 'full' || activeGuests === 'grand' ? 3 : 2;
                    setSelectedTierOrder(targetTier);
                    setUnselectedIncludedIds([]);
                    setSelectedUpgradeIds([]);
                    updateUrlParams(
                      activeEventId,
                      activePlan,
                      activeGuests,
                      targetTier,
                      [],
                      []
                    );
                    toast.success('Updated proposal parameters!');
                  }}
                  className="bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold px-6 py-2 text-xs"
                >
                  <span>View Customized Proposal →</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Top Header Bar ─── */}
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

            <button
              type="button"
              onClick={() => setIsEditingIntake((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D8C78E] hover:text-white underline underline-offset-4 ml-1 transition-colors"
            >
              <Sliders className="h-3 w-3" />
              <span>{isEditingIntake ? 'Hide Questions' : 'Edit Intake ▾'}</span>
            </button>
          </div>
        </div>

        {/* ─── Split Screen Layout: Left 65% / Right 35% Sticky ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ══════════ LEFT COLUMN (65% on Desktop) ══════════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* ─── 2. Interactive Bilingual Camera Styles, Crew & Albums Showcase ─── */}
            <CameraDemoShowcaseSection />

            {/* ─── Instant Tier Switcher Bar (Essential / Signature / Premium) ─── */}
            {eventPackages.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Choose Base Package Tier
                  </span>
                  <span className="text-[11px] text-[#E6ECEB]/60">
                    Switch preset instantly • Customize deliverables below
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {eventPackages.map((pkg) => {
                    const order = pkg.sortOrder ?? 2;
                    const isSelected = order === selectedTierOrder;
                    const isRecommended = order === intakeRecommendedTier;
                    const tierName = order === 1 ? 'Essential' : order === 3 ? 'Premium' : 'Signature';
                    const fallbackTagline =
                      order === 1
                        ? 'Traditional Only'
                        : order === 3
                        ? 'All-Inclusive Cinema & Drone'
                        : 'Traditional + Candid';

                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => handleSwitchTier(order)}
                        className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-sm border text-left transition-all ${
                          isSelected
                            ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_4px_20px_rgba(216,199,142,0.25)] ring-2 ring-[#D8C78E]'
                            : 'border-[#C5B378]/25 bg-[#092E2B]/80 hover:border-[#D8C78E]/60 hover:bg-[#0E423E]'
                        }`}
                      >
                        {isRecommended && (
                          <div className="absolute -top-2.5 right-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#C5B378] to-[#D8C78E] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#061E1C] shadow-sm">
                              <Sparkles className="h-2.5 w-2.5" />
                              Recommended for You
                            </span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold uppercase tracking-wider ${
                                isSelected ? 'text-[#F4E8C1]' : 'text-[#D8C78E]'
                              }`}
                            >
                              {tierName}
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-[#D8C78E]" />}
                          </div>

                          <p className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                            {formatINR(pkg.price)}
                          </p>

                          <p className="text-[11px] text-[#E6ECEB]/70 truncate">
                            {pkg.audience ? pkg.audience.split('—')[0].trim() : fallbackTagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 1. Unified "Included + Add-ons" Checkable Configurator ─── */}
            {basePackage && (
              <div className="rounded-sm border-2 border-[#D8C78E] bg-[#0E423E] p-5 sm:p-6 space-y-5 shadow-[0_12px_36px_rgba(216,199,142,0.15)]">
                {/* Header with Custom Plan Detection */}
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#C5B378]/20 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                        {basePackage.sortOrder === intakeRecommendedTier ? 'Recommended Plan' : 'Active Plan'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#072421] border border-[#D8C78E]/40 px-2 py-0.5 text-[10px] font-bold text-[#D8C78E]">
                        {basePackage.sortOrder === 3
                          ? '👑 Royal Tier'
                          : basePackage.sortOrder === 1
                          ? '✨ Essential Tier'
                          : '⭐ Signature Tier'}
                      </span>
                      {isCustomModified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C5B378]/20 border border-[#D8C78E]/50 px-2 py-0.5 text-[10px] font-bold text-[#D8C78E]">
                          Custom Plan Modified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#072421]/60 border border-[#C5B378]/30 px-2 py-0.5 text-[10px] text-[#E6ECEB]/70">
                          Package Preset
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                      {basePackage.name}
                    </h2>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-[#D8C78E]">
                      Estimated Plan Total
                    </span>
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {formatINR(finalPrice)}
                    </p>
                    {isCustomModified ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-[#E6ECEB]/70 font-mono">
                          Base: {formatINR(basePackage.price)}
                        </span>
                        <span className="text-[#C5B378]/40">•</span>
                        <button
                          type="button"
                          onClick={handleResetToDefault}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D8C78E] hover:text-white transition-colors"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Reset</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#E6ECEB]/50 mt-0.5">
                        Base standard package
                      </span>
                    )}
                  </div>
                </div>

                {/* Scannable At-a-Glance Icon Chips (Reflects live active coverage dynamically) */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeChips.map((chip) => (
                    <div
                      key={chip.id}
                      className="flex items-center gap-1.5 rounded-sm bg-[#061E1C]/70 border border-[#C5B378]/25 px-2.5 py-1.5 text-xs transition-colors"
                    >
                      {chip.icon}
                      <span className="font-medium text-white">{chip.label}</span>
                      {chip.isAdded && (
                        <span className="ml-1 text-[9px] font-extrabold uppercase tracking-wider bg-[#D8C78E] text-[#061E1C] px-1.5 py-0.5 rounded-full shadow-sm">
                          Added
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Deliverables Breakdown Collapsible */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDeliverablesOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D8C78E] hover:text-white transition-colors"
                  >
                    <span>
                      {isDeliverablesOpen
                        ? 'Hide full deliverable breakdown'
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
                        className="overflow-hidden pt-3 space-y-2.5 text-xs"
                      >
                        {/* Live Custom Modifications Summary */}
                        {customizedModifications.length > 0 && (
                          <div className="rounded-sm border border-[#D8C78E]/40 bg-[#114A45]/80 p-3 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3" />
                                Your Custom Modifications
                              </span>
                              <span className="text-[10px] text-[#F4E8C1] font-mono font-bold">
                                Net:{' '}
                                {totalDelta > 0
                                  ? `+${formatINR(totalDelta)}`
                                  : formatINR(totalDelta)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {customizedModifications.map((mod) => (
                                <div
                                  key={mod.id}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] border ${
                                    mod.isDeduction
                                      ? 'border-amber-400/30 bg-[#061E1C]/60 text-amber-200'
                                      : 'border-[#D8C78E]/30 bg-[#061E1C]/60 text-[#D8C78E]'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 font-medium truncate">
                                    {mod.isDeduction ? (
                                      <Minus className="h-3 w-3 text-amber-400 shrink-0" />
                                    ) : (
                                      <Plus className="h-3 w-3 text-[#D8C78E] shrink-0" />
                                    )}
                                    <span className="truncate">{mod.label}</span>
                                  </span>
                                  <span className="font-mono font-bold shrink-0 ml-2">
                                    {mod.badge}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Standard Base Deliverables */}
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

                {/* ─── Unified Interactive Checklist: Base Inclusions + Upgrades ─── */}
                <div className="pt-2 border-t border-[#C5B378]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E] block">
                        Interactive Plan Configurator
                      </span>
                      <p className="text-[11px] text-[#E6ECEB]/70">
                        Default included features are checked. Uncheck any item to apply deductions, or check upgrades below.
                      </p>
                    </div>

                    {isCustomModified && (
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D8C78E] hover:text-white transition-colors bg-[#061E1C] border border-[#C5B378]/30 px-2.5 py-1 rounded"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* A. Base Included Features (Default Checked) */}
                    {baseIncludedElements.map((el) => {
                      const isChecked = !unselectedIncludedIds.includes(el.id);
                      return (
                        <div
                          key={el.id}
                          className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-sm border transition-all duration-200 ${
                            isChecked
                              ? 'border-[#C5B378]/40 bg-[#061E1C]/90 hover:border-[#D8C78E]'
                              : 'border-rose-500/40 bg-rose-950/30'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleBaseIncluded(el.id)}
                            className="flex-1 flex items-center gap-2.5 text-left"
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                                isChecked
                                  ? 'border-[#D8C78E] bg-[#D8C78E] text-[#061E1C]'
                                  : 'border-rose-400 bg-transparent text-rose-300'
                              }`}
                            >
                              {isChecked ? (
                                <Check className="h-3 w-3 stroke-[3]" />
                              ) : (
                                <Minus className="h-3 w-3 stroke-[3]" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-semibold ${
                                    isChecked
                                      ? 'text-white'
                                      : 'text-rose-200 line-through decoration-rose-400/60'
                                  }`}
                                >
                                  {el.label}
                                </span>
                                {el.tamilLabel && (
                                  <span className="text-[10px] text-[#D8C78E]/80 hidden sm:inline">
                                    ({el.tamilLabel})
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#E6ECEB]/60 leading-tight">
                                {el.description}
                              </p>
                            </div>
                          </button>

                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isChecked
                                ? 'bg-[#0E423E] text-[#D8C78E] border border-[#C5B378]/40'
                                : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {isChecked ? 'Included in Base' : `Deducted: ${formatINR(el.priceDelta)}`}
                          </span>
                        </div>
                      );
                    })}

                    {/* Subtitle for Upgrades */}
                    {availableUpgrades.length > 0 && (
                      <div className="pt-2 pb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]/80 block">
                          Available Upgrades & Add-ons (Tap to Add)
                        </span>
                      </div>
                    )}

                    {/* B. Available Upgrades (Default Unchecked) */}
                    {availableUpgrades.map((el) => {
                      const isChecked = selectedUpgradeIds.includes(el.id);
                      return (
                        <div
                          key={el.id}
                          className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-sm border transition-all duration-200 ${
                            isChecked
                              ? 'border-[#D8C78E] bg-[#114A45] shadow-[0_2px_12px_rgba(216,199,142,0.15)] ring-1 ring-[#D8C78E]'
                              : 'border-[#C5B378]/20 bg-[#061E1C]/60 hover:border-[#C5B378]/50 hover:bg-[#0E423E]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleUpgrade(el.id)}
                            className="flex-1 flex items-center gap-2.5 text-left"
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                                isChecked
                                  ? 'border-[#D8C78E] bg-[#D8C78E] text-[#061E1C]'
                                  : 'border-[#C5B378]/40 bg-transparent'
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>

                            <div>
                              <span
                                className={`text-xs font-semibold ${
                                  isChecked ? 'text-white' : 'text-[#E6ECEB]/90 group-hover:text-white'
                                }`}
                              >
                                {el.label}
                              </span>
                              <p className="text-[10px] text-[#E6ECEB]/60 leading-tight">
                                {el.description}
                              </p>
                            </div>
                          </button>

                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isChecked
                                ? 'bg-[#D8C78E] text-[#061E1C]'
                                : 'text-[#D8C78E] bg-[#072421] border border-[#C5B378]/30'
                            }`}
                          >
                            +{formatINR(el.priceDelta)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Collapsible Accordions (SLA, Tiers & Policies) ─── */}
            <div className="space-y-3 pt-2">
              {/* Accordion 1: SLA & Studio Guarantees */}
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
                          {eventPackages.map((p) => {
                            const isCurrent = p.id === basePackage?.id;
                            return (
                              <tr
                                key={p.id}
                                onClick={() => handleSwitchTier(p.sortOrder ?? 2)}
                                className={`cursor-pointer transition-colors ${
                                  isCurrent ? 'bg-[#0E423E] font-medium' : 'hover:bg-[#0E423E]/50'
                                }`}
                              >
                                <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                                  <span>{p.name}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] text-[#D8C78E] font-bold bg-[#114A45] border border-[#D8C78E]/40 px-1.5 py-0.2 rounded">
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 font-mono font-semibold text-[#D8C78E]">
                                  {formatINR(p.price)}
                                </td>
                                <td className="py-2.5 text-[11px]">{p.duration}</td>
                                <td className="py-2.5 text-[11px] text-[#E6ECEB]/70 max-w-[200px] truncate">
                                  {p.audience}
                                </td>
                              </tr>
                            );
                          })}
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
              <div className="rounded-sm bg-[#061E1C]/80 border border-[#C5B378]/20 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-white">{basePackage?.name || 'Base Plan'}</span>
                  <span className="text-[#D8C78E]">{formatINR(basePackage?.price || 0)}</span>
                </div>

                {customizedModifications.length > 0 && (
                  <div className="pt-1.5 border-t border-[#C5B378]/15 space-y-1">
                    {customizedModifications.map((m) => (
                      <div key={m.id} className="flex justify-between text-[11px] text-[#E6ECEB]/80">
                        <span className={m.isDeduction ? 'text-rose-200' : 'text-white'}>
                          {m.isDeduction ? '− ' : '+ '}{m.label}
                        </span>
                        <span className={`font-semibold ${m.isDeduction ? 'text-rose-300' : 'text-[#D8C78E]'}`}>
                          {m.badge}
                        </span>
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
                          placeholder="e.g. Vignesh & Meera"
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white placeholder-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/90">WhatsApp Number *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 98400 12345"
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white placeholder-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Date & Time Side-by-Side Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/90 flex items-center justify-between">
                          <span>Event Date *</span>
                          {activePlan === 'full' && (
                            <span className="text-[10px] text-[#D8C78E] font-medium">Day 1</span>
                          )}
                        </label>
                        <input
                          type="date"
                          required
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-white/90 flex items-center justify-between">
                          <span>Event Start Time / Slot</span>
                          <span className="text-[10px] text-[#D8C78E] font-medium truncate max-w-[150px]">
                            {effectiveEventTime || 'Select below'}
                          </span>
                        </label>
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => {
                            setCustomTime(e.target.value);
                            setSelectedTimeSlot('custom');
                          }}
                          className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Smart Quick-Select Timing Chips */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8C78E]/90 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#D8C78E]" />
                          Quick Timing Presets
                        </span>
                        <span className="text-[10px] text-[#E6ECEB]/50">Tap to autofill slot</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {TIME_SLOT_PRESETS.map((slot) => {
                          const isSelected =
                            selectedTimeSlot === slot.value ||
                            (slot.time && customTime === slot.time && selectedTimeSlot !== 'custom');

                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setSelectedTimeSlot(slot.value);
                                setCustomTime(slot.time);
                              }}
                              className={`text-[11px] px-2.5 py-1 rounded-sm border transition-all ${
                                isSelected
                                  ? 'border-[#D8C78E] bg-[#114A45] text-white font-semibold ring-1 ring-[#D8C78E]'
                                  : 'border-[#C5B378]/25 bg-[#061E1C]/80 text-[#E6ECEB]/75 hover:border-[#D8C78E]/50 hover:text-white'
                              }`}
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Multi-Day End Date (if activePlan is Full-Day / Multi-Session) */}
                    {activePlan === 'full' && (
                      <div className="rounded-sm border border-[#C5B378]/25 bg-[#0E423E]/60 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#D8C78E] flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#D8C78E]" />
                            Multi-Session / Next-Day Muhurtham
                          </span>
                          <span className="text-[10px] text-[#E6ECEB]/60">Optional 2nd Day</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-0.5">
                            <label className="text-[10px] text-white/80">Day 2 / End Date</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-2.5 py-1.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[10px] text-white/80">Next-Day Muhurtham Timing</label>
                            <input
                              type="text"
                              value={nextDayTiming}
                              onChange={(e) => setNextDayTiming(e.target.value)}
                              placeholder="e.g. 5:30 AM Muhurtham"
                              className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-2.5 py-1.5 text-xs text-white placeholder-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Venue / City */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/90">Venue / City *</label>
                      <input
                        type="text"
                        required
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. Mayor Ramanathan Hall, Chennai"
                        className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white placeholder-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/90">Notes / Specific Rituals (Optional)</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Morning Muhurtham at 6 AM, evening reception at 7 PM"
                        className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3 py-2 text-xs text-white placeholder-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-[#E6ECEB]/70">
                      <ShieldCheck className="h-4 w-4 text-[#D8C78E] shrink-0" />
                      <span>Zero obligation · No instant payment · Date confirmed in 2 hours</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold py-2.5 text-xs hover:brightness-105 shadow"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Checking Availability...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Submit Online Inquiry</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleWhatsAppSend}
                        className="gap-1.5 border-[#25D366]/60 bg-[#25D366]/15 text-emerald-300 hover:bg-[#25D366]/25 text-xs py-2.5 px-4"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Send via WhatsApp</span>
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D8C78E]/20 border border-[#D8C78E]">
                    <Check className="h-6 w-6 text-[#D8C78E]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif text-2xl font-bold text-white">Inquiry Received!</h3>
                    <p className="text-xs text-[#E6ECEB]/80 max-w-sm mx-auto">
                      Vanakkam {clientName}! We have received your inquiry for {currentEvent?.name} on {eventDate}
                      {effectiveEventTime ? ` (${effectiveEventTime})` : ''}. We will review date availability and contact you on WhatsApp at {phone}.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center gap-2">
                    <Button
                      type="button"
                      onClick={handleWhatsAppSend}
                      className="gap-2 bg-[#25D366] text-[#061E1C] font-bold text-xs"
                    >
                      <MessageCircle className="h-4 w-4 fill-[#061E1C]" />
                      <span>Also Open in WhatsApp</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOrderModalOpen(false)}
                      className="border-[#C5B378]/30 text-white text-xs"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
