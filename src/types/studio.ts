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
}

export interface StageUpdateInfo {
  completedAt?: string;
  note?: string;
}

export interface EventProject {
  id: string;
  bookingId?: string;
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
  packageSnapshot?: PackageSnapshot;
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

export interface PackageSnapshot {
  id: string;
  name: string;
  price: number;
  duration?: string;
  deliverables?: string[];
  snapshotAt: string;
}

export interface StudioPackage {
  id: string;
  name: string;
  audience: string;
  price: number;
  priceLabel?: string;
  duration: string;
  highlighted?: boolean;
  featured?: boolean;
  deliverables: string[];
  imageUrl?: string;
  image?: string;
  category?: string;
  status?: 'active' | 'inactive';
  displayOnPortfolio?: boolean;
  sortOrder?: number;
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
  notes: string;
  status: BookingStatus;
  source?: string;
  assignedCrew?: string;
  acknowledgementNote?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
  packageSnapshot?: PackageSnapshot;
  createdAt: string;
}

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
}

export interface StudioState {
  portfolio: PortfolioItem[];
  packages: StudioPackage[];
  bookings: BookingRequest[];
  calendarEntries: CalendarDayEntry[];
  eventProjects: EventProject[];
}
