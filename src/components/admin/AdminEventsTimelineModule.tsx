'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  IndianRupee,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  EVENT_CATEGORIES,
  EVENT_STAGES,
  EventCategory,
  EventProject,
  EventStage,
  PaymentMethod,
} from '@/src/types/studio';
import { formatDateDisplay, formatINR, toISODate } from '@/src/lib/utils';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';

type TimelineFilter = 'All' | 'In Production' | 'Balance Due' | 'Delivered';

const PAYMENT_METHODS: PaymentMethod[] = ['UPI / GPay', 'Cash', 'Bank Transfer', 'Card'];

function getProjectTotals(project: EventProject) {
  const netTotal = Math.max(0, project.agreedAmount + project.extraCharges - project.discount);
  const paidTotal = project.payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, netTotal - paidTotal);
  return { netTotal, paidTotal, balanceDue };
}

export function AdminEventsTimelineModule() {
  const {
    eventProjects,
    packages,
    createEventProject,
    updateEventStage,
    updateEventFinancials,
    addEventPayment,
    deleteEventPayment,
  } = useStudio();

  const [filter, setFilter] = useState<TimelineFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [stageNoteInput, setStageNoteInput] = useState('');
  const [editAgreed, setEditAgreed] = useState(0);
  const [editExtras, setEditExtras] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editCrew, setEditCrew] = useState('');
  const [editDeliveryNotes, setEditDeliveryNotes] = useState('');

  const [payDate, setPayDate] = useState(() => toISODate(new Date()));
  const [payLabel, setPayLabel] = useState('Booking Advance');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI / GPay');
  const [payRef, setPayRef] = useState('');

  const [newClientName, setNewClientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEventType, setNewEventType] = useState<EventCategory>('Weddings');
  const [newEventDate, setNewEventDate] = useState('2026-12-08');
  const [newVenue, setNewVenue] = useState('');
  const [newPackageName, setNewPackageName] = useState(packages[1]?.name || 'Traditional Grand Wedding');
  const [newAgreedAmount, setNewAgreedAmount] = useState(packages[1]?.price || 52000);
  const [newInitialAdvance, setNewInitialAdvance] = useState('');
  const [newCrew, setNewCrew] = useState('G Krishna + Studio Unit');

  const activeProject = useMemo(
    () => eventProjects.find((p) => p.id === activeProjectId) || null,
    [eventProjects, activeProjectId]
  );

  const openProjectDetail = (project: EventProject) => {
    setActiveProjectId(project.id);
    setStageNoteInput(project.stageUpdates[project.currentStage]?.note || '');
    setEditAgreed(project.agreedAmount);
    setEditExtras(project.extraCharges);
    setEditDiscount(project.discount);
    setEditCrew(project.assignedCrew);
    setEditDeliveryNotes(project.deliveryNotes);
    setPayAmount('');
    setPayRef('');
  };

  const summary = useMemo(() => {
    return eventProjects.reduce(
      (acc, proj) => {
        const { netTotal, paidTotal, balanceDue } = getProjectTotals(proj);
        acc.contractValue += netTotal;
        acc.collected += paidTotal;
        acc.receivable += balanceDue;
        if (proj.currentStage === 'Delivered') {
          acc.delivered += 1;
        } else {
          acc.inProgress += 1;
        }
        return acc;
      },
      { contractValue: 0, collected: 0, receivable: 0, delivered: 0, inProgress: 0 }
    );
  }, [eventProjects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return eventProjects.filter((proj) => {
      const { balanceDue } = getProjectTotals(proj);
      const matchesFilter =
        filter === 'All'
          ? true
          : filter === 'Delivered'
          ? proj.currentStage === 'Delivered'
          : filter === 'Balance Due'
          ? balanceDue > 0
          : proj.currentStage !== 'Delivered';
      const matchesSearch =
        !q ||
        proj.clientName.toLowerCase().includes(q) ||
        proj.referenceCode.toLowerCase().includes(q) ||
        proj.venue.toLowerCase().includes(q) ||
        proj.eventType.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [eventProjects, filter, searchQuery]);

  const handleSetStage = async (stage: EventStage) => {
    if (!activeProject) return;
    try {
      await updateEventStage(activeProject.id, stage, stageNoteInput.trim() || undefined);
      toast.success(`Stage updated to "${stage}" for ${activeProject.clientName}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stage.');
    }
  };

  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    try {
      await updateEventFinancials(activeProject.id, {
        agreedAmount: Number(editAgreed) || 0,
        extraCharges: Number(editExtras) || 0,
        discount: Number(editDiscount) || 0,
        assignedCrew: editCrew.trim(),
        deliveryNotes: editDeliveryNotes.trim(),
      });
      toast.success('Billing & delivery notes saved to backend.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save billing.');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    const numericAmount = Number(payAmount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Enter a valid payment amount in INR.');
      return;
    }
    try {
      await addEventPayment(activeProject.id, {
        date: payDate,
        label: payLabel.trim() || 'Installment',
        amount: numericAmount,
        method: payMethod,
        referenceNote: payRef.trim() || undefined,
      });
      toast.success(`Recorded ${formatINR(numericAmount)} payment for ${activeProject.clientName}.`);
      setPayAmount('');
      setPayRef('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newPhone.trim() || !newVenue.trim()) {
      toast.error('Please enter client name, phone, and venue.');
      return;
    }
    try {
      const created = await createEventProject({
        clientName: newClientName,
        phone: newPhone,
        eventType: newEventType,
        eventDate: newEventDate,
        venue: newVenue,
        packageName: newPackageName,
        assignedCrew: newCrew,
        agreedAmount: Number(newAgreedAmount) || 0,
        initialAdvance: Number(newInitialAdvance) || 0,
      });
      toast.success(`Created timeline project ${created.referenceCode} for ${created.clientName}.`);
      setCreateModalOpen(false);
      setNewClientName('');
      setNewPhone('');
      setNewVenue('');
      setNewInitialAdvance('');
      openProjectDetail(created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create project.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial & Production Overview Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-4">
          <p className="text-xs text-[#D8C78E]">Total Contract Value</p>
          <p className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
            {formatINR(summary.contractValue)}
          </p>
        </div>
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-4">
          <p className="text-xs text-[#D8C78E]">Payments Collected</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-300 tabular-nums">
            {formatINR(summary.collected)}
          </p>
        </div>
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-4">
          <p className="text-xs text-[#D8C78E]">Balance Receivable</p>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-300 tabular-nums">
            {formatINR(summary.receivable)}
          </p>
        </div>
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-4">
          <p className="text-xs text-[#D8C78E]">Active / Delivered Events</p>
          <p className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
            {summary.inProgress} Active · {summary.delivered} Done
          </p>
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#C5B378]/20 bg-[#072421] p-1">
          {(['All', 'In Production', 'Balance Due', 'Delivered'] as TimelineFilter[]).map((tab) => {
            const active = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#C5B378] text-[#072421] font-semibold'
                    : 'text-[#E6ECEB]/80 hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D8C78E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search client, ref, venue..."
              className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] pl-9 pr-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
            />
          </div>

          <Button type="button" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Event Project
          </Button>
        </div>
      </div>

      {/* Event Timeline Cards */}
      {filteredProjects.length === 0 ? (
        <Card className="bg-[#0E423E] p-12 text-center">
          <p className="text-base font-semibold text-white">No event projects found</p>
          <p className="mt-1 text-sm text-[#E6ECEB]/75">
            Approve a booking inquiry or click &ldquo;New Event Project&rdquo; to track timeline
            stages and payments.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredProjects.map((project) => {
            const { netTotal, paidTotal, balanceDue } = getProjectTotals(project);
            const activeStageIdx = EVENT_STAGES.indexOf(project.currentStage);

            return (
              <Card key={project.id} className="bg-[#0E423E] overflow-hidden">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-[#C5B378]/15 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs text-[#D8C78E] tabular-nums">
                        {project.referenceCode}
                      </span>
                      <Badge variant={project.currentStage === 'Delivered' ? 'confirmed' : 'acknowledged'}>
                        {project.currentStage}
                      </Badge>
                      <Badge variant={balanceDue === 0 ? 'confirmed' : 'pending'}>
                        {balanceDue === 0 ? 'Paid in Full' : `Balance ${formatINR(balanceDue)}`}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-white pt-1">
                      {project.clientName} — {project.eventType}
                    </CardTitle>
                    <CardDescription>
                      {formatDateDisplay(project.eventDate)}
                      {project.endDate ? ` to ${formatDateDisplay(project.endDate)}` : ''} ·{' '}
                      {project.venue} · {project.packageName}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 lg:text-right">
                    <div className="space-y-0.5 text-xs">
                      <p className="text-[#E6ECEB]/70">
                        Total <span className="font-mono text-white tabular-nums">{formatINR(netTotal)}</span>
                        {' · '}Paid{' '}
                        <span className="font-mono text-emerald-300 tabular-nums">
                          {formatINR(paidTotal)}
                        </span>
                      </p>
                      <p className="font-mono text-sm font-semibold text-[#D8C78E] tabular-nums">
                        Due: {formatINR(balanceDue)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openProjectDetail(project)}>
                      Manage Timeline &amp; Payments
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                    {EVENT_STAGES.map((stage, idx) => {
                      const isDone = idx <= activeStageIdx;
                      const isCurrent = idx === activeStageIdx;
                      const info = project.stageUpdates[stage];
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={async () => {
                            await updateEventStage(project.id, stage);
                            toast.success(`${project.clientName}: moved to "${stage}"`);
                          }}
                          className={`flex flex-col justify-between rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'border-[#D8C78E] bg-[#134E49]'
                              : isDone
                              ? 'border-emerald-400/35 bg-emerald-950/35'
                              : 'border-[#C5B378]/15 bg-[#092E2B]/60 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono text-[10px] text-[#D8C78E] tabular-nums">
                              0{idx + 1}
                            </span>
                            {isDone ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-[#E6ECEB]/35 shrink-0" />
                            )}
                          </div>
                          <p className="mt-2 text-xs font-semibold text-white leading-snug">
                            {stage}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-[#E6ECEB]/65 tabular-nums">
                            {info?.completedAt ? formatDateDisplay(info.completedAt) : 'Pending'}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {project.deliveryNotes && (
                    <p className="text-xs text-[#E6ECEB]/80 border-t border-[#C5B378]/15 pt-3">
                      <span className="font-semibold text-[#D8C78E]">Production Note: </span>
                      {project.deliveryNotes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Event Lifecycle & Payment Ledger Detail Dialog */}
      <Dialog open={Boolean(activeProject)} onOpenChange={(open) => !open && setActiveProjectId(null)}>
        <DialogContent className="max-w-4xl bg-[#092E2B] border-[#C5B378]/35">
          {activeProject && (
            <>
              <DialogHeader>
                <p className="font-mono text-xs text-[#D8C78E] tabular-nums">
                  {activeProject.referenceCode} · {formatDateDisplay(activeProject.eventDate)} ·{' '}
                  {activeProject.phone}
                </p>
                <DialogTitle className="text-xl text-white">
                  {activeProject.clientName} — {activeProject.eventType}
                </DialogTitle>
                <DialogDescription className="text-[#E6ECEB]/80">
                  {activeProject.venue} · {activeProject.packageName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                <div className="rounded-xl border border-[#C5B378]/20 bg-[#072421] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">
                      Delivery Timeline Stage (Click a stage to update)
                    </h4>
                    <span className="text-xs text-[#D8C78E]">
                      Current: {activeProject.currentStage}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EVENT_STAGES.map((stage) => {
                      const activeIdx = EVENT_STAGES.indexOf(activeProject.currentStage);
                      const idx = EVENT_STAGES.indexOf(stage);
                      const isDone = idx <= activeIdx;
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => handleSetStage(stage)}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                            activeProject.currentStage === stage
                              ? 'border-[#D8C78E] bg-[#C5B378] text-[#072421] font-semibold'
                              : isDone
                              ? 'border-emerald-400/40 bg-emerald-950/50 text-emerald-100'
                              : 'border-[#C5B378]/20 bg-[#092E2B] text-[#E6ECEB]/80 hover:text-white'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>{stage}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-medium text-[#D8C78E]">
                      Stage Milestone Note (saved when clicking a stage above)
                    </label>
                    <input
                      type="text"
                      value={stageNoteInput}
                      onChange={(e) => setStageNoteInput(e.target.value)}
                      placeholder="e.g., 50-sheet Karizma layout sent on WhatsApp for couple approval"
                      className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>
                </div>

                <form
                  onSubmit={handleSaveFinancials}
                  className="rounded-xl border border-[#C5B378]/20 bg-[#072421] p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">
                      Contract Billing &amp; Crew Assignment
                    </h4>
                    <div className="font-mono text-xs tabular-nums text-[#D8C78E]">
                      Net Payable:{' '}
                      {formatINR(
                        Math.max(0, Number(editAgreed) + Number(editExtras) - Number(editDiscount))
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="block text-xs text-[#D8C78E]">Agreed Package (₹)</label>
                      <input
                        type="number"
                        value={editAgreed}
                        onChange={(e) => setEditAgreed(Number(e.target.value))}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[#D8C78E]">Add-Ons / Extras (₹)</label>
                      <input
                        type="number"
                        value={editExtras}
                        onChange={(e) => setEditExtras(Number(e.target.value))}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[#D8C78E]">Discount (₹)</label>
                      <input
                        type="number"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(Number(e.target.value))}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs text-[#D8C78E]">Assigned Crew</label>
                      <input
                        type="text"
                        value={editCrew}
                        onChange={(e) => setEditCrew(e.target.value)}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[#D8C78E]">
                        Delivery &amp; Album Deliverables Note
                      </label>
                      <input
                        type="text"
                        value={editDeliveryNotes}
                        onChange={(e) => setEditDeliveryNotes(e.target.value)}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" variant="outline">
                      Save Billing &amp; Notes
                    </Button>
                  </div>
                </form>

                <div className="rounded-xl border border-[#C5B378]/20 bg-[#072421] p-4 space-y-4">
                  {(() => {
                    const { netTotal, paidTotal, balanceDue } = getProjectTotals(activeProject);
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">Payment Ledger</h4>
                        <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
                          <span className="text-[#E6ECEB]">Net: {formatINR(netTotal)}</span>
                          <span className="text-emerald-300">Paid: {formatINR(paidTotal)}</span>
                          <span className="text-amber-300 font-semibold">
                            Balance: {formatINR(balanceDue)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {activeProject.payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Installment</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Remove</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeProject.payments.map((pay) => (
                          <TableRow key={pay.id}>
                            <TableCell className="font-mono text-xs tabular-nums whitespace-nowrap">
                              {formatDateDisplay(pay.date)}
                            </TableCell>
                            <TableCell className="text-xs text-white">{pay.label}</TableCell>
                            <TableCell className="text-xs text-[#D8C78E]">{pay.method}</TableCell>
                            <TableCell className="text-xs text-[#E6ECEB]/70">
                              {pay.referenceNote || '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-emerald-300 tabular-nums">
                              {formatINR(pay.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                aria-label="Delete payment entry"
                                onClick={async () => {
                                  await deleteEventPayment(activeProject.id, pay.id);
                                  toast.info('Payment receipt removed.');
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded text-red-300 hover:bg-red-900/40 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-xs text-[#E6ECEB]/70">
                      No payment receipts recorded yet. Add an advance or installment below.
                    </p>
                  )}

                  <form
                    onSubmit={handleAddPayment}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end border-t border-[#C5B378]/15 pt-4"
                  >
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Date</label>
                      <input
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2 font-mono text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Label</label>
                      <input
                        type="text"
                        value={payLabel}
                        onChange={(e) => setPayLabel(e.target.value)}
                        placeholder="Advance / Final Balance"
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Amount (₹)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="15000"
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2.5 font-mono text-xs text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Mode</label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3 flex gap-2">
                      <input
                        type="text"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="Ref # / Note"
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                      <Button type="submit" size="sm">
                        <IndianRupee className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create New Offline Event Project Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg bg-[#092E2B] border-[#C5B378]/35">
          <DialogHeader>
            <DialogTitle>New Event Timeline Project</DialogTitle>
            <DialogDescription>
              Create a booking-to-delivery tracker and payment ledger for a walk-in or offline
              client.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#D8C78E]">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g., Balaji & Divya"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#D8C78E]">Phone *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="98401 11223"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#D8C78E]">Event Type</label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as EventCategory)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#D8C78E]">Event Date</label>
                <input
                  type="date"
                  required
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#D8C78E]">Venue *</label>
              <input
                type="text"
                required
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                placeholder="Mandapam / City"
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#D8C78E]">Package</label>
                <select
                  value={newPackageName}
                  onChange={(e) => {
                    setNewPackageName(e.target.value);
                    const pkg = packages.find((p) => p.name === e.target.value);
                    if (pkg) setNewAgreedAmount(pkg.price);
                  }}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#D8C78E]">Agreed (₹)</label>
                <input
                  type="number"
                  value={newAgreedAmount}
                  onChange={(e) => setNewAgreedAmount(Number(e.target.value))}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#D8C78E]">Advance (₹)</label>
                <input
                  type="number"
                  value={newInitialAdvance}
                  onChange={(e) => setNewInitialAdvance(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#D8C78E]">Assigned Crew</label>
              <input
                type="text"
                value={newCrew}
                onChange={(e) => setNewCrew(e.target.value)}
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
