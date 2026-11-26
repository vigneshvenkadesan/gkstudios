import {
  BOOKING_SERVICE_OPTIONS,
  BookingServiceOption,
  DurationTier,
  OptedServiceSnapshot,
  PackageDeliverables,
  PackageIncludedFeatures,
  PackageIncludedService,
  StudioPackage,
  StudioService,
} from '../types/studio';
import { getAlbumPhotoSelectionNote } from './utils';

export const DURATION_TIER_LABELS: Record<DurationTier, { en: string; ta: string; duration: string }> = {
  threeHours: {
    en: 'Three Hours (3h)',
    ta: '3 மணி நேர அமர்வு',
    duration: 'Up to 3 Hours',
  },
  halfDay: {
    en: 'Half Day (6h)',
    ta: 'அரை நாள் அமர்வு (6 மணி நேரம்)',
    duration: 'Up to 6 Hours',
  },
  fullDay: {
    en: 'Full Day (10h - 12h)',
    ta: 'முழு நாள் நிகழ்வு (10-12 மணி நேரம்)',
    duration: 'Full Day Coverage',
  },
};

const DERIVED_DELIVERABLE_KEYS = new Set([
  'event coverage & crew',
  'event coverage',
  'coverage & crew',
  'albums & photo frames',
  'albums',
  'album',
  'photo albums',
]);

const VALID_DURATION_TIERS = new Set<DurationTier>(['threeHours', 'halfDay', 'fullDay']);

const PACKAGE_FEATURE_MATCHERS: Record<keyof PackageIncludedFeatures, RegExp> = {
  traditionalPhoto: /traditional.*(photograph|photo|camera)/i,
  traditionalVideo: /traditional.*(video|cinematograph|cinema|movie)/i,
  candidPhoto: /candid.*(photograph|photo|camera)/i,
  candidVideo: /candid.*(video|cinematograph|cinema|movie)/i,
  printedAlbum: /(album|photobook)/i,
  drone: /(drone|aerial)/i,
  ledWall: /led.*(wall|tv|screen)|live.*(wall|screen)/i,
  outdoorShoot: /outdoor.*(shoot|photo|session)|photoshoot.*outdoor/i,
};

const PACKAGE_BOOKING_SERVICE_SLUGS: Record<BookingServiceOption, string[]> = {
  'Traditional Camera': ['traditional-camera'],
  'Candid Camera': ['candid-photography', 'candid-photography-standard'],
  'Candid Video': ['candid-cinematography'],
  'Traditional Video': ['traditional-video'],
  Drone: ['drone-aerial-coverage'],
  TV: ['led-tv'],
  'LED Wall': ['led-wall'],
};

function packageServiceDescriptor(
  item: PackageIncludedService,
  services: StudioService[]
): string {
  const service = services.find((candidate) => candidate.slug === item.serviceSlug);
  return `${item.serviceSlug} ${service?.name || ''}`.trim();
}

function packageServiceMatchesFeature(
  item: PackageIncludedService,
  services: StudioService[],
  feature: keyof PackageIncludedFeatures
): boolean {
  const descriptor = packageServiceDescriptor(item, services);
  if (
    ['traditionalPhoto', 'traditionalVideo', 'candidPhoto', 'candidVideo'].includes(feature) &&
    /\b(editing|retouch|post-production)\b/i.test(descriptor)
  ) {
    return false;
  }
  return PACKAGE_FEATURE_MATCHERS[feature].test(descriptor);
}

export function getPackageFeatureServiceSlugs(
  pkg: Partial<StudioPackage>,
  services: StudioService[],
  feature: keyof PackageIncludedFeatures
): string[] {
  return (pkg.includedServices || [])
    .filter(
      (item) =>
        item.quantity > 0 &&
        packageServiceMatchesFeature(item, services, feature)
    )
    .map((item) => item.serviceSlug);
}

export function getPackageIncludedFeatures(
  pkg: Partial<StudioPackage>,
  services: StudioService[] = []
): PackageIncludedFeatures {
  if (Array.isArray(pkg.includedServices)) {
    return {
      traditionalPhoto: getPackageFeatureServiceSlugs(pkg, services, 'traditionalPhoto').length > 0,
      traditionalVideo: getPackageFeatureServiceSlugs(pkg, services, 'traditionalVideo').length > 0,
      candidPhoto: getPackageFeatureServiceSlugs(pkg, services, 'candidPhoto').length > 0,
      candidVideo: getPackageFeatureServiceSlugs(pkg, services, 'candidVideo').length > 0,
      drone: getPackageFeatureServiceSlugs(pkg, services, 'drone').length > 0,
      ledWall: getPackageFeatureServiceSlugs(pkg, services, 'ledWall').length > 0,
      outdoorShoot: getPackageFeatureServiceSlugs(pkg, services, 'outdoorShoot').length > 0,
      printedAlbum: getPackageFeatureServiceSlugs(pkg, services, 'printedAlbum').length > 0,
    };
  }

  if (pkg.customizer?.included) return { ...pkg.customizer.included };

  const sortOrder = pkg.sortOrder ?? 2;
  return {
    traditionalPhoto: true,
    traditionalVideo: true,
    candidPhoto: sortOrder >= 2,
    candidVideo: sortOrder >= 3,
    drone: sortOrder >= 3,
    ledWall: false,
    outdoorShoot: sortOrder >= 2,
    printedAlbum: true,
  };
}

