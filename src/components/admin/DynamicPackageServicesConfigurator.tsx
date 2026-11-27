'use client';

import React, { useMemo } from 'react';
import {
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  DurationTier,
  PackageIncludedService,
  StudioService,
} from '@/src/types/studio';
import {
  calculatePackageBasePrice,
  DURATION_TIER_LABELS,
  getPackageServiceGroupKey,
  normalizePackageIncludedServices,
  resolveServicePrice,
} from '@/src/lib/pricing';
import { formatINR } from '@/src/lib/utils';
import { englishOnlyName } from '@/src/lib/englishOnlyName';
import { Badge } from '@/src/components/ui/badge';

interface DynamicPackageServicesConfiguratorProps {
  durationTier: DurationTier;
  onChangeDurationTier: (tier: DurationTier) => void;
  includedServices: PackageIncludedService[];
  onChangeIncludedServices: (items: PackageIncludedService[]) => void;
  services: StudioService[];
}

export function DynamicPackageServicesConfigurator({
  durationTier,
  onChangeDurationTier,
  includedServices,
  onChangeIncludedServices,
  services,
}: DynamicPackageServicesConfiguratorProps) {
  // Only use active services for configuration
  const activeServices = useMemo(() => {
    return services
      .filter((s) => s.isActive !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [services]);

  const normalizedIncludedServices = useMemo(
    () => normalizePackageIncludedServices(includedServices, activeServices),
    [includedServices, activeServices]
  );

  // Set of currently included service slugs
  const includedSlugSet = useMemo(() => {
    return new Set(normalizedIncludedServices.map((i) => i.serviceSlug));
  }, [normalizedIncludedServices]);

  // Live calculated base price for package
  const liveBasePrice = useMemo(() => {
    const pricedServices = normalizedIncludedServices.map((item) => {
      const service = activeServices.find((candidate) => candidate.slug === item.serviceSlug);
      if (!service) return item;
      const minimum = service.pricingType === 'per_unit' && !service.slug.startsWith('photo-album')
        ? Math.max(1, Number(service.minQuantity) || 1)
        : 1;
      return {
        ...item,
        quantity: Math.max(minimum, Math.round(Number(item.quantity) || 0)),
      };
    });
    return calculatePackageBasePrice(
      { includedServices: pricedServices, durationTier },
      activeServices,
      durationTier
    );
  }, [normalizedIncludedServices, activeServices, durationTier]);

  // Included items breakdown with live cost
  const includedBreakdown = useMemo(() => {
    const rows = normalizedIncludedServices.flatMap((item) => {
      const svc = activeServices.find((s) => s.slug === item.serviceSlug);
      if (!svc) {
        return {
          slug: item.serviceSlug,
          name: item.serviceSlug,
          quantity: item.quantity,
          unitLabel: 'unit',
          unitPrice: 0,
          total: 0,
          category: 'Service',
        };
      }
      const itemTier = item.durationTier ?? durationTier;
      const minimum = svc.pricingType === 'per_unit' && !svc.slug.startsWith('photo-album')
        ? Math.max(1, Number(svc.minQuantity) || 1)
        : 1;
      const quantity = Math.max(minimum, Math.round(Number(item.quantity) || 0));
      const priceResult = resolveServicePrice(svc, itemTier, quantity);
      return {
        slug: svc.slug,
        name: svc.name,
        tamilName: svc.tamilName,
        quantity,
        unitLabel: svc.unitLabel || 'unit',
        unitPrice: priceResult.unitPrice,
        total: priceResult.total,
        category: svc.category,
        pricingType: svc.pricingType,
        durationTier: itemTier,
      };
    });

    const merged = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const slug = row.slug.toLowerCase();
      const name = englishOnlyName(row.name);
      const isCandidPhoto =
        slug === 'candid-photography' ||
        slug === 'candid-photography-standard' ||
        /candid.*(photo|photograph)/i.test(name);
      const isLedWall =
        slug === 'led-wall' ||
        /led.*wall|live.*led/i.test(name);

      const key = isCandidPhoto ? 'candid-photo' : isLedWall ? 'live-led-wall' : slug;
      const current = merged.get(key);
      if (!current) {
        merged.set(key, {
          ...row,
          name: isCandidPhoto ? 'Candid Photo' : isLedWall ? 'Live LED Wall' : row.name,
        });
        continue;
      }

      const preferRow = row.total > current.total ? row : current;
      merged.set(key, {
        ...preferRow,
        name: isCandidPhoto ? 'Candid Photo' : isLedWall ? 'Live LED Wall' : preferRow.name,
      });
    }

    return Array.from(merged.values()).filter((row) => {
      const hasCatalogName = !/^candid-photography(?:-|$)/i.test(row.name);
      return row.slug !== 'candid-photography' || row.total > 0 || hasCatalogName;
    });
  }, [normalizedIncludedServices, activeServices, durationTier]);

  // Toggle service inclusion in base package
  const handleToggleIncludeService = (svc: StudioService) => {
    const groupKey = getPackageServiceGroupKey(svc.slug, svc.name);
    if (includedSlugSet.has(svc.slug)) {
      // Remove from includedServices
      onChangeIncludedServices(
        normalizedIncludedServices.filter((item) =>
          getPackageServiceGroupKey(
            item.serviceSlug,
            activeServices.find((service) => service.slug === item.serviceSlug)?.name
          ) !== groupKey
        )
      );
    } else {
      // Add to includedServices with smart default quantity
      const defaultQty =
        svc.pricingType === 'per_unit' && !svc.slug.startsWith('photo-album')
          ? Math.max(svc.minQuantity || 1, 1)
          : 1;

      const nextIncluded = [
        ...normalizedIncludedServices.filter((item) =>
          getPackageServiceGroupKey(
            item.serviceSlug,
            activeServices.find((service) => service.slug === item.serviceSlug)?.name
          ) !== groupKey
        ),
        { serviceSlug: svc.slug, quantity: defaultQty, durationTier },
      ];
      onChangeIncludedServices(nextIncluded);
    }
  };

  // Update quantity of an included service
  const handleUpdateQuantity = (slug: string, newQty: number) => {
    const service = activeServices.find((item) => item.slug === slug);
    const minimum = service?.pricingType === 'per_unit' && !service.slug.startsWith('photo-album')
      ? service.minQuantity || 1
      : 1;
    const qty = Math.max(minimum, newQty);
    onChangeIncludedServices(
      normalizedIncludedServices.map((i) => (i.serviceSlug === slug ? { ...i, quantity: qty } : i))
    );
  };

  return (
    <div className="space-y-4 border-t border-[#C5B378]/25 pt-4">
      {/* ─── Header & Duration Tier Dropdown ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#D8C78E]" />
            Dynamic Service & Pricing Configurator
          </h4>
          <p className="text-[11px] text-[#E6ECEB]/70 mt-0.5">
            Select master services to calculate the package base price live. Prices derive directly from the Services collection.
          </p>
        </div>

        {/* Duration Tier Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-[#D8C78E]">Duration Tier *</label>
          <select
            value={durationTier === 'threeHours' ? 'halfDay' : durationTier}
            onChange={(e) => onChangeDurationTier(e.target.value as DurationTier)}
            className="h-9 rounded-md border border-[#C5B378]/35 bg-[#092E2B] px-3 text-xs text-white font-medium focus:border-[#D8C78E] focus:outline-none"
          >
            <option value="halfDay">Half Day</option>
            <option value="fullDay">Full Day</option>
          </select>
        </div>
      </div>

      {/* ─── Hero Live Calculated Base Price Card ─── */}
      <div className="rounded-lg border-2 border-[#D8C78E] bg-gradient-to-r from-[#0E423E] to-[#114A45] p-4 text-[#E6ECEB] shadow-[0_8px_24px_rgba(216,199,142,0.15)] space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#C5B378]/20 pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Live Dynamic Calculated Base Price
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-white tracking-tight">
                {formatINR(liveBasePrice)}
              </span>
              <span className="text-xs text-[#E6ECEB]/70 font-mono">
                ({DURATION_TIER_LABELS[durationTier]?.en || durationTier})
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#061E1C]/80 border border-[#D8C78E]/40 px-2.5 py-1 text-[11px] font-bold text-[#D8C78E]">
              <Check className="h-3 w-3 stroke-[3]" />
              {normalizedIncludedServices.length} {normalizedIncludedServices.length === 1 ? 'Service' : 'Services'} Included
            </span>
          </div>
        </div>

        {/* Live Line-Item Breakdown Chips */}
        {includedBreakdown.length === 0 ? (
          <p className="text-xs text-amber-300/80 italic">
            No services currently selected. Check services below to construct this package.
          </p>
        ) : (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D8C78E]/80 block">
              Itemized Line Items:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {includedBreakdown.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-center justify-between gap-2 rounded bg-[#061E1C]/70 border border-[#C5B378]/20 px-2.5 py-1 text-xs"
                >
                  <span className="truncate text-white font-medium">
                    {item.name} ({item.quantity} {item.unitLabel}{item.quantity > 1 ? 's' : ''})
                  </span>
                  <span className="font-mono font-bold text-[#D8C78E] shrink-0">
                    {formatINR(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── 1. Included Services Checklist (with Quantities & Line Costs) ─── */}
      <div className="space-y-2.5 bg-[#051C1A] p-4 rounded-lg border border-[#C5B378]/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#D8C78E] block">
              1. Base Included Services ({normalizedIncludedServices.length} Selected)
            </span>
            <p className="text-[11px] text-[#E6ECEB]/60">
              Check services to bundle into this package. Adjust camera counts or album sheets.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
          {activeServices.map((svc) => {
            const isIncluded = includedSlugSet.has(svc.slug);
            const currentItem = normalizedIncludedServices.find((i) => i.serviceSlug === svc.slug);
            const catalogMinimum =
              svc.pricingType === 'per_unit' && !svc.slug.startsWith('photo-album')
                ? Math.max(1, Number(svc.minQuantity) || 1)
                : 1;
            const qty = Math.max(
              catalogMinimum,
              Math.round(Number(currentItem?.quantity) || (svc.pricingType === 'per_unit' ? catalogMinimum : 1))
            );
            const itemTier = currentItem?.durationTier ?? durationTier;
            const linePrice = resolveServicePrice(svc, itemTier, qty);

            return (
              <div
                key={svc.slug}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-md border transition-all ${
                  isIncluded
                    ? 'border-[#D8C78E] bg-[#0E423E] shadow-sm'
                    : 'border-[#C5B378]/20 bg-[#092E2B]/50 hover:border-[#C5B378]/40 hover:bg-[#092E2B]'
                }`}
              >
                {/* Left: Checkbox + Name */}
                <label className="flex items-start sm:items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isIncluded}
                    onChange={() => handleToggleIncludeService(svc)}
                    className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-[#C5B378]/40 bg-[#072421] text-[#C5B378] accent-[#C5B378] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold ${isIncluded ? 'text-white' : 'text-[#E6ECEB]/85'}`}>
                        {englishOnlyName(svc.name)}
                      </span>
                      <Badge
                        variant="neutral"
                        className="border-[#C5B378]/20 bg-[#061E1C] text-[9px] text-[#D8C78E] py-0 px-1"
                      >
                        {svc.category}
                      </Badge>
                    </div>
                    {svc.description && (
                      <p className="text-[10px] text-[#E6ECEB]/60 truncate max-w-md">
                        {svc.description}
                      </p>
                    )}
                  </div>
                </label>

                {/* Right: Quantity Stepper & Line Price */}
                {isIncluded && (
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-6 sm:pl-0 shrink-0 border-t sm:border-t-0 border-[#C5B378]/15 pt-2 sm:pt-0">
                    {svc.pricingType === 'per_unit' && !svc.slug.startsWith('photo-album') && (
                      <span className="text-[10px] font-medium text-[#D8C78E]/70">
                        Min: {svc.minQuantity || 1}
                      </span>
                    )}
                    {/* Stepper */}
                    <div className="flex items-center rounded border border-[#C5B378]/35 bg-[#072421]">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(svc.slug, qty - 1)}
                        disabled={qty <= (
                          svc.pricingType === 'per_unit' && !svc.slug.startsWith('photo-album')
                            ? svc.minQuantity || 1
                            : 1
                        )}
                        className="px-2 py-0.5 text-xs font-bold text-[#D8C78E] hover:bg-[#114A45] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="px-2.5 py-0.5 font-mono text-xs font-bold text-white border-x border-[#C5B378]/25 min-w-[50px] text-center">
                        {qty} {svc.unitLabel}
                        {qty > 1 && !svc.unitLabel.endsWith('s') ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(svc.slug, qty + 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#D8C78E] hover:bg-[#114A45] hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    {svc.pricingType === 'tiered' && (
                      <select
                        aria-label={`${englishOnlyName(svc.name)} duration tier`}
                        value={itemTier === 'threeHours' ? 'halfDay' : itemTier}
                        onChange={(event) =>
                          onChangeIncludedServices(
                            includedServices.map((item) =>
                              item.serviceSlug === svc.slug
                                ? { ...item, durationTier: event.target.value as DurationTier }
                                : item
                            )
                          )
                        }
                        className="h-7 rounded border border-[#C5B378]/35 bg-[#072421] px-1.5 text-[10px] text-white focus:border-[#D8C78E] focus:outline-none"
                      >
                        <option value="halfDay">Half Day</option>
                        <option value="fullDay">Full Day</option>
                      </select>
                    )}

                    {/* Calculated Line Cost */}
                    <div className="text-right min-w-[80px]">
                      <span className="font-mono text-xs font-bold text-white block">
                        {svc.pricingType === 'tiered'
                          ? `${formatINR(linePrice.unitPrice)} × ${qty} = ${formatINR(linePrice.total)}`
                          : formatINR(linePrice.total)}
                      </span>
                      <span className="text-[9px] text-[#E6ECEB]/50 block">
                        {svc.pricingType === 'per_unit'
                          ? `₹${linePrice.unitPrice}/${svc.unitLabel}`
                          : `${DURATION_TIER_LABELS[itemTier === 'threeHours' ? 'halfDay' : itemTier]?.en || itemTier}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
