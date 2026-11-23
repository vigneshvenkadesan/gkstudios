'use client';

import React from 'react';
import Link from 'next/link';
import {
  Printer,
  Download,
  MessageCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { StudioBill } from '@/src/types/studio';
import { Button } from '@/src/components/ui/button';
import {
  buildWhatsAppUrl,
  formatDateDisplay,
  formatINR,
  getBillPaymentHistory,
} from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { downloadBillPdf } from '@/src/lib/generateBillPdfBlob';
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

interface BilingualBillClientViewProps {
  bill: StudioBill;
}

export function BilingualBillClientView({ bill }: BilingualBillClientViewProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const paymentHistory = getBillPaymentHistory(bill);

  const handlePrint = () => {
    window.print();
  };

  const handleDirectDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadBillPdf(bill);
      toast.success(`Downloaded ${bill.billNumber}.pdf`);
    } catch {
      toast.error('Failed to generate PDF. Using print dialog.');
      window.print();
    } finally {
      setIsDownloading(false);
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
  const billOptedServices = bill.packageDetails?.optedServices || bill.optedServices || [];

  const handleShareWhatsApp = () => {
    const lines = [
      `Vanakkam ${bill.clientName}! 📸`,
      `Here is your official payment receipt from GK STUDIOS:`,
      ``,
      `🧾 Bill Number: ${bill.billNumber}`,
      `✨ Event: ${bill.eventDetails.eventName}${
        bill.eventDetails.tamilEventName ? ` (${bill.eventDetails.tamilEventName})` : ''
      }`,
      `📅 Event Date & Timing: ${bill.eventDetails.eventDate} at ${bill.eventDetails.eventTime || '06:00 AM'}`,
      `📍 Venue: ${bill.eventDetails.venue}`,
      `📦 Package: ${bill.packageDetails.basePackageName}`,
      ``,
      `💵 Amount Paid Now: ${formatINR(bill.financials.amountPaidNow)} (${bill.financials.paymentMode} · ${bill.financials.paymentStage})`,
      `📊 Total Paid to Date: ${formatINR(bill.financials.totalPaidToDate)} of ${formatINR(bill.financials.totalPackageAmount)}`,
      `⚖️ Balance Due: ${formatINR(bill.financials.balanceDue)}`,
      ``,
      `View / Download your official bilingual bill online:`,
      `${typeof window !== 'undefined' ? window.location.href : ''}`,
      ``,
      `Thank you for choosing GK STUDIOS!`,
      `Your Memories, Our Responsibility. 🌿`,
    ];

    const message = lines.join('\n');
    const targetPhone = bill.clientPhone.replace(/[^0-9]/g, '') || STUDIO_INFO.phone;
    const url = buildWhatsAppUrl(targetPhone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* Top action controls (Hidden in print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-sm border border-[#C5B378]/25 bg-[#092E2B] print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D8C78E] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Studio Home</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Direct Download PDF */}
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

          {/* Print A4 */}
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

          <Button
            type="button"
            onClick={handleShareWhatsApp}
            size="sm"
            variant="outline"
            className="gap-1.5 border-[#25D366]/60 bg-[#25D366]/15 text-emerald-300 hover:bg-[#25D366]/25 text-xs h-8 px-3"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Share WhatsApp</span>
          </Button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div
        id="printable-bill-content"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Tamil", "Latha", "Vijaya", "Nirmala UI", sans-serif',
        }}
        className="rounded-sm border border-slate-300 bg-white p-6 sm:p-10 text-slate-800 shadow-xl space-y-6 text-xs font-sans print:shadow-none print:border-none print:p-0"
      >
        {/* Header: Luxury Studio Identity */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#092E2B] pb-5 gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wider text-[#072421]">
                GK STUDIOS
              </span>
              <span className="text-[11px] font-serif font-bold text-[#9A7B38]">
                ஜி கே ஸ்டுடியோஸ்
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              South Indian Wedding & Milestone Photography
            </p>
            <p className="text-[11px] text-slate-600">
              Lead: G Krishna (Candid & Traditional Cinematographer)
            </p>
            <p className="text-[11px] text-slate-600">
              Studio Reg: GKS-TN-2026 • Ph: +91 74185 43123 • Chennai & Tamil Nadu
            </p>
          </div>

          <div className="sm:text-right space-y-1 sm:self-center border-l-2 sm:border-l-0 sm:border-r-0 border-[#C5B378] pl-3 sm:pl-0">
            <div className="inline-block bg-[#092E2B] text-white px-3 py-1 rounded-sm">
              <span className="font-serif font-bold uppercase tracking-wider text-xs text-[#D8C78E]">
                TAX INVOICE & RECEIPT
              </span>
            </div>
            <p className="text-[11px] font-bold text-[#072421]">
              விலைப்பட்டியல் & கட்டண ரசீது
            </p>
            <p className="font-mono text-sm font-bold text-[#072421]">
              Bill No: <span className="text-[#9A7B38]">{bill.billNumber}</span>
            </p>
            <p className="text-[11px] text-slate-600">
              Date: <span className="font-medium">{bill.financials.paymentDate}</span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Ref: {bill.bookingId}
            </p>
          </div>
        </div>

        {/* Two-Column Info: Client & Celebration Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Billed To */}
          <div className="rounded border border-slate-300 bg-slate-50/70 p-3.5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#072421] border-b border-slate-300 pb-1 block">
              Billed To / பெறுநர்
            </span>
            <div className="space-y-1 text-slate-800">
              <p className="text-sm font-bold text-[#072421]">{bill.clientName}</p>
              <p className="flex items-center gap-1.5 text-xs text-slate-700">
                <Phone className="h-3 w-3 text-[#9A7B38]" />
                <span>Phone: {bill.clientPhone}</span>
              </p>
              <p className="flex items-start gap-1.5 text-xs text-slate-700">
                <MapPin className="h-3 w-3 text-[#9A7B38] shrink-0 mt-0.5" />
                <span>Venue: {bill.eventDetails.venue}</span>
              </p>
            </div>
          </div>

          {/* Event & Timing Details */}
          <div className="rounded border border-slate-300 bg-slate-50/70 p-3.5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#072421] border-b border-slate-300 pb-1 block">
              Event & Session Details / நிகழ்வு விவரங்கள்
            </span>
            <div className="space-y-1 text-slate-800">
              <p className="text-sm font-bold text-[#072421]">
                {bill.eventDetails.eventName}{' '}
                {bill.eventDetails.tamilEventName && (
                  <span className="text-xs text-[#9A7B38] font-normal">
                    ({bill.eventDetails.tamilEventName})
                  </span>
                )}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-700">
                <Calendar className="h-3 w-3 text-[#9A7B38]" />
                <span>Date: {bill.eventDetails.eventDate}</span>
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-700">
                <Clock className="h-3 w-3 text-[#9A7B38]" />
                <span>Timing: {bill.eventDetails.eventTime || '06:00 AM (Morning Muhurtham)'}</span>
              </p>
              <p className="text-[11px] text-slate-600">
                Schedule: {bill.eventDetails.schedulePlan}
              </p>
            </div>
          </div>
        </div>

        {/* Package & Scope Details */}
        <div className="rounded border border-slate-300 bg-slate-50/70 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#072421]">
              Included Services & Scope / சேர்க்கப்பட்ட சேவைகள்
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase bg-[#092E2B] text-[#D8C78E] px-2 py-0.5 rounded">
                {bill.packageDetails.tierLabel || 'Signature'} Tier
              </span>
              <span className="font-bold text-xs text-[#072421]">
                {bill.packageDetails.basePackageName}
              </span>
            </div>
          </div>

          {/* Itemized Opted Services Breakdown (Single Source of Truth) */}
          {billOptedServices.length > 0 ? (
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Confirmed Services & Deliverables:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {billOptedServices.map((svc, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 bg-white p-2 rounded border border-slate-200">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activeServices.map((svc, i) => (
                <div key={i} className="flex items-start gap-2 bg-white p-2 rounded border border-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{svc.en}</span>
                    {svc.ta && (
                      <span className="text-[10px] text-slate-500 font-tamil block">{svc.ta}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Assigned Crew:{' '}
                  <span className="font-medium text-slate-800">
                    {bill.packageDetails.requiredCrew.length > 0
                      ? bill.packageDetails.requiredCrew.join(' • ')
                      : 'Lead Traditional & Candid Photographer'}
                  </span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#092E2B]/10 text-[#072421] font-semibold text-[11px] border border-[#092E2B]/20">
                <CheckCircle2 className="h-3 w-3 text-[#9A7B38]" />
                Confirmed Scope
              </span>
            </div>
          )}

          {/* Deliverables details */}
          {bill.packageDetails.deliverables && Object.keys(bill.packageDetails.deliverables).length > 0 && (
            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              {Object.entries(bill.packageDetails.deliverables).map(([cat, text]) => (
                <div key={cat}>
                  <strong className="text-slate-800">{cat}:</strong> {text}
                </div>
              ))}
            </div>
          )}

          {/* Excluded Items */}
          {bill.packageDetails.excludedItems && bill.packageDetails.excludedItems.length > 0 && (
            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 text-[10px]">
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

        {/* Financial Payment Ledger Table */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#072421] block">
            Payment Ledger & Financial Summary / கட்டண விபரம்
          </span>

          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-[#092E2B] text-white">
                <th className="p-2.5 font-bold">Transaction Description (விவரம்)</th>
                <th className="p-2.5 font-bold">Mode & Stage</th>
                <th className="p-2.5 font-bold text-right">Amount (ரூபாய்)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 font-medium text-slate-800">
                  Total Agreed Package Investment (மொத்தத் தொகுப்புக் கட்டணம்)
                </td>
                <td className="p-2.5 text-slate-600">Standard Contract</td>
                <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                  {formatINR(bill.financials.totalPackageAmount)}
                </td>
              </tr>

              {paymentHistory.map((payment, index) => (
                <tr key={payment.id || `${payment.date}-${index}`} className={index % 2 === 0 ? 'bg-emerald-50/60' : ''}>
                  <td className="p-2.5 font-medium text-slate-800">
                    Payment {index + 1}
                    <span className="block text-[10px] text-slate-500 font-normal">
                      Date: {formatDateDisplay(payment.date) || 'Not recorded'}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {payment.method} • {payment.label}
                  </td>
                  <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                    {formatINR(payment.amount)}
                  </td>
                </tr>
              ))}

              <tr className="bg-amber-50/80 font-bold">
                <td className="p-2.5 text-[#9A7B38]">
                  Remaining Balance Due (மீதமுள்ள நிலுவைத் தொகை)
                </td>
                <td className="p-2.5 text-slate-700">Due as per terms</td>
                <td className="p-2.5 text-right font-mono text-sm text-[#9A7B38]">
                  {formatINR(bill.financials.balanceDue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Page 1 Print-Only Footer */}
        <div className="hidden print:flex justify-between items-center text-[9px] text-slate-500 pt-3 border-t border-slate-200">
          <span>GK STUDIOS • Panruti, Tamil Nadu • Ph: +91 {STUDIO_INFO.phone}</span>
          <span className="font-semibold text-[#072421]">Page 1 of 2 • Official Payment Receipt</span>
        </div>

        {/* ─── Page 2: Terms & Conditions: Shared Bilingual Source of Truth (10 Clauses) ─── */}
        <div className="space-y-3 border-t-2 border-slate-300 pt-5 print-page-break-before print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#072421]" />
              <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#072421]">
                Terms & Conditions / விதிமுறைகள் மற்றும் நிபந்தனைகள்
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Bill #{bill.billNumber}
            </span>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50/60 p-3 space-y-2.5 text-[10px] leading-relaxed text-slate-700">
            {termsList.map((term: BillTermItem, index: number) => {
              const titleEn = term.title?.en ? ` — ${term.title.en}` : '';
              const titleTa = term.title?.ta ? ` (${term.title.ta})` : '';

              return (
                <div key={index} className="flex items-start gap-2 border-b border-slate-200 pb-2 last:border-none last:pb-0">
                  <span className="font-bold text-[#9A7B38] shrink-0 mt-0.5">{index + 1}.</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 leading-snug">
                      {term.en}{titleEn}
                    </p>
                    <p className="text-slate-600 font-sans leading-relaxed">
                      {term.ta}{titleTa}
                    </p>
                  </div>
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
          <div className="hidden print:flex justify-between items-center text-[9px] text-slate-500 pt-3 border-t border-slate-200">
            <span>GK STUDIOS PANRUTI • உங்கள் நினைவுகள், எங்கள் பொறுப்பு. • Your Memories, Our Responsibility.</span>
            <span className="font-semibold text-[#072421]">Page 2 of 2 • Studio Terms & Conditions</span>
          </div>
        </div>

        {/* Footer Sign-off */}
        <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
          <div>
            <p className="font-serif font-bold text-sm text-[#072421]">
              THANK YOU FOR CHOOSING GK STUDIOS!
            </p>
            <p className="text-[11px] font-medium text-[#9A7B38]">
              உங்கள் நினைவுகள், எங்கள் பொறுப்பு. · Your Memories, Our Responsibility.
            </p>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <div className="inline-block border-b border-slate-400 pb-1 px-4">
              <span className="font-serif italic font-bold text-slate-800 text-xs">
                G Krishna
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-600">
              Authorized Signatory · GK STUDIOS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