export function getPackageBookingServiceOptions(
  pkg: Partial<StudioPackage>,
  services: StudioService[] = []
): BookingServiceOption[] {
  if (Array.isArray(pkg.includedServices)) {
    const includedSlugs = new Set(
      pkg.includedServices.filter((item) => item.quantity > 0).map((item) => item.serviceSlug)
    );
    return BOOKING_SERVICE_OPTIONS.filter((service) =>
      PACKAGE_BOOKING_SERVICE_SLUGS[service].some((slug) => includedSlugs.has(slug))
    );
  }

  const features = getPackageIncludedFeatures(pkg, services);
  return [
    ...(features.traditionalPhoto ? (['Traditional Camera'] as const) : []),
    ...(features.candidPhoto ? (['Candid Camera'] as const) : []),
    ...(features.candidVideo ? (['Candid Video'] as const) : []),
    ...(features.traditionalVideo ? (['Traditional Video'] as const) : []),
    ...(features.drone ? (['Drone'] as const) : []),
    ...(features.ledWall ? (['LED Wall'] as const) : []),
  ];
}

export function hasValidPackageServiceDurationTiers(items: unknown): boolean {
  return (
    items === undefined ||
    (Array.isArray(items) &&
      items.every(
        (item) =>
          item !== null &&
          typeof item === 'object' &&
          (!('durationTier' in item) ||
            item.durationTier === undefined ||
            VALID_DURATION_TIERS.has(item.durationTier as DurationTier))
      ))
  );
}

function isDerivedDeliverableKey(key: string): boolean {
  return DERIVED_DELIVERABLE_KEYS.has(key.trim().toLowerCase());
}

/**
 * Keeps only human-authored package deliverables, migrating legacy digital text to Deliverables.
 */
export function sanitizePackageDeliverables(raw: unknown): Record<string, string> {
  const entries: Array<[string, unknown]> = [];
  if (Array.isArray(raw)) {
    for (const rawItem of raw) {
      const item = String(rawItem).trim();
      if (!item) continue;
      const separatorIndex = item.indexOf(':');
      entries.push(
        separatorIndex < 0
          ? ['Deliverables', item]
          : [item.slice(0, separatorIndex).trim(), item.slice(separatorIndex + 1).trim()]
      );
    }
  } else if (raw && typeof raw === 'object') {
    entries.push(...Object.entries(raw as Record<string, unknown>));
  }

  const deliverables: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    if (typeof rawValue !== 'string' || !rawValue.trim()) continue;
    const key = rawKey.trim();
    if (isDerivedDeliverableKey(key)) continue;

    const category =
      key.toLowerCase() === 'digital deliverables' ? 'Deliverables' : key;
    const value = rawValue.trim();
    deliverables[category] = deliverables[category]
      ? `${deliverables[category]} + ${value}`
      : value;
  }
  return deliverables;
}

const COVERAGE_SERVICE_LABELS: Record<string, string> = {
  'traditional-camera': 'Traditional Photo',
  'traditional-video': 'Traditional Video',
  'candid-photography': 'Candid Photo',
  'candid-cinematography': 'Candid Video',
  'drone-aerial-coverage': 'Drone Aerial Coverage',
  'led-wall': 'Live LED Wall',
  'led-tv': 'LED TV Display',
  'live-streaming': 'Live Streaming',
};

