'use client';

import React from 'react';
import Link from 'next/link';
import {
  Printer,
  MessageCircle,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { StudioBill } from '@/src/types/studio';
import { Button } from '@/src/components/ui/button';
import { buildWhatsAppUrl, formatINR } from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';

interface BilingualBillClientViewProps {
  bill: StudioBill;
}

export function BilingualBillClientView({ bill }: BilingualBillClientViewProps) {
  const handlePrint = () => {
    window.print();
  };

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
          <Button
            type="button"
            onClick={handlePrint}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold text-xs h-8 px-3"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Download / Print PDF</span>
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
      <div className="rounded-sm border border-slate-300 bg-white p-6 sm:p-10 text-slate-800 shadow-xl space-y-6 text-xs font-sans print:shadow-none print:border-none print:p-0">
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
        <div className="rounded border border-slate-300 bg-slate-50/70 p-3.5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#072421] border-b border-slate-300 pb-1 block">
            Package Scope & Crew Allocation / தொகுப்பு & படப்பிடிப்புக் குழு
          </span>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <span className="font-bold text-xs text-[#072421]">
                {bill.packageDetails.basePackageName}
              </span>
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

              <tr className="bg-emerald-50/60">
                <td className="p-2.5 font-bold text-[#072421]">
                  Amount Paid in this Transaction (இப்போது செலுத்திய தொகை)
                </td>
                <td className="p-2.5 font-semibold text-emerald-800">
                  {bill.financials.paymentMode} • {bill.financials.paymentStage}
                </td>
                <td className="p-2.5 text-right font-mono font-bold text-emerald-700 text-sm">
                  {formatINR(bill.financials.amountPaidNow)}
                </td>
              </tr>

              <tr>
                <td className="p-2.5 text-slate-700">
                  Cumulative Payments to Date (இதுவரை செலுத்திய மொத்தத் தொகை)
                </td>
                <td className="p-2.5 text-slate-600">Cumulative Ledger</td>
                <td className="p-2.5 text-right font-mono font-semibold text-slate-800">
                  {formatINR(bill.financials.totalPaidToDate)}
                </td>
              </tr>

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

        {/* Terms & Conditions: Shared Bilingual Source of Truth */}
        <div className="space-y-2 border-t-2 border-slate-300 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#072421] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#9A7B38]" />
              Terms & Conditions / விதிமுறைகள் மற்றும் நிபந்தனைகள்
            </span>
            <span className="text-[9px] text-slate-500">
              GK Studios Standard Client Agreement
            </span>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50/60 p-3 space-y-2 text-[10px] leading-relaxed text-slate-700">
            {bill.termsAndConditions.map((term, index) => (
              <div key={index} className="flex items-start gap-2 border-b border-slate-200 pb-1.5 last:border-none last:pb-0">
                <span className="font-bold text-[#9A7B38] shrink-0 mt-0.5">{index + 1}.</span>
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-900">{term.en}</p>
                  <p className="text-slate-600 font-sans">{term.ta}</p>
                </div>
              </div>
            ))}
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
