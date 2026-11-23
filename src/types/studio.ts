export type CoreEventCategory =
  | 'Weddings'
  | 'Traditional Ceremonies'
  | 'Family Celebrations'
  | 'Portraits & Outdoor Shoots'
  | 'Corporate Events';

export type LegacyEventCategory =
  | 'Iyer Weddings'
  | 'Temple Weddings'
  | 'Hindu, Christian & Muslim Weddings'
  | 'Pre-Wedding & Engagement Shoots'
  | 'Seemantham / Baby Shower'
  | 'Kaathu Kuthi'
  | 'Puberty Ceremony'
  | 'Nool Punal / Upanayanam'
  | 'Griha Pravesam (Housewarming)'
  | 'Birthdays & Milestones'
  | 'Maternity & Newborn Shoots'
  | 'Outdoor Shoots'
  | 'Corporate & Social Events';

export type EventCategory = CoreEventCategory | LegacyEventCategory;

export const EVENT_CATEGORIES: CoreEventCategory[] = [
  'Weddings',
  'Traditional Ceremonies',
  'Family Celebrations',
  'Portraits & Outdoor Shoots',
  'Corporate Events',
];

export interface StudioEvent {
  id: string; // Unique event identifier (e.g. 'wedding', 'engagement', 'valai-kaapu')
  name: string;
  tamilName?: string;
  category: string; // Event category identifier (e.g. 'wedding', 'baby-maternity', 'birthday-kids', 'family-traditional', 'corporate-business')
  status: 'active' | 'inactive';
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export const EVENT_CATEGORY_GROUPS = [
  { id: 'wedding', label: 'Wedding', icon: 'Heart' },
  { id: 'baby-maternity', label: 'Baby & Maternity', icon: 'Baby' },
  { id: 'birthday-kids', label: 'Birthday & Kids', icon: 'Cake' },
  { id: 'family-traditional', label: 'Family & Traditional', icon: 'Flame' },
  { id: 'corporate-business', label: 'Corporate & Business', icon: 'Briefcase' },
] as const;

export type EventCategoryGroupId = (typeof EVENT_CATEGORY_GROUPS)[number]['id'];

export function normalizeEventCategory(category?: string): CoreEventCategory {
  switch (category) {
    case 'Weddings':
    case 'Iyer Weddings':
    case 'Temple Weddings':
    case 'Hindu, Christian & Muslim Weddings':
      return 'Weddings';
    case 'Traditional Ceremonies':
    case 'Kaathu Kuthi':
    case 'Seemantham / Baby Shower':
    case 'Puberty Ceremony':
    case 'Nool Punal / Upanayanam':
    case 'Griha Pravesam (Housewarming)':
      return 'Traditional Ceremonies';
    case 'Family Celebrations':
    case 'Birthdays & Milestones':
    case 'Maternity & Newborn Shoots':
      return 'Family Celebrations';
    case 'Portraits & Outdoor Shoots':
    case 'Pre-Wedding & Engagement Shoots':
    case 'Outdoor Shoots':
      return 'Portraits & Outdoor Shoots';
    case 'Corporate Events':
    case 'Corporate & Social Events':
      return 'Corporate Events';
    default:
      return 'Weddings';
  }
}

export type BookingStatus =
  | 'Pending'
  | 'In Discussion'
  | 'Acknowledged'
  | 'Confirmed'
  | 'Declined';

export const CUSTOM_PACKAGE_ID = 'custom-package';
export const CUSTOM_PACKAGE_NAME = 'Custom Package';

export const BOOKING_SERVICE_OPTIONS = [
  'Traditional Camera',
  'Candid Camera',
  'Candid Video',
  'Traditional Video',
  'Drone',
  'TV',
  'LED Wall',
] as const;

export type BookingServiceOption = (typeof BOOKING_SERVICE_OPTIONS)[number];

export type AvailabilityStatus = 'Available' | 'Limited' | 'Booked';

export type DurationTier = 'threeHours' | 'halfDay' | 'fullDay';

export type PricingType = 'tiered' | 'per_unit';

export interface StudioServicePricing {
  threeHours?: number;
  halfDay?: number;
  fullDay?: number;
}

export interface StudioService {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  tamilName?: string;
  category: string;
  description: string;
  pricingType: PricingType;
  unitLabel: string;
  unitPrice?: number | null;
  minQuantity: number;
  pricing?: StudioServicePricing | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PackageIncludedService {
  serviceSlug: string;
  quantity: number;
  durationTier?: DurationTier;
}

export interface PackageAvailableAddon {
  serviceSlug: string;
  defaultQuantity?: number;
  label?: string;
  durationTier?: DurationTier;
}

export interface OptedServiceSnapshot {
  serviceSlug: string;
  name: string;
  tamilName?: string;
  category: string;
  pricingType: PricingType;
  durationTier?: DurationTier;
  unitLabel: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export type EventStage =
  | 'Booking Confirmed'
  | 'Pre-Shoot Briefing'
  | 'Shoot Completed'
  | 'Editing & Selection'
  | 'Album & Film Ready'
  | 'Delivered';

export const EVENT_STAGES: EventStage[] = [
  'Booking Confirmed',
  'Pre-Shoot Briefing',
  'Shoot Completed',
  'Editing & Selection',
  'Album & Film Ready',
  'Delivered',
];

export type PaymentMethod = 'UPI / GPay' | 'Cash' | 'Bank Transfer' | 'Card';

export interface PaymentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  amount: number;
  method: PaymentMethod;
  referenceNote?: string;
  billId?: string;
  billNumber?: string;
}

export interface StudioBillServiceItem {
  key: string; // "traditionalPhoto" | "traditionalVideo" | "candidPhoto" | "candidVideo" | "drone" | "ledWall" | "outdoorShoot" | "printedAlbum"
  en: string; // "Traditional Photography"
  ta: string; // "பாரம்பரியப் புகைப்படம்"
  selected?: boolean;
}

export interface StudioBill {
  _id?: string;
  id: string;
  billNumber: string; // Auto-incremented sequential ID, e.g., "GKS-2026-0001"
  billDate?: string;
  bookingId: string; // Reference to the booking / project
  paymentId: string; // Reference to the specific payment transaction just added
  clientName: string;
  clientPhone: string;
  eventDetails: {
    eventName: string; // e.g., "Wedding"
    tamilEventName: string; // e.g., "திருமணம்"
    eventDate: string; // e.g., "2026-12-14"
    eventTime: string; // e.g., "06:00 AM (Morning Muhurtham)"
    venue: string;
    schedulePlan: string; // e.g., "Full-Day / 2-Day • Morning & Evening"
  };
  crewDetails?: {
    assignedCrew?: string;
  };
  packageDetails: {
    basePackageName: string; // e.g., "Signature Wedding"
    tierLabel?: 'Essential' | 'Signature' | 'Premium' | string;
    durationTier?: DurationTier;
    optedServices?: OptedServiceSnapshot[];
    includedServices?: StudioBillServiceItem[];
    deliverables?: Record<string, string>;
    requiredCrew: string[]; // Derived from package deliverables & customizer
    inclusions?: string[];
    addons: Array<{
      label: string;
      priceDelta: number;
    }>;
    excludedItems?: Array<{
      label: string;
      priceDelta: number;
    }>;
  };
  financials: {
    totalPackageAmount: number;
    amountPaidNow: number; // Amount recorded in this payment entry
    totalPaidToDate: number; // Cumulative paid including this transaction
    balanceDue: number; // Remaining balance (totalPackageAmount - totalPaidToDate)
    paymentMode: string; // e.g., "UPI", "Cash", "Bank Transfer"
    paymentDate: string;
    paymentStage: string; // e.g., "Advance (20%)", "Event Day", "Final Settlement"
  };
  paymentHistory?: PaymentRecord[];
  termsAndConditions: Array<{
    en: string;
    ta: string;
  }>;
  optedServices?: OptedServiceSnapshot[];
  createdAt: string;
}

export interface StageUpdateInfo {
  completedAt?: string;
  note?: string;
}

export interface EventProject {
  id: string;
  bookingId?: string;
  calendarEntryId?: string;
  referenceCode: string;
  clientName: string;
  phone: string;
  eventType: EventCategory;
  eventDate: string; // YYYY-MM-DD
  endDate?: string;
  venue: string;
  packageName: string;
  assignedCrew: string;
  currentStage: EventStage;
  stageUpdates: Partial<Record<EventStage, StageUpdateInfo>>;
  agreedAmount: number;
  extraCharges: number;
  discount: number;
  payments: PaymentRecord[];
  deliveryNotes: string;
  requestedServices?: BookingServiceOption[];
  packageSnapshot?: PackageSnapshot;
  durationTier?: DurationTier;
  optedServices?: OptedServiceSnapshot[];
  totalAmount?: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: EventCategory;
  location: string;
  imageUrl: string;
  shootNotes: string;
  exif: string;
  dateLabel: string;
  isHeroFeatured: boolean;
  isVisible: boolean;
  aspect?: 'wide' | 'standard';
}

export interface PackageDeliverables {
  Deliverables?: string;
  [key: string]: string | undefined; // Allow dynamic category keys
}

export interface PackageIncludedFeatures {
  traditionalPhoto: boolean;
  traditionalVideo: boolean;
  candidPhoto: boolean;
  candidVideo: boolean;
  drone: boolean;
  ledWall: boolean;
  outdoorShoot: boolean;
  printedAlbum: boolean;
}

export interface PackageAddon {
  id: string; // e.g., "drone", "candid-video", "remove-album"
  label: string; // e.g., "Drone Aerial Coverage"
  priceDelta: number; // Positive for upgrades (+8000), negative for downgrades (-5000)
  type: "upgrade" | "downgrade";
}

export interface PackageCustomizer {
  included: PackageIncludedFeatures;
  addons?: PackageAddon[];
  features?: string[];
}

export interface PackageSnapshot {
  id: string;
  name: string;
  price: number;
  duration?: string;
  deliverables?: PackageDeliverables | string[];
  snapshotAt: string;
  basePackageName?: string;
  basePrice?: number;
  selectedTier?: number;
  customizerState?: {
    additions?: string[];
    exclusions?: string[];
    netAdjustment?: number;
    liveTotal?: number;
    excludedIncludedIds?: string[];
    selectedUpgradeIds?: string[];
    serviceDurationOverrides?: Record<string, DurationTier>;
    albumSheets?: number;
    eventId?: string;
    plan?: 'half' | 'full';
    guests?: string;
    shootSetting?: string;
  };
}

export interface StudioPackage {
  _id?: string;
  id: string; // e.g., "pkg-engagement-essential"
  eventId?: string; // Matches event.id (e.g., "engagement", "wedding")
  tier?: 'essential' | 'signature' | 'premium';
  name: string; // e.g., "Essential Engagement"
  audience: string; // e.g., "Most Popular — Complete event coverage"
  price: number; // Numeric value for sorting/calculations (e.g., 18000)
  currency?: string; // e.g., "INR"
  priceLabel?: string; // Formatted display string (e.g., "₹18,000")
  duration: string; // e.g., "Up to 4 Hours"
  durationTier?: DurationTier;
  includedServices?: PackageIncludedService[];
  availableAddons?: PackageAvailableAddon[];
  highlighted?: boolean; // Marks the recommended/"Most Popular" tier
  deliverables: PackageDeliverables;
  customizer?: PackageCustomizer;
  category?: string; // Matches eventId
  image?: string;
  imageUrl?: string;
  status?: 'active' | 'inactive';
  displayOnPortfolio?: boolean;
  sortOrder?: number; // 1 = Essential, 2 = Signature, 3 = Premium
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingRequest {
  id: string;
  referenceCode: string;
  clientName: string;
  phone: string;
  eventType: EventCategory;
  preferredDate: string; // YYYY-MM-DD
  endDate?: string; // Optional multi-day YYYY-MM-DD
  eventTime?: string; // Optional HH:mm
  venue: string;
  packageId: string;
  packageName: string;
  quotedAmount: number;
  requestedServices?: BookingServiceOption[];
  durationTier?: DurationTier;
  optedServices?: OptedServiceSnapshot[];
  totalAmount?: number;
  notes: string;
  status: BookingStatus;
  source?: string;
  assignedCrew?: string;
  acknowledgementNote?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  packageSnapshot?: PackageSnapshot;
  proposalToken?: string;
  proposalDraft?: BookingProposalUpdate;
  proposalUpdatedAt?: string;
  proposalSubmittedAt?: string;
  proposalRevision?: number;
  createdAt: string;
}

export type BookingProposalUpdate = Pick<
  BookingRequest,
  | 'clientName'
  | 'phone'
  | 'eventType'
  | 'preferredDate'
  | 'venue'
  | 'packageId'
  | 'packageName'
  | 'quotedAmount'
  | 'notes'
  | 'requestedServices'
  | 'durationTier'
  | 'optedServices'
  | 'totalAmount'
  | 'packageSnapshot'
> &
  Partial<
    Pick<
      BookingRequest,
      'endDate' | 'eventTime' | 'termsAccepted' | 'termsAcceptedAt' | 'termsVersion'
    >
  >;

export type ProposalBookingView = Pick<
  BookingRequest,
  | 'id'
  | 'clientName'
  | 'phone'
  | 'eventType'
  | 'preferredDate'
  | 'endDate'
  | 'eventTime'
  | 'venue'
  | 'packageId'
  | 'packageName'
  | 'quotedAmount'
  | 'requestedServices'
  | 'durationTier'
  | 'optedServices'
  | 'totalAmount'
  | 'notes'
  | 'status'
  | 'termsAccepted'
  | 'termsAcceptedAt'
  | 'termsVersion'
  | 'packageSnapshot'
  | 'proposalDraft'
  | 'proposalUpdatedAt'
  | 'proposalSubmittedAt'
  | 'proposalRevision'
  | 'createdAt'
>;

export interface CalendarDayEntry {
  id?: string;
  date: string; // YYYY-MM-DD
  status: Exclude<AvailabilityStatus, 'Available'>;
  title: string;
  eventType?: EventCategory | 'Studio Maintenance' | 'Muhurtham Rush';
  clientName?: string;
  venue?: string;
  assignedCrew?: string;
  notes?: string;
  bookingId?: string;
  phone?: string;
  time?: string;
  requestedServices?: BookingServiceOption[];
  durationTier?: DurationTier;
  optedServices?: OptedServiceSnapshot[];
  packageId?: string;
  packageName?: string;
  packageTier?: 'Essential' | 'Signature' | 'Premium';
  totalPackageAmount?: number;
  totalAmount?: number;
  paymentStatus?: string;
}

export interface StudioState {
  portfolio: PortfolioItem[];
  packages: StudioPackage[];
  services?: StudioService[];
  events?: StudioEvent[];
  bookings: BookingRequest[];
  calendarEntries: CalendarDayEntry[];
  eventProjects: EventProject[];
  bills?: StudioBill[];
}