export function getDynamicPackageDisplaySections(
  activeServiceItems: PackageIncludedService[] | undefined,
  services: StudioService[],
  packageDurationTier?: DurationTier,
  packageDeliverables?: PackageDeliverables | string[]
): { coverage: string | null; albums: string | null; deliverables: string | null } {
  const items = (activeServiceItems || []).filter((item) => item.quantity > 0);
  const servicesBySlug = new Map(services.map((service) => [service.slug, service]));
  const canonicalCoverageLabel = (item: PackageIncludedService): string | null => {
    const slug = item.serviceSlug.toLowerCase();
    const serviceName = servicesBySlug.get(item.serviceSlug)?.name || '';
    if (
      slug === 'candid-photography' ||
      slug === 'candid-photography-standard' ||
      /candid.*(photo|photograph)/i.test(serviceName)
    ) {
      return 'Candid Photo';
    }
    if (
      slug === 'led-wall' ||
      /led.*wall|live.*led/i.test(serviceName)
    ) {
      return 'Live LED Wall';
    }
    if (slug === 'led-tv' || /^led tv/i.test(serviceName)) {
      return 'LED TV Display';
    }
    return (
      COVERAGE_SERVICE_LABELS[item.serviceSlug] ||
      servicesBySlug.get(item.serviceSlug)?.name ||
      item.serviceSlug
    );
  };
  const albumItems = items.filter((item) => item.serviceSlug.startsWith('photo-album'));
  const albumSelectionNote = getAlbumPhotoSelectionNote(packageDeliverables);
  const deliverableItems = items.filter((item) => {
    if (item.serviceSlug.startsWith('photo-album')) return false;
    return servicesBySlug.get(item.serviceSlug)?.category
      .trim()
      .toLowerCase()
      .includes('deliverable') ?? false;
  });
  const deliverableSlugs = new Set(deliverableItems.map((item) => item.serviceSlug));
  const coverageItems = Array.from(
    items
    .filter(
      (item) =>
        !item.serviceSlug.startsWith('photo-album') &&
        !deliverableSlugs.has(item.serviceSlug)
    )
    .reduce((merged, item) => {
      const label = canonicalCoverageLabel(item);
      if (!label) return merged;
      const key = label.toLowerCase();
      const current = merged.get(key);
      merged.set(key, {
        label,
        quantity: (current?.quantity || 0) + item.quantity,
      });
      return merged;
    }, new Map<string, { label: string; quantity: number }>())
    .values()
  )
    .filter(
      ({ quantity }) => quantity > 0
    )
    .map(({ label, quantity }) =>
      `${quantity > 1 ? `${quantity} × ` : ''}${label}`
    );

  let coverage: string | null = null;
  if (coverageItems.length === 1) {
    coverage = coverageItems[0];
  } else if (coverageItems.length > 1) {
    coverage = `${coverageItems.slice(0, -1).join(', ')} & ${coverageItems[coverageItems.length - 1]}`;
  }

  const deliverables =
    deliverableItems.length > 0
      ? deliverableItems
          .map((item) => {
            const service = servicesBySlug.get(item.serviceSlug);
            const name = service?.name || item.serviceSlug.replace(/-/g, ' ');
            return `${item.quantity > 1 ? `${item.quantity} × ` : ''}${name}`;
          })
          .join(', ')
      : null;

  return {
    coverage,
    albums:
      albumItems.length > 0
        ? albumItems
            .map((item) => {
              const service = servicesBySlug.get(item.serviceSlug);
              const name =
                service?.name ||
                item.serviceSlug
                  .replace(/^photo-album-?/, 'Photo Album ')
                  .replace(/-/g, ' ')
                  .trim();
              return `${name}${albumSelectionNote ? ` - ${albumSelectionNote}` : ''} · ${item.quantity * 2} pages`;
            })
            .join(', ')
        : null,
    deliverables,
  };
}

