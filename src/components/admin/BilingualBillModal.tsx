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
import { formatINR } from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { downloadBillPdf, shareBillPdfWhatsApp } from '@/src/lib/generateBillPdfBlob';
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
  const activeAddons = (bill.packageDetails?.addons || []).filter(isServiceActive);
  const billOptedServices = bill.packageDetails?.optedServices || bill.optedServices || [];

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

          <div className="relative w-full max-w-4xl rounded-sm border border-[#C5B378]/35 bg-[#072421] text-[#E6ECEB] shadow-2xl my-auto flex flex-col max-h-[90vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black print:my-0">
            {/* Top Control Bar (Hidden during Print) */}
            <div className="flex flex-wrap items-center justify-between p-4 border-b border-[#C5B378]/25 bg-[#092E2B] print:hidden gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#D8C78E]" />
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                    Bilingual Tax Invoice / Bill #{bill.billNumber}
                  </h3>
                  <p className="text-[11px] text-[#D8C78E]">
                    Official GK Studios Billing Record (English + தமிழ்)
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
              className="flex-1 min-h-0 overflow-y-auto max-h-[calc(90vh-72px)] p-6 sm:p-8 space-y-6 text-xs bg-white text-slate-800 font-sans print:p-0 print:overflow-visible print:max-h-none print:text-[10px]"
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
                    Client Details / வாடிக்கையாளர் விவரம்
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
                    Event & Ceremony / நிகழ்வு விவரம்
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-bold text-slate-900">
                      {bill.eventDetails.eventName}
                    </span>
                    {bill.eventDetails.tamilEventName && (
                      <span className="text-xs font-semibold text-[#092E2B] bg-[#C5B378]/25 px-1.5 py-0.2 rounded">
                        {bill.eventDetails.tamilEventName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{bill.eventDetails.eventDate}</span>
                    {bill.eventDetails.eventTime && (
                      <span className="font-medium text-[#072421]">({bill.eventDetails.eventTime})</span>
                    )}
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
                    Included Services & Deliverables / சேர்க்கப்பட்ட சேவைகள்
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
                {billOptedServices.length > 0 ? (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Confirmed Services & Deliverables:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {billOptedServices.map((svc, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 bg-slate-50/80 p-2 rounded border border-slate-100">
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-900 block">{svc.name}</span>
                              {svc.tamilName && (
                                <span className="text-[10px] text-slate-500 font-tamil block">{svc.tamilName}</span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {svc.quantity} {svc.quantity > 1 ? `${svc.unitLabel}s` : svc.unitLabel} × ₹{svc.unitPrice.toLocaleString('en-IN')}
                                {svc.durationTier ? ` • ${svc.durationTier === 'threeHours' ? '3h' : svc.durationTier === 'fullDay' ? 'Full Day' : 'Half Day'}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 text-xs shrink-0">
                            ₹{svc.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeServices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                    {activeServices.map((svc, i) => (
                      <div key={i} className="flex items-start gap-2 bg-slate-50/80 p-2 rounded border border-slate-100">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-slate-900 block">{svc.en}</span>
                          {svc.ta && (
                            <span className="text-[10px] text-slate-500 font-tamil block">{svc.ta}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Deliverables details */}
                {bill.packageDetails.deliverables && Object.keys(bill.packageDetails.deliverables).length > 0 && (
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                    {Object.entries(bill.packageDetails.deliverables).map(([cat, text]) => (
                      <div key={cat}>
                        <strong className="text-slate-800">{cat}:</strong> {text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom Upgrades & Excluded Items */}
                {((activeAddons.length > 0) ||
                  (bill.packageDetails.excludedItems && bill.packageDetails.excludedItems.length > 0)) && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[10px]">
                    {activeAddons.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold uppercase tracking-wider text-slate-500">Upgrades Added:</span>
                        {activeAddons.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 font-medium"
                          >
                            + {a.label} (+{formatINR(a.priceDelta)})
                          </span>
                        ))}
                      </div>
                    )}
                    {bill.packageDetails.excludedItems && bill.packageDetails.excludedItems.length > 0 && (
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
                    )}
                  </div>
                )}
              </div>

              {/* ─── Financial Transaction Ledger ─── */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#092E2B] text-white text-[11px] uppercase tracking-wider">
                      <th className="p-2.5">Description / விவரம்</th>
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

                    {/* Amount Paid Now Row */}
                    <tr className="bg-emerald-50/70 font-semibold">
                      <td className="p-2.5 text-emerald-900">
                        Payment Received Now (This Receipt)
                        <span className="block text-[10px] text-emerald-700 font-normal">
                          Transaction Ref: #{bill.paymentId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-emerald-800 font-mono text-[11px]">
                        {bill.financials.paymentMode}
                      </td>
                      <td className="p-2.5 text-center text-emerald-800 text-[11px]">
                        {bill.financials.paymentStage}
                      </td>
                      <td className="p-2.5 text-right font-mono text-sm text-emerald-800 font-extrabold">
                        {formatINR(bill.financials.amountPaidNow)}
                      </td>
                    </tr>

                    {/* Total Paid to Date */}
                    <tr className="bg-slate-50">
                      <td className="p-2.5 text-slate-700">Cumulative Paid to Date</td>
                      <td className="p-2.5 text-center text-slate-500">—</td>
                      <td className="p-2.5 text-center text-slate-500">Paid Total</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                        {formatINR(bill.financials.totalPaidToDate)}
                      </td>
                    </tr>

                    {/* Balance Due */}
                    <tr className="bg-amber-50/80 font-bold border-t-2 border-slate-300">
                      <td className="p-2.5 text-amber-950">
                        Remaining Balance Due / மீதமுள்ள தொகை
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
                    Official Studio Seal / முத்திரை
                  </span>
                  <div className="h-14 w-32 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-serif">
                    GK STUDIOS PANRUTI
                  </div>
                  <p className="text-[10px] text-slate-500">Computer Generated Official Receipt</p>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    For GK STUDIOS / உரிமையாளர் கையொப்பம்
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
                <span>GK STUDIOS • Panruti, Tamil Nadu • Ph: +91 {STUDIO_INFO.phone}</span>
                <span className="font-semibold text-[#072421]">Page 1 of 2 • Official Payment Receipt</span>
              </div>

              {/* ─── Page 2: Full Bilingual Terms & Conditions (10 Clauses) ─── */}
              <div className="border-t-2 border-slate-300 pt-5 space-y-3 print-page-break-before print-avoid-break">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#072421]" />
                    <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#072421]">
                      Terms & Conditions / விதிமுறைகள் மற்றும் நிபந்தனைகள்
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">
                    Bill #{bill.billNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 text-[10px] text-slate-700 leading-relaxed">
                  {termsList.map((term: BillTermItem, idx: number) => {
                    const titleEn = term.title?.en ? ` — ${term.title.en}` : '';
                    const titleTa = term.title?.ta ? ` (${term.title.ta})` : '';

                    return (
                      <div key={idx} className="border-b border-slate-100 pb-2 last:border-none">
                        <p className="font-bold text-slate-900 leading-snug">
                          {idx + 1}. {term.en}{titleEn}
                        </p>
                        <p className="text-slate-600 mt-0.5 font-sans leading-relaxed">
                          {term.ta}{titleTa}
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
                  <span>GK STUDIOS PANRUTI • உங்கள் நினைவுகள், எங்கள் பொறுப்பு. • Your Memories, Our Responsibility.</span>
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
