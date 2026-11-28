'use client';

import React, { useRef, useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Printer,
  Download,
  Share2,
  X,
  MessageCircle,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Camera,
  Layers,
  Loader2,
} from 'lucide-react';
import { StudioBill } from '@/src/types/studio';
import { Button } from '@/src/components/ui/button';
import {
  formatDateDisplay,
  formatTimeWithAmPm,
  formatINR,
  getAlbumPhotoSelectionNote,
  getBillDisplayDeliverables,
  getBillPaymentHistory,
} from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { downloadBillPdf, shareBillPdfWhatsApp } from '@/src/lib/generateBillPdfBlob';
import { englishOnlyName } from '@/src/lib/englishOnlyName';
import { STUDIO_TERMS_AND_CONDITIONS } from '@/src/config/termsAndConditions';
import { toast } from 'sonner';

interface BillTermItem {
  en: string;
  ta: string;
  title?: {
    en?: string;
    ta?: string;
  };
}

interface BilingualBillModalProps {
  bill: StudioBill | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BilingualBillModal({ bill, isOpen, onClose }: BilingualBillModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const paymentHistory = bill ? getBillPaymentHistory(bill) : [];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Guarantee body styles (pointer-events & overflow) are cleaned up whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        if (typeof document !== 'undefined') {
          const openDialogs = document.querySelectorAll('[role="dialog"]');
          if (openDialogs.length === 0) {
            document.body.style.removeProperty('pointer-events');
            document.body.style.removeProperty('overflow');
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !bill || !isMounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadBillPdf(bill);
      toast.success(`Downloaded ${bill.billNumber}-${bill.clientName}.pdf`);
    } catch (err) {
      toast.error('Failed to generate PDF. Using print dialog.');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareWhatsAppPdf = async () => {
    setIsSharing(true);
    try {
      await shareBillPdfWhatsApp(bill);
      toast.success('Bill receipt opened for sharing.');
    } catch {
      toast.error('Unable to share PDF.');
    } finally {
      setIsSharing(false);
    }
  };

  const termsList: BillTermItem[] =
    bill.termsAndConditions && bill.termsAndConditions.length > 0
      ? bill.termsAndConditions
      : STUDIO_TERMS_AND_CONDITIONS;

  // Filter strictly to ONLY active & selected services (exclude unselected / excluded / quantity 0 items)
  const excludedLabels = (bill.packageDetails?.excludedItems || []).map((e) =>
    e.label.toLowerCase()
  );

  const isServiceActive = (svc: any): boolean => {
    if (!svc) return false;
    if (svc.selected === false || svc.selected === 'false') return false;
    if (svc.active === false || svc.active === 'false') return false;
    if (svc.included === false || svc.included === 'false') return false;
    if (typeof svc.quantity === 'number' && svc.quantity <= 0) return false;
    const enText = (svc.en || svc.name || svc.key || '').toLowerCase();
    if (excludedLabels.some((ex) => ex.includes(enText) || enText.includes(ex))) {
      return false;
    }
    return true;
  };

  const rawServices =
    bill.packageDetails?.includedServices && bill.packageDetails.includedServices.length > 0
      ? bill.packageDetails.includedServices
      : (bill.packageDetails?.inclusions || bill.packageDetails?.requiredCrew || []).map((inc) => ({
          key: inc,
          en: inc,
          ta: '',
          selected: true,
        }));

  const activeServices = rawServices.filter(isServiceActive);
  const billOptedServices =
    bill.packageDetails?.optedServices?.length ? bill.packageDetails.optedServices : bill.optedServices || [];
  const printableDeliverables = getBillDisplayDeliverables(bill.packageDetails?.deliverables);
  const albumSelectionNote = getAlbumPhotoSelectionNote(bill.packageDetails?.deliverables);
  const albumServiceIndex = billOptedServices.findIndex(
    (service) => service.serviceSlug.startsWith('photo-album') || /album/i.test(service.name)
  );
  const activeAlbumServiceIndex = activeServices.findIndex((service) =>
    /album/i.test(service.en || service.key || '')
  );
  const packagePrice = bill.financials.packagePrice ?? bill.financials.totalPackageAmount;
  const discountAmount = bill.financials.discountAmount ?? 0;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm print:hidden transition-opacity" />
        <DialogPrimitive.Content
          aria-describedby="bilingual-bill-dialog-desc"
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 pointer-events-auto print:p-0 print:static print:block focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Bilingual Tax Invoice / Bill #{bill.billNumber}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description id="bilingual-bill-dialog-desc" className="sr-only">
            Official GK Studios Bilingual Invoice and Payment Receipt for {bill.clientName}
          </DialogPrimitive.Description>

          <div className="relative w-full max-w-5xl print:max-w-4xl rounded-sm border border-[#C5B378]/35 bg-[#072421] text-[#E6ECEB] shadow-2xl my-auto flex flex-col max-h-[92dvh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black print:my-0">
            {/* Top Control Bar (Hidden during Print) */}
            <div className="flex flex-wrap items-center justify-between p-4 border-b border-[#C5B378]/25 bg-[#092E2B] print:hidden gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#D8C78E]" />
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                    Bilingual Tax Invoice / Bill #{bill.billNumber}
                  </h3>
                  <p className="text-[11px] text-[#D8C78E]">
                    Official GK Studios Billing Record
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Direct One-Click Download PDF */}
                <Button
                  type="button"
                  disabled={isDownloading}
                  onClick={handleDirectDownload}
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold text-xs h-8 px-3 hover:brightness-105 cursor-pointer"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Download PDF</span>
                </Button>

                {/* Print Bilingual Document */}
                <Button
                  type="button"
                  onClick={handlePrint}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#D8C78E] hover:text-[#061E1C] text-xs h-8 px-3 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print A4</span>
                </Button>

                {/* Share PDF on WhatsApp */}
                <Button
                  type="button"
                  disabled={isSharing}
                  onClick={handleShareWhatsAppPdf}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-[#25D366]/60 bg-[#25D366]/15 text-emerald-300 hover:bg-[#25D366]/25 text-xs h-8 px-3 cursor-pointer"
                >
                  {isSharing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Share PDF via WhatsApp</span>
                </Button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#E6ECEB]/70 hover:text-white p-1 ml-1 cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div
              ref={printRef}
              id="printable-bill-content"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Tamil", "Latha", "Vijaya", "Nirmala UI", sans-serif',
              }}
              className="flex-1 min-h-0 overflow-y-auto max-h-[calc(92dvh-72px)] p-6 sm:p-8 space-y-6 text-xs bg-white text-slate-800 font-sans print:p-0 print:overflow-visible print:max-h-none print:text-[10px]"
            >
              {/* ─── Header: Luxury Studio Identity ─── */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#092E2B] pb-5 gap-4">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-[#072421]">
                      GK STUDIOS
                    </h1>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5B378]">
                      CREATING MEMORIES
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Professional Wedding Photography & 4K Cinematography
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                    {STUDIO_INFO.address}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Phone: +91 {STUDIO_INFO.phone} • Email: {STUDIO_INFO.email}
                  </p>
                </div>

                {/* Bill Info Card */}
                <div className="sm:text-right bg-slate-50 border border-slate-200 p-3 rounded sm:min-w-56 space-y-1">
                  <div className="inline-block bg-[#092E2B] text-[#D8C78E] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Official Payment Receipt
                  </div>
                  <p className="font-mono text-sm sm:text-base font-extrabold text-[#072421]">
                    {bill.billNumber}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <strong className="text-slate-800">Date:</strong>{' '}
                    {bill.billDate || bill.financials.paymentDate || bill.createdAt.slice(0, 10)}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">Ref: #{bill.bookingId.slice(0, 8)}</p>
                </div>
              </div>

              {/* ─── Client & Event Details Grid ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded p-4 bg-slate-50/60">
                {/* Client Details */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#072421] border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <User className="h-3 w-3 text-[#C5B378]" />
                    Client Details
                  </h4>
                  <p className="text-sm font-bold text-slate-900">{bill.clientName}</p>
                  <p className="text-xs text-slate-700 flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {bill.clientPhone}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <strong>Assigned Crew:</strong>{' '}
                    {bill.crewDetails?.assignedCrew || 'G Krishna + Studio Unit'}
                  </p>
                </div>

                {/* Event Details */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#072421] border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-[#C5B378]" />
                    Event & Ceremony
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-slate-900">
                      {englishOnlyName(bill.eventDetails.eventName)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>
                      {bill.eventDetails.eventDate}
                      {bill.eventDetails.eventTime
                        ? ` · ${formatTimeWithAmPm(bill.eventDetails.eventTime)}`
                        : ''}
                      {bill.eventDetails.eventEndDate
                        ? ` — ${bill.eventDetails.eventEndDate}${bill.eventDetails.eventEndTime ? ` · ${formatTimeWithAmPm(bill.eventDetails.eventEndTime)}` : ''}`
                        : bill.eventDetails.eventEndTime
                          ? ` — ${formatTimeWithAmPm(bill.eventDetails.eventEndTime)}`
                          : ''}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{bill.eventDetails.venue || 'To be updated'}</span>
                  </p>
                </div>
              </div>

              {/* ─── Package & Inclusions ─── */}
              <div className="border border-slate-200 rounded p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#072421] flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-[#C5B378]" />
                    Included Services & Deliverables
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-[#092E2B] text-[#D8C78E] px-2 py-0.5 rounded">
                      {bill.packageDetails.tierLabel || 'Signature'} Tier
                    </span>
                    <span className="font-serif font-bold text-sm text-[#072421]">
                      {bill.packageDetails.basePackageName}
                    </span>
                  </div>
                </div>

                {/* Itemized Opted Services Breakdown (Single Source of Truth) */}
                {billOptedServices.length > 0 ||
                activeServices.length > 0 ||
                printableDeliverables.length > 0 ? (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Confirmed Services & Deliverables:
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700">
                            <th className="p-2">Service / Deliverable</th>
                            <th className="p-2 text-center">Quantity</th>
                            <th className="p-2 text-right">Status / Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billOptedServices.map((svc, i) => (
                            <tr key={`service-${svc.serviceSlug}-${i}`} className="border-t border-slate-200">
                              <td className="p-2 font-semibold text-slate-900">
                                {englishOnlyName(svc.name)}
                                {albumSelectionNote && i === albumServiceIndex ? ` - ${albumSelectionNote}` : ''}
                                {svc.durationTier ? ` (${svc.durationTier === 'fullDay' ? 'Full Day' : svc.durationTier === 'threeHours' ? '3 Hours' : 'Half Day'})` : ''}
                              </td>
                              <td className="p-2 text-center text-slate-600">{svc.quantity}</td>
                              <td className="p-2 text-right font-bold text-slate-600">Included</td>
                            </tr>
                          ))}
                          {billOptedServices.length === 0 && activeServices.map((svc, i) => (
                            <tr key={`legacy-${svc.key}-${i}`} className="border-t border-slate-200">
                              <td className="p-2 font-semibold text-slate-900">
                                {englishOnlyName(svc.en)}
                                {albumSelectionNote && i === activeAlbumServiceIndex ? ` - ${albumSelectionNote}` : ''}
                              </td>
                              <td colSpan={3} className="p-2 text-right text-slate-500">Included</td>
                            </tr>
                          ))}
                          {printableDeliverables.map(({ category, text, isComplimentary }, i) => (
                            <tr
                              key={`deliverable-${category}-${i}`}
                              className={`border-t border-slate-200 ${isComplimentary ? 'bg-emerald-50' : 'bg-slate-50'}`}
                            >
                              <td className={`p-2 ${isComplimentary ? 'font-bold text-emerald-800' : 'text-slate-700'}`}>
                                {category && <><strong className="text-slate-900">{englishOnlyName(category)}:</strong>{' '}</>}
                                {englishOnlyName(text)}
                                {isComplimentary && <span className="ml-1 font-bold">(Complimentary)</span>}
                              </td>
                              <td className="p-2 text-center text-slate-500">—</td>
                              <td className={`p-2 text-right ${isComplimentary ? 'font-bold text-emerald-800' : 'text-slate-500'}`}>
                                {isComplimentary ? formatINR(0) : 'Included'}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-slate-200">
                            <td colSpan={3} className="p-2 font-bold text-slate-800">Selected Package Price</td>
                            <td className="p-2 text-right font-bold text-slate-900">{formatINR(packagePrice)}</td>
                          </tr>
                          <tr className="border-t border-slate-200">
                            <td colSpan={3} className="p-2 font-bold text-slate-700">Discount</td>
                            <td className="p-2 text-right font-bold text-red-700">-{formatINR(discountAmount)}</td>
                          </tr>
                          {billOptedServices.length === 0 &&
                            activeServices.length === 0 &&
                            printableDeliverables.length === 0 && (
                              <tr><td colSpan={4} className="p-2 text-slate-500">No services or deliverables listed.</td></tr>
                            )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {/* Excluded Items */}
                {bill.packageDetails.excludedItems && bill.packageDetails.excludedItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold uppercase tracking-wider text-red-600">Items Excluded:</span>
                      {bill.packageDetails.excludedItems.map((e, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center bg-red-50 border border-red-200 px-2 py-0.5 rounded text-red-800 font-medium"
                        >
                          - {e.label} (-{formatINR(Math.abs(e.priceDelta))})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Financial Transaction Ledger ─── */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#092E2B] text-white text-[11px] uppercase tracking-wider">
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Payment Mode</th>
                      <th className="p-2.5 text-center">Stage</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    <tr>
                      <td className="p-2.5 font-medium text-slate-800">
                        Total Agreed Package Amount
                        <span className="block text-[10px] text-slate-500">
                          Base package rate + confirmed upgrades
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-slate-500">—</td>
                      <td className="p-2.5 text-center text-slate-500">Total Contract</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(bill.financials.totalPackageAmount)}
                      </td>
                    </tr>

                    {paymentHistory.map((payment, index) => (
                      <tr
                        key={payment.id || `${payment.date}-${index}`}
                        className={index % 2 === 0 ? 'bg-emerald-50/70' : ''}
                      >
                        <td className="p-2.5 font-medium text-slate-800">
                          Payment {index + 1}
                          <span className="block text-[10px] text-slate-500 font-normal">
                            Date: {formatDateDisplay(payment.date) || 'Not recorded'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-slate-700 font-mono text-[11px]">
                          {payment.method}
                        </td>
                        <td className="p-2.5 text-center text-slate-700 text-[11px]">
                          {payment.label}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          {formatINR(payment.amount)}
                        </td>
                      </tr>
                    ))}

                    {/* Balance Due */}
                    <tr className="bg-amber-50/80 font-bold border-t-2 border-slate-300">
                      <td className="p-2.5 text-amber-950">
                        Remaining Balance Due
                        <span className="block text-[10px] text-amber-800 font-normal">
                          Payable before final deliverables handover
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-slate-500">—</td>
                      <td className="p-2.5 text-center text-amber-800 text-[11px]">Pending Balance</td>
                      <td className="p-2.5 text-right font-mono text-sm sm:text-base text-amber-950 font-black">
                        {formatINR(bill.financials.balanceDue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ─── Signatures & Seal ─── */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Official Studio Seal
                  </span>
                  <div className="h-14 w-32 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-serif">
                    GK STUDIOS PANRUTI
                  </div>
                  <p className="text-[10px] text-slate-500">Computer Generated Official Receipt</p>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    For GK Studios
                  </span>
                  <div className="h-10 flex items-end justify-end">
                    <span className="font-serif italic font-bold text-sm text-[#072421] border-b border-slate-400 pb-0.5">
                      G. Krishna
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium">Authorized Signatory</p>
                </div>
              </div>

              {/* Page 1 Print-Only Footer */}
              <div className="hidden print:flex justify-between items-center text-[9px] text-slate-500 pt-3 border-t border-slate-200">
                <span>GK STUDIOS • {STUDIO_INFO.address} • Ph: +91 {STUDIO_INFO.phone}</span>
                <span className="font-semibold text-[#072421]">Page 1 of 2 • Official Payment Receipt</span>
              </div>

              {/* ─── Page 2: Shared Bilingual Booking Guidelines ─── */}
              <div className="border-t-2 border-slate-300 pt-5 space-y-3 print-page-break-before print-avoid-break">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#072421]" />
                    <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#072421]">
                      Booking Guidelines & Terms / முன்பதிவு வழிகாட்டுதல்கள் மற்றும் நிபந்தனைகள்
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">
                    Bill #{bill.billNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 text-[10px] text-slate-700 leading-relaxed">
                  {termsList.map((term: BillTermItem, idx: number) => {
                    const titleEn = term.title?.en ? `${term.title.en}: ` : '';
                    const titleTa = term.title?.ta ? `${term.title.ta}: ` : '';

                    return (
                      <div key={idx} className="border-b border-slate-100 pb-2 last:border-none">
                        <p className="font-bold text-slate-900 leading-snug">
                          {idx + 1}. {titleEn}{term.en}
                        </p>
                        <p className="text-slate-600 mt-0.5 font-sans leading-relaxed">
                          {titleTa}{term.ta}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Client Acceptance Box */}
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[10px] text-slate-700 space-y-1">
                  <p className="font-bold text-[#072421]">
                    Client Acceptance & Agreement / வாடிக்கையாளர் ஒப்புதல்:
                  </p>
                  <p className="text-slate-700 leading-snug">
                    By confirming your booking and payment, you agree that you have read, understood and accepted all the above terms and conditions.
                  </p>
                  <p className="text-slate-500 leading-relaxed">
                    முன்பதிவையும் கட்டணத்தையும் உறுதிப்படுத்துவதன் மூலம், மேலே உள்ள அனைத்து விதிமுறைகளையும் படித்து, புரிந்து, ஏற்றுக்கொண்டதாக ஒப்புக்கொள்கிறீர்கள்.
                  </p>
                </div>

                {/* Page 2 Print Footer */}
                <div className="flex justify-between items-center text-[9px] text-slate-500 pt-3 border-t border-slate-200">
                  <span>GK STUDIOS PANRUTI • Your Memories, Our Responsibility.</span>
                  <span className="font-semibold text-[#072421]">Page 2 of 2 • Studio Terms & Conditions</span>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