export const DEFAULT_STUDIO_SERVICES: StudioService[] = [
  {
    name: 'Traditional Camera',
    slug: 'traditional-camera',
    tamilName: 'பாரம்பரியப் புகைப்படம்',
    category: 'Photography',
    description: 'Professional traditional still photography coverage for rituals and guests',
    pricingType: 'tiered',
    unitLabel: 'camera',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 10000,
      fullDay: 16000,
    },
    isActive: true,
    displayOrder: 1,
  },
  {
    name: 'Traditional Video',
    slug: 'traditional-video',
    tamilName: 'பாரம்பரிய வீடியோ பதிவு',
    category: 'Videography',
    description: 'Complete continuous traditional video coverage of the entire ceremony',
    pricingType: 'tiered',
    unitLabel: 'camera',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 10000,
      fullDay: 16000,
    },
    isActive: true,
    displayOrder: 2,
  },
  {
    name: 'Candid Photography',
    slug: 'candid-photography',
    tamilName: 'இயற்கையான புகைப்படங்கள் (Candid)',
    category: 'Photography',
    description: 'Artistic unposed moments, emotions, and candid portraiture',
    pricingType: 'tiered',
    unitLabel: 'photographer',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 14000,
      fullDay: 22000,
    },
    isActive: true,
    displayOrder: 3,
  },
  {
    name: 'Candid Cinema & 3-Min Film',
    slug: 'candid-cinematography',
    tamilName: 'சினிமா தர வீடியோ & டீஸர்',
    category: 'Videography',
    description: 'Cinematic storytelling, gimbal tracking, 4K film & 3-5 min highlight trailer',
    pricingType: 'tiered',
    unitLabel: 'cinematographer',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 18000,
      fullDay: 28000,
    },
    isActive: true,
    displayOrder: 4,
  },
  {
    name: 'Drone Aerial Coverage',
    slug: 'drone-aerial-coverage',
    tamilName: 'ட்ரோன் வான்வழிப் பதிவு',
    category: 'Aerial',
    description: '4K aerial perspectives of venue, baarat procession, and mandapam entrance',
    pricingType: 'tiered',
    unitLabel: 'drone',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 12000,
      fullDay: 18000,
    },
    isActive: true,
    displayOrder: 5,
  },
  {
    name: 'Live LED Screen (8×12 ft Wall)',
    slug: 'led-wall',
    tamilName: 'நேரலை LED திரை (8×12 அடி)',
    category: 'Display',
    description: 'High-brightness live broadcast display for grand auditoriums & halls',
    pricingType: 'tiered',
    unitLabel: 'wall',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 18000,
      fullDay: 25000,
    },
    isActive: true,
    displayOrder: 6,
  },
  {
    name: 'LED TV (55" / 65" Stand)',
    slug: 'led-tv',
    tamilName: 'LED தொலைக்காட்சி திரை',
    category: 'Display',
    description: 'Ultra-HD display stand for banquet halls, reception foyers & dining area',
    pricingType: 'tiered',
    unitLabel: 'tv',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 6000,
      fullDay: 9000,
    },
    isActive: true,
    displayOrder: 7,
  },
  {
    name: 'Outdoor / Pre-Wedding Session',
    slug: 'outdoor-shoot',
    tamilName: 'வெளிப்புற / முன் திருமண அமர்வு',
    category: 'Special',
    description: 'Scenic outdoor couple shoot with romantic lighting & creative portraits',
    pricingType: 'tiered',
    unitLabel: 'session',
    unitPrice: null,
    minQuantity: 1,
    pricing: {
      halfDay: 14000,
      fullDay: 20000,
    },
    isActive: true,
    displayOrder: 8,
  },
  {
    name: 'Photo Album (Karizma / Canvera)',
    slug: 'photo-album',
    tamilName: 'பிரீமியம் புகைப்பட ஆல்பம்',
    category: 'Deliverables',
    description: 'Premium 30+ sheet flush-mount heirloom album in acrylic/leatherette case',
    pricingType: 'per_unit',
    unitLabel: 'sheets',
    unitPrice: 350,
    minQuantity: 30,
    pricing: null,
    isActive: true,
    displayOrder: 9,
  },
  {
    name: 'Photo Album 8×12 in',
    slug: 'photo-album-8x12',
    category: 'Deliverables',
    description: 'Photo album sheets in 8×12 inch size',
    pricingType: 'per_unit',
    unitLabel: 'sheets',
    unitPrice: null,
    minQuantity: 1,
    pricing: null,
    isActive: false,
    displayOrder: 10,
  },
  {
    name: 'Photo Album 10×30 in',
    slug: 'photo-album-10x30',
    category: 'Deliverables',
    description: 'Photo album sheets in 10×30 inch size',
    pricingType: 'per_unit',
    unitLabel: 'sheets',
    unitPrice: null,
    minQuantity: 1,
    pricing: null,
    isActive: false,
    displayOrder: 11,
  },
  {
    name: 'Photo Album 16×24 in',
    slug: 'photo-album-16x24',
    category: 'Deliverables',
    description: 'Photo album sheets in 16×24 inch size',
    pricingType: 'per_unit',
    unitLabel: 'sheets',
    unitPrice: null,
    minQuantity: 1,
    pricing: null,
    isActive: false,
    displayOrder: 12,
  },
  {
    name: 'Photo Album 12×36 in',
    slug: 'photo-album-12x36',
    category: 'Deliverables',
    description: 'Photo album sheets in 12×36 inch size',
    pricingType: 'per_unit',
    unitLabel: 'sheets',
    unitPrice: null,
    minQuantity: 1,
    pricing: null,
    isActive: false,
    displayOrder: 13,
  },
  {
    name: 'Photo Album 18×24 in',
    slug: 'photo-album-18x24',
    category: 'Deliverables',
    description: 'Photo album sheets in 18×24 inch size',
    pricingType: 'per_unit',
    unitLabel: 'sheets',
    unitPrice: null,
    minQuantity: 1,
    pricing: null,
    isActive: false,
    displayOrder: 14,
  },
  {
    name: 'Photo Album 18×24 in Combo Box',
    slug: 'photo-album-18x24-combo-box',
    category: 'Deliverables',
    description: 'Photo album sheets with combo box in 18×24 inch size',
    pricingType: 'per_unit',
    unitLabel: 'sheets',
    unitPrice: null,
    minQuantity: 1,
    pricing: null,
    isActive: false,
    displayOrder: 15,
  },
];

/**
 * Resolves the unit price and total cost for a given service, duration tier, and quantity.
 */
export function resolveServicePrice(
  service: StudioService,
  durationTier: DurationTier = 'halfDay',
  quantity: number = 1
): { unitPrice: number; total: number } {
  const safeQty = Math.max(0, quantity);

  if (service.pricingType === 'per_unit') {
    const unitPrice = service.unitPrice || 0;
    return {
      unitPrice,
      total: unitPrice * safeQty,
    };
  }

  // Tiered pricing
  const unitPrice =
    durationTier === 'threeHours'
      ? service.pricing?.halfDay ?? 0
      : service.pricing?.[durationTier] ?? 0;
  return {
    unitPrice,
    total: unitPrice * safeQty,
  };
}

