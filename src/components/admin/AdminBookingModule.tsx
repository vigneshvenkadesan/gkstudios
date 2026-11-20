'use client';

import React, { useMemo, useState } from 'react';
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
} from '@/src/types/studio';
import { buildWhatsAppUrl, formatDateDisplay, formatINR, toISODate } from '@/src/lib/utils';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
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
  const { bookings, packages, submitBooking, processBookingAction, updateBookingStatus } =
    useStudio();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBooking, setActiveBooking] = useState<BookingRequest | null>(null);

  // Manage modal editable state
  const [editPackageId, setEditPackageId] = useState('');
  const [editQuote, setEditQuote] = useState<number>(0);
  const [editCrew, setEditCrew] = useState('');
  const [editNote, setEditNote] = useState('');
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
  const [leadPackageId, setLeadPackageId] = useState<string>(packages[1]?.id || 'pkg-grand');
  const [leadQuotedAmount, setLeadQuotedAmount] = useState<number>(packages[1]?.price || 52000);
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
    setLeadClientName('');
    setLeadPhone('');
    setLeadEventType('Weddings');
    setLeadPreferredDate(toISODate(new Date()));
    setLeadEndDate('');
    setLeadEventTime('');
    setLeadVenue('');
    setLeadPackageId(packages[1]?.id || 'pkg-grand');
    setLeadQuotedAmount(packages[1]?.price || 52000);
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

  const handleLeadPackageChange = (pkgId: string) => {
    setLeadPackageId(pkgId);
    if (pkgId === CUSTOM_PACKAGE_ID) {
      setLeadQuotedAmount(0);
    } else {
      const found = packages.find((p) => p.id === pkgId);
      if (found) setLeadQuotedAmount(found.price);
    }
  };

  const toggleLeadService = (service: BookingServiceOption) => {
    setLeadRequestedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
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
        quotedAmount: Number(leadQuotedAmount) || 0,
        requestedServices: leadRequestedServices,
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
    return [
      `Vanakkam ${activeBooking.clientName}!`,
      `This is G Krishna from GK STUDIOS (Creating Memories), Chennai Highway, Kandarakkottai, Panruti.`,
      `Regarding your ${activeBooking.eventType} (Ref: ${activeBooking.referenceCode}) for ${formatDateDisplay(activeBooking.preferredDate)} at ${activeBooking.venue}:`,
      activeBooking.eventTime ? `Event time: ${activeBooking.eventTime}` : '',
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
  }, [activeBooking, selectedPkg, editQuote, editNote]);

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
                <TableHead className="px-5 py-4 text-sm">Package / Quote</TableHead>
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
                    <p className="text-base font-medium text-white">{booking.eventType}</p>
                    <p className="mt-1 text-sm text-[#E6ECEB]/75 min-w-[180px] max-w-[320px]">
                      {booking.venue}
                    </p>
                  </TableCell>
                  <TableCell className="px-5 py-5">
                    <p className="font-mono text-sm text-white tabular-nums whitespace-nowrap">
                      {formatDateDisplay(booking.preferredDate)}
                    </p>
                    {booking.eventTime && (
                      <p className="mt-1 font-mono text-xs text-[#E6ECEB]/70 tabular-nums">
                        {booking.eventTime}
                      </p>
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
                    <p className="text-base text-white">{booking.packageName}</p>
                    <p className="mt-1 font-mono text-sm text-[#D8C78E] tabular-nums">
                      {booking.packageId === CUSTOM_PACKAGE_ID
                        ? 'Custom quote'
                        : formatINR(booking.quotedAmount)}
                    </p>
                    {booking.requestedServices?.length ? (
                      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-[#E6ECEB]/70">
                        {booking.requestedServices.join(', ')}
                      </p>
                    ) : null}
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
                        <a
                          href={buildWhatsAppUrl(
                            booking.phone,
                            `Vanakkam ${booking.clientName}! This is G Krishna from GK STUDIOS. Regarding your ${booking.eventType} on ${formatDateDisplay(
                              booking.preferredDate
                            )}:`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] hover:text-[#25D366] hover:border-[#25D366]/50 transition-colors"
                          title="Quick WhatsApp message"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
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
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#092E2B] border-[#C5B378]/35 text-[#E6ECEB]">
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
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Event Category *
                </label>
                <select
                  value={leadEventType}
                  onChange={(e) => setLeadEventType(e.target.value as EventCategory)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Time / Slot (Optional)
                </label>
                <input
                  type="text"
                  value={leadEventTime}
                  onChange={(e) => setLeadEventTime(e.target.value)}
                  placeholder="e.g., 06:00 AM Muhurtham"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
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
                  Package Interest
                </label>
                <select
                  value={leadPackageId}
                  onChange={(e) => handleLeadPackageChange(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatINR(p.price)})
                    </option>
                  ))}
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
              <Button
                type="submit"
                disabled={isCreatingLead}
                className="bg-[#C5B378] text-[#072421] hover:bg-[#D8C78E] font-semibold"
              >
                {isCreatingLead ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Creating Lead...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Lead &amp; Start Tracking
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Acknowledge & Approve Workflow Dialog */}
      <Dialog
        open={Boolean(activeBooking)}
        onOpenChange={(open) => !open && !isProcessingAction && setActiveBooking(null)}
      >
        <DialogContent className="max-w-2xl bg-[#092E2B] border-[#C5B378]/35 text-[#E6ECEB]">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Assigned Package
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
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
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
                    <a
                      href={buildWhatsAppUrl(activeBooking.phone, generatedMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" size="sm" variant="outline" disabled={isProcessingAction}>
                        <MessageCircle className="h-3.5 w-3.5" />
                        Send via WhatsApp
                      </Button>
                    </a>
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
    </div>
  );
}
