'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  FileText,
  MessageCircle,
  Printer,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { SubmitButton } from '@/src/components/ui/SubmitButton';
import {
  EVENT_CATEGORIES,
  EVENT_STAGES,
  CUSTOM_PACKAGE_NAME,
  EventCategory,
  EventProject,
  EventStage,
  PaymentMethod,
  PaymentRecord,
  StudioBill,
} from '@/src/types/studio';
import { EventSelector } from '@/src/components/common/EventSelector';
import { buildWhatsAppUrl, formatDateDisplay, formatINR, toISODate } from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { BilingualBillModal } from './BilingualBillModal';
import { downloadBillPdf, shareBillPdfWhatsApp } from '@/src/lib/generateBillPdfBlob';
import { Badge } from '@/src/components/ui/badge';
import { englishOnlyName } from '@/src/lib/englishOnlyName';
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
    bills,
    createEventProject,
    deleteEventProject,
    updateEventStage,
    updateEventFinancials,
    addEventPayment,
    deleteEventPayment,
  } = useStudio();

  const [filter, setFilter] = useState<TimelineFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Bilingual Bill Modal State
  const [selectedBillForModal, setSelectedBillForModal] = useState<StudioBill | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

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

  // Async action loading states for double-click prevention
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isSavingFinancials, setIsSavingFinancials] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);
  const [sharingBillId, setSharingBillId] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const [newClientName, setNewClientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEventType, setNewEventType] = useState<EventCategory>('Weddings');
  const [newEventDate, setNewEventDate] = useState(() => toISODate(new Date()));
  const [newVenue, setNewVenue] = useState('');
  const [newPackageName, setNewPackageName] = useState(packages[0]?.name || CUSTOM_PACKAGE_NAME);
  const [newAgreedAmount, setNewAgreedAmount] = useState(packages[0]?.price ?? 0);
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
        return acc;
      },
      { contractValue: 0, collected: 0, receivable: 0 }
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
    if (!activeProject || isSavingFinancials) return;
    setIsSavingFinancials(true);
    try {
      await updateEventFinancials(activeProject.id, {
        agreedAmount: Number(editAgreed) || 0,
        extraCharges: Number(editExtras) || 0,
        discount: Number(editDiscount) || 0,
        assignedCrew: editCrew.trim(),
        deliveryNotes: editDeliveryNotes.trim(),
      });
      toast.success('Billing and delivery notes saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save billing.');
    } finally {
      setIsSavingFinancials(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProject) return;
    const confirmed = window.confirm(
      `Delete ${activeProject.clientName}'s project and payment ledger? The original booking will remain.`
    );
    if (!confirmed) return;

    try {
      await deleteEventProject(activeProject.id);
      setActiveProjectId(null);
      toast.success('Event project deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete event project.');
    }
  };

  const getBillForPayment = (pay: PaymentRecord): StudioBill | undefined => {
    if (pay.billId) {
      const found = bills.find((b) => b.id === pay.billId);
      if (found) return found;
    }
    if (pay.billNumber) {
      const found = bills.find((b) => b.billNumber === pay.billNumber);
      if (found) return found;
    }
    return bills.find((b) => b.paymentId === pay.id);
  };

  const handleSharePaymentBillOnWhatsApp = async (bill: StudioBill) => {
    if (sharingBillId === bill.id) return;
    setSharingBillId(bill.id);
    try {
      await shareBillPdfWhatsApp(bill);
      toast.success(`Bill receipt opened for sharing.`);
    } catch {
      toast.error('Unable to share bill on WhatsApp.');
    } finally {
      setSharingBillId(null);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || isRecordingPayment) return;
    const numericAmount = Number(payAmount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Enter a valid payment amount in INR.');
      return;
    }
    setIsRecordingPayment(true);
    try {
      await addEventPayment(activeProject.id, {
        date: payDate,
        label: payLabel.trim() || 'Installment',
        amount: numericAmount,
        method: payMethod,
        referenceNote: payRef.trim() || undefined,
      });
      toast.success(
        `Recorded ${formatINR(numericAmount)} payment for ${activeProject.clientName}. Bilingual bill auto-generated!`
      );
      setPayAmount('');
      setPayRef('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingProject) return;
    if (!newClientName.trim() || !newPhone.trim() || !newVenue.trim()) {
      toast.error('Please enter client name, phone, and venue.');
      return;
    }
    setIsCreatingProject(true);
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
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial & Production Overview Strip */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-3 sm:p-4">
          <p className="text-[11px] text-[#D8C78E] sm:text-xs">Contract</p>
          <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums sm:text-2xl">
            {formatINR(summary.contractValue)}
          </p>
        </div>
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-3 sm:p-4">
          <p className="text-[11px] text-[#D8C78E] sm:text-xs">Paid</p>
          <p className="mt-1 font-mono text-lg font-bold text-emerald-300 tabular-nums sm:text-2xl">
            {formatINR(summary.collected)}
          </p>
        </div>
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-3 sm:p-4">
          <p className="text-[11px] text-[#D8C78E] sm:text-xs">Due</p>
          <p className="mt-1 font-mono text-lg font-bold text-amber-300 tabular-nums sm:text-2xl">
            {formatINR(summary.receivable)}
          </p>
        </div>
        <div className="rounded-xl border border-[#C5B378]/20 bg-[#0E423E] p-3 sm:p-4">
          <p className="text-[11px] text-[#D8C78E] sm:text-xs">Projects</p>
          <p className="mt-1 font-mono text-lg font-bold text-white tabular-nums sm:text-2xl">
            {eventProjects.length}
          </p>
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto rounded-lg border border-[#C5B378]/20 bg-[#072421] p-1">
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
              placeholder="Search projects..."
              className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] pl-9 pr-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
            />
          </div>

          <Button type="button" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </div>
      </div>

      {/* Event Timeline Cards */}
      {filteredProjects.length === 0 ? (
        <Card className="bg-[#0E423E] p-12 text-center">
          <p className="text-base font-semibold text-white">No event projects found</p>
          <p className="mt-1 text-sm text-[#E6ECEB]/75">Create a project to track delivery and payments.</p>
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
                    <CardTitle className="text-lg text-white pt-1">
                      {project.clientName} — {englishOnlyName(project.eventType)}
                    </CardTitle>
                    <CardDescription>
                      {formatDateDisplay(project.eventDate)}
                      {project.endDate ? ` to ${formatDateDisplay(project.endDate)}` : ''} ·{' '}
                      {project.venue}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 lg:text-right">
                    <div className="space-y-0.5 text-xs">
                      <p className="text-[#E6ECEB]/70">
                        {formatINR(paidTotal)} paid of {formatINR(netTotal)}
                      </p>
                      <p className="font-mono text-sm font-semibold text-[#D8C78E] tabular-nums">
                        {formatINR(balanceDue)} due
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openProjectDetail(project)}>
                      Manage
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 pt-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-white">{project.currentStage}</span>
                    <span className="shrink-0 text-[#D8C78E]">
                      {activeStageIdx + 1} of {EVENT_STAGES.length}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[#072421]"
                    role="progressbar"
                    aria-label={`${project.clientName} delivery progress`}
                    aria-valuemin={0}
                    aria-valuemax={EVENT_STAGES.length}
                    aria-valuenow={activeStageIdx + 1}
                  >
                    <div
                      className="h-full rounded-full bg-[#D8C78E] transition-all"
                      style={{ width: `${((activeStageIdx + 1) / EVENT_STAGES.length) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Event Lifecycle & Payment Ledger Detail Dialog */}
      <Dialog
        open={Boolean(activeProject)}
        onOpenChange={(open) => {
          if (!open && !isRecordingPayment && !isSavingFinancials && !isBillModalOpen) {
            setActiveProjectId(null);
          }
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => {
            if (isRecordingPayment || isSavingFinancials || isBillModalOpen) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isRecordingPayment || isSavingFinancials || isBillModalOpen) e.preventDefault();
          }}
          className="w-[95vw] max-w-5xl max-h-[92dvh] bg-[#092E2B] border-[#C5B378]/35"
        >
          {activeProject && (
            <>
              <DialogHeader>
                <p className="font-mono text-xs text-[#D8C78E] tabular-nums">
                  {activeProject.referenceCode} · {formatDateDisplay(activeProject.eventDate)} ·{' '}
                  {activeProject.phone}
                </p>
                <DialogTitle className="text-xl text-white">
                  {activeProject.clientName} — {englishOnlyName(activeProject.eventType)}
                </DialogTitle>
                <DialogDescription className="text-[#E6ECEB]/80">
                  {activeProject.venue} · {activeProject.packageName}
                </DialogDescription>
                {activeProject.optedServices && activeProject.optedServices.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    {activeProject.optedServices.map((svc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#C5B378]/35 bg-[#C5B378]/15 text-[#D8C78E]"
                      >
                        ✓ {englishOnlyName(svc.name)} ({svc.quantity} {svc.unitLabel}{svc.quantity > 1 ? 's' : ''})
                      </span>
                    ))}
                  </div>
                )}
              </DialogHeader>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteProject}
                className="absolute right-16 top-4 border-red-400/40 text-red-200 hover:bg-red-950/50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>

              <div className="space-y-6 pt-2">
                <div className="rounded-xl border border-[#C5B378]/20 bg-[#072421] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">Delivery stage</h4>
                    <span className="text-xs text-[#D8C78E]">
                      {activeProject.currentStage}
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
                    <label className="block text-xs font-medium text-[#D8C78E]">Stage note</label>
                    <input
                      type="text"
                      value={stageNoteInput}
                      onChange={(e) => setStageNoteInput(e.target.value)}
                      placeholder="Add a note about this stage"
                      className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>
                </div>

                <form
                  onSubmit={handleSaveFinancials}
                  className="rounded-xl border border-[#C5B378]/20 bg-[#072421] p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">Billing &amp; delivery</h4>
                    <div className="font-mono text-xs tabular-nums text-[#D8C78E]">
                      Total:{' '}
                      {formatINR(
                        Math.max(0, Number(editAgreed) + Number(editExtras) - Number(editDiscount))
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="block text-xs text-[#D8C78E]">Package (₹)</label>
                      <input
                        type="number"
                        value={editAgreed}
                        onChange={(e) => setEditAgreed(Number(e.target.value))}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-sm text-white tabular-nums focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[#D8C78E]">Extras (₹)</label>
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
                        Delivery note
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
                    <SubmitButton
                      type="submit"
                      size="sm"
                      variant="outline"
                      isLoading={isSavingFinancials}
                      loadingText="Saving..."
                    >
                      Save changes
                    </SubmitButton>
                  </div>
                </form>

                <div className="rounded-xl border border-[#C5B378]/20 bg-[#072421] p-4 space-y-4">
                  {(() => {
                    const { netTotal, paidTotal, balanceDue } = getProjectTotals(activeProject);
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white">Payments</h4>
                        <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
                          <span className="text-[#E6ECEB]">Total: {formatINR(netTotal)}</span>
                          <span className="text-emerald-300">Paid: {formatINR(paidTotal)}</span>
                          <span className="text-amber-300 font-semibold">
                            Balance: {formatINR(balanceDue)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {activeProject.payments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Installment</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Invoice / Bill</TableHead>
                            <TableHead className="text-right">Remove</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeProject.payments.map((pay) => {
                            const bill = getBillForPayment(pay);
                            return (
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
                                <TableCell className="text-center whitespace-nowrap">
                                  {bill ? (
                                    <div className="inline-flex items-center gap-1.5 bg-[#061E1C] border border-[#C5B378]/30 px-2 py-1 rounded">
                                      <span className="font-mono text-[11px] font-bold text-[#D8C78E]">
                                        {bill.billNumber}
                                      </span>
                                      {/* Direct 1-Click PDF Download */}
                                      <button
                                        type="button"
                                        title="Download PDF directly"
                                        disabled={downloadingBillId === bill.id}
                                        onClick={async () => {
                                          try {
                                            setDownloadingBillId(bill.id);
                                            await downloadBillPdf(bill);
                                            toast.success(`Downloaded ${bill.billNumber}-${bill.clientName}.pdf`);
                                          } catch {
                                            setSelectedBillForModal(bill);
                                            setIsBillModalOpen(true);
                                          } finally {
                                            setDownloadingBillId(null);
                                          }
                                        }}
                                        className="text-[#D8C78E] hover:text-white p-0.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                                        aria-label="Direct Download PDF"
                                      >
                                        {downloadingBillId === bill.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Download className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                      {/* Preview & Print Modal */}
                                      <button
                                        type="button"
                                        title="Preview & Print Bilingual Bill"
                                        onClick={() => {
                                          setSelectedBillForModal(bill);
                                          setIsBillModalOpen(true);
                                        }}
                                        className="text-[#E6ECEB]/70 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                                        aria-label="Preview Bilingual Bill"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      {/* Native WhatsApp Share */}
                                      <button
                                        type="button"
                                        title="Share Bill PDF via WhatsApp"
                                        disabled={sharingBillId === bill.id}
                                        onClick={() => handleSharePaymentBillOnWhatsApp(bill)}
                                        className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                                        aria-label="Share Bill PDF via WhatsApp"
                                      >
                                        {sharingBillId === bill.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <MessageCircle className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-[#E6ECEB]/50">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <button
                                    type="button"
                                    aria-label="Delete payment entry"
                                    disabled={deletingPaymentId === pay.id}
                                    onClick={async () => {
                                      try {
                                        setDeletingPaymentId(pay.id);
                                        await deleteEventPayment(activeProject.id, pay.id);
                                        toast.info('Payment entry removed.');
                                      } catch (error) {
                                        toast.error(
                                          error instanceof Error
                                            ? error.message
                                            : 'Unable to remove payment.'
                                        );
                                      } finally {
                                        setDeletingPaymentId(null);
                                      }
                                    }}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded text-red-300 hover:bg-red-900/40 cursor-pointer disabled:opacity-50"
                                  >
                                    {deletingPaymentId === pay.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-xs text-[#E6ECEB]/70">No payments yet.</p>
                  )}

                  <form
                    onSubmit={handleAddPayment}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end border-t border-[#C5B378]/15 pt-4"
                  >
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Date</label>
                      <input
                        type="date"
                        disabled={isRecordingPayment}
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2 font-mono text-xs text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Label</label>
                      <input
                        type="text"
                        disabled={isRecordingPayment}
                        value={payLabel}
                        onChange={(e) => setPayLabel(e.target.value)}
                        placeholder="Advance / Final Balance"
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Amount (₹)</label>
                      <input
                        type="number"
                        disabled={isRecordingPayment}
                        required
                        min={1}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="15000"
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2.5 font-mono text-xs text-white tabular-nums focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[11px] text-[#D8C78E]">Mode</label>
                      <select
                        disabled={isRecordingPayment}
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
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
                        disabled={isRecordingPayment}
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="Ref # / Note"
                        className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                      />
                      <SubmitButton
                        type="submit"
                        size="sm"
                        isLoading={isRecordingPayment}
                        loadingText="Recording Payment & Generating Bill..."
                        icon={<IndianRupee className="h-3.5 w-3.5" />}
                      >
                        Add
                      </SubmitButton>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create New Offline Event Project Modal */}
      <Dialog open={createModalOpen} onOpenChange={(open) => { if (!open && !isCreatingProject) setCreateModalOpen(false); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isCreatingProject) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isCreatingProject) e.preventDefault(); }}
          className="w-[95vw] max-w-xl max-h-[92dvh] bg-[#092E2B] border-[#C5B378]/35"
        >
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>Track delivery progress and payments.</DialogDescription>
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
                <EventSelector
                  id="admin-timeline-event"
                  label="Event Type"
                  value={newEventType}
                  onChange={(selectedId, selectedEv) => {
                    setNewEventType((selectedEv?.name || selectedId) as EventCategory);
                  }}
                  required
                />
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
                  <option value={CUSTOM_PACKAGE_NAME}>{CUSTOM_PACKAGE_NAME}</option>
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
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingProject}
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <SubmitButton
                type="submit"
                isLoading={isCreatingProject}
                loadingText="Creating Project..."
              >
                Create Project
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bilingual Tax Invoice / Bill Modal */}
      <BilingualBillModal
        bill={selectedBillForModal}
        isOpen={isBillModalOpen}
        onClose={() => {
          setIsBillModalOpen(false);
          setSelectedBillForModal(null);
        }}
      />
    </div>
  );
}