/**
 * Calculates package base price dynamically resolved strictly from the services collection.
 */
export function calculatePackageServiceCost(
  pkg: Partial<StudioPackage>,
  services: StudioService[] = DEFAULT_STUDIO_SERVICES,
  overrideDurationTier?: DurationTier
): number {
  const tier: DurationTier = overrideDurationTier || pkg.durationTier || 'fullDay';
  // Apply a one-rupee reduction to every positive package base price.
  
  if (Array.isArray(pkg.includedServices) && pkg.includedServices.length > 0) {
    let total = 0;
    for (const item of pkg.includedServices) {
      const svc = services.find((s) => s.slug === item.serviceSlug);
      if (svc) {
        const effectiveTier = item.durationTier ?? overrideDurationTier ?? pkg.durationTier ?? tier;
        const { total: itemTotal } = resolveServicePrice(svc, effectiveTier, item.quantity);
        total += itemTotal;
      }
    }
    return total > 0 ? Math.max(0, total - 1) : total;
  }

  // Synthesize from customizer or sort order if legacy package document lacks includedServices
  const sortOrder = pkg.sortOrder ?? 2;
  let total = 0;
  const serviceBySlug = new Map(services.map((s) => [s.slug, s]));

  // Default inclusions
  const tradCam = serviceBySlug.get('traditional-camera');
  const tradVid = serviceBySlug.get('traditional-video');
  const candidCam = serviceBySlug.get('candid-photography');
  const candidCin = serviceBySlug.get('candid-cinematography');
  const drone = serviceBySlug.get('drone-aerial-coverage');
  const album = serviceBySlug.get('photo-album') ||
    services.find((service) => service.slug.startsWith('photo-album'));
  const outdoor = serviceBySlug.get('outdoor-shoot');

  if (sortOrder === 1) {
    // Essential (e.g. 1 trad camera, 1 trad video, 30-sheet album)
    if (tradCam) total += resolveServicePrice(tradCam, 'halfDay', 1).total;
    if (tradVid) total += resolveServicePrice(tradVid, 'halfDay', 1).total;
    if (album) total += resolveServicePrice(album, 'halfDay', 30).total;
  } else if (sortOrder === 3) {
    // Premium (1 trad cam, 1 trad vid, 1 candid cam, 1 candid cinema, 1 drone, 1 outdoor, 40-sheet album)
    if (tradCam) total += resolveServicePrice(tradCam, 'fullDay', 1).total;
    if (tradVid) total += resolveServicePrice(tradVid, 'fullDay', 1).total;
    if (candidCam) total += resolveServicePrice(candidCam, 'fullDay', 1).total;
    if (candidCin) total += resolveServicePrice(candidCin, 'fullDay', 1).total;
    if (drone) total += resolveServicePrice(drone, 'fullDay', 1).total;
    if (outdoor) total += resolveServicePrice(outdoor, 'fullDay', 1).total;
    if (album) total += resolveServicePrice(album, 'fullDay', 40).total;
  } else {
    // Signature (1 trad cam, 1 trad vid, 1 candid cam, 35-sheet album)
    if (tradCam) total += resolveServicePrice(tradCam, 'fullDay', 1).total;
    if (tradVid) total += resolveServicePrice(tradVid, 'fullDay', 1).total;
    if (candidCam) total += resolveServicePrice(candidCam, 'fullDay', 1).total;
    if (album) total += resolveServicePrice(album, 'fullDay', 35).total;
  }

  const basePrice = total > 0 ? total : (pkg.price || 45000);
  return Math.max(0, basePrice - 1);
}

export function calculatePackageBasePrice(
  pkg: Partial<StudioPackage>,
  services: StudioService[] = DEFAULT_STUDIO_SERVICES,
  overrideDurationTier?: DurationTier
): number {
  if (
    pkg.priceIsOverride !== false &&
    typeof pkg.price === 'number' &&
    Number.isFinite(pkg.price)
  ) {
    return pkg.price;
  }
  return calculatePackageServiceCost(pkg, services, overrideDurationTier);
}

/**
 * Calculates customized event price and builds OptedServiceSnapshot items.
 */
