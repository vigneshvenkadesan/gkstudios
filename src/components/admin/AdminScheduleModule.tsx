'use client';

import React, { useMemo, useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { CalendarDayEntry, EVENT_CATEGORIES, EventCategory } from '@/src/types/studio';
import { formatDateDisplay, toISODate } from '@/src/lib/utils';
import { StudioCalendar } from '@/src/components/ui/calendar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';

export function AdminScheduleModule() {
  const { calendarEntries, upsertCalendarEntry, removeCalendarEntry } = useStudio();
  const [monthDate, setMonthDate] = useState<Date>(() => new Date(2026, 10, 1));
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-22');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [status, setStatus] = useState<'Booked' | 'Limited'>('Booked');
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<
    EventCategory | 'Studio Maintenance' | 'Muhurtham Rush'
  >('Iyer Weddings');
  const [clientName, setClientName] = useState('');
  const [venue, setVenue] = useState('');
  const [assignedCrew, setAssignedCrew] = useState('G Krishna + Studio Unit');
  const [notes, setNotes] = useState('');

  const handleSelectDate = (isoDate: string, entry?: CalendarDayEntry) => {
    setSelectedDate(isoDate);
    if (entry) {
      setStatus(entry.status);
      setTitle(entry.title);
      setEventType(entry.eventType || 'Iyer Weddings');
      setClientName(entry.clientName || '');
      setVenue(entry.venue || '');
      setAssignedCrew(entry.assignedCrew || 'G Krishna + Studio Unit');
      setNotes(entry.notes || '');
    } else {
      setStatus('Booked');
      setTitle('');
      setEventType('Iyer Weddings');
      setClientName('');
      setVenue('');
      setAssignedCrew('G Krishna + Studio Unit');
      setNotes('');
    }
    setDialogOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !title.trim()) {
      toast.error('Please select a date and provide an event or block title.');
      return;
    }

    try {
      await upsertCalendarEntry({
        date: selectedDate,
        status,
        title: title.trim(),
        eventType,
        clientName: clientName.trim() || undefined,
        venue: venue.trim() || undefined,
        assignedCrew: assignedCrew.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success(`Schedule updated for ${formatDateDisplay(selectedDate)} (${status}).`);
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save schedule entry.');
    }
  };

  const handleClearDate = async (dateToRemove: string) => {
    try {
      await removeCalendarEntry(dateToRemove);
      setDialogOpen(false);
      toast.info(`${formatDateDisplay(dateToRemove)} is now Open / Available on the public site.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove schedule entry.');
    }
  };

  const sortedEntries = useMemo(
    () => [...calendarEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [calendarEntries]
  );

  const selectedHasEntry = calendarEntries.some((c) => c.date === selectedDate);

  return (
    <div className="space-y-6">
      {/* Full-Width Large Studio Master Calendar */}
      <Card className="bg-[#0E423E]">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#C5B378]/15 pb-5">
          <div>
            <CardTitle className="text-xl">Studio Master Schedule Planner</CardTitle>
            <CardDescription>
              Click any day cell below to view details, log an offline shoot, or block out
              Muhurtham &amp; maintenance dates.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => handleSelectDate(selectedDate || toISODate(new Date()))}
          >
            <CalendarPlus className="h-4 w-4" />
            Add Offline Booking / Block
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <StudioCalendar
            monthDate={monthDate}
            onMonthChange={setMonthDate}
            entries={calendarEntries}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            allowSelectBooked
            size="large"
          />
        </CardContent>
      </Card>

      {/* Chronological Confirmed Events & Blocks */}
      <Card className="bg-[#0E423E]">
        <CardHeader>
          <CardTitle>Chronological Studio Schedule &amp; Blocked Dates</CardTitle>
          <CardDescription>
            All confirmed events, Muhurtham rush windows, and maintenance dates synced to the
            public availability calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <p className="text-sm text-[#E6ECEB]/75 py-4">
              All upcoming dates are currently Open. Click any calendar cell above to log an offline
              booking or block.
            </p>
          ) : (
            <div className="divide-y divide-[#C5B378]/15">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.date}
                  className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-[#D8C78E] tabular-nums">
                        {formatDateDisplay(entry.date)}
                      </span>
                      <Badge variant={entry.status === 'Booked' ? 'declined' : 'pending'}>
                        {entry.status}
                      </Badge>
                      <span className="text-sm font-semibold text-white">{entry.title}</span>
                    </div>
                    <p className="text-xs text-[#E6ECEB]/75">
                      {[entry.eventType, entry.venue, entry.assignedCrew, entry.notes]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectDate(entry.date, entry)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClearDate(entry.date)}
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

      {/* Edit / Block Selected Date Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl bg-[#092E2B] border-[#C5B378]/35">
          <DialogHeader>
            <DialogTitle>Manage Date · {formatDateDisplay(selectedDate)}</DialogTitle>
            <DialogDescription>
              Updates sync immediately with the live public Availability Calendar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Target Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const nextIso = e.target.value;
                    const existing = calendarEntries.find((c) => c.date === nextIso);
                    handleSelectDate(nextIso, existing);
                  }}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Availability Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Booked' | 'Limited')}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="Booked">Booked (Unavailable)</option>
                  <option value="Limited">Limited (1 Crew Slot Remaining)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">
                Schedule Title / Block Reason *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Karthik & Meera — Offline Temple Booking"
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Category</label>
                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(
                      e.target.value as EventCategory | 'Studio Maintenance' | 'Muhurtham Rush'
                    )
                  }
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Muhurtham Rush">Muhurtham Rush</option>
                  <option value="Studio Maintenance">Studio Maintenance</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Assigned Crew</label>
                <input
                  type="text"
                  value={assignedCrew}
                  onChange={(e) => setAssignedCrew(e.target.value)}
                  placeholder="e.g., G Krishna + 2 Crew"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Client Name (Optional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client family name"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Venue (Optional)
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Mandapam / City"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">Shoot Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Muhurtham timing, drone gear checklist, or slot notes..."
                className="w-full rounded-md border border-[#C5B378]/30 bg-[#072421] p-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <DialogFooter className="sm:justify-between">
              {selectedHasEntry ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleClearDate(selectedDate)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Mark Date Open
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <CalendarPlus className="h-4 w-4" />
                  Save Schedule Entry
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
