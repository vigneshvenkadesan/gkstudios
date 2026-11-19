'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Search,
  Send,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  BookingRequest,
  BookingStatus,
  CUSTOM_PACKAGE_ID,
  CUSTOM_PACKAGE_NAME,
} from '@/src/types/studio';
import { buildWhatsAppUrl, formatDateDisplay, formatINR } from '@/src/lib/utils';
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
const STATUS_FILTERS: StatusFilter[] = ['All', 'Pending', 'Acknowledged', 'Confirmed', 'Declined'];

function getStatusBadge(status: BookingStatus) {
  switch (status) {
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
  const { bookings, packages, processBookingAction, updateBookingStatus } = useStudio();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBooking, setActiveBooking] = useState<BookingRequest | null>(null);

  // Modal editable state
  const [editPackageId, setEditPackageId] = useState('');
  const [editQuote, setEditQuote] = useState<number>(0);
  const [editCrew, setEditCrew] = useState('');
  const [editNote, setEditNote] = useState('');

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
        b.eventType.toLowerCase().includes(q);
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
      `We have received your ${activeBooking.eventType} inquiry (Ref: ${activeBooking.referenceCode}) for ${formatDateDisplay(activeBooking.preferredDate)} at ${activeBooking.venue}.`,
      activeBooking.eventTime ? `Event time: ${activeBooking.eventTime}` : '',
      activeBooking.requestedServices?.length
        ? `Requested services: ${activeBooking.requestedServices.join(', ')}`
        : '',
      `Package: ${pkgName} | Quote: ${
        editPackageId === CUSTOM_PACKAGE_ID ? 'Custom quote to discuss' : formatINR(editQuote)
      }`,
      editNote ? `Note: ${editNote}` : '',
      `Reply to confirm your advance & lock the date. Contact: 7418543123.`,
    ]
      .filter(Boolean)
      .join('\n');
  }, [activeBooking, selectedPkg, editQuote, editNote]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      toast.success('Confirmation template copied to clipboard.');
    } catch {
      toast.info('Select and copy the message text manually.');
    }
  };

  const handleAcknowledge = async () => {
    if (!activeBooking) return;
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
    }
  };

  const handleConfirmAndBlock = async () => {
    if (!activeBooking) return;
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
    }
  };

  const handleDecline = async (booking: BookingRequest) => {
    try {
      await updateBookingStatus(booking.id, 'Declined');
      toast.info(`Inquiry ${booking.referenceCode} marked as Declined.`);
      if (activeBooking?.id === booking.id) {
        setActiveBooking(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to decline inquiry.');
    }
  };

  return (
    <div className="space-y-6">
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
            placeholder="Search client, ref, venue..."
            className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] pl-9 pr-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="w-full rounded-xl border border-[#C5B378]/20 bg-[#0E423E] overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-base font-semibold text-white">No booking requests match this filter</p>
            <p className="text-sm text-[#E6ECEB]/70">
              Try clearing your search or switching to &ldquo;All&rdquo; inquiries.
            </p>
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
                        variant={booking.status === 'Pending' ? 'default' : 'outline'}
                        onClick={() => openManageDialog(booking)}
                      >
                        {booking.status === 'Pending' ? 'Acknowledge & Book' : 'Manage'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Acknowledge & Approve Workflow Dialog */}
      <Dialog open={Boolean(activeBooking)} onOpenChange={(open) => !open && setActiveBooking(null)}>
        <DialogContent className="max-w-2xl bg-[#092E2B] border-[#C5B378]/35">
          {activeBooking && (
            <>
              <DialogHeader>
                <p className="font-mono text-xs text-[#D8C78E] tabular-nums">
                  {activeBooking.referenceCode} · {formatDateDisplay(activeBooking.preferredDate)}
                  {activeBooking.eventTime ? ` · ${activeBooking.eventTime}` : ''}
                </p>
                <DialogTitle className="text-xl text-white">
                  {activeBooking.clientName} — {activeBooking.eventType}
                </DialogTitle>
                <DialogDescription className="text-[#E6ECEB]/80">
                  Venue: {activeBooking.venue} · Phone: {activeBooking.phone}
                </DialogDescription>
              </DialogHeader>

              {activeBooking.notes && (
                <div className="rounded-lg border border-[#C5B378]/20 bg-[#072421] p-3 text-xs text-[#E6ECEB]/85">
                  <span className="font-semibold text-[#D8C78E]">Client Notes: </span>
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
                    value={editPackageId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setEditPackageId(nextId);
                      const found = packages.find((p) => p.id === nextId);
                      setEditQuote(found?.price ?? 0);
                    }}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
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
                    value={editQuote}
                    onChange={(e) => setEditQuote(Number(e.target.value))}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
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
                    value={editCrew}
                    onChange={(e) => setEditCrew(e.target.value)}
                    placeholder="e.g., G Krishna, Karthik, Mani"
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">
                    Acknowledgement / Shoot Note
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Pre-filled WhatsApp / SMS Template */}
              <div className="space-y-2 rounded-xl border border-[#C5B378]/25 bg-[#072421] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#D8C78E]">
                    Pre-Filled Client WhatsApp / SMS Template
                  </span>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={handleCopyMessage}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Text
                    </Button>
                    <a
                      href={buildWhatsAppUrl(activeBooking.phone, generatedMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" size="sm" variant="outline">
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
                  onClick={() => handleDecline(activeBooking)}
                >
                  Decline Request
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleAcknowledge}>
                    Acknowledge &amp; Hold Date
                  </Button>
                  <Button type="button" onClick={handleConfirmAndBlock}>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve &amp; Block Date
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
