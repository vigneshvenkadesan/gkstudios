'use client';

import React, { useMemo } from 'react';
import {
  Camera,
  BookOpen,
  Film,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Star,
  Layers,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PackageDeliverables, StudioEvent, StudioPackage } from '@/src/types/studio';
import {
  PACKAGE_ADDONS,
  PackageAddon,
  PriorityOption,
  ScaleOption,
} from '@/src/data/packageAdvisorConfig';
import { formatINR } from '@/src/lib/utils';
import { englishOnlyName } from '@/src/lib/englishOnlyName';
import { Button } from '@/src/components/ui/button';

interface CategorizedDeliverable {
  category: string;
  text: string;
  consultativeWhy?: string;
}

function parseDeliverables(
  deliverables: PackageDeliverables | string[] | undefined | null
): CategorizedDeliverable[] {
  if (!deliverables) return [];

  const getWhyExplanation = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('crew') || cat.includes('coverage')) {
      return 'Dedicated specialists ensure important rites are never rushed while candid expressions are captured unobtrusively.';
    }
    if (cat.includes('album') || cat.includes('frame')) {
      return 'Heirloom print quality you and your family can touch, share, and preserve for future generations.';
    }
    if (cat.includes('digital') || cat.includes('video')) {
      return 'Fast cloud delivery ready for instant family sharing across WhatsApp, Instagram, and home 4K screens.';
    }
    return undefined;
  };

  if (Array.isArray(deliverables)) {
    return deliverables.map((item) => {
      if (item.includes(':')) {
        const [cat, ...rest] = item.split(':');
        const c = cat.trim();
        return {
          category: c,
          text: rest.join(':').trim(),
          consultativeWhy: getWhyExplanation(c),
        };
      }
      return {
        category: 'Inclusions',
        text: item,
        consultativeWhy: getWhyExplanation('Inclusions'),
      };
    });
  }

  if (typeof deliverables === 'object') {
    return Object.entries(deliverables)
      .filter(([_, val]) => Boolean(val && typeof val === 'string' && val.trim()))
      .map(([cat, val]) => ({
        category: cat,
        text: String(val).trim(),
        consultativeWhy: getWhyExplanation(cat),
      }));
  }

  return [];
}

interface AdvisorSolutionStepProps {
  event: StudioEvent | undefined;
  pkg: StudioPackage;
  headline: string;
  consultativeReason: string;
  matchedTier: 'essential' | 'signature' | 'premium';
  selectedAddonIds: string[];
  onToggleAddon: (addonId: string) => void;
  onLockPackage: () => void;
  onCheckAvailability?: () => void;
  onChangeSelections?: () => void;
}

