'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Sparkles, RefreshCw } from 'lucide-react';
import { StudioEvent, StudioPackage } from '@/src/types/studio';
import {
  ScaleOption,
  PriorityOption,
  resolveRecommendedPackage,
  PACKAGE_ADDONS,
} from '@/src/data/packageAdvisorConfig';
import { AdvisorStepIndicator } from './AdvisorStepIndicator';
import { AdvisorEventSelector } from './AdvisorEventSelector';
import { AdvisorScalePriorityStep } from './AdvisorScalePriorityStep';
import { AdvisorSolutionStep } from './AdvisorSolutionStep';
import { AdvisorInquiryModal } from './AdvisorInquiryModal';
import { Button } from '@/src/components/ui/button';

interface PackageAdvisorProps {
  events: StudioEvent[];
  packages: StudioPackage[];
  selectedCategoryId: string;
  onChangeCategory: (catId: string) => void;
  selectedEventId: string;
  onChangeEvent: (eventId: string) => void;
  onSelectPackageForBooking: (pkg: StudioPackage, eventId?: string) => void;
  onSwitchToStandardGrid: () => void;
  isLoading?: boolean;
}

export function PackageAdvisor({
  events,
  packages,
  selectedCategoryId,
  onChangeCategory,
  selectedEventId,
  onChangeEvent,
  onSelectPackageForBooking,
  onSwitchToStandardGrid,
  isLoading = false,
}: PackageAdvisorProps) {
  // Step state: 1 = Event selection, 2 = Scale & Priority, 3 = Solution reveal
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Consultative diagnostic answers
  const [scale, setScale] = useState<ScaleOption['id']>('classic');
  const [priority, setPriority] = useState<PriorityOption['id']>('emotions');

  // Live customizer add-on selections
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Inquiry modal state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  // Active events for selection
  const activeEvents = useMemo(() => {
    return events.filter((e) => (e.status ?? 'active') === 'active');
  }, [events]);

  // Current selected event object
  const currentEvent = useMemo(() => {
    return (
      activeEvents.find((e) => e.id === selectedEventId) ||
      activeEvents.find((e) => e.id === 'wedding') ||
      activeEvents[0]
    );
  }, [activeEvents, selectedEventId]);

  // Packages matching selected event
  const matchingPackages = useMemo(() => {
    return packages
      .filter((pkg) => (pkg.status ?? 'active') === 'active' && pkg.displayOnPortfolio !== false)
      .filter((pkg) => pkg.eventId === selectedEventId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages, selectedEventId]);

  // Diagnostic recommendation resolution
  const { recommendedPackage, headline, consultativeReason, matchedTier } = useMemo(() => {
    return resolveRecommendedPackage(
      matchingPackages,
      scale,
      priority,
      currentEvent?.name || 'Milestone Celebration'
    );
  }, [matchingPackages, scale, priority, currentEvent?.name]);

  // Handle toggling an add-on
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Calculate final dynamic price
  const activeAddonsList = useMemo(() => {
    return PACKAGE_ADDONS.filter((a) => selectedAddonIds.includes(a.id));
  }, [selectedAddonIds]);

  const finalEstimatedPrice = useMemo(() => {
    const base = recommendedPackage?.price || 0;
    const delta = activeAddonsList.reduce((acc, curr) => acc + curr.priceDelta, 0);
    return Math.max(0, base + delta);
  }, [recommendedPackage?.price, activeAddonsList]);

  return (
    <div className="space-y-8">
      {/* Step Indicator Header */}
      <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] p-4 sm:p-5">
        <AdvisorStepIndicator
          currentStep={currentStep}
          totalSteps={3}
          onStepClick={(step) => setCurrentStep(step as 1 | 2 | 3)}
          onBack={() => setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3)}
          stepLabels={['1. Select Milestone', '2. Scale & Focus', '3. Tailored Solution']}
        />
      </div>

      {/* Main Step Content Area */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.3 }}
          >
            <AdvisorEventSelector
              events={activeEvents}
              packages={packages}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onChangeCategory}
              selectedEventId={selectedEventId}
              onSelectEvent={onChangeEvent}
              onNext={() => setCurrentStep(2)}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.3 }}
          >
            <AdvisorScalePriorityStep
              event={currentEvent}
              scale={scale}
              onChangeScale={setScale}
              priority={priority}
              onChangePriority={setPriority}
              onRevealSolution={() => setCurrentStep(3)}
            />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.3 }}
          >
            {recommendedPackage ? (
              <AdvisorSolutionStep
                event={currentEvent}
                pkg={recommendedPackage}
                headline={headline}
                consultativeReason={consultativeReason}
                matchedTier={matchedTier}
                selectedAddonIds={selectedAddonIds}
                onToggleAddon={handleToggleAddon}
                onLockPackage={() => setIsInquiryModalOpen(true)}
                onCheckAvailability={() => {
                  if (recommendedPackage) {
                    onSelectPackageForBooking(recommendedPackage, selectedEventId);
                  }
                }}
                onChangeSelections={() => setCurrentStep(2)}
              />
            ) : (
              /* Fallback if no specific package found for this event */
              <div className="rounded-sm border border-[#C5B378]/25 bg-[#092E2B] p-10 text-center space-y-4">
                <Sparkles className="h-8 w-8 text-[#D8C78E] mx-auto" />
                <h4 className="font-serif text-2xl font-semibold text-white">
                  Bespoke Plan for {currentEvent?.name || 'This Milestone'}
                </h4>
                <p className="text-sm text-[#E6ECEB]/75 max-w-lg mx-auto leading-relaxed">
                  Every celebration is bespoke. Our team crafts a custom schedule, camera team, and album presentation specifically for your venue.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    onClick={() => setIsInquiryModalOpen(true)}
                    className="bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-semibold"
                  >
                    Inquire for Custom Quote
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Fallback View Toggle ("Prefer to browse? View all standard packages") ─── */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#C5B378]/15 text-xs text-[#E6ECEB]/70">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#D8C78E]" />
          <span>Package Advisor dynamically customizes packages for {currentEvent?.name || 'events'}.</span>
        </div>

        <button
          type="button"
          onClick={onSwitchToStandardGrid}
          className="group inline-flex items-center gap-1.5 font-semibold text-[#D8C78E] hover:text-white underline underline-offset-4 transition-colors"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Prefer to browse? View all standard packages</span>
        </button>
      </div>

      {/* ─── Step 4 / Inquiry Modal ─── */}
      {recommendedPackage && (
        <AdvisorInquiryModal
          isOpen={isInquiryModalOpen}
          onClose={() => setIsInquiryModalOpen(false)}
          event={currentEvent}
          pkg={recommendedPackage}
          activeAddons={activeAddonsList}
          finalEstimatedPrice={finalEstimatedPrice}
          onSuccessSubmit={() => {
            onSelectPackageForBooking(recommendedPackage, selectedEventId);
          }}
        />
      )}
    </div>
  );
}
