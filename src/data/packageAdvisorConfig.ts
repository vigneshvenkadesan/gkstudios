import { StudioPackage } from '../types/studio';

export interface ScaleOption {
  id: 'intimate' | 'classic' | 'grand';
  title: string;
  subtitle: string;
  guestCount: string;
  description: string;
  iconName: 'Home' | 'Users' | 'Crown';
}

export interface PriorityOption {
  id: 'budget' | 'emotions' | 'cinema';
  title: string;
  tagline: string;
  description: string;
  targetSortOrder: number;
  iconName: 'ShieldCheck' | 'Heart' | 'Sparkles';
}

export interface PackageAddon {
  id: string;
  name: string;
  tamilName?: string;
  priceDelta: number;
  type: 'add' | 'upgrade' | 'remove';
  description: string;
  badge: string;
  applicableIf?: (pkg: StudioPackage) => boolean;
}

/**
 * Event scale / guest count options for Step 2
 */
export const SCALE_OPTIONS: ScaleOption[] = [
  {
    id: 'intimate',
    title: 'Intimate Gathering',
    subtitle: '< 100 Guests',
    guestCount: 'Home or small banquet hall',
    description: 'Close-knit rituals, minimal crew intrusion, warm personal moments.',
    iconName: 'Home',
  },
  {
    id: 'classic',
    title: 'Classic Celebration',
    subtitle: '100 – 300 Guests',
    guestCount: 'Marriage hall / Banquet',
    description: 'Balanced coverage capturing both traditional rites and natural guest candid shots.',
    iconName: 'Users',
  },
  {
    id: 'grand',
    title: 'Grand Event',
    subtitle: '300+ Guests',
    guestCount: 'Large mandapam / Multi-session',
    description: 'Comprehensive multi-crew setup with simultaneous coverage for stage, rituals, and guests.',
    iconName: 'Crown',
  },
];

/**
 * Primary priorities (the client's core problem to solve)
 */
export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    id: 'budget',
    title: 'Keep it simple & budget-friendly',
    tagline: 'Traditional photo & video essentials',
    description: 'Clean, professional documentation of every vital ritual without extra frills.',
    targetSortOrder: 1,
    iconName: 'ShieldCheck',
  },
  {
    id: 'emotions',
    title: 'Capture natural emotions + printed album',
    tagline: 'Candid storytelling + keepsake album',
    description: 'Unposed, heartfelt moments paired with a heirloom Karizma photo album.',
    targetSortOrder: 2,
    iconName: 'Heart',
  },
  {
    id: 'cinema',
    title: 'Go all-out with cinema & outdoor shoots',
    tagline: 'Candid video, cinematic reels & outdoor shoot',
    description: '4K highlight films, couple portraits, aerial angles, and luxury presentation.',
    targetSortOrder: 3,
    iconName: 'Sparkles',
  },
];

/**
 * Helper to check if a package already includes specific keywords in its deliverables
 */
function hasDeliverableKeyword(pkg: StudioPackage, keywords: string[]): boolean {
  const checkText = (text: string) => {
    const lower = text.toLowerCase();
    return keywords.some((kw) => lower.includes(kw.toLowerCase()));
  };

  if (Array.isArray(pkg.deliverables)) {
    return pkg.deliverables.some((d) => checkText(String(d)));
  }

  if (pkg.deliverables && typeof pkg.deliverables === 'object') {
    return Object.values(pkg.deliverables).some((val) =>
      val ? checkText(String(val)) : false
    );
  }

  return false;
}

/**
 * Configurable list of add-ons and swaps with pricing.
 * Studio owner can easily adjust pricing deltas and descriptions here.
 */
