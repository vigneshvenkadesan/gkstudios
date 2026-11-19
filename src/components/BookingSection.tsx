'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Info,
  Loader2,
  MessageCircle,
  Send,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import {
  BookingRequest,
  CalendarDayEntry,
  EVENT_CATEGORIES,
  EventCategory,
  normalizeEventCategory,
} from '@/src/types/studio';
import { buildWhatsAppUrl, formatDateDisplay, formatINR, toISODate } from '@/src/lib/utils';
import { StudioCalendar } from '@/src/components/ui/calendar';
import { Button } from '@/src/components/ui/button';

interface BookingSectionProps {
  preselectedPackageId: string;
  preselectedCategory: EventCategory | null;
}

export function BookingSection({
  preselectedPackageId,
  preselectedCategory,
}: BookingSectionProps) {
  const { packages, calendarEntries, submitBooking } = useStudio();
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [monthDate, setMonthDate] = useState<Date>(() => {
    const now = new Date();
    const defaultStart = new Date(2026, 10, 1);
    return now > new Date(2026, 10, 28)
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : defaultStart;
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayIso = toISODate(new Date());
    return todayIso > '2026-11-28' ? todayIso : '2026-11-28';
  });

  const [selectedDayNote, setSelectedDayNote] = useState<CalendarDayEntry | undefined>(undefined);

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState<EventCategory>('Weddings');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [packageId, setPackageId] = useState(
    preselectedPackageId || packages[0]?.id || 'pkg-grand'
  );
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<BookingRequest | null>(null);

  useEffect(() => {
    if (preselectedPackageId) {
      setPackageId(preselectedPackageId);
    }
  }, [preselectedPackageId]);

  useEffect(() => {
    if (preselectedCategory) {
      setEventType(normalizeEventCategory(preselectedCategory));
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
    setFormError(null);
    if (entry?.status === 'Limited') {
      toast.info(`${formatDateDisplay(isoDate)} has Limited availability — ${entry.title}`);
    }
  };

  const handleDateInputChange = (isoDate: string) => {
    setSelectedDate(isoDate);
    setFormError(null);
    if (isoDate) {
      const [y, m] = isoDate.split('-').map(Number);
      if (y && m) {
        setMonthDate(new Date(y, m - 1, 1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientName.trim() || !phone.trim() || !selectedDate || !venue.trim()) {
      const msg = 'Please fill in your name, phone number, preferred date, and venue.';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      const msg = 'Please enter a valid 10-digit phone or WhatsApp number.';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const dayEntry = calendarEntryMap.get(selectedDate);
    if (dayEntry?.status === 'Booked') {
      const msg = `${formatDateDisplay(selectedDate)} is already fully booked. Please pick an Open or Limited date.`;
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitBooking({
        clientName: clientName.trim(),
        phone: phone.trim(),
        eventType,
        preferredDate: selectedDate,
        endDate: endDate && endDate >= selectedDate ? endDate : undefined,
        venue: venue.trim(),
        packageId,
        notes: notes.trim(),
      });

      setLastSubmitted(created);
      toast.success(`Inquiry ${created.referenceCode} saved! G Krishna will confirm shortly.`);
      setClientName('');
      setPhone('');
      setVenue('');
      setEndDate('');
      setNotes('');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to submit inquiry.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappAcknowledgementUrl = lastSubmitted
    ? buildWhatsAppUrl(
        STUDIO_INFO.phone,
        `Vanakkam GK Studios! I just submitted booking inquiry ${lastSubmitted.referenceCode} for ${lastSubmitted.eventType} on ${formatDateDisplay(
          lastSubmitted.preferredDate
        )} (${lastSubmitted.packageName}) at ${lastSubmitted.venue}. Name: ${
          lastSubmitted.clientName
        }.`
      )
    : '';

  const inputBaseClass =
    'h-11 w-full rounded-sm border border-[#C5B378]/28 bg-[#072421] px-3.5 text-sm text-white placeholder:text-[#E6ECEB]/38 transition-colors focus:border-[#D8C78E] focus:bg-[#061E1C] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]';

  return (
    <section
      id="availability"
      className="scroll-mt-16 sm:scroll-mt-[72px] bg-[#072421] py-20 sm:py-28 border-b border-[#C5B378]/18"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Minimal Editorial Section Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl space-y-3"
        >
          <p className="text-xs font-semibold tracking-[0.24em] text-[#D8C78E]">
            LET&apos;S CREATE SOMETHING TIMELESS
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold tracking-[-0.015em] text-white leading-[1.06]">
            Your Date. Our Frames.
          </h2>
          <p className="text-sm sm:text-base text-[#E6ECEB]/78">
            Tell us about your celebration. Let&apos;s make it unforgettable.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left: Live Studio Availability Calendar */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-sm border border-[#C5B378]/25 bg-[#0E423E] p-6 sm:p-7">
            <div>
              <div className="space-y-1 pb-5">
                <h3 className="flex items-center gap-2.5 font-serif text-2xl font-semibold text-white">
                  <CalendarIcon className="h-5 w-5 text-[#D8C78E] shrink-0" />
                  <span>Live Calendar</span>
                </h3>
                <p className="text-xs text-[#E6ECEB]/72">
                  Select an open or limited date below.
                </p>
              </div>

              <StudioCalendar
                monthDate={monthDate}
                onMonthChange={setMonthDate}
                entries={calendarEntries}
                selectedDate={selectedDate}
                onSelectDate={handleCalendarSelect}
              />
            </div>

            {/* Selected Date Status Strip */}
            <div className="mt-6 rounded-sm border border-[#C5B378]/25 bg-[#072421] p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium tracking-[0.06em] text-[#D8C78E]">
                  Selected Date
                </span>
                <span className="font-mono tabular-nums text-xs sm:text-sm text-white font-semibold">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              {selectedDayNote ? (
                <p className="text-xs text-amber-200 flex items-start gap-2 pt-0.5 leading-relaxed">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" />
                  <span>
                    {selectedDayNote.status}: {selectedDayNote.title}
                    {selectedDayNote.notes ? ` — ${selectedDayNote.notes}` : ''}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-[#E6ECEB]/85 pt-0.5 leading-relaxed">
                  Open — Full studio photography &amp; 4K cinema crew available on this date.
                </p>
              )}
            </div>
          </div>

          {/* Right: Booking Inquiry Form */}
          <div
            id="booking"
            className="lg:col-span-7 rounded-sm border border-[#C5B378]/25 bg-[#0E423E] p-6 sm:p-8"
          >
            <div className="space-y-1 pb-5 border-b border-[#C5B378]/15">
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                Booking Inquiry
              </h3>
              <p className="text-xs text-[#E6ECEB]/72">
                We&apos;ll confirm availability directly on WhatsApp.
              </p>
            </div>

            {lastSubmitted && (
              <div
                role="status"
                aria-live="polite"
                className="mt-6 rounded-sm border border-[#D8C78E]/45 bg-[#072421] p-5 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#D8C78E] mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-white">
                      Booking Request Submitted · Reference{' '}
                      <span className="font-mono text-[#D8C78E] tabular-nums">
                        {lastSubmitted.referenceCode}
                      </span>
                    </p>
                    <p className="text-[#E6ECEB]/80 text-xs sm:text-sm leading-relaxed">
                      Thank you, {lastSubmitted.clientName}. Your request for{' '}
                      <span className="text-white">{lastSubmitted.eventType}</span> on{' '}
                      <span className="font-mono tabular-nums text-white">
                        {formatDateDisplay(lastSubmitted.preferredDate)}
                      </span>{' '}
                      has been recorded for studio confirmation.
                    </p>
                  </div>
                </div>
                <div className="pl-8">
                  <a
                    href={whatsappAcknowledgementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-[#D8C78E] hover:text-white underline underline-offset-4 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Send reference {lastSubmitted.referenceCode} directly on WhatsApp
                  </a>
                </div>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="mt-6 rounded-sm border border-rose-400/45 bg-rose-950/50 px-4 py-3 text-xs sm:text-sm text-rose-100"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="clientName" className="block text-xs font-medium text-[#D8C78E]">
                    Client Name <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., Karthikeyan & Revathi"
                    className={inputBaseClass}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-xs font-medium text-[#D8C78E]">
                    Phone / WhatsApp Number <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 98401 23456"
                    className={`${inputBaseClass} font-mono placeholder:font-sans`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="eventType" className="block text-xs font-medium text-[#D8C78E]">
                    Ceremony / Event Type <span className="text-rose-300">*</span>
                  </label>
                  <select
                    id="eventType"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventCategory)}
                    className={`${inputBaseClass} studio-select cursor-pointer`}
                  >
                    {EVENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#072421] text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="packageId" className="block text-xs font-medium text-[#D8C78E]">
                    Selected Package <span className="text-rose-300">*</span>
                  </label>
                  <select
                    id="packageId"
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className={`${inputBaseClass} studio-select cursor-pointer`}
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id} className="bg-[#072421] text-white">
                        {pkg.name} ({formatINR(pkg.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="preferredDate"
                    className="block text-xs font-medium text-[#D8C78E]"
                  >
                    Preferred Start Date <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="preferredDate"
                    type="date"
                    required
                    min={toISODate(new Date())}
                    value={selectedDate}
                    onChange={(e) => handleDateInputChange(e.target.value)}
                    className={`${inputBaseClass} font-mono`}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="endDate" className="block text-xs font-medium text-[#D8C78E]">
                    End Date <span className="text-[#E6ECEB]/50 font-normal">(Optional Multi-Day)</span>
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    min={selectedDate || toISODate(new Date())}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${inputBaseClass} font-mono`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="venue" className="block text-xs font-medium text-[#D8C78E]">
                  Venue / Mandapam / City <span className="text-rose-300">*</span>
                </label>
                <input
                  id="venue"
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g., Sri Lakshmi Mahal, Chennai Highway, Villupuram"
                  className={inputBaseClass}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-xs font-medium text-[#D8C78E]">
                  Ceremony Notes &amp; Custom Requests
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share Muhurtham timings, specific rituals (Oonjal, Kashi Yatra, Drone coverage), or Karizma album preferences..."
                  className="w-full rounded-sm border border-[#C5B378]/28 bg-[#072421] p-3.5 text-sm text-white placeholder:text-[#E6ECEB]/38 transition-colors focus:border-[#D8C78E] focus:bg-[#061E1C] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                />
              </div>

              {/* Form Footer Summary & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#C5B378]/18 pt-5">
                <div className="text-xs sm:text-sm text-[#E6ECEB]/80">
                  <span className="text-[#E6ECEB]/60">Collection: </span>
                  <span className="font-semibold text-white">{selectedPackage?.name}</span>
                  <span aria-hidden="true" className="mx-1.5 text-[#C5B378]/50">
                    ·
                  </span>
                  <span className="font-mono tabular-nums font-medium text-[#D8C78E]">
                    {selectedPackage ? formatINR(selectedPackage.price) : ''}
                  </span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Inquiry...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Booking Inquiry
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