export function AdvisorSolutionStep({
  event,
  pkg,
  headline,
  consultativeReason,
  matchedTier,
  selectedAddonIds,
  onToggleAddon,
  onLockPackage,
  onCheckAvailability,
  onChangeSelections,
}: AdvisorSolutionStepProps) {
  const parsedDeliverables = useMemo(() => {
    return parseDeliverables(pkg.deliverables);
  }, [pkg.deliverables]);

  // Filter applicable add-ons for this specific package
  const availableAddons = useMemo(() => {
    return PACKAGE_ADDONS.filter((addon) => {
      if (!addon.applicableIf) return true;
      return addon.applicableIf(pkg);
    });
  }, [pkg]);

  // Calculate dynamic custom price
  const { totalDelta, activeAddonsList, finalEstimatedPrice } = useMemo(() => {
    let delta = 0;
    const list: PackageAddon[] = [];

    availableAddons.forEach((addon) => {
      if (selectedAddonIds.includes(addon.id)) {
        delta += addon.priceDelta;
        list.push(addon);
      }
    });

    const calculated = Math.max(0, (pkg.price || 0) + delta);
    return {
      totalDelta: delta,
      activeAddonsList: list,
      finalEstimatedPrice: calculated,
    };
  }, [availableAddons, selectedAddonIds, pkg.price]);

  const isSignature = matchedTier === 'signature';
  const isPremium = matchedTier === 'premium';

  return (
    <div className="space-y-8 pb-20 sm:pb-8">
      {/* ─── Conversational Framing Header ─── */}
      <div className="rounded-sm border border-[#C5B378]/30 bg-gradient-to-br from-[#0E423E] via-[#092E2B] to-[#072421] p-6 sm:p-8 space-y-4 shadow-[0_12px_36px_rgba(4,20,18,0.4)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C5B378]/15 border border-[#C5B378]/40 px-3 py-1 text-xs font-semibold text-[#D8C78E]">
            <Sparkles className="h-3.5 w-3.5 text-[#D8C78E]" />
            <span>AI Consultative Advisor Diagnostic</span>
          </div>

          {onChangeSelections && (
            <button
              type="button"
              onClick={onChangeSelections}
              className="text-xs font-semibold text-[#D8C78E] hover:text-white underline underline-offset-4 transition-colors"
            >
              Adjust Answers
            </button>
          )}
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-white leading-tight">
          {headline}
        </h3>

        <div className="flex items-start gap-3 rounded-sm bg-[#061E1C]/60 border border-[#C5B378]/20 p-3.5 sm:p-4 text-xs sm:text-sm text-[#E6ECEB]/85 leading-relaxed">
          <span className="font-semibold text-[#D8C78E] shrink-0 uppercase tracking-wider text-[11px] pt-0.5">
            Why this plan:
          </span>
          <p>{consultativeReason}</p>
        </div>
      </div>

      {/* ─── Main Recommended Package Card + Live Customizer Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recommended Package Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className={`rounded-sm border p-6 sm:p-8 space-y-6 transition-all ${
              isSignature
                ? 'border-2 border-[#D8C78E] bg-[#0E423E] shadow-[0_18px_45px_rgba(216,199,142,0.25)] ring-1 ring-[#D8C78E]/40'
                : isPremium
                ? 'border border-amber-400/40 bg-[#0A3330] shadow-[0_14px_32px_rgba(4,20,18,0.3)]'
                : 'border border-[#C5B378]/30 bg-[#092E2B]'
            }`}
          >
            {/* Tier Indicator */}
            <div className="flex items-center justify-between gap-2 border-b border-[#C5B378]/20 pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D8C78E]">
                  Recommended Base Tier
                </span>
                <h4 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                  {pkg.name}
                </h4>
              </div>

              {isSignature ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C5B378] to-[#D8C78E] px-3.5 py-1 text-xs font-bold text-[#061E1C] uppercase tracking-wider shadow">
                  <Star className="h-3.5 w-3.5 fill-[#061E1C]" />
                  Signature Plan
                </span>
              ) : isPremium ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  👑 Premium Tier
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0E423E] border border-[#C5B378]/40 px-3 py-1 text-xs font-bold text-[#D8C78E] uppercase tracking-wider">
                  ✨ Essential Plan
                </span>
              )}
            </div>

            {/* Audience & Duration */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#E6ECEB]/80">
              <span className="text-[#D8C78E] font-medium">{pkg.audience}</span>
              <span>•</span>
              <span>{pkg.duration}</span>
            </div>

            {/* Base Price */}
            <div className="rounded-sm bg-[#072421]/70 border border-[#C5B378]/15 p-4 flex items-baseline justify-between">
              <div>
                <p className="text-[11px] text-[#E6ECEB]/60 uppercase tracking-wider">
                  Standard Inclusions Value
                </p>
                <p className="font-serif text-3xl font-semibold text-white tracking-tight mt-0.5">
                  {formatINR(pkg.price)}
                </p>
              </div>
              <span className="text-xs text-[#D8C78E]">
                {pkg.priceLabel || 'All-inclusive rate'}
              </span>
            </div>

            {/* Structured Deliverables Breakdown with Consultative "Why" */}
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                <Layers className="h-4 w-4" />
                <span>Structured Deliverables & Inclusions</span>
              </div>

              <div className="space-y-4">
                {parsedDeliverables.map((item, idx) => {
                  const isCrew =
                    item.category.toLowerCase().includes('crew') ||
                    item.category.toLowerCase().includes('coverage');
                  const isAlbum =
                    item.category.toLowerCase().includes('album') ||
                    item.category.toLowerCase().includes('frame');
                  const isDigital =
                    item.category.toLowerCase().includes('digital') ||
                    item.category.toLowerCase().includes('video');

                  return (
                    <div
                      key={idx}
                      className="rounded-sm bg-[#061E1C]/50 border border-[#C5B378]/15 p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                        {isCrew ? (
                          <Camera className="h-3.5 w-3.5 text-[#D8C78E]" />
                        ) : isAlbum ? (
                          <BookOpen className="h-3.5 w-3.5 text-[#D8C78E]" />
                        ) : isDigital ? (
                          <Film className="h-3.5 w-3.5 text-[#D8C78E]" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-[#D8C78E]" />
                        )}
                        <span>{item.category}</span>
                      </div>

                      <p className="text-sm text-white font-medium pl-5.5 leading-relaxed">
                        {item.text}
                      </p>

                      {item.consultativeWhy && (
                        <p className="text-[11px] text-[#E6ECEB]/65 pl-5.5 italic">
                          Why this matters: {item.consultativeWhy}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Customizer & Dynamic Total (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-sm border border-[#C5B378]/30 bg-[#0E423E] p-6 space-y-6 shadow-[0_12px_30px_rgba(4,20,18,0.35)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D8C78E]">
                <Sliders className="h-4 w-4 text-[#D8C78E]" />
                <span>Live Package Customizer</span>
              </div>
              <h4 className="font-serif text-xl font-semibold text-white">
                Fine-tune with Add-ons & Swaps
              </h4>
              <p className="text-xs text-[#E6ECEB]/75 leading-relaxed">
                Add cinematic video, outdoor sessions, or extra albums in one click. Price updates in real time.
              </p>
            </div>

            {/* Addon Pills List */}
            <div className="space-y-3">
              {availableAddons.map((addon) => {
                const isActive = selectedAddonIds.includes(addon.id);
                const isRemoval = addon.type === 'remove';

                return (
                  <motion.button
                    key={addon.id}
                    type="button"
                    onClick={() => onToggleAddon(addon.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group w-full flex items-start justify-between gap-3 p-3.5 rounded-sm border text-left transition-all ${
                      isActive
                        ? isRemoval
                          ? 'border-rose-400/50 bg-rose-950/30 ring-1 ring-rose-400/40'
                          : 'border-[#D8C78E] bg-[#114A45] ring-1 ring-[#D8C78E] shadow-[0_4px_16px_rgba(216,199,142,0.2)]'
                        : 'border-[#C5B378]/25 bg-[#092E2B] hover:border-[#C5B378]/50 hover:bg-[#0C3935]'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isActive
                              ? isRemoval
                                ? 'text-rose-200'
                                : 'text-white'
                              : 'text-white group-hover:text-[#F4E8C1]'
                          }`}
                        >
                          {englishOnlyName(addon.name)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#E6ECEB]/70 leading-relaxed">
                        {addon.description}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tracking-wide ${
                          isActive
                            ? isRemoval
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                              : 'bg-[#D8C78E] text-[#061E1C]'
                            : isRemoval
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                            : 'bg-[#072421] text-[#D8C78E] border border-[#C5B378]/30'
                        }`}
                      >
                        {isActive ? (
                          isRemoval ? (
                            <Minus className="h-3 w-3 stroke-[3]" />
                          ) : (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )
                        ) : isRemoval ? (
                          <Minus className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        {addon.badge}
                      </span>
                      <span className="text-[10px] text-[#E6ECEB]/50 uppercase tracking-wider">
                        {isActive ? 'Included' : 'Tap to add'}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Dynamic Investment Summary Card */}
            <div className="rounded-sm border border-[#D8C78E]/40 bg-gradient-to-br from-[#061E1C] to-[#092E2B] p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E]">
                  Estimated Total Investment
                </span>
                <div className="flex items-baseline justify-between">
                  <motion.div
                    key={finalEstimatedPrice}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight"
                  >
                    {formatINR(finalEstimatedPrice)}
                  </motion.div>

                  {totalDelta !== 0 && (
                    <span
                      className={`text-xs font-semibold ${
                        totalDelta > 0 ? 'text-[#D8C78E]' : 'text-rose-300'
                      }`}
                    >
                      {totalDelta > 0 ? `+${formatINR(totalDelta)}` : formatINR(totalDelta)} in options
                    </span>
                  )}
                </div>
              </div>

              {activeAddonsList.length > 0 && (
                <div className="pt-2 border-t border-[#C5B378]/20 space-y-1">
                  <p className="text-[11px] text-[#E6ECEB]/60 uppercase tracking-wider">
                    Selected Customizations:
                  </p>
                  <ul className="text-xs text-[#E6ECEB]/85 space-y-1">
                    {activeAddonsList.map((a) => (
                      <li key={a.id} className="flex justify-between">
                        <span>• {a.name}</span>
                        <span className="font-semibold text-[#D8C78E]">{a.badge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Desktop Lock Custom Package CTA */}
              <div className="pt-2 space-y-2.5">
                <Button
                  type="button"
                  onClick={onLockPackage}
                  className="w-full gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold hover:brightness-105 shadow-[0_4px_16px_rgba(216,199,142,0.35)] py-3 text-sm"
                >
                  <span>Lock This Custom Package</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {onCheckAvailability && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCheckAvailability}
                    className="w-full border-[#C5B378]/40 text-[#D8C78E] hover:bg-[#C5B378]/10 text-xs py-2"
                  >
                    Check Calendar Availability
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sticky Mobile Price Summary Bar ─── */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#061E1C]/95 backdrop-blur-md border-t border-[#C5B378]/30 p-3 sm:p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#D8C78E] font-semibold truncate max-w-[140px] sm:max-w-none">
              {pkg.name}
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
              {formatINR(finalEstimatedPrice)}
            </p>
          </div>

          <Button
            type="button"
            onClick={onLockPackage}
            className="gap-2 bg-gradient-to-r from-[#C5B378] to-[#D8C78E] text-[#061E1C] font-bold shadow px-4 py-2 text-xs sm:text-sm"
          >
            <span>Lock Package</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
