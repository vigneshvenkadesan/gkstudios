'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  MessageCircle,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Send,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  BOOKING_SERVICE_OPTIONS,
  BookingRequest,
  BookingServiceOption,
  BookingStatus,
  CUSTOM_PACKAGE_ID,
  CUSTOM_PACKAGE_NAME,
  EVENT_CATEGORIES,
  EventCategory,
  StudioEvent,
} from '@/src/types/studio';
import { EventSelector } from '@/src/components/common/EventSelector';
import { buildWhatsAppUrl, formatDateDisplay, formatINR, toISODate } from '@/src/lib/utils';
import { WhatsAppTemplateModal } from '@/src/components/admin/WhatsAppTemplateModal';
import { getPackageTierInfo } from '@/src/lib/packageTiers';
import { calculateCustomizedEventPrice, calculatePackageBasePrice } from '@/src/lib/pricing';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { SubmitButton } from '@/src/components/ui/SubmitButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';

type StatusFilter = 'All' | BookingStatus;
const STATUS_FILTERS: StatusFilter[] = [
  'All',
  'In Discussion',
  'Pending',
  'Acknowledged',
  'Confirmed',
  'Declined',
];

const LEAD_SOURCE_OPTIONS = [
  'Direct Referral',
  'Phone Call',
  'Walk-in Studio Visit',
  'WhatsApp / Instagram',
  'Friend / Family Referral',
  'Website Inquiry',
  'Other Offline',
] as const;

