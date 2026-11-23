'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  HeartHandshake,
  HelpCircle,
  Image,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { GKCameraMark } from '@/src/components/MandalaAccents';
import { useOptionalPublicPreferences } from '@/src/context/PublicPreferencesContext';
import { PublicLocale, translate } from '@/src/i18n/translations';

export interface BookingSummaryProps {
  clientName: string;
  phone: string;
  preferredDate: string;
  packageName: string;
  venue: string;
}

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBookingFlow?: boolean;
  bookingSummary?: BookingSummaryProps;
  onAcceptAndContinue?: () => void;
  isSubmitting?: boolean;
}

export function TermsAndConditionsModal({
  isOpen,
  onClose,
  isBookingFlow = false,
  bookingSummary,
  onAcceptAndContinue,
  isSubmitting = false,
}: TermsAndConditionsModalProps) {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [termsLanguage, setTermsLanguage] = useState<PublicLocale>('en');
  const preferences = useOptionalPublicPreferences();
  const locale = preferences?.locale ?? 'en';
  const t = (key: Parameters<typeof translate>[1]) => translate(termsLanguage, key);

  // Reset agreement checkbox when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasAgreed(false);
      setTermsLanguage(locale);
    }
  }, [isOpen, locale]);

  const handleAccept = () => {
    if (!hasAgreed || isSubmitting) return;
    if (onAcceptAndContinue) {
      onAcceptAndContinue();
    }
  };

  const highlightBadge = (text: string) => (
    <span className="inline-flex items-center rounded border border-[#C5B378]/35 bg-[#C5B378]/15 px-1.5 py-0.5 font-mono text-xs font-semibold text-[#D8C78E]">
      {text}
    </span>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent
        closeLabel={t('common.close')}
        className="max-h-[92vh] w-[95vw] max-w-3xl overflow-hidden p-0 border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-[#C5B378]/20 bg-[#092E2B]/80 px-6 pt-6 pb-4">
          <DialogHeader className="pr-10">
            <div className="flex items-center gap-2.5 mb-1.5">
              <GKCameraMark className="h-6 w-8 shrink-0" />
              <span className="text-[11px] font-semibold tracking-[0.25em] text-[#D8C78E] uppercase">
                {t('terms.guidelines')}
              </span>
            </div>
            <DialogTitle className="font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-white">
              {t('terms.title')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#E6ECEB]/80 leading-relaxed pt-0.5">
              {t('terms.description')}
            </DialogDescription>
            <div
              role="group"
              aria-label="Terms language"
              className="flex items-center gap-2 pt-2"
            >
              {([
                { value: 'en', label: 'English' },
                { value: 'ta', label: 'தமிழ்' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={termsLanguage === value}
                  onClick={() => setTermsLanguage(value)}
                  className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
                    termsLanguage === value
                      ? 'border-[#D8C78E] bg-[#C5B378]/20 text-[#F4E8C1]'
                      : 'border-[#C5B378]/25 text-[#E6ECEB]/70 hover:border-[#D8C78E]/60 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </DialogHeader>

          {/* Optional booking summary banner when inside the booking flow */}
          {isBookingFlow && bookingSummary && (
            <div className="mt-3.5 rounded-lg border border-[#C5B378]/25 bg-[#061E1C]/90 px-3.5 py-2.5 text-xs text-[#E6ECEB]/90">
              <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-4">
                <div>
                  <span className="text-[#D8C78E] font-medium">{t('terms.bookingInquiry')} </span>
                  <span className="font-semibold text-white">{bookingSummary.clientName}</span>
                  <span className="text-[#E6ECEB]/60"> ({bookingSummary.phone})</span>
                </div>
                <div className="font-mono text-[#D8C78E]">
                  {bookingSummary.packageName} · {bookingSummary.preferredDate}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm text-[#E6ECEB]/85">
          <p className="font-medium text-white/95 text-sm sm:text-base leading-relaxed border-l-2 border-[#D8C78E] pl-3 py-0.5">
            {t('terms.intro')}
          </p>

          <div className="space-y-4">
            {/* Condition 1 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  1
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.payment.title')} ({highlightBadge('20%')} – {highlightBadge('60%')} – {highlightBadge('20%')})
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-[#D8C78E] font-medium">•</span>
                      <span>
                        <strong className="text-white">{highlightBadge('20%')} {t('terms.payment.advance')}:</strong>{' '}
                        {t('terms.payment.advanceDescription')}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#D8C78E] font-medium">•</span>
                      <span>
                        <strong className="text-white">{highlightBadge('60%')} {t('terms.payment.duringEvent')}:</strong>{' '}
                        {t('terms.payment.duringEventDescription')}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#D8C78E] font-medium">•</span>
                      <span>
                        <strong className="text-white">{highlightBadge('20%')} {t('terms.payment.final')}:</strong>{' '}
                        {t('terms.payment.finalDescription')}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Condition 2 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  2
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.collection.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.collection.before')} {highlightBadge(t('terms.days120'))}
                    {t('terms.collection.after')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 3 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  3
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.uncollected.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.uncollected.before')} {highlightBadge(t('terms.days120'))}
                    {t('terms.uncollected.after')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 4 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  4
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.selection.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.selection.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 5 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  5
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.sheets.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.sheets.before')} {highlightBadge(t('terms.sheets.price'))}{' '}
                    {t('terms.sheets.after')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 6 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  6
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.delivery.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.delivery.before')} {highlightBadge(t('terms.delivery.duration'))}{' '}
                    {t('terms.delivery.after')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 7 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  7
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.complimentary.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.complimentary.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 8 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  8
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.confirmation.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.confirmation.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 9 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  9
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.afterDelivery.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.afterDelivery.description')}
                  </p>
                </div>
              </div>
            </div>

            {/* Condition 10 */}
            <div className="rounded-lg border border-[#C5B378]/15 bg-[#092E2B]/50 p-4 transition-colors hover:border-[#C5B378]/30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5B378]/15 text-xs font-semibold text-[#D8C78E]">
                  10
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#D8C78E]" />
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      {t('terms.agreement.title')}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed pl-1">
                    {t('terms.agreement.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note Callout */}
          <div className="rounded-xl border border-[#D8C78E]/40 bg-[#092E2B] p-4.5 sm:p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-[#D8C78E]">
              <HelpCircle className="h-4 w-4" />
              <h4 className="font-serif text-sm sm:text-base font-semibold tracking-wider uppercase text-[#D8C78E]">
                {t('terms.important.title')}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[#E6ECEB]/90 leading-relaxed">
              {t('terms.important.description')}
            </p>
            <p className="text-xs sm:text-sm text-[#D8C78E]/90 font-medium leading-relaxed pt-1">
              {t('terms.important.confirmed')}
            </p>
          </div>

          {/* Studio Signature Tagline */}
          <div className="text-center py-3 border-t border-[#C5B378]/15 space-y-1">
            <p className="font-serif text-sm sm:text-base tracking-widest text-[#D8C78E] uppercase font-semibold">
              {t('terms.thankYou')}
            </p>
            <p className="text-xs text-[#E6ECEB]/70 tracking-wider">
              {t('terms.tagline')}
            </p>
          </div>
        </div>

        {/* Footer Acceptance Section */}
        <div className="border-t border-[#C5B378]/25 bg-[#092E2B]/95 px-6 py-4 space-y-4">
          {isBookingFlow ? (
            <>
              {/* Mandatory Acceptance Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none rounded-lg border border-[#C5B378]/30 bg-[#072421] p-3 hover:border-[#D8C78E] transition-colors">
                <input
                  type="checkbox"
                  checked={hasAgreed}
                  disabled={isSubmitting}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#C5B378]/40 bg-[#092E2B] text-[#C5B378] focus:ring-[#D8C78E] accent-[#C5B378] cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-medium text-white leading-snug">
                  {t('terms.acceptance')}
                </span>
              </label>

              {/* Action Buttons */}
              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#072421] hover:text-white"
                >
                  {t('terms.goBack')}
                </Button>

                <Button
                  type="button"
                  onClick={handleAccept}
                  disabled={!hasAgreed || isSubmitting}
                  className="w-full sm:w-auto min-w-[170px] bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('terms.confirming')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t('terms.acceptContinue')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
              >
                {t('terms.close')}
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