export function calculateCustomizedEventPrice(
  items: PackageIncludedService[],
  services: StudioService[] = DEFAULT_STUDIO_SERVICES,
  durationTier: DurationTier = 'halfDay'
): { total: number; snapshots: OptedServiceSnapshot[] } {
  let total = 0;
  const snapshots: OptedServiceSnapshot[] = [];

  for (const item of items) {
    if (item.quantity <= 0) continue;
    const svc = services.find((s) => s.slug === item.serviceSlug);
    if (!svc) continue;

    const effectiveTier = item.durationTier ?? durationTier;
    const { unitPrice, total: itemTotal } = resolveServicePrice(svc, effectiveTier, item.quantity);
    total += itemTotal;
    snapshots.push({
      serviceSlug: svc.slug,
      name: svc.name,
      tamilName: svc.tamilName,
      category: svc.category,
      pricingType: svc.pricingType,
      durationTier: svc.pricingType === 'tiered' ? effectiveTier : undefined,
      unitLabel: svc.unitLabel,
      unitPrice,
      quantity: item.quantity,
      total: itemTotal,
    });
  }

  return { total, snapshots };
}

/**
 * Formats a snapshot into an official itemized line item.
 * e.g. "Traditional Camera (Three Hours) — 1 camera × ₹6,000 = ₹6,000"
 * e.g. "Photo Album (Karizma / Canvera) — 30 sheets × ₹350 = ₹10,500"
 */
export function formatServiceLineItem(snapshot: OptedServiceSnapshot): string {
  const tierText = snapshot.durationTier
    ? ` (${DURATION_TIER_LABELS[snapshot.durationTier]?.en || snapshot.durationTier})`
    : '';
  const unitLabel = snapshot.quantity > 1 ? `${snapshot.unitLabel}s` : snapshot.unitLabel;
  return `${snapshot.name}${tierText} — ${snapshot.quantity} ${unitLabel} × ₹${snapshot.unitPrice.toLocaleString('en-IN')} = ₹${snapshot.total.toLocaleString('en-IN')}`;
}

/**
 * Generates an opted services snapshot array given a package, toggled additions, exclusions, and custom quantities.
 */
export function buildOptedServicesForPackage(
  pkg: Partial<StudioPackage>,
  services: StudioService[] = DEFAULT_STUDIO_SERVICES,
  durationTier?: DurationTier,
  customSelections?: {
    excludedSlugs?: string[];
    addedSlugs?: Array<{ serviceSlug: string; quantity: number }>;
  }
): { totalAmount: number; optedServices: OptedServiceSnapshot[] } {
  const baseItems: PackageIncludedService[] = [];

  if (Array.isArray(pkg.includedServices) && pkg.includedServices.length > 0) {
    baseItems.push(...pkg.includedServices);
  } else {
    // Synthesize standard base items based on sortOrder
    const sortOrder = pkg.sortOrder ?? 2;
    if (sortOrder === 1) {
      baseItems.push(
        { serviceSlug: 'traditional-camera', quantity: 1 },
        { serviceSlug: 'traditional-video', quantity: 1 },
        { serviceSlug: 'photo-album', quantity: 30 }
      );
    } else if (sortOrder === 3) {
      baseItems.push(
        { serviceSlug: 'traditional-camera', quantity: 1 },
        { serviceSlug: 'traditional-video', quantity: 1 },
        { serviceSlug: 'candid-photography', quantity: 1 },
        { serviceSlug: 'candid-cinematography', quantity: 1 },
        { serviceSlug: 'drone-aerial-coverage', quantity: 1 },
        { serviceSlug: 'outdoor-shoot', quantity: 1 },
        { serviceSlug: 'photo-album', quantity: 40 }
      );
    } else {
      baseItems.push(
        { serviceSlug: 'traditional-camera', quantity: 1 },
        { serviceSlug: 'traditional-video', quantity: 1 },
        { serviceSlug: 'candid-photography', quantity: 1 },
        { serviceSlug: 'photo-album', quantity: 35 }
      );
    }
  }

  // Filter out exclusions
  const excludedSet = new Set(customSelections?.excludedSlugs || []);
  let activeItems = baseItems.filter((item) => !excludedSet.has(item.serviceSlug));

  // Merge additions or adjust quantities
  if (customSelections?.addedSlugs) {
    for (const add of customSelections.addedSlugs) {
      const existing = activeItems.find((i) => i.serviceSlug === add.serviceSlug);
      if (existing) {
        existing.quantity += add.quantity;
      } else {
        activeItems.push({ ...add });
      }
    }
  }

  const fallbackTier = durationTier ?? pkg.durationTier ?? 'fullDay';
  const { total, snapshots } = calculateCustomizedEventPrice(activeItems, services, fallbackTier);
  return { totalAmount: total, optedServices: snapshots };
}

