'use client';

import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
  Sparkles,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { StudioEvent, StudioPackage } from '@/src/types/studio';
import { PackageAddon } from '@/src/data/packageAdvisorConfig';
import { buildWhatsAppUrl, formatINR, toISODate } from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { Button } from '@/src/components/ui/button';
import { useStudio } from '@/src/context/StudioContext';

interface AdvisorInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: StudioEvent | undefined;
  pkg: StudioPackage;
  activeAddons: PackageAddon[];
  finalEstimatedPrice: number;
  onSuccessSubmit?: () => void;
}

export function AdvisorInquiryModal({
  isOpen,
  onClose,
  event,
  pkg,
  activeAddons,
  finalEstimatedPrice,
  onSuccessSubmit,
}: AdvisorInquiryModalProps) {
  const { submitBooking } = useStudio();

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const today = toISODate(new Date());
    return today > '2026-11-28' ? today : '2026-11-28';
  });
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const buildWhatsAppMessage = () => {
    const lines = [
      `Vanakkam GK Studios! 📸`,
      `I would like to inquire about photography for our upcoming celebration:`,
      ``,
      `✨ Event: ${event?.name || 'Milestone Celebration'}${
        event?.tamilName ? ` (${event.tamilName})` : ''
      }`,
      `📦 Base Package: ${pkg.name}`,
      `💰 Estimated Total: ${formatINR(finalEstimatedPrice)}`,
    ];

    if (activeAddons.length > 0) {
      lines.push(``);
      lines.push(`🛠️ Selected Customizations:`);
      activeAddons.forEach((a) => {
        lines.push(`  • ${a.name} (${a.badge})`);
      });
    }

    if (clientName.trim()) {
      lines.push(``);
      lines.push(`👤 Client Name: ${clientName.trim()}`);
    }
    if (phone.trim()) {
      lines.push(`📞 Phone: ${phone.trim()}`);
    }
    if (eventDate) {
      lines.push(`📅 Preferred Date: ${eventDate}`);
    }
    if (venue.trim()) {
      lines.push(`📍 Venue / City: ${venue.trim()}`);
    }
    if (notes.trim()) {
      lines.push(`📝 Notes: ${notes.trim()}`);
    }

    lines.push(``);
    lines.push(`Please let us know your team's availability and next steps.`);
    return lines.join('\n');
  };

  const handleWhatsAppInquiry = () => {
    if (!clientName.trim() && !phone.trim() && !venue.trim()) {
      toast.info('Tip: Entering your name and venue makes your WhatsApp quote faster!');
    }
    const message = buildWhatsAppMessage();
    const url = buildWhatsAppUrl(STUDIO_INFO.phone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !phone.trim() || !eventDate || !venue.trim()) {
      toast.error('Please enter your name, phone, date, and venue to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const addonNotes = activeAddons.map((a) => `${a.name} (${a.badge})`).join(', ');
      const combinedNotes = [
        `Advisor Custom Plan for ${pkg.name} (${formatINR(finalEstimatedPrice)})`,
        addonNotes ? `Customizations: ${addonNotes}` : '',
        notes ? `Client Notes: ${notes}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await submitBooking({
        clientName: clientName.trim(),
        phone: phone.trim(),
        eventType: (event?.name || 'Weddings') as any,
        preferredDate: eventDate,
        venue: venue.trim(),
        packageId: pkg.id,
        packageName: `${pkg.name} (Customized - ${formatINR(finalEstimatedPrice)})`,
        quotedAmount: finalEstimatedPrice,
        notes: combinedNotes,
        status: 'Pending',
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: '1.0',
      });

      setIsSubmitted(true);
      toast.success('Your customized package inquiry has been received! We will connect shortly.');
      if (onSuccessSubmit) {
        onSuccessSubmit();
      }
    } catch (err) {
      console.error('Failed to submit booking:', err);
      toast.error('Failed to submit inquiry. Please use the WhatsApp option.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-sm border border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] shadow-[0_24px_60px_rgba(0,0,0,0.7)] my-8"
      >
        {/* Header Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C5B378] via-[#D8C78E] to-[#F4E8C1]" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#0E423E]/80 border border-[#C5B378]/30 text-[#E6ECEB]/70 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto scrollbar-thin">
          {!isSubmitted ? (
            <>
              {/* Modal Title */}
              <div className="space-y-1.5 pr-8">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E]">
                  Lock In Your Tailored Package
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                  Confirm Availability & Inquire
                </h3>
                <p className="text-xs text-[#E6ECEB]/70 leading-relaxed">
                  Review your configured package summary below and message our lead photographer directly on WhatsApp or submit an inquiry.
                </p>
              </div>

              {/* Package Summary Snapshot Card */}
              <div className="rounded-sm border border-[#C5B378]/30 bg-[#0E423E] p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#C5B378]/20 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#D8C78E]">
                      Milestone & Package
                    </span>
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-white">
                      {event?.name || 'Celebration'} · {pkg.name}
                    </h4>
                    {event?.tamilName && (
                      <p className="text-xs text-[#D8C78E] font-medium">{event.tamilName}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#D8C78E]">
                      Estimated Total
                    </span>
                    <p className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {formatINR(finalEstimatedPrice)}
                    </p>
                  </div>
                </div>

                {/* Inclusions & Customizations */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#E6ECEB]/80">
                    <span>Base Tier Inclusions:</span>
                    <span className="font-medium text-white">{formatINR(pkg.price)}</span>
                  </div>

                  {activeAddons.length > 0 && (
                    <div className="pt-1 space-y-1">
                      <span className="text-[11px] text-[#D8C78E] font-semibold uppercase tracking-wider">
                        Active Options:
                      </span>
                      {activeAddons.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-[#E6ECEB]/90 pl-2">
                          <span>• {addon.name}</span>
                          <span className="font-semibold text-[#D8C78E]">{addon.badge}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact & Date Form */}
              <form onSubmit={handleDirectSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E6ECEB]/90 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#D8C78E]" />
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Vignesh & Sneha"
                      className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3.5 py-2 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E6ECEB]/90 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[#D8C78E]" />
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98401 12233"
                      className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3.5 py-2 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E6ECEB]/90 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#D8C78E]" />
                      Tentative Celebration Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3.5 py-2 text-sm text-white focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E6ECEB]/90 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#D8C78E]" />
                      Venue / Mandapam & City *
                    </label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Panruti, Cuddalore, Chennai"
                      className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3.5 py-2 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#E6ECEB]/90 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Special Rituals or Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Early morning Muhurtham at 6 AM, drone permission needed, etc."
                    className="w-full rounded-sm border border-[#C5B378]/30 bg-[#061E1C] px-3.5 py-2 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none focus:ring-1 focus:ring-[#D8C78E]"
                  />
                </div>

                {/* Instant Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleWhatsAppInquiry}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 text-sm font-bold text-[#061E1C] shadow-[0_4px_16px_rgba(37,211,102,0.3)] hover:brightness-105 transition-all"
                  >
                    <MessageCircle className="h-4 w-4 fill-[#061E1C]" />
                    <span>Send Custom Plan via WhatsApp</span>
                  </button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold hover:brightness-105 shadow py-3 text-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Submit Online Inquiry</span>
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Success confirmation */
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#114A45] text-[#D8C78E] border border-[#D8C78E]/40">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-2xl font-semibold text-white">
                  Vanakkam {clientName}!
                </h4>
                <p className="text-sm text-[#D8C78E] font-medium">
                  Your customized inquiry has been successfully sent to GK Studios.
                </p>
                <p className="text-xs text-[#E6ECEB]/75 max-w-md mx-auto leading-relaxed">
                  Our lead photographer G Krishna will review your celebration details for {eventDate} at {venue} and get in touch within a few hours.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppInquiry}
                  className="inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-5 py-2.5 text-xs font-bold text-[#061E1C] hover:brightness-105"
                >
                  <MessageCircle className="h-4 w-4 fill-[#061E1C]" />
                  Chat on WhatsApp Now
                </button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#C5B378]/10 text-xs py-2.5"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
