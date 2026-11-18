import React, { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, Info, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  BookingRequest,
  CalendarDayEntry,
  EVENT_CATEGORIES,
  EventCategory,
} from '@/src/types/studio';
import { formatDateDisplay, formatINR, toISODate } from '@/src/lib/utils';
import { StudioCalendar } from '@/src/components/ui/calendar';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';

interface BookingSectionProps {
  preselectedPackageId: string;
  preselectedCategory: EventCategory | null;
}

export function BookingSection({
  preselectedPackageId,
  preselectedCategory,
}: BookingSectionProps) {
  const { packages, calendarEntries, submitBooking } = useStudio();

  const [monthDate, setMonthDate] = useState<Date>(() => new Date(2026, 10, 1));
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-28');
  const [selectedDayNote, setSelectedDayNote] = useState<CalendarDayEntry | undefined>(undefined);

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState<EventCategory>('Iyer Weddings');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [packageId, setPackageId] = useState(preselectedPackageId || packages[0]?.id || 'pkg-grand');
  const [notes, setNotes] = useState('');
  const [lastSubmitted, setLastSubmitted] = useState<BookingRequest | null>(null);

  useEffect(() => {
    if (preselectedPackageId) {
      setPackageId(preselectedPackageId);
    }
  }, [preselectedPackageId]);

  useEffect(() => {
    if (preselectedCategory) {
      setEventType(preselectedCategory);
    }
  }, [preselectedCategory]);

  const calendarEntryMap = useMemo(() => {
    const map = new Map<string, CalendarDayEntry>();
    calendarEntries.forEach((e) => map.set(e.date, e));
    return map;
  }, [calendarEntries]);

  useEffect(() => {
    setSelectedDayNote(calendarEntryMap.get(selectedDate));
  }, [selectedDate, calendarEntryMap]);

  const selectedPackage = packages.find((p) => p.id === packageId) || packages[0];

  const handleCalendarSelect = (isoDate: string, entry?: CalendarDayEntry) => {
    setSelectedDate(isoDate);
    setSelectedDayNote(entry);
    if (entry?.status === 'Limited') {
      toast.info(`${formatDateDisplay(isoDate)} has Limited availability — ${entry.title}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !phone.trim() || !selectedDate || !venue.trim()) {
      toast.error('Please fill in your name, phone number, preferred date, and venue.');
      return;
    }

    const dayEntry = calendarEntryMap.get(selectedDate);
    if (dayEntry?.status === 'Booked') {
      toast.error(
        `${formatDateDisplay(selectedDate)} is already fully booked. Please pick an Open or Limited date.`
      );
      return;
    }

    const created = submitBooking({
      clientName,
      phone,
      eventType,
      preferredDate: selectedDate,
      endDate: endDate && endDate >= selectedDate ? endDate : undefined,
      venue,
      packageId,
      notes,
    });

    setLastSubmitted(created);
    toast.success(`Inquiry ${created.referenceCode} received! G Krishna will confirm shortly.`);
    setClientName('');
    setPhone('');
    setVenue('');
    setEndDate('');
    setNotes('');
  };

  return (
    <section
      id="availability"
      className="bg-[#092E2B] py-16 sm:py-20 border-b border-[#C5B378]/20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#D8C78E]">
            LIVE STUDIO SCHEDULE &amp; INQUIRY
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Check Availability &amp; Reserve Your Ceremony Date
          </h2>
          <p className="text-base text-[#E6ECEB]/80">
            Select an open date directly on our live studio calendar—synced in real time with our
            production schedule—and submit your event details below.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left: Live Availability Calendar */}
          <Card className="lg:col-span-5 flex flex-col justify-between bg-[#0E423E]">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5 text-[#D8C78E]" />
                  Live Muhurtham &amp; Shoot Calendar
                </CardTitle>
              </div>
              <CardDescription>
                Tap any Open or Limited date to select it for your booking request.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <StudioCalendar
                monthDate={monthDate}
                onMonthChange={setMonthDate}
                entries={calendarEntries}
                selectedDate={selectedDate}
                onSelectDate={handleCalendarSelect}
              />

              {/* Selected Date Context Panel */}
              <div className="rounded-lg border border-[#C5B378]/25 bg-[#092E2B] p-4 text-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#D8C78E] font-medium">Selected Date</span>
                  <span className="font-mono tabular-nums text-xs text-white font-semibold">
                    {formatDateDisplay(selectedDate)}
                  </span>
                </div>
                {selectedDayNote ? (
                  <p className="text-xs text-amber-200 flex items-start gap-2 pt-1">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" />
                    <span>
                      {selectedDayNote.status}: {selectedDayNote.title}
                      {selectedDayNote.notes ? ` — ${selectedDayNote.notes}` : ''}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-emerald-200 pt-1">
                    Full studio photography &amp; 4K cinema crew available on this date.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Booking Inquiry Form */}
          <Card id="booking" className="lg:col-span-7 bg-[#0E423E]">
            <CardHeader>
              <CardTitle className="text-xl">Booking Inquiry Form</CardTitle>
              <CardDescription>
                Submitting creates an instant booking request for GK Studios review and WhatsApp
                acknowledgement.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {lastSubmitted && (
                <div className="mb-6 rounded-xl border border-emerald-400/40 bg-emerald-950/50 p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-white">
                      Booking Request Submitted · Reference{' '}
                      <span className="font-mono text-[#D8C78E] tabular-nums">
                        {lastSubmitted.referenceCode}
                      </span>
                    </p>
                    <p className="text-[#E6ECEB]/80 text-xs leading-relaxed">
                      Thank you, {lastSubmitted.clientName}. Your request for{' '}
                      <span className="text-white">{lastSubmitted.eventType}</span> on{' '}
                      <span className="font-mono tabular-nums text-white">
                        {formatDateDisplay(lastSubmitted.preferredDate)}
                      </span>{' '}
                      is now in our Studio Admin Inbox as Pending.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="clientName" className="block text-xs font-medium text-[#D8C78E]">
                      Client Name *
                    </label>
                    <input
                      id="clientName"
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g., Karthikeyan &amp; Revathi"
                      className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="block text-xs font-medium text-[#D8C78E]">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g., 98401 23456"
                      className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white placeholder:font-sans placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="eventType" className="block text-xs font-medium text-[#D8C78E]">
                      Ceremony / Event Type *
                    </label>
                    <select
                      id="eventType"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as EventCategory)}
                      className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    >
                      {EVENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="packageId" className="block text-xs font-medium text-[#D8C78E]">
                      Selected Package *
                    </label>
                    <select
                      id="packageId"
                      value={packageId}
                      onChange={(e) => setPackageId(e.target.value)}
                      className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({formatINR(pkg.price)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="preferredDate"
                      className="block text-xs font-medium text-[#D8C78E]"
                    >
                      Preferred Start Date *
                    </label>
                    <input
                      id="preferredDate"
                      type="date"
                      required
                      min={toISODate(new Date())}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="endDate" className="block text-xs font-medium text-[#D8C78E]">
                      End Date (Optional for Multi-Day Weddings)
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      min={selectedDate || toISODate(new Date())}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="venue" className="block text-xs font-medium text-[#D8C78E]">
                    Venue / Mandapam / City *
                  </label>
                  <input
                    id="venue"
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g., Sri Lakshmi Mahal, Chennai Highway, Villupuram"
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="notes" className="block text-xs font-medium text-[#D8C78E]">
                    Ceremony Notes &amp; Custom Requests
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Share Muhurtham timings, specific rituals (Oonjal, Kashi Yatra, Drone coverage), or Karizma album preferences..."
                    className="w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] p-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#C5B378]/15 pt-4">
                  <div className="text-xs text-[#E6ECEB]/75">
                    Selected Collection:{' '}
                    <span className="font-semibold text-white">{selectedPackage?.name}</span> ·{' '}
                    <span className="font-mono tabular-nums text-[#D8C78E]">
                      {selectedPackage ? formatINR(selectedPackage.price) : ''}
                    </span>
                  </div>
                  <Button type="submit" size="lg">
                    <Send className="h-4 w-4" />
                    Submit Booking Inquiry
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
