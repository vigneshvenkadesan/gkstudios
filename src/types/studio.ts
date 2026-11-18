export type EventCategory =
  | 'Iyer Weddings'
  | 'Temple Weddings'
  | 'Hindu, Christian & Muslim Weddings'
  | 'Kaathu Kuthi'
  | 'Birthdays & Milestones'
  | 'Outdoor Shoots';

export const EVENT_CATEGORIES: EventCategory[] = [
  'Iyer Weddings',
  'Temple Weddings',
  'Hindu, Christian & Muslim Weddings',
  'Kaathu Kuthi',
  'Birthdays & Milestones',
  'Outdoor Shoots',
];

export type BookingStatus = 'Pending' | 'Acknowledged' | 'Confirmed' | 'Declined';

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

export interface StudioPackage {
  id: string;
  name: string;
  audience: string;
  price: number;
  priceLabel: string;
  duration: string;
  highlighted?: boolean;
  deliverables: string[];
}

export interface BookingRequest {
  id: string;
  referenceCode: string;
  clientName: string;
  phone: string;
  eventType: EventCategory;
  preferredDate: string; // YYYY-MM-DD
  endDate?: string; // Optional multi-day YYYY-MM-DD
  venue: string;
  packageId: string;
  packageName: string;
  quotedAmount: number;
  notes: string;
  status: BookingStatus;
  assignedCrew?: string;
  acknowledgementNote?: string;
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
}

export interface StudioState {
  portfolio: PortfolioItem[];
  packages: StudioPackage[];
  bookings: BookingRequest[];
  calendarEntries: CalendarDayEntry[];
  eventProjects: EventProject[];
}
