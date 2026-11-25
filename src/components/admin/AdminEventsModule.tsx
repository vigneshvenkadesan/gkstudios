'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  EVENT_CATEGORY_GROUPS,
  StudioEvent,
  StudioEventCategory,
} from '@/src/types/studio';
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

const EMPTY_EVENT: StudioEvent = {
  id: '',
  name: '',
  tamilName: '',
  category: 'wedding',
  status: 'active',
  sortOrder: 1,
};

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function AdminEventsModule() {
  const { events, packages, addEvent, updateEvent, deleteEvent } = useStudio();
  const [dialogEvent, setDialogEvent] = useState<StudioEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudioEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [events]
  );

  const openCreate = () => {
    const maxOrder = sortedEvents.reduce((max, event) => Math.max(max, event.sortOrder), 0);
    setDialogEvent({ ...EMPTY_EVENT, sortOrder: maxOrder + 1 });
    setIsCreating(true);
    setEditingOriginalId(null);
    setSlugEdited(false);
  };

  const openEdit = (event: StudioEvent) => {
    setDialogEvent({ ...event });
    setIsCreating(false);
    setEditingOriginalId(event.id);
    setSlugEdited(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setDialogEvent(null);
    setIsCreating(false);
    setEditingOriginalId(null);
  };

  const saveEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialogEvent) return;
    setIsSaving(true);
    try {
      const payload = {
        ...dialogEvent,
        id: toSlug(dialogEvent.id),
        name: dialogEvent.name.trim(),
        tamilName: dialogEvent.tamilName.trim(),
      };
      if (isCreating) {
        await addEvent(payload);
        toast.success(`Event "${payload.name}" created.`);
      } else {
        if (!editingOriginalId) throw new Error('The event being edited could not be identified.');
        await updateEvent(editingOriginalId, payload);
        toast.success(`Event "${payload.name}" updated.`);
      }
      setDialogEvent(null);
      setIsCreating(false);
      setEditingOriginalId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save event.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (event: StudioEvent) => {
    setLoadingId(event.id);
    try {
      const status = event.status === 'active' ? 'inactive' : 'active';
      await updateEvent(event.id, { status });
      toast.success(`Event and linked packages are now ${status}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update event status.');
    } finally {
      setLoadingId(null);
    }
  };

  const moveEvent = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sortedEvents.length || loadingId) return;
    const current = sortedEvents[index];
    const neighbor = sortedEvents[nextIndex];
    setLoadingId(current.id);
    try {
      await updateEvent(current.id, { sortOrder: neighbor.sortOrder });
      await updateEvent(neighbor.id, { sortOrder: current.sortOrder });
      toast.success('Event order updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reorder events.');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setLoadingId(pendingDelete.id);
    try {
      await deleteEvent(pendingDelete.id);
      toast.success(`Event "${pendingDelete.name}" deleted.`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete event.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <Card className="border-[#C5B378]/25 bg-[#092E2B] text-[#E6ECEB]">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl text-white">Events</CardTitle>
            <CardDescription className="mt-1 text-[#E6ECEB]/65">
              Manage the live event catalog and its linked packages.
            </CardDescription>
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          {sortedEvents.length === 0 ? (
            <p className="rounded-md border border-[#C5B378]/15 bg-[#072421] p-5 text-sm text-[#E6ECEB]/70">
              No events have been added yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#C5B378]/20 text-xs uppercase tracking-wide text-[#D8C78E]">
                    <th className="px-3 py-3">Order</th>
                    <th className="px-3 py-3">Event</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Packages</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((event, index) => {
                    const packageCount = packages.filter((pkg) => pkg.eventId === event.id).length;
                    return (
                      <tr key={event.id} className="border-b border-[#C5B378]/10 last:border-0">
                        <td className="px-3 py-3 font-mono text-[#D8C78E]">
                          {String(event.sortOrder).padStart(2, '0')}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-white">{event.name}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-[#E6ECEB]/45">{event.id}</div>
                        </td>
                        <td className="px-3 py-3 text-[#E6ECEB]/80">
                          {EVENT_CATEGORY_GROUPS.find((group) => group.id === event.category)?.label || event.category}
                        </td>
                        <td className="px-3 py-3 tabular-nums">{packageCount}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleStatus(event)}
                            disabled={loadingId === event.id}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                              event.status === 'active'
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                                : 'border-white/15 bg-white/5 text-white/60'
                            }`}
                          >
                            {event.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Move ${event.name} up`}
                              disabled={index === 0 || Boolean(loadingId)}
                              onClick={() => void moveEvent(index, -1)}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Move ${event.name} down`}
                              disabled={index === sortedEvents.length - 1 || Boolean(loadingId)}
                              onClick={() => void moveEvent(index, 1)}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${event.name}`} onClick={() => openEdit(event)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${event.name}`}
                              onClick={() => setPendingDelete(event)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-300" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(dialogEvent)} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{isCreating ? 'Create Event' : 'Edit Event'}</DialogTitle>
            <DialogDescription className="text-[#E6ECEB]/65">
              Event ordering is reflected in all linked packages.
            </DialogDescription>
          </DialogHeader>
          {dialogEvent && (
            <form onSubmit={saveEvent} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-[#D8C78E]">
                  Event name *
                  <input
                    required
                    value={dialogEvent.name}
                    onChange={(event) => setDialogEvent((current) => current && {
                      ...current,
                      name: event.target.value,
                      id: isCreating && !slugEdited ? toSlug(event.target.value) : current.id,
                    })}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-1 text-xs text-[#D8C78E]">
                  Event ID (slug) *
                  <input
                    required
                    value={dialogEvent.id}
                    onChange={(event) => {
                      setSlugEdited(true);
                      setDialogEvent((current) => current && { ...current, id: toSlug(event.target.value) });
                    }}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white"
                  />
                </label>
                <label className="space-y-1 text-xs text-[#D8C78E]">
                  Category *
                  <select
                    required
                    value={dialogEvent.category}
                    onChange={(event) => setDialogEvent((current) => current && {
                      ...current,
                      category: event.target.value as StudioEventCategory,
                    })}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white"
                  >
                    {EVENT_CATEGORY_GROUPS.map((category) => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-[#D8C78E]">
                  Sort order *
                  <input
                    required
                    type="number"
                    min={1}
                    step={1}
                    value={dialogEvent.sortOrder}
                    onChange={(event) => setDialogEvent((current) => current && {
                      ...current,
                      sortOrder: Number(event.target.value),
                    })}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white"
                  />
                </label>
                <label className="space-y-1 text-xs text-[#D8C78E]">
                  Status
                  <select
                    value={dialogEvent.status}
                    onChange={(event) => setDialogEvent((current) => current && {
                      ...current,
                      status: event.target.value as StudioEvent['status'],
                    })}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditor} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Event'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open && !loadingId) setPendingDelete(null); }}>
        <DialogContent className="border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete event?</DialogTitle>
            <DialogDescription className="text-[#E6ECEB]/70">
              {pendingDelete
                ? `Delete "${pendingDelete.name}"? Events with linked packages cannot be deleted.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)} disabled={Boolean(loadingId)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={Boolean(loadingId)}>
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
