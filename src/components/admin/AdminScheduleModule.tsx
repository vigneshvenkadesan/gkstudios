'use client';

import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarPlus,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Grid2X2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Trash2,
  Tv,
  User,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  BOOKING_SERVICE_OPTIONS,
  BookingServiceOption,
  CalendarDayEntry,
  DurationTier,
  EventCategory,
  OptedServiceSnapshot,
} from '@/src/types/studio';
import {
  calculateCustomizedEventPrice,
  calculatePackageBasePrice,
  buildOptedServicesForPackage,
  getPackageBookingServiceOptions,
  sanitizePackageDeliverables,
} from '@/src/lib/pricing';
import {
  buildWhatsAppUrl,
  formatDateDisplay,
  formatINR,
  formatTimeWithAmPm,
  toISODate,
} from '@/src/lib/utils';
import { englishOnlyName } from '@/src/lib/englishOnlyName';
import { EventTypeIcon } from '@/src/components/common/EventTypeIcon';
import { WhatsAppTemplateModal, WhatsAppRecipientDetails } from '@/src/components/admin/WhatsAppTemplateModal';
import { QuotePdfActions } from '@/src/components/admin/QuotePdfActions';
import { useEvents } from '@/src/hooks/useEvents';
import { getPackageTierInfo } from '@/src/lib/packageTiers';
import type { StudioQuotePdfData } from '@/src/lib/generateBillPdfBlob';
import { StudioCalendar } from '@/src/components/ui/calendar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { SubmitButton } from '@/src/components/ui/SubmitButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';

const SCHEDULE_SERVICE_SLUGS: Record<BookingServiceOption, string> = {
  'Traditional Camera': 'traditional-camera',
  'Candid Camera': 'candid-photography',
  'Candid Video': 'candid-cinematography',
  'Traditional Video': 'traditional-video',
  Drone: 'drone-aerial-coverage',
  TV: 'led-tv',
  'LED Wall': 'led-wall',
};

function toTimeInputValue(value?: string): string {
  const match = value?.trim().match(/(?:^|[^\d])(\d{1,2}):([0-5]\d)\s*(AM|PM)?/i);
  if (!match) return '';

  let hour = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (hour < 1 || hour > 12) return '';
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
  } else if (hour > 23) {
    return '';
  }

  return `${String(hour).padStart(2, '0')}:${match[2]}`;
}

type CalendarView = 'day' | 'week' | 'month' | '3-months' | '6-months' | 'year';

const CALENDAR_VIEWS: Array<{ value: CalendarView; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3-months', label: 'Next 3 Months' },
  { value: '6-months', label: 'Next 6 Months' },
  { value: 'year', label: 'Yearly' },
];