function extract24HourTime(timeStr: string): string {
  if (!timeStr) return '';
  const match24 = timeStr.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  if (match24) return `${match24[1]}:${match24[2]}`;

  const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const period = match12[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return '';
}

function formatTimeTo12Hour(time24: string): string {
  if (!time24) return '';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1].slice(0, 2);
  if (isNaN(h)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${m} ${period}`;
}

const COMMON_EVENT_TIME_SLOTS = [
  { label: '06:00 AM (Muhurtham)', value: '06:00 AM (Morning Muhurtham)', time24: '06:00' },
  { label: '09:00 AM (Morning)', value: '09:00 AM (Morning Session)', time24: '09:00' },
  { label: '06:00 PM (Reception)', value: '06:00 PM (Evening Reception)', time24: '18:00' },
  { label: 'Full-Day Session', value: 'Full-Day / Multi-Session', time24: '06:00' },
] as const;

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'In Discussion':
      return (
        <Badge variant="inDiscussion">
          <PhoneCall className="h-3 w-3" />
          In Talks
        </Badge>
      );
    case 'Pending':
      return (
        <Badge variant="pending">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'Acknowledged':
      return (
        <Badge variant="acknowledged">
          <Send className="h-3 w-3" />
          Acknowledged
        </Badge>
      );
    case 'Confirmed':
      return (
        <Badge variant="confirmed">
          <CheckCircle2 className="h-3 w-3" />
          Confirmed
        </Badge>
      );
    case 'Declined':
      return (
        <Badge variant="declined">
          <XCircle className="h-3 w-3" />
          Declined
        </Badge>
      );
  }
}

export function AdminBookingModule() {
  const { bookings, packages, events, services, submitBooking, processBookingAction, updateBookingStatus } =
    useStudio();

  const activeEvents = useMemo(() => {
    return (events || [])
      .filter((e) => (e.status ?? 'active') === 'active')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [events]);

  const activePackages = useMemo(() => {
    return (packages || [])
      .filter((p) => (p.status ?? 'active') === 'active')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages]);

  const getPackagesForEvent = useCallback(
    (eventCatOrId?: string) => {
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
    },
    [activeEvents, activePackages]
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBooking, setActiveBooking] = useState<BookingRequest | null>(null);
  const [whatsAppModalBooking, setWhatsAppModalBooking] = useState<BookingRequest | null>(null);

  // Manage modal editable state
  const [editPackageId, setEditPackageId] = useState('');
  const [editQuote, setEditQuote] = useState<number>(0);
  const [editCrew, setEditCrew] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [processingAction, setProcessingAction] = useState<
    'confirm' | 'acknowledge' | 'inTalks' | 'decline' | null
  >(null);
  const isProcessingAction = processingAction !== null;

  // Add Direct Lead Modal state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [leadClientName, setLeadClientName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEventType, setLeadEventType] = useState<EventCategory>('Weddings');
  const [leadPreferredDate, setLeadPreferredDate] = useState(() => toISODate(new Date()));
  const [leadEndDate, setLeadEndDate] = useState('');
  const [leadEventTime, setLeadEventTime] = useState('');
  const [leadVenue, setLeadVenue] = useState('');
  const [leadPackageId, setLeadPackageId] = useState<string>(
    packages[0]?.id || CUSTOM_PACKAGE_ID
  );
  const [leadQuotedAmount, setLeadQuotedAmount] = useState<number>(packages[0]?.price ?? 0);
  const [leadSource, setLeadSource] = useState<string>('Direct Referral');
  const [leadStatus, setLeadStatus] = useState<BookingStatus>('In Discussion');
  const [leadAssignedCrew, setLeadAssignedCrew] = useState('G Krishna + Studio Unit');
  const [leadRequestedServices, setLeadRequestedServices] = useState<BookingServiceOption[]>([
    'Traditional Camera',
    'Candid Camera',
    'Traditional Video',
  ]);
  const [leadNotes, setLeadNotes] = useState('');

  const concurrentLeadCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.preferredDate === leadPreferredDate && b.status !== 'Declined'
      ).length,
    [bookings, leadPreferredDate]
  );

  const resetLeadForm = () => {
    const defaultEv = activeEvents[0]?.name || 'Weddings';
    const defaultEvId = activeEvents[0]?.id || 'wedding';
    const evPkgs = getPackagesForEvent(defaultEvId);
    const signaturePkg =
      evPkgs.find((p) => (p.sortOrder ?? 2) === 2) || evPkgs[0] || packages[0];

    setLeadClientName('');
    setLeadPhone('');
    setLeadEventType(defaultEv as EventCategory);
    setLeadPreferredDate(toISODate(new Date()));
    setLeadEndDate('');
    setLeadEventTime('');
    setLeadVenue('');
    setLeadPackageId(signaturePkg?.id || CUSTOM_PACKAGE_ID);
    setLeadQuotedAmount(signaturePkg?.price ?? 0);
    setLeadSource('Direct Referral');
    setLeadStatus('In Discussion');
    setLeadAssignedCrew('G Krishna + Studio Unit');
    setLeadRequestedServices(['Traditional Camera', 'Candid Camera', 'Traditional Video']);
    setLeadNotes('');
  };

  const handleOpenAddLead = () => {
    resetLeadForm();
    setIsAddLeadOpen(true);
  };

  const handleLeadEventTypeChange = (
    selectedId: string,
    selectedEv?: StudioEvent
  ) => {
    const evName = (selectedEv?.name || selectedId) as EventCategory;
    setLeadEventType(evName);

    // Sync Package Interest with selected Ceremony / Event Type
    const evPackages = getPackagesForEvent(selectedEv?.id || selectedId || evName);
    if (evPackages.length > 0) {
      if (leadPackageId === CUSTOM_PACKAGE_ID) {
        // Retain custom quote option if previously set
      } else {
        // Preserve selected package tier (Essential / Signature / Premium)
        const currentPkg = packages.find((p) => p.id === leadPackageId);
        const currentTier = currentPkg ? getPackageTierInfo(currentPkg).tier : 'Signature';

        const matchingTierPkg =
          evPackages.find((p) => getPackageTierInfo(p).tier === currentTier) ||
          evPackages.find((p) => (p.sortOrder ?? 2) === 2) ||
          evPackages[0];

        if (matchingTierPkg) {
          setLeadPackageId(matchingTierPkg.id);
          setLeadQuotedAmount(matchingTierPkg.price);

          // Synchronize services based on package inclusions
          const inc = matchingTierPkg.customizer?.included;
          const newServices: BookingServiceOption[] = ['Traditional Camera', 'Traditional Video'];
          if (inc?.candidPhoto || matchingTierPkg.sortOrder === 2 || matchingTierPkg.sortOrder === 3) {
            newServices.push('Candid Camera');
          }
          if (inc?.candidVideo || matchingTierPkg.sortOrder === 3) {
            newServices.push('Candid Video');
          }
          if (inc?.drone || matchingTierPkg.sortOrder === 3) {
            newServices.push('Drone');
          }
          if (inc?.ledWall) {
            newServices.push('LED Wall');
          }
          setLeadRequestedServices(newServices);
        }
      }
    }
  };

  const handleLeadPackageChange = (pkgId: string) => {
    setLeadPackageId(pkgId);
    if (pkgId === CUSTOM_PACKAGE_ID) {
      setLeadQuotedAmount(0);
      return;
    }

    const found = packages.find((p) => p.id === pkgId);
    if (found) {
      const dynamicPrice = calculatePackageBasePrice(found, services, 'halfDay');
      setLeadQuotedAmount(dynamicPrice);

      // Two-way sync: If selected package belongs to an event, update ceremony & event type
      if (found.eventId) {
        const matchedEv = activeEvents.find(
          (e) =>
            e.id.toLowerCase() === found.eventId?.toLowerCase() ||
            e.name.toLowerCase() === found.eventId?.toLowerCase() ||
            e.id.toLowerCase().replace(/[^a-z0-9]/g, '') ===
              found.eventId?.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (matchedEv) {
          setLeadEventType(matchedEv.name as EventCategory);
        }
      }

      // Synchronize services based on package inclusions
      const inc = found.customizer?.included;
      const newServices: BookingServiceOption[] = ['Traditional Camera', 'Traditional Video'];
      if (inc?.candidPhoto || found.sortOrder === 2 || found.sortOrder === 3) {
        newServices.push('Candid Camera');
      }
      if (inc?.candidVideo || found.sortOrder === 3) {
        newServices.push('Candid Video');
      }
      if (inc?.drone || found.sortOrder === 3) {
        newServices.push('Drone');
      }
      if (inc?.ledWall) {
        newServices.push('LED Wall');
      }
      setLeadRequestedServices(newServices);
    }
  };

  const toggleLeadService = (service: BookingServiceOption) => {
    setLeadRequestedServices((prev) => {
      const updated = prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service];
      // Dynamically recalculate quote for custom selection
      if (leadPackageId === CUSTOM_PACKAGE_ID) {
        const items = updated.map((svcName) => {
          let slug = 'traditional-camera';
          if (svcName === 'Traditional Video') slug = 'traditional-video';
          else if (svcName === 'Candid Camera') slug = 'candid-photography';
          else if (svcName === 'Candid Video') slug = 'candid-cinematography';
          else if (svcName === 'Drone') slug = 'drone-aerial-coverage';
          else if (svcName === 'LED Wall') slug = 'led-wall';
          else if (svcName === 'TV') slug = 'led-tv';
          return { serviceSlug: slug, quantity: 1 };
        });
        const { total } = calculateCustomizedEventPrice(items, services, 'halfDay');
        setLeadQuotedAmount(total);
      }
      return updated;
    });
  };

  const handleCreateDirectLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadClientName.trim()) {
      toast.error('Client name is required.');
      return;
    }
    if (!leadPhone.trim()) {
      toast.error('Phone number is required.');
      return;
    }
    if (!leadPreferredDate) {
      toast.error('Event date is required.');
      return;
    }
    if (!leadVenue.trim()) {
      toast.error('Venue / Location is required.');
      return;
    }

    const selectedPkg = packages.find((p) => p.id === leadPackageId);
    const resolvedPackageName =
      leadPackageId === CUSTOM_PACKAGE_ID
        ? CUSTOM_PACKAGE_NAME
        : selectedPkg?.name || CUSTOM_PACKAGE_NAME;

    // Dynamically build historical optedServices snapshot
    const activeItems: Array<{ serviceSlug: string; quantity: number }> = [];
    leadRequestedServices.forEach((s) => {
      if (s === 'Traditional Camera') activeItems.push({ serviceSlug: 'traditional-camera', quantity: 1 });
      else if (s === 'Traditional Video') activeItems.push({ serviceSlug: 'traditional-video', quantity: 1 });
      else if (s === 'Candid Camera') activeItems.push({ serviceSlug: 'candid-photography', quantity: 1 });
      else if (s === 'Candid Video') activeItems.push({ serviceSlug: 'candid-cinematography', quantity: 1 });
      else if (s === 'Drone') activeItems.push({ serviceSlug: 'drone-aerial-coverage', quantity: 1 });
      else if (s === 'LED Wall') activeItems.push({ serviceSlug: 'led-wall', quantity: 1 });
      else if (s === 'TV') activeItems.push({ serviceSlug: 'led-tv', quantity: 1 });
    });
    if (selectedPkg?.includedServices?.some((i) => i.serviceSlug === 'photo-album')) {
      const album = selectedPkg.includedServices.find((i) => i.serviceSlug === 'photo-album');
      activeItems.push({ serviceSlug: 'photo-album', quantity: album?.quantity || 30 });
    }
    const { snapshots: leadOptedServices, total: computedTotal } = calculateCustomizedEventPrice(
      activeItems,
      services,
      'halfDay'
    );
    const finalLeadAmount = Number(leadQuotedAmount) > 0 ? Number(leadQuotedAmount) : computedTotal;

    setIsCreatingLead(true);
    try {
      const created = await submitBooking({
        clientName: leadClientName.trim(),
        phone: leadPhone.trim(),
        eventType: leadEventType,
        preferredDate: leadPreferredDate,
        endDate: leadEndDate ? leadEndDate : undefined,
        eventTime: leadEventTime.trim() ? leadEventTime.trim() : undefined,
        venue: leadVenue.trim(),
        packageId: leadPackageId,
        packageName: resolvedPackageName,
        quotedAmount: finalLeadAmount,
        requestedServices: leadRequestedServices,
        durationTier: 'halfDay',
        optedServices: leadOptedServices,
        totalAmount: finalLeadAmount,
        notes: leadNotes.trim(),
        status: leadStatus,
        source: leadSource,
        assignedCrew: leadAssignedCrew.trim(),
      });

      toast.success(
        `Lead created for ${created.clientName} (Ref: ${created.referenceCode}) marked as ${created.status}.`
      );
      setIsAddLeadOpen(false);
      resetLeadForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create lead.');
    } finally {
      setIsCreatingLead(false);
    }
  };

  const openManageDialog = (booking: BookingRequest) => {
    setActiveBooking(booking);
    setEditPackageId(booking.packageId);
    setEditQuote(booking.quotedAmount);
    setEditCrew(booking.assignedCrew || 'G Krishna + Studio Unit');
    setEditEventTime(booking.eventTime || '');
    setEditNote(
      booking.acknowledgementNote ||
        'Thank you for choosing GK Studios. Date is available for your ceremony.'
    );
  };

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchesQuery =
        !q ||
        b.clientName.toLowerCase().includes(q) ||
        b.referenceCode.toLowerCase().includes(q) ||
        b.venue.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        b.eventType.toLowerCase().includes(q) ||
        (b.source && b.source.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [bookings, statusFilter, searchQuery]);

  const selectedPkg = packages.find((p) => p.id === editPackageId);

  const generatedMessage = useMemo(() => {
    if (!activeBooking) return '';
    const pkgName = selectedPkg?.name || activeBooking.packageName;
    const resolvedTime = editEventTime.trim() || activeBooking.eventTime;
    return [
      `Vanakkam ${activeBooking.clientName}!`,
      `This is G Krishna from GK STUDIOS (Creating Memories), Chennai Highway, Kandarakkottai, Panruti.`,
      `Regarding your ${activeBooking.eventType} (Ref: ${activeBooking.referenceCode}) for ${formatDateDisplay(activeBooking.preferredDate)} at ${activeBooking.venue}:`,
      resolvedTime ? `Event time: ${resolvedTime}` : '',
      activeBooking.requestedServices?.length
        ? `Requested services: ${activeBooking.requestedServices.join(', ')}`
        : '',
      `Package: ${pkgName} | Quote: ${
        editPackageId === CUSTOM_PACKAGE_ID ? 'Custom quote under discussion' : formatINR(editQuote)
      }`,
      editNote ? `Note: ${editNote}` : '',
      `Reply to lock the date or schedule a call. Contact: 7418543123.`,
    ]
      .filter(Boolean)
      .join('\n');
  }, [activeBooking, selectedPkg, editQuote, editNote, editEventTime]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      toast.success('Message template copied to clipboard.');
    } catch {
      toast.info('Select and copy the message text manually.');
    }
  };

  const handleMarkInDiscussion = async () => {
    if (!activeBooking || isProcessingAction) return;
    setProcessingAction('inTalks');
    try {
      await processBookingAction({
        bookingId: activeBooking.id,
        packageId: editPackageId,
        quotedAmount: Number(editQuote) || activeBooking.quotedAmount,
        assignedCrew: editCrew,
        eventTime: editEventTime.trim() || undefined,
        acknowledgementNote: editNote,
        nextStatus: 'In Discussion',
        blockCalendarDate: false,
      });
      toast.info(`Lead ${activeBooking.referenceCode} moved to In Talks / Discussion.`);
      setActiveBooking(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleAcknowledge = async () => {
    if (!activeBooking || isProcessingAction) return;
    setProcessingAction('acknowledge');
    try {
      await processBookingAction({
        bookingId: activeBooking.id,
        packageId: editPackageId,
        quotedAmount: Number(editQuote) || activeBooking.quotedAmount,
        assignedCrew: editCrew,
        eventTime: editEventTime.trim() || undefined,
        acknowledgementNote: editNote,
        nextStatus: 'Acknowledged',
        blockCalendarDate: true,
      });
      toast.success(`Inquiry ${activeBooking.referenceCode} acknowledged & marked Limited on calendar.`);
      setActiveBooking(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to acknowledge inquiry.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleConfirmAndBlock = async () => {
    if (!activeBooking || isProcessingAction) return;
    setProcessingAction('confirm');
    try {
      await processBookingAction({
        bookingId: activeBooking.id,
        packageId: editPackageId,
        quotedAmount: Number(editQuote) || activeBooking.quotedAmount,
        assignedCrew: editCrew,
        eventTime: editEventTime.trim() || undefined,
        acknowledgementNote: editNote,
        nextStatus: 'Confirmed',
        blockCalendarDate: true,
      });
      toast.success(
        `Booking ${activeBooking.referenceCode} confirmed! ${formatDateDisplay(activeBooking.preferredDate)} is now blocked on the live calendar.`
      );
      setActiveBooking(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm booking.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDecline = async (booking: BookingRequest) => {
    if (isProcessingAction) return;
    setProcessingAction('decline');
    try {
      await updateBookingStatus(booking.id, 'Declined');
      toast.info(`Lead ${booking.referenceCode} marked as Declined.`);
      if (activeBooking?.id === booking.id) {
        setActiveBooking(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to decline inquiry.');
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header & Action Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#0E423E] border border-[#C5B378]/25 p-4 sm:p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Leads &amp; Inquiries</h2>
            <Badge variant="neutral" className="text-xs font-mono">
              {bookings.length} Total
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#E6ECEB]/75">
            Manage online inquiries, phone calls, walk-in referrals, and ongoing client discussions.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenAddLead}
          className="shrink-0 bg-[#C5B378] text-[#072421] hover:bg-[#D8C78E] font-semibold"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Direct Lead / Referral
        </Button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#C5B378]/20 bg-[#072421] p-1">
          {STATUS_FILTERS.map((status) => {
            const count =
              status === 'All'
                ? bookings.length
                : bookings.filter((b) => b.status === status).length;
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#C5B378] text-[#072421] font-semibold'
                    : 'text-[#E6ECEB]/80 hover:text-white'
                }`}
              >
                {status} <span className="font-mono tabular-nums opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D8C78E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client, ref, venue, source..."
            className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] pl-9 pr-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings / Leads Table */}
      <div className="w-full rounded-xl border border-[#C5B378]/20 bg-[#0E423E] overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-base font-semibold text-white">No leads or inquiries match this filter</p>
            <p className="text-sm text-[#E6ECEB]/70 max-w-md mx-auto">
              Try clearing your search or add a new direct offline lead via the &ldquo;Add Direct Lead / Referral&rdquo; button above.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAddLead}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Direct Lead
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-[#072421]/60">
              <TableRow>
                <TableHead className="px-5 py-4 text-sm">Ref / Client</TableHead>
                <TableHead className="px-5 py-4 text-sm">Event &amp; Venue</TableHead>
                <TableHead className="px-5 py-4 text-sm">Event Date</TableHead>
                <TableHead className="px-5 py-4 text-sm">Package, Quote &amp; Services</TableHead>
                <TableHead className="px-5 py-4 text-sm">Status</TableHead>
                <TableHead className="px-5 py-4 text-right text-sm">Workflow Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id} className="text-base">
                  <TableCell className="px-5 py-5">
                    <p className="font-mono text-sm text-[#D8C78E] tabular-nums">
                      {booking.referenceCode}
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">{booking.clientName}</p>
                    <p className="mt-0.5 font-mono text-sm text-[#E6ECEB]/70 tabular-nums">
                      {booking.phone}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {booking.source ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-[#C5B378]/30 bg-[#C5B378]/10 text-[#D8C78E] font-medium">
                          {booking.source}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[#E6ECEB]/60 font-medium">
                          Website Inquiry
                        </span>
                      )}
                      {booking.termsAccepted && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          T&C Agreed
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base font-medium text-white">{booking.eventType}</span>
                      {(() => {
                        const ev = activeEvents.find(
                          (e) =>
                            e.name.toLowerCase() === booking.eventType.toLowerCase() ||
                            e.id.toLowerCase() === booking.eventType.toLowerCase()
                        );
                        return ev?.tamilName ? (
                          <span className="text-[11px] text-[#D8C78E] font-medium bg-[#C5B378]/15 px-1.5 py-0.5 rounded border border-[#C5B378]/25">
                            {ev.tamilName}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <p className="mt-1 text-sm text-[#E6ECEB]/75 min-w-[180px] max-w-[320px]">
                      {booking.venue}
                    </p>
                  </TableCell>
                  <TableCell className="px-5 py-5">
                    <p className="font-mono text-sm text-white tabular-nums whitespace-nowrap">
                      {formatDateDisplay(booking.preferredDate)}
                    </p>
                    {booking.eventTime && (
                      <span className="mt-1 inline-block font-mono text-xs text-[#D8C78E] bg-[#072421] px-1.5 py-0.5 rounded border border-[#C5B378]/25 tabular-nums">
                        {booking.eventTime}
                      </span>
                    )}
                    {booking.endDate && (
                      <p className="mt-1 font-mono text-xs text-[#D8C78E] tabular-nums whitespace-nowrap">
                        to {formatDateDisplay(booking.endDate)}
                      </p>
                    )}
                    {bookings.some(
                      (b) =>
                        b.id !== booking.id &&
                        b.preferredDate === booking.preferredDate &&
                        b.status !== 'Declined'
                    ) && (
                      <span className="mt-1 inline-block text-[10px] text-[#D8C78E] font-medium bg-[#C5B378]/10 px-1.5 py-0.5 rounded border border-[#C5B378]/25">
                        Concurrent Date
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-5">
                    {(() => {
                      const matchedPkg = activePackages.find((p) => p.id === booking.packageId);
                      const tier = getPackageTierInfo(
                        matchedPkg ||
                          (booking.packageSnapshot?.selectedTier === 1
                            ? 1
                            : booking.packageSnapshot?.selectedTier === 3
                            ? 3
                            : 2)
                      );
                      const formattedAmount =
                        booking.packageId === CUSTOM_PACKAGE_ID
                          ? 'Custom quote'
                          : formatINR(booking.quotedAmount);
                      const optedServices = booking.requestedServices || [];
                      return (
                        <div className="space-y-1.5 min-w-[220px] max-w-[340px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${tier.badgeClass}`}
                            >
                              {tier.tier}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {booking.packageName}
                            </span>
                            <span className="text-[#C5B378]/50 text-xs">•</span>
                            <span className="font-mono text-sm text-[#D8C78E] tabular-nums font-bold">
                              {formattedAmount}
                            </span>
                          </div>

                          {/* Opted Service(s) Display */}
                          {optedServices.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              {optedServices.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#C5B378]/35 bg-[#C5B378]/15 text-[#D8C78E]"
                                >
                                  ✓ {service}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-[#E6ECEB]/50 italic">
                              Standard Package Inclusions
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="px-5 py-5">{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="px-5 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant={
                          booking.status === 'Pending' || booking.status === 'In Discussion'
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() => openManageDialog(booking)}
                      >
                        {booking.status === 'Pending'
                          ? 'Acknowledge'
                          : booking.status === 'In Discussion'
                          ? 'Manage & Quote'
                          : 'Manage'}
                      </Button>
                      {booking.phone && (
                        <button
                          type="button"
                          onClick={() => setWhatsAppModalBooking(booking)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] hover:text-[#25D366] hover:border-[#25D366]/50 transition-colors cursor-pointer"
                          title="Open WhatsApp message templates"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Direct Lead / Offline Referral Dialog */}
      <Dialog open={isAddLeadOpen} onOpenChange={(open) => { if (!open && !isCreatingLead) setIsAddLeadOpen(false); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isCreatingLead) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isCreatingLead) e.preventDefault(); }}
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#092E2B] border-[#C5B378]/35 text-[#E6ECEB]"
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#D8C78E]" />
              <DialogTitle className="text-xl text-white">Add Direct Lead / Offline Referral</DialogTitle>
            </div>
            <DialogDescription className="text-[#E6ECEB]/80 text-xs sm:text-sm">
              Record a phone call, walk-in client, or direct friend referral currently in discussion.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDirectLead} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={leadClientName}
                  onChange={(e) => setLeadClientName(e.target.value)}
                  placeholder="e.g., Karthik Raja"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="e.g., 9842211900"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <EventSelector
                  id="admin-lead-event"
                  label="Ceremony / Event Type"
                  value={leadEventType}
                  onChange={handleLeadEventTypeChange}
                  showTamilName={true}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Lead Source / Channel
                </label>
                <select
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={leadPreferredDate}
                  onChange={(e) => setLeadPreferredDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
                {concurrentLeadCount > 0 && (
                  <p className="text-[11px] text-[#D8C78E] mt-1">
                    ✓ {concurrentLeadCount} existing booking(s) on this date (Concurrent crew allowed)
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={leadEndDate}
                  onChange={(e) => setLeadEndDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            {/* Interactive Time Picker & Quick Slots */}
            <div className="space-y-1.5 rounded-lg border border-[#C5B378]/25 bg-[#072421]/60 p-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Ceremony Time / Slot (Interactive Time Picker)
                </label>
                {leadEventTime && (
                  <button
                    type="button"
                    disabled={isCreatingLead}
                    onClick={() => setLeadEventTime('')}
                    className="text-[11px] text-[#C5B378]/70 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Clear Time
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative sm:w-44">
                  <input
                    type="time"
                    disabled={isCreatingLead}
                    value={extract24HourTime(leadEventTime)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLeadEventTime(val ? formatTimeTo12Hour(val) : '');
                    }}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  disabled={isCreatingLead}
                  value={leadEventTime}
                  onChange={(e) => setLeadEventTime(e.target.value)}
                  placeholder="e.g., 06:00 AM (Muhurtham) or Full-Day Session"
                  className="h-10 flex-1 rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#C5B378]/70">Quick Slots:</span>
                {COMMON_EVENT_TIME_SLOTS.map((slot) => {
                  const isSelected =
                    leadEventTime.toLowerCase().includes(slot.time24.toLowerCase()) ||
                    leadEventTime === slot.label ||
                    leadEventTime === slot.value;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      disabled={isCreatingLead}
                      onClick={() => setLeadEventTime(slot.label)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#C5B378]/25 border-[#D8C78E] text-[#D8C78E] font-semibold'
                          : 'bg-[#072421] border-[#C5B378]/20 text-[#E6ECEB]/70 hover:border-[#D8C78E]/40 hover:text-white'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">
                Venue / Mandapam / Location *
              </label>
              <input
                type="text"
                required
                value={leadVenue}
                onChange={(e) => setLeadVenue(e.target.value)}
                placeholder="e.g., Thiruvakkarai Mandapam, Panruti"
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Package Interest (Tier &amp; Live MongoDB Rate)
                </label>
                <select
                  value={leadPackageId}
                  onChange={(e) => handleLeadPackageChange(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {getPackagesForEvent(leadEventType).map((p) => {
                    const tier = getPackageTierInfo(p);
                    return (
                      <option key={p.id} value={p.id}>
                        [{tier.tier}] {p.name} — {formatINR(p.price)}
                      </option>
                    );
                  })}
                  <option value={CUSTOM_PACKAGE_ID}>{CUSTOM_PACKAGE_NAME} (To Discuss)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Quoted / Estimated Amount (₹)
                </label>
                <input
                  type="number"
                  value={leadQuotedAmount}
                  onChange={(e) => setLeadQuotedAmount(Number(e.target.value))}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Initial Pipeline Status
                </label>
                <select
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value as BookingStatus)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="In Discussion">In Talks (Actively Discussing)</option>
                  <option value="Pending">Pending (Awaiting Quote / Review)</option>
                  <option value="Acknowledged">Acknowledged (Quote Sent / Tentative)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Assigned Lead Crew
                </label>
                <input
                  type="text"
                  value={leadAssignedCrew}
                  onChange={(e) => setLeadAssignedCrew(e.target.value)}
                  placeholder="e.g., G Krishna + Studio Unit"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            {/* Services Checklist */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#D8C78E]">
                Services Requested / In Scope
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BOOKING_SERVICE_OPTIONS.map((service) => {
                  const selected = leadRequestedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleLeadService(service)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#C5B378] bg-[#C5B378]/20 text-[#D8C78E] font-medium'
                          : 'border-white/15 bg-[#072421] text-[#E6ECEB]/70 hover:text-white'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">
                Referral Notes / Discussion Summary
              </label>
              <textarea
                rows={3}
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="e.g., Friend referral from Panruti temple wedding. Client wants candid photography + drone coverage; discussing album sheets."
                className="w-full rounded-md border border-[#C5B378]/30 bg-[#072421] p-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddLeadOpen(false)}
                disabled={isCreatingLead}
              >
                Cancel
              </Button>
              <SubmitButton
                type="submit"
                isLoading={isCreatingLead}
                loadingText="Creating Lead..."
                icon={<Plus className="h-4 w-4 mr-1.5" />}
                className="bg-[#C5B378] text-[#072421] hover:bg-[#D8C78E] font-semibold"
              >
                Create Lead &amp; Start Tracking
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Acknowledge & Approve Workflow Dialog */}
      <Dialog
        open={Boolean(activeBooking)}
        onOpenChange={(open) => !open && !isProcessingAction && setActiveBooking(null)}
      >
        <DialogContent
          onPointerDownOutside={(e) => { if (isProcessingAction) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isProcessingAction) e.preventDefault(); }}
          className="max-w-2xl bg-[#092E2B] border-[#C5B378]/35 text-[#E6ECEB]"
        >
          {activeBooking && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs text-[#D8C78E] tabular-nums">
                    {activeBooking.referenceCode} · {formatDateDisplay(activeBooking.preferredDate)}
                    {activeBooking.eventTime ? ` · ${activeBooking.eventTime}` : ''}
                  </p>
                  {activeBooking.source && (
                    <span className="text-[11px] px-2 py-0.2 rounded border border-[#C5B378]/30 bg-[#C5B378]/10 text-[#D8C78E]">
                      {activeBooking.source}
                    </span>
                  )}
                  {getStatusBadge(activeBooking.status)}
                </div>
                <DialogTitle className="text-xl text-white">
                  {activeBooking.clientName} — {activeBooking.eventType}
                </DialogTitle>
                <DialogDescription className="text-[#E6ECEB]/80">
                  Venue: {activeBooking.venue} · Phone: {activeBooking.phone}
                </DialogDescription>
              </DialogHeader>

              {activeBooking.termsAccepted ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-emerald-300">Terms & Conditions Accepted</span>
                    {activeBooking.termsVersion && (
                      <span className="ml-1 text-emerald-400/80">· v{activeBooking.termsVersion}</span>
                    )}
                    {activeBooking.termsAcceptedAt && (
                      <span className="ml-1 text-emerald-400/80">
                        on {new Date(activeBooking.termsAcceptedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-300">
                  <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Terms & Conditions: Unrecorded / Direct inquiry (requires verbal or written guidelines agreement)
                  </span>
                </div>
              )}

              {activeBooking.notes && (
                <div className="rounded-lg border border-[#C5B378]/20 bg-[#072421] p-3 text-xs text-[#E6ECEB]/85">
                  <span className="font-semibold text-[#D8C78E]">Client Notes / Discussion: </span>
                  {activeBooking.notes}
                </div>
              )}

              {activeBooking.requestedServices?.length ? (
                <div className="rounded-lg border border-[#C5B378]/20 bg-[#072421] p-3 text-xs text-[#E6ECEB]/85">
                  <span className="font-semibold text-[#D8C78E]">Requested services: </span>
                  {activeBooking.requestedServices.join(', ')}
                </div>
              ) : null}

              {/* Inquired Plan Breakdown (from Live Proposal Intake) */}
              <div className="rounded-xl border border-[#C5B378]/35 bg-[#072421] p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                      Inquiry Plan &amp; Live Customizer Breakdown
                    </span>
                    {activeBooking.packageSnapshot?.selectedTier && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          getPackageTierInfo(activeBooking.packageSnapshot.selectedTier).badgeClass
                        }`}
                      >
                        {getPackageTierInfo(activeBooking.packageSnapshot.selectedTier).tier}
                      </span>
                    )}
                  </div>
                  {activeBooking.eventTime && (
                    <span className="font-mono text-xs text-[#D8C78E] bg-[#092E2B] px-2 py-0.5 rounded border border-[#C5B378]/25">
                      Time: {activeBooking.eventTime}
                    </span>
                  )}
                </div>

                {activeBooking.packageSnapshot ? (
                  <div className="space-y-1.5 text-xs text-[#E6ECEB]/85">
                    <div className="flex items-center justify-between">
                      <span>
                        Base Plan:{' '}
                        <strong>
                          {activeBooking.packageSnapshot.basePackageName || activeBooking.packageName}
                        </strong>
                      </span>
                      <span className="font-mono text-[#D8C78E] font-bold">
                        {formatINR(activeBooking.packageSnapshot.basePrice || activeBooking.quotedAmount)}
                      </span>
                    </div>

                    {activeBooking.packageSnapshot.customizerState?.additions?.length ? (
                      <div className="text-[11px] text-emerald-300 flex flex-wrap gap-1 items-center">
                        <span className="font-semibold text-emerald-400">Added Upgrades:</span>
                        {activeBooking.packageSnapshot.customizerState.additions.map((add, i) => (
                          <span
                            key={i}
                            className="bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded"
                          >
                            +{add}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {activeBooking.packageSnapshot.customizerState?.exclusions?.length ? (
                      <div className="text-[11px] text-amber-300 flex flex-wrap gap-1 items-center">
                        <span className="font-semibold text-amber-400">Excluded Deductions:</span>
                        {activeBooking.packageSnapshot.customizerState.exclusions.map((ex, i) => (
                          <span
                            key={i}
                            className="bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded"
                          >
                            -{ex}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between pt-1 border-t border-white/10 font-bold">
                      <span className="text-[#D8C78E]">Inquired Live Total Rate:</span>
                      <span className="font-mono text-sm text-emerald-400 font-extrabold">
                        {formatINR(activeBooking.quotedAmount)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span>
                      Inquired Package: <strong>{activeBooking.packageName}</strong>
                    </span>
                    <span className="font-mono text-sm text-[#D8C78E] font-bold">
                      {formatINR(activeBooking.quotedAmount)}
                    </span>
                  </div>
                )}

                {/* Opted Services in Manage Modal */}
                {activeBooking.requestedServices && activeBooking.requestedServices.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[#D8C78E] font-semibold text-[11px]">Opted Services:</span>
                    {activeBooking.requestedServices.map((svc, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#C5B378]/35 bg-[#C5B378]/15 text-[#D8C78E]"
                      >
                        ✓ {svc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Instant 3-Tier Switcher Bar (Live MongoDB Rates) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Switch Base Tier for {activeBooking.eventType} (Live MongoDB Rates)
                  </label>
                  <span className="text-[10px] text-[#E6ECEB]/60">Click tier to update quote instantly</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {getPackagesForEvent(activeBooking.eventType)
                    .filter((p) => (p.sortOrder ?? 2) >= 1 && (p.sortOrder ?? 2) <= 3)
                    .map((p) => {
                      const tierInfo = getPackageTierInfo(p);
                      const isSelected = editPackageId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isProcessingAction}
                          onClick={() => {
                            setEditPackageId(p.id);
                            setEditQuote(p.price);
                          }}
                          className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#D8C78E] bg-[#114A45] ring-2 ring-[#D8C78E] shadow-md'
                              : 'border-[#C5B378]/25 bg-[#072421] hover:border-[#D8C78E]/60 hover:bg-[#0E423E]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${tierInfo.badgeClass}`}
                            >
                              {tierInfo.tier}
                            </span>
                            {isSelected && <span className="text-[10px] text-[#D8C78E] font-bold">✓ Active</span>}
                          </div>
                          <p className="font-serif text-xs font-bold text-white mt-1 truncate">{p.name}</p>
                          <p className="font-mono text-xs font-extrabold text-[#D8C78E] mt-0.5">
                            {formatINR(p.price)}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Assigned Package Dropdown
                  </label>
                  <select
                    disabled={isProcessingAction}
                    value={editPackageId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setEditPackageId(nextId);
                      const found = packages.find((p) => p.id === nextId);
                      setEditQuote(found?.price ?? 0);
                    }}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                  >
                    {getPackagesForEvent(activeBooking.eventType).map((p) => {
                      const tier = getPackageTierInfo(p);
                      return (
                        <option key={p.id} value={p.id}>
                          [{tier.tier}] {p.name} ({formatINR(p.price)})
                        </option>
                      );
                    })}
                    <option value={CUSTOM_PACKAGE_ID}>{CUSTOM_PACKAGE_NAME}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Studio Quote (INR)
                  </label>
                  <input
                    type="number"
                    disabled={isProcessingAction}
                    value={editQuote}
                    onChange={(e) => setEditQuote(Number(e.target.value))}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Interactive Time Picker & Quick Slots for Manage Dialog */}
              <div className="space-y-1.5 rounded-lg border border-[#C5B378]/25 bg-[#072421]/60 p-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Ceremony Time / Slot (Interactive Time Picker)
                  </label>
                  {editEventTime && (
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => setEditEventTime('')}
                      className="text-[11px] text-[#C5B378]/70 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      Clear Time
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative sm:w-44">
                    <input
                      type="time"
                      disabled={isProcessingAction}
                      value={extract24HourTime(editEventTime)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditEventTime(val ? formatTimeTo12Hour(val) : '');
                      }}
                      className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    disabled={isProcessingAction}
                    value={editEventTime}
                    onChange={(e) => setEditEventTime(e.target.value)}
                    placeholder="e.g., 06:00 AM (Muhurtham) or Full-Day Session"
                    className="h-10 flex-1 rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#C5B378]/70">Quick Slots:</span>
                  {COMMON_EVENT_TIME_SLOTS.map((slot) => {
                    const isSelected =
                      editEventTime.toLowerCase().includes(slot.time24.toLowerCase()) ||
                      editEventTime === slot.label ||
                      editEventTime === slot.value;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => setEditEventTime(slot.label)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#C5B378]/25 border-[#D8C78E] text-[#D8C78E] font-semibold'
                            : 'bg-[#072421] border-[#C5B378]/20 text-[#E6ECEB]/70 hover:border-[#D8C78E]/40 hover:text-white'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Assigned Crew
                  </label>
                  <input
                    type="text"
                    disabled={isProcessingAction}
                    value={editCrew}
                    onChange={(e) => setEditCrew(e.target.value)}
                    placeholder="e.g., G Krishna, Karthik, Mani"
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Acknowledgement / Discussion Note
                  </label>
                  <input
                    type="text"
                    disabled={isProcessingAction}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Pre-filled WhatsApp / SMS Template */}
              <div className="space-y-2 rounded-xl border border-[#C5B378]/25 bg-[#072421] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#D8C78E]">
                    Client Follow-Up WhatsApp / SMS Draft
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isProcessingAction}
                      onClick={handleCopyMessage}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Text
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isProcessingAction}
                      onClick={() => setWhatsAppModalBooking(activeBooking)}
                      className="cursor-pointer border-[#C5B378]/30 text-[#E6ECEB] hover:text-[#25D366] hover:border-[#25D366]/50"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-[#25D366]" />
                      Send via WhatsApp
                    </Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#E6ECEB]/90">
                  {generatedMessage}
                </pre>
              </div>

              <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isProcessingAction}
                  onClick={() => handleDecline(activeBooking)}
                >
                  {processingAction === 'decline' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    'Decline Lead'
                  )}
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  {activeBooking.status !== 'In Discussion' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isProcessingAction}
                      onClick={handleMarkInDiscussion}
                    >
                      {processingAction === 'inTalks' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
                          Mark In Talks
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isProcessingAction}
                    onClick={handleAcknowledge}
                  >
                    {processingAction === 'acknowledge' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Holding Date...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Hold Date as Limited
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isProcessingAction}
                    onClick={handleConfirmAndBlock}
                    className="bg-[#C5B378] text-[#072421] hover:bg-[#D8C78E] font-semibold"
                  >
                    {processingAction === 'confirm' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Approving &amp; Blocking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Confirm &amp; Block Date
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Multiple WhatsApp Message Templates Modal */}
      {whatsAppModalBooking && (
        <WhatsAppTemplateModal
          isOpen={Boolean(whatsAppModalBooking)}
          onClose={() => setWhatsAppModalBooking(null)}
          booking={whatsAppModalBooking}
          currentQuote={whatsAppModalBooking?.id === activeBooking?.id ? editQuote : undefined}
          currentNote={whatsAppModalBooking?.id === activeBooking?.id ? editNote : undefined}
          currentPackageId={
            whatsAppModalBooking?.id === activeBooking?.id ? editPackageId : undefined
          }
        />
      )}
    </div>
  );
}