export const PACKAGE_ADDONS: PackageAddon[] = [
  {
    id: 'addon-candid-video',
    name: '+ Candid Videography / Cinematic Highlights',
    tamilName: 'கேண்டிட் வீடியோ & சினிமாட்டிக் ஹைலைட்ஸ்',
    priceDelta: 12000,
    type: 'add',
    description: 'Creative gimbal operator dedicated to cinematic slow-mo and emotive story cuts.',
    badge: '+₹12,000',
    applicableIf: (pkg) =>
      !hasDeliverableKeyword(pkg, ['candid video', 'cinema team', 'gimbal operator', 'cinematic wedding teaser']),
  },
  {
    id: 'addon-outdoor-shoot',
    name: '+ Pre/Post-Event Outdoor Shoot (Half Day)',
    tamilName: 'அவுட்டோர் ஜோடி போட்டோஷூட் (அரை நாள்)',
    priceDelta: 10000,
    type: 'add',
    description: 'Relaxed golden-hour portrait session at a beach, temple, or heritage grove.',
    badge: '+₹10,000',
    applicableIf: (pkg) =>
      !hasDeliverableKeyword(pkg, ['pre-wedding couple shoot', 'pre/post-event outdoor', 'outdoor couple']),
  },
  {
    id: 'addon-luxury-album',
    name: '+ Upgrade to 50-Sheet (18×24) Luxury Album',
    tamilName: '50-தாள் லக்ஸரி ஆல்பம் மேம்படுத்தல்',
    priceDelta: 6000,
    type: 'upgrade',
    description: 'Larger metallic/velvet layflat album with handcrafted acrylic cover and presentation case.',
    badge: '+₹6,000',
    applicableIf: (pkg) =>
      hasDeliverableKeyword(pkg, ['album', 'karizma', 'layflat']) &&
      !hasDeliverableKeyword(pkg, ['70-sheet', 'signature velvet']),
  },
  {
    id: 'addon-wall-frame',
    name: '+ Extra 16×24 Wall Frame',
    tamilName: '16×24 பெரிய சுவர் போட்டோ பிரேம்',
    priceDelta: 2500,
    type: 'add',
    description: 'Museum-grade framed enlargement ready to display in your living room.',
    badge: '+₹2,500',
  },
  {
    id: 'addon-remove-album',
    name: 'Digital-Only Option (Remove Printed Album)',
    tamilName: 'டிஜிட்டல் மட்டும் (ஆல்பம் வேண்டாம்)',
    priceDelta: -5000,
    type: 'remove',
    description: 'Receive full curated high-res digital gallery only; opt out of physical album printing.',
    badge: '-₹5,000',
    applicableIf: (pkg) =>
      hasDeliverableKeyword(pkg, ['album', 'karizma', 'book']),
  },
];

/**
 * Intelligent solution mapping algorithm:
 * Diagnoses client's scale & priority and pairs them with the ideal package.
 */
export function resolveRecommendedPackage(
  packages: StudioPackage[],
  scale: ScaleOption['id'],
  priority: PriorityOption['id'],
  eventName: string
): {
  recommendedPackage: StudioPackage | null;
  headline: string;
  consultativeReason: string;
  matchedTier: 'essential' | 'signature' | 'premium';
} {
  if (!packages || packages.length === 0) {
    return {
      recommendedPackage: null,
      headline: `Bespoke Collection for ${eventName}`,
      consultativeReason: 'Every milestone is unique. We craft tailored coverage based on your schedule.',
      matchedTier: 'signature',
    };
  }

  // Desired sortOrder based on priority & scale
  let targetSortOrder = 2; // Default to Signature
  if (priority === 'budget') {
    targetSortOrder = 1; // Essential
  } else if (priority === 'cinema' || scale === 'grand') {
    targetSortOrder = 3; // Premium
  } else {
    targetSortOrder = 2; // Signature
  }

  // Find exact sortOrder match or tier match
  let matched = packages.find((p) => p.sortOrder === targetSortOrder);

  if (!matched) {
    if (targetSortOrder === 1) {
      matched = packages[0];
    } else if (targetSortOrder === 3) {
      matched = packages[packages.length - 1];
    } else {
      matched = packages.find((p) => p.highlighted) || packages[Math.floor(packages.length / 2)] || packages[0];
    }
  }

  const matchedTier: 'essential' | 'signature' | 'premium' =
    matched.sortOrder === 1
      ? 'essential'
      : matched.sortOrder === 3
      ? 'premium'
      : 'signature';

  const scaleObj = SCALE_OPTIONS.find((s) => s.id === scale) || SCALE_OPTIONS[1];
  const priorityObj = PRIORITY_OPTIONS.find((p) => p.id === priority) || PRIORITY_OPTIONS[1];

  const headline = `Here is the ideal setup for your ${eventName}: Designed for a ${scaleObj.title.toLowerCase()} focused on ${priorityObj.title.toLowerCase()}.`;

  let consultativeReason = '';
  if (matchedTier === 'essential') {
    consultativeReason =
      'Selected to keep your investment lean while ensuring zero compromise on ritual authenticity, crisp photography, and raw coverage.';
  } else if (matchedTier === 'premium') {
    consultativeReason =
      'Selected to deliver full cinematic grandeur with dedicated multi-camera angles, drone coverage, and signature keepsake albums for large gatherings.';
  } else {
    consultativeReason =
      'Our most loved choice: perfectly balances unposed candid storytelling, full ritual coverage, and a handcrafted heirloom album.';
  }

  return {
    recommendedPackage: matched,
    headline,
    consultativeReason,
    matchedTier,
  };
}
