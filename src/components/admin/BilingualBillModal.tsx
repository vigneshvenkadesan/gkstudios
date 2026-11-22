'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { toast } from 'sonner';

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

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl rounded-sm border border-[#C5B378]/35 bg-[#072421] text-[#E6ECEB] shadow-2xl my-6 flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black print:my-0">
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
              className="gap-1.5 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold text-xs h-8 px-3 hover:brightness-105"
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
              className="gap-1.5 border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#D8C78E] hover:text-[#061E1C] text-xs h-8 px-3"
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
              className="gap-1.5 border-[#25D366]/60 bg-[#25D366]/15 text-emerald-300 hover:bg-[#25D366]/25 text-xs h-8 px-3"
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
              className="text-[#E6ECEB]/70 hover:text-white p-1 ml-1"
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
          className="overflow-y-auto p-6 sm:p-8 space-y-6 text-xs bg-white text-slate-800 font-sans print:p-0 print:overflow-visible print:text-[10px]"
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
          <div className="border border-slate-200 rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#072421] flex items-center gap-1.5">
                <Camera className="h-3 w-3 text-[#C5B378]" />
                Selected Package & Deliverables / தொகுப்பு விவரம்
              </span>
              <span className="font-serif font-bold text-sm text-[#072421]">
                {bill.packageDetails.basePackageName}
              </span>
            </div>

            {/* Deliverables Bullet List */}
            {((bill.packageDetails.inclusions && bill.packageDetails.inclusions.length > 0) ||
              (bill.packageDetails.requiredCrew && bill.packageDetails.requiredCrew.length > 0)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                {(bill.packageDetails.inclusions || bill.packageDetails.requiredCrew).map((inc, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Upgrades */}
            {bill.packageDetails.addons && bill.packageDetails.addons.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Customized Upgrades & Add-ons:
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {bill.packageDetails.addons.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700"
                    >
                      {a.label} (+{formatINR(a.priceDelta)})
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

          {/* ─── Full Bilingual Terms & Conditions ─── */}
          <div className="border-t-2 border-slate-200 pt-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#072421]" />
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#072421]">
                Terms & Conditions / விதிமுறைகள் மற்றும் நிபந்தனைகள்
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-2 text-[9px] text-slate-600 leading-relaxed">
              {bill.termsAndConditions && bill.termsAndConditions.length > 0 ? (
                bill.termsAndConditions.map((term, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-1.5">
                    <p className="font-medium text-slate-800">
                      {idx + 1}. {term.en}
                    </p>
                    <p className="text-slate-600 mt-0.5 font-sans leading-tight">{term.ta}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">
                  Standard GK Studios service terms apply. All files stored for 120 days.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