export const DEFAULT_STUDIO_PACKAGES: StudioPackage[] = [
  {
    id: 'pkg-wedding-essential',
    eventId: 'wedding',
    tier: 'essential',
    name: 'Essential Wedding',
    audience: 'For Temple & Intimate Weddings',
    price: 34000,
    priceLabel: '₹34,000',
    duration: 'Half Day (Up to 6 Hours)',
    durationTier: 'halfDay',
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 1 },
      { serviceSlug: 'traditional-video', quantity: 1 },
      { serviceSlug: 'candid-photography', quantity: 1 },
    ],
    highlighted: false,
    featured: false,
    deliverables: {
      'Event Coverage & Crew': '1 Traditional Photographer + 1 Traditional Videographer + 1 Candid Photographer',
      'Digital Deliverables': 'Full HD Ceremony Video Edit + 300+ Curated Color-Graded Stills on Cloud / USB',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: true,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '1 Traditional Photographer',
        '1 Traditional Videographer',
        '1 Candid Photographer',
        'Full HD Ceremony Video Edit',
        'High-Res Curated Digital Gallery',
      ],
    },
    category: 'wedding',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-wedding-signature',
    eventId: 'wedding',
    tier: 'signature',
    name: 'Traditional Grand Wedding',
    audience: 'For Muhurtham & Reception Celebrations',
    price: 82000,
    priceLabel: '₹82,000',
    duration: 'Full Day Coverage',
    durationTier: 'fullDay',
    highlighted: true,
    featured: true,
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 1 },
      { serviceSlug: 'traditional-video', quantity: 1 },
      { serviceSlug: 'candid-photography', quantity: 1 },
      { serviceSlug: 'candid-cinematography', quantity: 1 },
    ],
    deliverables: {
      'Event Coverage & Crew': '1 Traditional Photographer + 1 Traditional Videographer + 1 Candid Photographer + 1 Cinematographer',
      'Digital Deliverables': '4K Cinematic 3-Min Film + Full Event Video + Complete High-Res Photo Gallery',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: true,
        candidVideo: true,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '1 Traditional Photographer + 1 Videographer',
        '1 Lead Candid Photographer',
        '1 Candid Cinematographer with Gimbal',
        '3-5 Min 4K Cinematic Highlight Film',
        'Complete Ceremony Video & Raw Footage Drive',
      ],
    },
    category: 'wedding',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 2,
  },
  {
    id: 'pkg-wedding-premium',
    eventId: 'wedding',
    tier: 'premium',
    name: 'Royal Cinematic Complete',
    audience: 'For Full 2-Day Iyer & Grand Multi-Event Celebrations',
    price: 116000,
    priceLabel: '₹1,16,000',
    duration: 'Full Day + Drone & Cinema',
    durationTier: 'fullDay',
    highlighted: false,
    featured: false,
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 2 },
      { serviceSlug: 'traditional-video', quantity: 1 },
      { serviceSlug: 'candid-photography', quantity: 1 },
      { serviceSlug: 'candid-cinematography', quantity: 1 },
      { serviceSlug: 'drone-aerial-coverage', quantity: 1 },
    ],
    deliverables: {
      'Event Coverage & Crew': '2 Traditional Photographers + 1 Traditional Videographer + 1 Candid Photographer + 1 Cinematographer + 1 Drone Operator',
      'Digital Deliverables': '4K Cinematic Film + 4K Drone Venue Reel + Full HD Video + Complete Raw Stills',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: true,
        candidVideo: true,
        drone: true,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '2 Traditional Photographers + 1 Videographer',
        '1 Candid Photographer + 1 Cinematographer',
        'Licensed 4K Aerial Drone Coverage',
        '4K Cinematic Teaser + Full Video',
        'Complete High-Res Digital Delivery',
      ],
    },
    category: 'wedding',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 3,
  },
  {
    id: 'pkg-engagement-essential',
    eventId: 'engagement',
    tier: 'essential',
    name: 'Essential Engagement',
    audience: 'Intimate betrothal & family exchange',
    price: 12000,
    priceLabel: '₹12,000',
    duration: '3 Hours Coverage',
    durationTier: 'threeHours',
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 1 },
      { serviceSlug: 'traditional-video', quantity: 1 },
    ],
    highlighted: false,
    featured: false,
    deliverables: {
      'Event Coverage & Crew': '1 Traditional Photographer + 1 Traditional Videographer',
      'Digital Deliverables': 'Full HD Edited Video + All High-Res Stills on Cloud / USB',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: false,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '1 Traditional Photographer',
        '1 Traditional Videographer',
        'Full HD Ceremony Video Edit',
        'Digital High-Res Photo Delivery',
      ],
    },
    category: 'wedding',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-engagement-signature',
    eventId: 'engagement',
    tier: 'signature',
    name: 'Signature Engagement & Ring Exchange',
    audience: 'Complete Betrothal Ceremony & Family Portraits',
    price: 34000,
    priceLabel: '₹34,000',
    duration: 'Half Day (6 Hours)',
    durationTier: 'halfDay',
    highlighted: true,
    featured: false,
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 1 },
      { serviceSlug: 'traditional-video', quantity: 1 },
      { serviceSlug: 'candid-photography', quantity: 1 },
    ],
    deliverables: {
      'Event Coverage & Crew': '1 Traditional Photographer + 1 Traditional Videographer + 1 Candid Photographer',
      'Digital Deliverables': 'Full HD Edited Ceremony Video + High-Res Digital Photo Gallery',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: true,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '1 Traditional Photographer',
        '1 Traditional Videographer',
        '1 Candid Photographer',
        'Full HD Ceremony Video Edit',
        'Curated Digital Photo Delivery',
      ],
    },
    category: 'wedding',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 2,
  },
  {
    id: 'pkg-reception-signature',
    eventId: 'reception',
    tier: 'signature',
    name: 'Signature Wedding Reception',
    audience: 'Stage portraits, couple entry, and dinner celebration',
    price: 58000,
    priceLabel: '₹58,000',
    duration: 'Half Day (6 Hours)',
    durationTier: 'halfDay',
    highlighted: true,
    featured: false,
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 1 },
      { serviceSlug: 'traditional-video', quantity: 1 },
      { serviceSlug: 'candid-photography', quantity: 1 },
      { serviceSlug: 'candid-cinematography', quantity: 1 },
    ],
    deliverables: {
      'Event Coverage & Crew': '1 Traditional Photographer + 1 Traditional Videographer + 1 Candid Photographer + 1 Cinematographer',
      'Digital Deliverables': '4K Cinematic Teaser + Full HD Video + Curated Gallery',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: true,
        candidVideo: true,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '1 Traditional Photographer + 1 Videographer',
        '1 Candid Photographer + 1 Cinematographer',
        'Stage & Guest Family Coverage',
        '4K Cinematic Reception Highlight Reel',
      ],
    },
    category: 'wedding',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-valai-kaapu-essential',
    eventId: 'valai-kaapu',
    tier: 'essential',
    name: 'Traditional Valai Kaapu Ceremony',
    audience: 'Intimate bangle blessing & family rituals',
    price: 12000,
    priceLabel: '₹12,000',
    duration: '3 Hours Coverage',
    durationTier: 'threeHours',
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 1 },
      { serviceSlug: 'traditional-video', quantity: 1 },
    ],
    deliverables: {
      'Event Coverage & Crew': '1 Traditional Photographer + 1 Traditional Videographer',
      'Digital Deliverables': 'Full HD Video + All High-Res Stills',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: true,
        candidPhoto: false,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '1 Traditional Photographer',
        '1 Traditional Videographer',
        'Bangle Blessing & Family Portraits',
        'Digital High-Res Photo Delivery',
      ],
    },
    category: 'baby-kids',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-birthday-essential',
    eventId: 'birthday',
    tier: 'essential',
    name: 'Milestone Birthday Celebration',
    audience: 'Cake cutting, kids games, and family portraits',
    price: 14000,
    priceLabel: '₹14,000',
    duration: '3 Hours Coverage',
    durationTier: 'threeHours',
    includedServices: [
      { serviceSlug: 'traditional-camera', quantity: 1 },
      { serviceSlug: 'candid-photography', quantity: 1 },
    ],
    deliverables: {
      'Event Coverage & Crew': '1 Traditional Photographer + 1 Candid Photographer',
      'Digital Deliverables': 'Curated High-Res Digital Stills on Cloud / USB',
    },
    customizer: {
      included: {
        traditionalPhoto: true,
        traditionalVideo: false,
        candidPhoto: true,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: false,
        printedAlbum: false,
      },
      features: [
        '1 Traditional Photographer',
        '1 Candid Kids & Family Photographer',
        'Cake Cutting & Games Documentation',
        'Digital High-Res Delivery',
      ],
    },
    category: 'baby-kids',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-outdoor-session',
    eventId: 'pre-wedding',
    tier: 'signature',
    name: 'Signature Outdoor Couple Shoot',
    audience: 'Golden hour pre/post-wedding portraits',
    price: 28000,
    priceLabel: '₹28,000',
    duration: 'Half Day (4-6 Hours)',
    durationTier: 'halfDay',
    highlighted: true,
    featured: false,
    includedServices: [
      { serviceSlug: 'outdoor-shoot', quantity: 1 },
      { serviceSlug: 'candid-photography', quantity: 1 },
    ],
    deliverables: {
      'Event Coverage & Crew': '1 Lead Portrait Photographer + Lighting Assistant',
      'Digital Deliverables': '100+ Artistically Retouched Stills + High-Res Cloud Gallery',
    },
    customizer: {
      included: {
        traditionalPhoto: false,
        traditionalVideo: false,
        candidPhoto: true,
        candidVideo: false,
        drone: false,
        ledWall: false,
        outdoorShoot: true,
        printedAlbum: false,
      },
      features: [
        '1 Lead Creative Portrait Photographer',
        'Golden Hour & Heritage Locations',
        'Signature Art Color Grading',
        'Online Cloud Gallery Access',
      ],
    },
    category: 'outdoor',
    status: 'active',
    displayOnPortfolio: true,
    sortOrder: 1,
  },
];