export function AdminScheduleModule() {
  const {
    calendarEntries,
    bookings,
    packages,
    services,
    eventProjects,
    upsertCalendarEntry,
    removeCalendarEntry,
  } = useStudio();
  const { activeEvents } = useEvents();
  const [monthDate, setMonthDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [editingEntryId, setEditingEntryId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [status, setStatus] = useState<'Booked' | 'Limited'>('Booked');
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<
    EventCategory | 'Studio Maintenance' | 'Muhurtham Rush'
  >('Weddings');
  const [clientName, setClientName] = useState('');
  const [venue, setVenue] = useState('');
  const [phone, setPhone] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [assignedCrew, setAssignedCrew] = useState('G Krishna + Studio Unit');
  const [notes, setNotes] = useState('');
  const [requestedServices, setRequestedServices] = useState<BookingServiceOption[]>([]);
  const [serviceDurationTiers, setServiceDurationTiers] = useState<Record<string, DurationTier>>({});
  const [linkedBookingId, setLinkedBookingId] = useState<string | undefined>();
  const [packageId, setPackageId] = useState<string>('');
  const [packageName, setPackageName] = useState<string>('');
  const [packageTier, setPackageTier] = useState<'Essential' | 'Signature' | 'Premium'>('Signature');
  const [totalPackageAmount, setTotalPackageAmount] = useState<number>(0);
  const [proposalEditorUrl, setProposalEditorUrl] = useState('');
  const [isCreatingProposalLink, setIsCreatingProposalLink] = useState(false);
  const [whatsAppModalBooking, setWhatsAppModalBooking] = useState<WhatsAppRecipientDetails | null>(
    null
  );

  const activePackages = useMemo(() => {
    return (packages || [])
      .filter((p) => (p.status ?? 'active') === 'active')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages]);

  const getPackagesForEvent = useMemo(() => {
    return (eventCatOrId?: string) => {
      if (!eventCatOrId) return activePackages;
      const normalized = eventCatOrId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedEvent = activeEvents.find(
        (e) =>
          e.id.toLowerCase() === normalized ||
          e.name.toLowerCase() === eventCatOrId.toLowerCase() ||
          e.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
      );
      const targetId = matchedEvent ? matchedEvent.id.toLowerCase() : normalized;
      const filtered = activePackages.filter(
        (p) =>
          (p.eventId || 'wedding').toLowerCase() === targetId ||
          (p.eventId || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
      );
      return filtered.length > 0 ? filtered : activePackages;
    };
  }, [activeEvents, activePackages]);

  const getDefaultEventType = () =>
    activeEvents.find((event) => event.id.toLowerCase() === 'wedding')?.name ||
    activeEvents[0]?.name ||
    'Weddings';

  const getEntryPaymentStatus = (entry: CalendarDayEntry) => {
    if (entry.paymentStatus) return entry.paymentStatus;
    const project = eventProjects.find(
      (p) =>
        (entry.bookingId && p.id === entry.bookingId) ||
        (entry.clientName && p.clientName.toLowerCase() === entry.clientName.toLowerCase()) ||
        (entry.date && p.eventDate === entry.date)
    );
    if (!project) return null;
    const totalPaid = project.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const agreed = Number(project.agreedAmount) || 0;
    if (agreed > 0 && totalPaid >= agreed) {
      return 'Fully Paid';
    }
    if (totalPaid > 0) {
      return `Advance Paid (${formatINR(totalPaid)})`;
    }
    return 'Payment Pending';
  };

  const getEntryTierInfo = (entry: CalendarDayEntry) => {
    if (entry.packageTier) {
      return getPackageTierInfo(
        entry.packageTier === 'Essential' ? 1 : entry.packageTier === 'Premium' ? 3 : 2
      );
    }
    const matchedBooking = entry.bookingId
      ? bookings.find((b) => b.id === entry.bookingId)
      : undefined;
    const pkgId = entry.packageId || matchedBooking?.packageId;
    const pkg = packages.find((p) => p.id === pkgId);
    if (pkg) return getPackageTierInfo(pkg);
    if (matchedBooking?.packageSnapshot?.selectedTier) {
      return getPackageTierInfo(matchedBooking.packageSnapshot.selectedTier);
    }
    return null;
  };

  const applyPackageToSchedule = (pkg: (typeof activePackages)[0]) => {
    setPackageId(pkg.id);
    setPackageName(pkg.name);
    const tierInfo = getPackageTierInfo(pkg);
    setPackageTier(tierInfo.tier);
    const dynamicPrice = calculatePackageBasePrice(pkg, services);
    setTotalPackageAmount(dynamicPrice);
    setServiceDurationTiers(
      Object.fromEntries(
        BOOKING_SERVICE_OPTIONS.map((service) => [
          SCHEDULE_SERVICE_SLUGS[service],
          pkg.includedServices?.find(
            (item) => item.serviceSlug === SCHEDULE_SERVICE_SLUGS[service]
          )?.durationTier ?? pkg.durationTier ?? 'halfDay',
        ])
      )
    );

    setRequestedServices(getPackageBookingServiceOptions(pkg, services));

    // Auto-fill crew
    if (pkg.sortOrder === 3) {
      setAssignedCrew('G Krishna (Lead) + 2 Photographers + 2 Cinematographers + Drone Pilot');
    } else if (pkg.sortOrder === 2) {
      setAssignedCrew('G Krishna (Lead) + 2 Photographers + 1 Videographer');
    } else {
      setAssignedCrew('G Krishna + Traditional Photo & Video Crew');
    }
  };

  const handleSelectDate = (isoDate: string, entry?: CalendarDayEntry) => {
    setSelectedDate(isoDate);
    setEditingEntryId(entry?.id);
    setProposalEditorUrl('');

    if (entry) {
      setStatus(entry.status);
      setTitle(entry.title);
      const matchingEvent = activeEvents.find(
        (event) => event.name === entry.eventType || event.id === entry.eventType
      );
      setEventType(
        (matchingEvent?.name || entry.eventType || getDefaultEventType()) as
          | EventCategory
          | 'Studio Maintenance'
          | 'Muhurtham Rush'
      );
      setClientName(entry.clientName || '');
      setVenue(entry.venue || '');
      setAssignedCrew(entry.assignedCrew || 'G Krishna + Studio Unit');
      setNotes(entry.notes || '');
      setLinkedBookingId(entry.bookingId);

      const matchedBooking = entry.bookingId
        ? bookings.find((b) => b.id === entry.bookingId)
        : undefined;

      setPhone(entry.phone || matchedBooking?.phone || '');
      setEventTime(entry.time || matchedBooking?.eventTime || '');
      setEndDate(entry.endDate || matchedBooking?.endDate || '');
      setEventEndTime(entry.eventEndTime || matchedBooking?.eventEndTime || '');
      setRequestedServices(
        entry.requestedServices && entry.requestedServices.length > 0
          ? entry.requestedServices
          : matchedBooking?.requestedServices && matchedBooking.requestedServices.length > 0
          ? matchedBooking.requestedServices
          : []
      );

      const foundPkgId = entry.packageId || matchedBooking?.packageId || '';
      const foundPkg = packages.find((p) => p.id === foundPkgId);
      setPackageId(foundPkgId);
      setPackageName(entry.packageName || matchedBooking?.packageName || foundPkg?.name || '');
      setPackageTier(
        entry.packageTier || (foundPkg ? getPackageTierInfo(foundPkg).tier : 'Signature')
      );
      setTotalPackageAmount(
        entry.totalPackageAmount || matchedBooking?.quotedAmount || foundPkg?.price || 0
      );
      const savedOptedServices = entry.optedServices || matchedBooking?.optedServices;
      setServiceDurationTiers(
        Object.fromEntries(
          BOOKING_SERVICE_OPTIONS.map((service) => {
            const slug = SCHEDULE_SERVICE_SLUGS[service];
            return [
              slug,
              savedOptedServices?.find((item) => item.serviceSlug === slug)?.durationTier ??
                foundPkg?.includedServices?.find((item) => item.serviceSlug === slug)?.durationTier ??
                foundPkg?.durationTier ??
                entry.durationTier ??
                matchedBooking?.durationTier ??
                'halfDay',
            ];
          })
        )
      );
    } else {
      setStatus('Booked');
      setTitle('');
      const defaultEventType = getDefaultEventType();
      setEventType(defaultEventType as EventCategory);
      setClientName('');
      setVenue('');
      setPhone('');
      setEventTime('');
      setEndDate('');
      setEventEndTime('');
      setNotes('');
      setLinkedBookingId(undefined);

      const evPkgs = getPackagesForEvent(defaultEventType);
      const signaturePkg = evPkgs.find((p) => (p.sortOrder ?? 2) === 2) || evPkgs[0];
      if (signaturePkg) {
        applyPackageToSchedule(signaturePkg);
      } else {
        setPackageId('');
        setPackageName('');
        setPackageTier('Signature');
        setTotalPackageAmount(0);
        setAssignedCrew('G Krishna + Studio Unit');
        setRequestedServices(['Traditional Camera', 'Candid Camera', 'Traditional Video']);
        setServiceDurationTiers(
          Object.fromEntries(
            BOOKING_SERVICE_OPTIONS.map((service) => [SCHEDULE_SERVICE_SLUGS[service], 'halfDay'])
          )
        );
      }
    }
    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !title.trim() || !eventType || !venue.trim() || !phone.trim()) {
      toast.error('Please provide the event title, category, venue, and phone number.');
      return;
    }

    if (endDate && endDate < selectedDate) {
      toast.error('Event end date must be on or after the start date.');
      return;
    }

    const startTimeValue = toTimeInputValue(eventTime);
    const endTimeValue = toTimeInputValue(eventEndTime);
    if (
      startTimeValue &&
      endTimeValue &&
      (!endDate || endDate === selectedDate) &&
      endTimeValue <= startTimeValue
    ) {
      toast.error('Event end time must be later than the start time.');
      return;
    }

    setIsSaving(true);
    try {
      let resolvedOptedServices: OptedServiceSnapshot[] | undefined;
      const matchedPkg = packages.find((p) => p.id === packageId);
      if (matchedPkg) {
        const includedServices = matchedPkg.includedServices?.map((item) => ({
          ...item,
          durationTier:
            serviceDurationTiers[item.serviceSlug] ??
            item.durationTier ??
            matchedPkg.durationTier ??
            'fullDay',
        }));
        resolvedOptedServices = buildOptedServicesForPackage(
          { ...matchedPkg, includedServices },
          services
        ).optedServices;
      } else if (requestedServices.length > 0) {
        const items = requestedServices.map((svcName) => {
          const slug = SCHEDULE_SERVICE_SLUGS[svcName];
          return {
            serviceSlug: slug,
            quantity: 1,
            durationTier: serviceDurationTiers[slug] ?? 'halfDay',
          };
        });
        resolvedOptedServices = calculateCustomizedEventPrice(items, services, 'halfDay').snapshots;
      }

      await upsertCalendarEntry({
        id: editingEntryId,
        date: selectedDate,
        status,
        title: title.trim(),
        eventType,
        clientName: clientName.trim() || undefined,
        venue: venue.trim() || undefined,
        phone: phone.trim() || undefined,
        time: eventTime.trim() ? formatTimeWithAmPm(eventTime) : undefined,
        endDate: endDate || undefined,
        eventEndTime: eventEndTime.trim() ? formatTimeWithAmPm(eventEndTime) : undefined,
        assignedCrew: assignedCrew.trim() || undefined,
        notes: notes.trim() || undefined,
        bookingId: linkedBookingId,
        requestedServices: requestedServices.length > 0 ? requestedServices : undefined,
        durationTier: matchedPkg?.durationTier ?? 'halfDay',
        optedServices: resolvedOptedServices,
        packageId: packageId || undefined,
        packageName: packageName || undefined,
        packageTier: packageTier || undefined,
        totalPackageAmount: totalPackageAmount || undefined,
        totalAmount: totalPackageAmount || undefined,
      });

      toast.success(`Schedule updated for ${formatDateDisplay(selectedDate)} (${status}).`);
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save schedule entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDate = async (dateToRemove: string, entryId?: string) => {
    const entriesToRemove = entryId
      ? calendarEntries.filter((entry) => entry.id === entryId)
      : calendarEntries.filter((entry) => entry.date === dateToRemove);
    const entryIds = new Set(
      [...entriesToRemove.map((entry) => entry.id), ...(entryId ? [entryId] : [])].filter(
        (id): id is string => Boolean(id)
      )
    );
    const bookingIds = new Set(
      entriesToRemove.map((entry) => entry.bookingId).filter((id): id is string => Boolean(id))
    );
    const linkedProjects = eventProjects.filter(
      (project) =>
        (project.calendarEntryId && entryIds.has(project.calendarEntryId)) ||
        (project.bookingId && bookingIds.has(project.bookingId))
    );
    linkedProjects.forEach((project) => {
      if (project.bookingId) bookingIds.add(project.bookingId);
    });
    const hasLinkedProject = linkedProjects.length > 0;
    const hasLinkedBooking = bookings.some((booking) => bookingIds.has(booking.id));
    const linkedRecords = [];
    if (hasLinkedProject) linkedRecords.push('the linked event project, its payments, and bills');
    if (hasLinkedBooking) linkedRecords.push('the original booking inquiry');
    const targetLabel = entryId
      ? 'this calendar entry'
      : `all calendar entries on ${formatDateDisplay(dateToRemove)}`;
    const linkedRecordsWarning =
      linkedRecords.length > 0
        ? ` This will also permanently delete ${linkedRecords.join(' and ')}.`
        : '';
    if (
      !window.confirm(
        `Remove ${targetLabel}?${linkedRecordsWarning} This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      await removeCalendarEntry(dateToRemove, entryId);
      setDialogOpen(false);
      toast.success(
        hasLinkedProject
          ? 'Calendar order and linked payment records deleted.'
          : `Schedule entry removed for ${formatDateDisplay(dateToRemove)}.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove schedule entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const enrichedCalendarEntries = useMemo(() => {
    return calendarEntries.map((entry) => {
      const matched = entry.bookingId
        ? bookings.find((b) => b.id === entry.bookingId)
        : bookings.find(
            (b) =>
              b.preferredDate === entry.date &&
              Boolean(entry.phone && b.phone && b.phone === entry.phone)
          );
      if (!matched) return entry;
      return {
        ...entry,
        packageName: entry.packageName || matched.packageName,
        totalPackageAmount: entry.totalPackageAmount || matched.quotedAmount,
        requestedServices:
          entry.requestedServices && entry.requestedServices.length > 0
            ? entry.requestedServices
            : matched.requestedServices,
        phone: entry.phone || matched.phone,
        venue: entry.venue || matched.venue,
        clientName: entry.clientName || matched.clientName,
        time: entry.time || matched.eventTime,
        endDate: entry.endDate || matched.endDate,
        eventEndTime: entry.eventEndTime || matched.eventEndTime,
      };
    });
  }, [calendarEntries, bookings]);

  const sortedEntries = useMemo(
    () => [...enrichedCalendarEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [enrichedCalendarEntries]
  );

  const selectedEntries = useMemo(
    () => enrichedCalendarEntries.filter((entry) => entry.date === selectedDate),
    [enrichedCalendarEntries, selectedDate]
  );

  const matchedBooking = useMemo(
    () => (linkedBookingId ? bookings.find((b) => b.id === linkedBookingId) : undefined),
    [bookings, linkedBookingId]
  );
  const scheduleOptedServiceRows = useMemo<
    Array<Pick<OptedServiceSnapshot, 'serviceSlug' | 'name' | 'quantity'>>
  >(() => {
    const savedEntry = calendarEntries.find((entry) => entry.id === editingEntryId);
    const savedOptedServices =
      savedEntry?.optedServices?.length ? savedEntry.optedServices : matchedBooking?.optedServices;
    const savedPackageId = savedEntry?.packageId || matchedBooking?.packageId;

    if (
      savedOptedServices?.length &&
      (savedPackageId === packageId || !packageId)
    ) {
      return savedOptedServices;
    }

    const selectedPackage = packages.find((pkg) => pkg.id === packageId);
    if (selectedPackage) {
      const includedServices = selectedPackage.includedServices?.map((item) => ({
        ...item,
        durationTier:
          serviceDurationTiers[item.serviceSlug] ??
          item.durationTier ??
          selectedPackage.durationTier ??
          'fullDay',
      }));
      const packageServices = buildOptedServicesForPackage(
        { ...selectedPackage, includedServices },
        services
      ).optedServices;
      if (packageServices.length) return packageServices;
    }

    if (savedOptedServices?.length) return savedOptedServices;

    return requestedServices.map((serviceName) => {
      const serviceSlug = SCHEDULE_SERVICE_SLUGS[serviceName];
      const service = services.find((item) => item.slug === serviceSlug);
      return {
        serviceSlug,
        name: service?.name || serviceName,
        quantity: 1,
      };
    });
  }, [
    calendarEntries,
    editingEntryId,
    matchedBooking,
    packageId,
    packages,
    requestedServices,
    serviceDurationTiers,
    services,
  ]);
  const calendarQuote = useMemo<StudioQuotePdfData>(() => {
    const selectedPackage = packages.find((pkg) => pkg.id === packageId);
    const packageItems = selectedPackage?.includedServices?.map((item) => ({
      ...item,
      durationTier:
        serviceDurationTiers[item.serviceSlug] ??
        item.durationTier ??
        selectedPackage.durationTier ??
        'halfDay',
    }));
    const customItems = requestedServices.map((service) => {
      const serviceSlug = SCHEDULE_SERVICE_SLUGS[service];
      return {
        serviceSlug,
        quantity: 1,
        durationTier: serviceDurationTiers[serviceSlug] ?? 'halfDay',
      };
    });
    const { snapshots, total } = calculateCustomizedEventPrice(
      packageItems?.length ? packageItems : customItems,
      services,
      selectedPackage?.durationTier ?? 'halfDay'
    );
    const deliverables = sanitizePackageDeliverables(
      selectedPackage?.deliverables ?? matchedBooking?.packageSnapshot?.deliverables
    );
    const quoteId = editingEntryId || matchedBooking?.referenceCode || selectedDate;

    return {
      quoteNumber: `GKS-Q-CAL-${quoteId.replace(/[^a-zA-Z0-9-]/g, '').slice(-24)}`,
      clientName: clientName.trim() || matchedBooking?.clientName || 'Client',
      clientPhone: phone.trim() || matchedBooking?.phone || '',
      eventName: englishOnlyName(eventType),
      eventDate: selectedDate,
      eventTime: eventTime.trim() ? formatTimeWithAmPm(eventTime) : 'To be confirmed',
      schedulePlan: selectedPackage?.duration || 'To be confirmed',
      ...(endDate ? { endDate } : {}),
      ...(eventEndTime.trim() ? { eventEndTime: formatTimeWithAmPm(eventEndTime) } : {}),
      venue: venue.trim() || matchedBooking?.venue || 'To be confirmed',
      packageName: packageName || selectedPackage?.name || 'Custom Plan',
      totalAmount: totalPackageAmount > 0 ? totalPackageAmount : total,
      optedServices: snapshots,
      deliverables: Object.entries(deliverables).map(([category, text]) => ({
        category: englishOnlyName(category),
        text: englishOnlyName(text),
      })),
    };
  }, [
    clientName,
    editingEntryId,
    endDate,
    eventEndTime,
    eventTime,
    eventType,
    matchedBooking,
    packageId,
    packageName,
    packages,
    phone,
    requestedServices,
    selectedDate,
    serviceDurationTiers,
    services,
    totalPackageAmount,
    venue,
  ]);

  const handleCreateProposalEditorLink = async () => {
    if (!matchedBooking) return;
    setIsCreatingProposalLink(true);
    try {
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(matchedBooking.id)}/proposal`,
        { method: 'POST' }
      );
      const result = (await response.json()) as { proposalToken?: string; error?: string };
      if (!response.ok || !result.proposalToken) {
        throw new Error(result.error || 'Could not create the proposal editor link.');
      }

      const selectedPackage = packages.find((pkg) => pkg.id === packageId);
      const eventId =
        matchedBooking.packageSnapshot?.customizerState?.eventId ||
        selectedPackage?.eventId ||
        activeEvents.find(
          (event) => event.name.toLowerCase() === matchedBooking.eventType.toLowerCase()
        )?.id ||
        'wedding';
      const durationTier =
        matchedBooking.durationTier || selectedPackage?.durationTier || 'halfDay';
      const params = new URLSearchParams({
        proposal: result.proposalToken,
        admin: '1',
        event: eventId,
        plan: durationTier === 'fullDay' ? 'full' : 'half',
        guests: matchedBooking.packageSnapshot?.customizerState?.guests || 'classic',
        tier: String(selectedPackage?.sortOrder ?? matchedBooking.packageSnapshot?.selectedTier ?? 2),
      });
      if (matchedBooking.packageId) params.set('package', matchedBooking.packageId);
      setProposalEditorUrl(`/packages/proposal?${params.toString()}`);
      toast.success('Proposal editor link is ready.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not create the proposal editor link.'
      );
    } finally {
      setIsCreatingProposalLink(false);
    }
  };

  const weekDates = useMemo(() => {
    const selected = new Date(`${selectedDate}T12:00:00`);
    const start = new Date(selected);
    start.setDate(selected.getDate() - selected.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return toISODate(date);
    });
  }, [selectedDate]);

  const rangeMonthCount =
    calendarView === '3-months' ? 3 : calendarView === '6-months' ? 6 : calendarView === 'year' ? 12 : 0;
  const rangeCalendars = useMemo(() => {
    if (!rangeMonthCount) return [];
    return Array.from({ length: rangeMonthCount }, (_, index) => {
      const monthDateInRange = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + index,
        1
      );
      const monthPrefix = `${monthDateInRange.getFullYear()}-${String(
        monthDateInRange.getMonth() + 1
      ).padStart(2, '0')}`;
      return {
        monthDate: monthDateInRange,
        entries: enrichedCalendarEntries.filter((entry) => entry.date.startsWith(monthPrefix)),
      };
    });
  }, [enrichedCalendarEntries, monthDate, rangeMonthCount]);

  const selectCalendarView = (view: CalendarView) => {
    setCalendarView(view);
    if (view === 'year') {
      setMonthDate(new Date(new Date().getFullYear(), 0, 1));
    } else if (view === '3-months' || view === '6-months') {
      const today = new Date();
      setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  };

  const moveSelectedDate = (offset: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + offset);
    const next = toISODate(date);
    setSelectedDate(next);
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <div className="space-y-6">
      {/* Full-Width Large Studio Master Calendar */}
      <Card className="bg-[#0E423E] border border-[#C5B378]/25">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#C5B378]/15 pb-5">
          <div>
            <CardTitle className="text-xl text-white font-bold">Studio Master Schedule Planner</CardTitle>
            <CardDescription className="text-[#E6ECEB]/75 text-xs sm:text-sm">
              Click any individual event to inspect camera requirements, or click the date cell to add new bookings.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => handleSelectDate(selectedDate || toISODate(new Date()))}
            className="bg-[#C5B378] text-[#072421] hover:bg-[#D8C78E] font-semibold shrink-0"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Add Offline Booking / Block
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {CALENDAR_VIEWS.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={calendarView === value ? 'default' : 'outline'}
                  onClick={() => selectCalendarView(value)}
                  className="shrink-0"
                >
                  {value === 'day' && <CalendarDays className="h-3.5 w-3.5 mr-1" />}
                  {value === 'week' && <Grid2X2 className="h-3.5 w-3.5 mr-1" />}
                  {(value === 'month' || value === '3-months' || value === '6-months' || value === 'year') && (
                    <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                  )}
                  {label}
                </Button>
              ))}
            </div>

            {(calendarView === 'day' || calendarView === 'week') && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => moveSelectedDate(calendarView === 'week' ? -7 : -1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-36 text-center font-mono text-sm font-semibold text-white">
                  {formatDateDisplay(selectedDate)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => moveSelectedDate(calendarView === 'week' ? 7 : 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {rangeMonthCount > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Previous calendar range"
                  onClick={() =>
                    setMonthDate(
                      new Date(
                        monthDate.getFullYear(),
                        monthDate.getMonth() - rangeMonthCount,
                        1
                      )
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-36 text-center font-mono text-sm font-semibold text-white">
                  {calendarView === 'year'
                    ? monthDate.getFullYear()
                    : `${monthDate.toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })} – ${new Date(
                        monthDate.getFullYear(),
                        monthDate.getMonth() + rangeMonthCount - 1,
                        1
                      ).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}`}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Next calendar range"
                  onClick={() =>
                    setMonthDate(
                      new Date(
                        monthDate.getFullYear(),
                        monthDate.getMonth() + rangeMonthCount,
                        1
                      )
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* DAY VIEW */}
          {calendarView === 'day' && (
            <div className="rounded-xl border border-[#C5B378]/20 bg-[#072421]/60 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {formatDateDisplay(selectedDate)}
                  </h3>
                  <p className="text-xs text-[#D8C78E]">
                    {selectedEntries.length} {selectedEntries.length === 1 ? 'event' : 'events'} scheduled
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSelectDate(selectedDate)}
                  className="bg-[#C5B378] text-[#072421] hover:bg-[#D8C78E] font-semibold"
                >
                  <CalendarPlus className="h-4 w-4 mr-1.5" /> Add Booking / Event
                </Button>
              </div>

              {selectedEntries.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-white">No events scheduled for this day</p>
                  <p className="text-xs text-[#E6ECEB]/60">Date is open and available for bookings.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEntries.map((entry) => (
                    <button
                      key={entry.id || `${entry.date}-${entry.title}`}
                      type="button"
                      onClick={() => handleSelectDate(entry.date, entry)}
                      className="w-full text-left rounded-xl border border-[#C5B378]/25 bg-[#092E2B] p-4 transition-all hover:border-[#D8C78E] hover:bg-[#134E49]/60 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={entry.status === 'Booked' ? 'declined' : 'pending'}>
                            {entry.status}
                          </Badge>
                          <span className="text-base font-bold text-white">{entry.title}</span>
                          {(() => {
                            const tier = getEntryTierInfo(entry);
                            return tier ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${tier.badgeClass}`}
                              >
                                {tier.tier}
                              </span>
                            ) : null;
                          })()}
                          {(() => {
                            const payStatus = getEntryPaymentStatus(entry);
                            return payStatus ? (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                  payStatus.includes('Fully Paid')
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : payStatus.includes('Advance')
                                    ? 'bg-[#C5B378]/20 text-[#D8C78E] border-[#C5B378]/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {payStatus}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {entry.time && (
                          <span className="font-mono text-xs text-[#D8C78E] bg-[#072421] px-2 py-0.5 rounded border border-[#C5B378]/20">
                            {formatTimeWithAmPm(entry.time)}
                          </span>
                        )}
                        {(entry.endDate || entry.eventEndTime) && (
                          <span className="font-mono text-xs text-[#E6ECEB]/75">
                            End:{' '}
                            {[
                              entry.endDate ? formatDateDisplay(entry.endDate) : '',
                              entry.eventEndTime ? formatTimeWithAmPm(entry.eventEndTime) : '',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </div>

                      {/* Package Name & Amount */}
                      {(entry.packageName || (entry.totalPackageAmount && entry.totalPackageAmount > 0)) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          {entry.packageName && (
                            <span className="font-semibold text-white">
                              Package: <span className="text-[#D8C78E]">{entry.packageName}</span>
                            </span>
                          )}
                          {entry.totalPackageAmount && entry.totalPackageAmount > 0 ? (
                            <>
                              <span className="text-[#C5B378]/40">•</span>
                              <span className="font-mono font-bold text-[#D8C78E]">
                                {formatINR(entry.totalPackageAmount)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      )}

                      <p className="mt-2 text-xs sm:text-sm text-[#E6ECEB]/80 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {entry.eventType && (
                          <span className="inline-flex items-center gap-1">
                            <EventTypeIcon
                              name={entry.eventType}
                              category={entry.eventType}
                              className="h-3.5 w-3.5 text-[#D8C78E]"
                            />
                            Category: {englishOnlyName(entry.eventType)}
                          </span>
                        )}
                        {entry.venue && <span>· Venue: {entry.venue}</span>}
                        {entry.clientName && <span>· Client: {entry.clientName}</span>}
                        {entry.phone && <span className="font-mono">· Phone: {entry.phone}</span>}
                        {entry.assignedCrew && <span>· Crew: {entry.assignedCrew}</span>}
                      </p>

                      {/* Opted Services Badge Section */}
                      {entry.requestedServices && entry.requestedServices.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-[#D8C78E] mr-1 flex items-center gap-1">
                            <Camera className="h-3 w-3" /> Opted Services:
                          </span>
                          {entry.requestedServices.map((svc) => (
                            <span
                              key={svc}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[#C5B378]/35 bg-[#C5B378]/15 text-[#D8C78E] font-medium"
                            >
                              ✓ {svc}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WEEK VIEW */}
          {calendarView === 'week' && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-7">
              {weekDates.map((date) => {
                const entries = enrichedCalendarEntries.filter((entry) => entry.date === date);
                return (
                  <div
                    key={date}
                    className="min-h-40 rounded-lg border border-[#C5B378]/20 bg-[#092E2B] p-3 text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <p className="text-xs font-mono font-bold text-[#D8C78E]">
                          {formatDateDisplay(date)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSelectDate(date)}
                          className="text-[10px] text-[#E6ECEB]/60 hover:text-[#D8C78E] font-bold"
                          title="Add event on this date"
                        >
                          + Add
                        </button>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {entries.slice(0, 4).map((entry) => (
                          <button
                            key={entry.id || `${entry.date}-${entry.title}`}
                            type="button"
                            onClick={() => handleSelectDate(entry.date, entry)}
                            className="w-full text-left rounded border border-white/10 bg-[#072421] p-1.5 text-xs text-white hover:border-[#D8C78E] hover:bg-[#134E49] transition-colors cursor-pointer space-y-0.5"
                          >
                            <p className="font-semibold text-[11px] truncate">{entry.title}</p>
                            {(entry.packageName || (entry.totalPackageAmount && entry.totalPackageAmount > 0)) && (
                              <p className="text-[9.5px] text-[#D8C78E] font-medium truncate">
                                {entry.packageName}
                                {entry.totalPackageAmount && entry.totalPackageAmount > 0 ? ` • ${formatINR(entry.totalPackageAmount)}` : ''}
                              </p>
                            )}
                            {entry.requestedServices && entry.requestedServices.length > 0 && (
                              <p className="text-[8.5px] text-emerald-300/90 truncate font-mono">
                                {entry.requestedServices.join(' • ')}
                              </p>
                            )}
                          </button>
                        ))}
                        {entries.length === 0 && (
                          <p className="text-xs text-[#E6ECEB]/40 py-2">Open / Available</p>
                        )}
                        {entries.length > 4 && (
                          <p className="text-xs font-semibold text-[#D8C78E]">
                            +{entries.length - 4} more
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MONTH VIEW (Large interactive clickable calendar) */}
          {calendarView === 'month' && (
            <StudioCalendar
              monthDate={monthDate}
              onMonthChange={setMonthDate}
              entries={enrichedCalendarEntries}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              allowSelectBooked
              size="large"
            />
          )}

          {rangeMonthCount > 0 && (
            <div>
              {calendarView !== 'year' && (
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#E6ECEB]/75">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm border border-[#C5B378]/35 bg-[#072421]" />
                    O · Open
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm border border-amber-400/50 bg-amber-500/20" />
                    L · Limited
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm border border-rose-400/45 bg-rose-950/60" />
                    B · Booked
                  </span>
                </div>
              )}
              <div
                className={
                  calendarView === 'year'
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                    : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
                }
              >
                {rangeCalendars.map(({ monthDate: rangeMonth, entries }) => (
                  <div
                    key={`${rangeMonth.getFullYear()}-${rangeMonth.getMonth()}`}
                    className="min-w-0 rounded-lg border border-[#C5B378]/20 bg-[#072421]/60 p-3 sm:p-4"
                  >
                    <StudioCalendar
                      monthDate={rangeMonth}
                      onMonthChange={setMonthDate}
                      entries={entries}
                      selectedDate={selectedDate}
                      onSelectDate={handleSelectDate}
                      allowSelectBooked
                      size="compact"
                      showNavigation={false}
                      showLegend={false}
                      showCellStatusLabels={calendarView !== 'year'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chronological Confirmed Events & Blocks */}
      <Card className="bg-[#0E423E] border border-[#C5B378]/25">
        <CardHeader>
          <CardTitle className="text-lg text-white font-bold">Upcoming Studio Bookings &amp; Schedules</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-[#E6ECEB]/70">
            Chronological master list of all confirmed events, dates, crew assignments, and camera units.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <p className="text-sm text-[#E6ECEB]/75 py-4">
              All upcoming dates are currently Open. Click any calendar cell above to log an offline
              booking or schedule block.
            </p>
          ) : (
            <div className="divide-y divide-[#C5B378]/15">
              {sortedEntries.map((entry, index) => (
                <div
                  key={entry.id || `${entry.date}-${entry.title}-${index}`}
                  className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-[#D8C78E] tabular-nums">
                        {formatDateDisplay(entry.date)}
                      </span>
                      {entry.time && (
                        <span className="font-mono text-[11px] text-[#E6ECEB]/80 bg-[#072421] px-1.5 py-0.5 rounded border border-white/10">
                          {formatTimeWithAmPm(entry.time)}
                        </span>
                      )}
                      {(entry.endDate || entry.eventEndTime) && (
                        <span className="font-mono text-[11px] text-[#E6ECEB]/65">
                          End:{' '}
                          {[
                            entry.endDate ? formatDateDisplay(entry.endDate) : '',
                            entry.eventEndTime ? formatTimeWithAmPm(entry.eventEndTime) : '',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                      <Badge variant={entry.status === 'Booked' ? 'declined' : 'pending'}>
                        {entry.status}
                      </Badge>
                      <span className="text-sm font-bold text-white">{entry.title}</span>
                    </div>

                    {/* Package & Quoted Rate */}
                    {(entry.packageName || (entry.totalPackageAmount && entry.totalPackageAmount > 0)) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {entry.packageName && (
                          <span className="font-semibold text-white">
                            Package: <span className="text-[#D8C78E]">{entry.packageName}</span>
                          </span>
                        )}
                        {entry.totalPackageAmount && entry.totalPackageAmount > 0 ? (
                          <>
                            <span className="text-[#C5B378]/40">•</span>
                            <span className="font-mono font-bold text-[#D8C78E]">
                              {formatINR(entry.totalPackageAmount)}
                            </span>
                          </>
                        ) : null}
                      </div>
                    )}

                    <p className="text-xs text-[#E6ECEB]/80">
                      {[entry.eventType, entry.venue, entry.assignedCrew, entry.notes]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>

                    {/* Opted Services in chronological list */}
                    {entry.requestedServices && entry.requestedServices.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-[#D8C78E] font-medium flex items-center gap-1 mr-1">
                          <Camera className="h-2.5 w-2.5" /> Opted Services:
                        </span>
                        {entry.requestedServices.map((svc) => (
                          <span
                            key={svc}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[#C5B378]/30 bg-[#C5B378]/10 text-[#D8C78E] font-medium"
                          >
                            ✓ {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectDate(entry.date, entry)}
                    >
                      View &amp; Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClearDate(entry.date, entry.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit / Manage Selected Event Details Modal */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !isSaving) setDialogOpen(false); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isSaving) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isSaving) e.preventDefault(); }}
          className="w-[95vw] max-w-3xl max-h-[92dvh] overflow-y-auto bg-[#092E2B] border-[#C5B378]/35 text-[#E6ECEB]"
        >
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#D8C78E]" />
                <DialogTitle className="text-xl text-white">
                  {editingEntryId ? 'Event & Schedule Details' : 'Add Booking / Block Date'}
                </DialogTitle>
              </div>
              <Badge variant={status === 'Booked' ? 'declined' : 'pending'}>
                {status}
              </Badge>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-[#E6ECEB]/75">
              Scheduled Date: <span className="font-mono font-semibold text-[#D8C78E]">{formatDateDisplay(selectedDate)}</span>
              {venue ? ` · ${venue}` : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Linked Booking Summary Banner (if created via Inquiry) */}
          {matchedBooking ? (
            <div className="rounded-xl border border-[#C5B378]/35 bg-[#072421] p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-[#D8C78E]">
                  Linked Inquiry Ref: {matchedBooking.referenceCode}
                </span>
                <span className="text-xs text-[#E6ECEB]/90 font-medium">
                  Package: <strong className="text-white">{matchedBooking.packageName}</strong> •{' '}
                  <span className="font-mono font-bold text-[#D8C78E]">
                    {formatINR(matchedBooking.quotedAmount)}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>Client: {matchedBooking.clientName}</span>
                {matchedBooking.phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#D8C78E]">{matchedBooking.phone}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setWhatsAppModalBooking({
                          clientName: matchedBooking.clientName,
                          phone: matchedBooking.phone,
                          eventType: matchedBooking.eventType,
                          preferredDate: matchedBooking.preferredDate,
                          venue: matchedBooking.venue,
                          referenceCode: matchedBooking.referenceCode,
                          packageId: matchedBooking.packageId,
                          packageName: matchedBooking.packageName,
                          quotedAmount: matchedBooking.quotedAmount,
                          requestedServices: matchedBooking.requestedServices,
                          notes: matchedBooking.notes,
                          acknowledgementNote: matchedBooking.acknowledgementNote,
                          eventTime: matchedBooking.eventTime,
                        })
                      }
                      className="text-[#25D366] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* Opted Services in Linked Booking Banner */}
              {matchedBooking.requestedServices && matchedBooking.requestedServices.length > 0 && (
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#D8C78E] font-semibold text-[11px] flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Opted Services:
                  </span>
                  {matchedBooking.requestedServices.map((svc) => (
                    <span
                      key={svc}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[#C5B378]/35 bg-[#C5B378]/15 text-[#D8C78E] font-medium"
                    >
                      ✓ {svc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : editingEntryId && (packageName || totalPackageAmount > 0 || requestedServices.length > 0) ? (
            <div className="rounded-xl border border-[#C5B378]/35 bg-[#072421] p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#E6ECEB]/90 font-medium">
                  {packageName ? (
                    <>
                      Package: <strong className="text-white">{packageName}</strong>
                    </>
                  ) : (
                    'Custom Plan'
                  )}
                  {totalPackageAmount > 0 && (
                    <>
                      {' '}•{' '}
                      <span className="font-mono font-bold text-[#D8C78E]">
                        {formatINR(totalPackageAmount)}
                      </span>
                    </>
                  )}
                </span>
                {clientName && <span className="text-xs text-[#E6ECEB]/80">Client: {clientName}</span>}
              </div>

              {/* Opted Services in Direct Booking Banner */}
              {requestedServices.length > 0 && (
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#D8C78E] font-semibold text-[11px] flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Opted Services:
                  </span>
                  {requestedServices.map((svc) => (
                    <span
                      key={svc}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[#C5B378]/35 bg-[#C5B378]/15 text-[#D8C78E] font-medium"
                    >
                      ✓ {svc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {eventType !== 'Studio Maintenance' && eventType !== 'Muhurtham Rush' && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#C5B378]/25 bg-[#072421] p-3">
              <QuotePdfActions
                quote={calendarQuote}
                disabled={!selectedDate || (!clientName.trim() && !matchedBooking)}
              />
              {matchedBooking &&
                matchedBooking.status !== 'Declined' &&
                (proposalEditorUrl ? (
                  <a
                    href={proposalEditorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-md border border-[#C5B378]/40 px-3 text-sm font-medium text-[#D8C78E] hover:bg-[#C5B378]/10"
                  >
                    Open proposal editor
                  </a>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateProposalEditorLink}
                    disabled={isCreatingProposalLink}
                  >
                    {isCreatingProposalLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Edit proposal / services
                  </Button>
                ))}
            </div>
          )}

          <form onSubmit={handleSaveEntry} className="space-y-4 pt-1">
            {/* SECTION 1: Event & Client Information */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Event Start Date *</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setSelectedDate(nextDate);
                    setEndDate((currentEndDate) =>
                      currentEndDate && currentEndDate < nextDate ? nextDate : currentEndDate
                    );
                  }}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Event Start Time</label>
                <input
                  type="time"
                  value={toTimeInputValue(eventTime)}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
                <p className="text-[11px] text-[#E6ECEB]/55">
                  {eventTime ? formatTimeWithAmPm(eventTime) : 'Optional'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Event End Date</label>
                <input
                  type="date"
                  min={selectedDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Event End Time</label>
                <input
                  type="time"
                  value={toTimeInputValue(eventEndTime)}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
                <p className="text-[11px] text-[#E6ECEB]/55">
                  {eventEndTime ? formatTimeWithAmPm(eventEndTime) : 'Optional'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">Availability Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Booked' | 'Limited')}
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              >
                <option value="Booked">Booked (Full Crew Deployed)</option>
                <option value="Limited">Limited (1 Slot Remaining)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">
                Event Title / Client Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Kaveri & Subramanian — Iyer Wedding & Muhurtham"
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Event Category *</label>
                <select
                  required
                  value={eventType}
                  onChange={(e) => {
                    const newType = e.target.value as
                      | EventCategory
                      | 'Studio Maintenance'
                      | 'Muhurtham Rush';
                    setEventType(newType);
                    const evPkgs = getPackagesForEvent(newType);
                    const sig = evPkgs.find((p) => (p.sortOrder ?? 2) === 2) || evPkgs[0];
                    if (sig) applyPackageToSchedule(sig);
                  }}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {!activeEvents.some((event) => event.name === eventType) &&
                    eventType !== 'Muhurtham Rush' &&
                    eventType !== 'Studio Maintenance' && (
                      <option value={eventType} className="bg-[#072421] text-white">
                        {englishOnlyName(eventType)}
                      </option>
                    )}
                  <optgroup label="Ceremonies & Events" className="bg-[#051B19] text-[#D8C78E]">
                    {activeEvents.map((ev) => (
                      <option key={ev.id} value={ev.name} className="bg-[#072421] text-white">
                        {ev.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Studio Operations" className="bg-[#051B19] text-[#D8C78E]">
                    <option value="Muhurtham Rush" className="bg-[#072421] text-amber-300">Muhurtham Rush</option>
                    <option value="Studio Maintenance" className="bg-[#072421] text-stone-300">Studio Maintenance</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Venue / Location *</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Mandapam / Hall / City"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            {/* Live MongoDB Package Tier Switcher for Selected Event */}
            {eventType !== 'Studio Maintenance' && eventType !== 'Muhurtham Rush' && (
              <div className="space-y-2 rounded-xl border border-[#C5B378]/30 bg-[#072421] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                    Package Tier (Live MongoDB Rates &amp; Crew Allocation)
                  </span>
                  <span className="text-[10px] text-[#E6ECEB]/60">Select tier to auto-configure equipment</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {getPackagesForEvent(eventType)
                    .filter((p) => (p.sortOrder ?? 2) >= 1 && (p.sortOrder ?? 2) <= 3)
                    .map((pkg) => {
                      const tier = getPackageTierInfo(pkg);
                      const isSelected = packageId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => applyPackageToSchedule(pkg)}
                          className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#D8C78E] bg-[#114A45] ring-2 ring-[#D8C78E] shadow-md'
                              : 'border-[#C5B378]/25 bg-[#092E2B] hover:border-[#D8C78E]/60 hover:bg-[#0E423E]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${tier.badgeClass}`}
                            >
                              {tier.tier}
                            </span>
                            {isSelected && <span className="text-[10px] text-[#D8C78E] font-bold">✓ Active</span>}
                          </div>
                          <p className="font-serif text-xs font-bold text-white mt-1 truncate">{pkg.name}</p>
                          <p className="font-mono text-xs font-extrabold text-[#D8C78E] mt-0.5">
                            {formatINR(pkg.price)}
                          </p>
                        </button>
                      );
                    })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-[#D8C78E]">Package Dropdown</label>
                    <select
                      value={packageId}
                      onChange={(e) => {
                        const found = packages.find((p) => p.id === e.target.value);
                        if (found) applyPackageToSchedule(found);
                      }}
                      className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                    >
                      {getPackagesForEvent(eventType).map((p) => {
                        const tier = getPackageTierInfo(p);
                        return (
                          <option key={p.id} value={p.id}>
                            [{tier.tier}] {p.name} ({formatINR(p.price)})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-[#D8C78E]">Contract / Agreed Amount (₹)</label>
                    <input
                      type="number"
                      value={totalPackageAmount}
                      onChange={(e) => setTotalPackageAmount(Number(e.target.value))}
                      className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-xs text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Client Contact Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Subramanian (Groom's Father)"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., 9842211900"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            {/* SECTION 2: DEDICATED CAMERA & EQUIPMENT REQUIREMENTS */}
            <div className="space-y-2 rounded-xl border border-[#C5B378]/30 bg-[#072421] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#D8C78E]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                    Opted Services
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#D8C78E]">
                  {scheduleOptedServiceRows.length}{' '}
                  {scheduleOptedServiceRows.length === 1 ? 'service' : 'services'} selected
                </span>
              </div>
              {scheduleOptedServiceRows.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {scheduleOptedServiceRows.map((service, index) => (
                    <span
                      key={`${service.serviceSlug}-${index}`}
                      className="inline-flex max-w-full items-center gap-1 rounded border border-[#C5B378]/20 bg-[#092E2B] px-2 py-1 text-[10px] leading-tight text-[#E6ECEB]/90"
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-[#D8C78E]" />
                      <span>{service.name}</span>
                      <span className="shrink-0 font-mono text-[#D8C78E]">×{service.quantity}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#E6ECEB]/55">No services selected for this event.</p>
              )}
            </div>

            {/* SECTION 3: Crew Assignment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">
                Assigned Studio Crew &amp; Operators
              </label>
              <input
                type="text"
                value={assignedCrew}
                onChange={(e) => setAssignedCrew(e.target.value)}
                placeholder="e.g., G Krishna (Lead Candid) + Bala (Cinema) + Mani (Traditional Video)"
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            {/* SECTION 4: Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">
                Logistics &amp; Ceremony Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Muhurtham timings, special pooja instructions, outdoor drone permission, etc."
                className="w-full rounded-md border border-[#C5B378]/30 bg-[#072421] p-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <DialogFooter className="sm:justify-between pt-2 gap-2">
              {editingEntryId ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleClearDate(selectedDate, editingEntryId)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remove Entry
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <SubmitButton
                  type="submit"
                  isLoading={isSaving}
                  loadingText="Saving..."
                  icon={<CalendarPlus className="h-4 w-4 mr-1.5" />}
                  className="bg-[#C5B378] text-[#072421] hover:bg-[#D8C78E] font-semibold"
                >
                  {editingEntryId ? 'Update Schedule Entry' : 'Save Schedule Entry'}
                </SubmitButton>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Multiple WhatsApp Message Templates Modal */}
      {whatsAppModalBooking && (
        <WhatsAppTemplateModal
          isOpen={Boolean(whatsAppModalBooking)}
          onClose={() => setWhatsAppModalBooking(null)}
          booking={whatsAppModalBooking}
        />
      )}
    </div>
  );
}
