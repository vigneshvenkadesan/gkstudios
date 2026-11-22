'use client';

import React, { useState, useMemo } from 'react';
import NextImage from 'next/image';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Baby,
  BookOpen,
  Briefcase,
  Cake,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Film,
  Filter,
  Flame,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Loader2,
  Package as PackageIcon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_GROUPS,
  EventCategory,
  PackageAddon,
  PackageCustomizer,
  PackageDeliverables,
  PackageIncludedFeatures,
  StudioEvent,
  StudioPackage,
} from '@/src/types/studio';
import { formatINR } from '@/src/lib/utils';
import { useEvents } from '@/src/hooks/useEvents';
import { EventSelector } from '@/src/components/common/EventSelector';
import { Button } from '@/src/components/ui/button';
import { SubmitButton } from '@/src/components/ui/SubmitButton';
import { SHIMMER_BLUR_DATA_URL } from '@/src/lib/imageBlur';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';

export type PackageTier = 'essential' | 'signature' | 'premium';

/**
 * Normalizes any package deliverables (object or legacy string array) into a PackageDeliverables object.
 */
export function normalizePackageDeliverables(
  raw: unknown
): PackageDeliverables {
  if (!raw) return {};

  if (Array.isArray(raw)) {
    const result: PackageDeliverables = {};
    const items = raw.map(String).map((s) => s.trim()).filter(Boolean);
    items.forEach((item) => {
      const lower = item.toLowerCase();
      if (
        lower.includes('photographer') ||
        lower.includes('videographer') ||
        lower.includes('drone') ||
        lower.includes('crew') ||
        lower.includes('gimbal') ||
        lower.includes('operator') ||
        lower.includes('camera') ||
        lower.includes('coverage')
      ) {
        result['Event Coverage & Crew'] = result['Event Coverage & Crew']
          ? `${result['Event Coverage & Crew']} + ${item}`
          : item;
      } else if (
        lower.includes('album') ||
        lower.includes('book') ||
        lower.includes('frame') ||
        lower.includes('print') ||
        lower.includes('box') ||
        lower.includes('karizma')
      ) {
        result['Albums & Photo Frames'] = result['Albums & Photo Frames']
          ? `${result['Albums & Photo Frames']} + ${item}`
          : item;
      } else if (
        lower.includes('digital') ||
        lower.includes('raw') ||
        lower.includes('teaser') ||
        lower.includes('video') ||
        lower.includes('film') ||
        lower.includes('cloud') ||
        lower.includes('drive') ||
        lower.includes('footage') ||
        lower.includes('reel') ||
        lower.includes('stills') ||
        lower.includes('photos')
      ) {
        result['Digital Deliverables'] = result['Digital Deliverables']
          ? `${result['Digital Deliverables']} + ${item}`
          : item;
      } else {
        result['Event Coverage & Crew'] = result['Event Coverage & Crew']
          ? `${result['Event Coverage & Crew']} + ${item}`
          : item;
      }
    });
    return result;
  }

  if (typeof raw === 'object') {
    const result: PackageDeliverables = {};
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof val === 'string' && val.trim()) {
        result[key] = val.trim();
      }
    }
    return result;
  }

  return {};
}

/**
 * Accurately determines a package's tier.
 * Only 3 tiers: Essential, Signature, Premium.
 */
export function getPackageTier(pkg: StudioPackage): PackageTier {
  // 0. Explicit tier stored on package
  if (pkg.tier === 'essential' || pkg.tier === 'signature' || pkg.tier === 'premium') {
    return pkg.tier;
  }

  // 1. Check sortOrder (1 = Essential, 2 = Signature, 3 = Premium per schema)
  if (pkg.sortOrder === 1) return 'essential';
  if (pkg.sortOrder === 2) return 'signature';
  if (pkg.sortOrder === 3) return 'premium';

  const name = (pkg.name || '').toLowerCase();
  const id = (pkg.id || '').toLowerCase();
  const audience = (pkg.audience || '').toLowerCase();

  // 2. Premium keywords check (takes priority to prevent premium slipping into essential)
  if (
    id.includes('premium') ||
    name.includes('premium') ||
    id.includes('royal') ||
    name.includes('royal') ||
    id.includes('luxury') ||
    name.includes('luxury') ||
    id.includes('elite') ||
    name.includes('platinum') ||
    name.includes('cinematic complete') ||
    id === 'pkg-royal'
  ) {
    return 'premium';
  }

  // 3. Signature keywords check (flagship / highlighted / grand)
  if (
    Boolean(pkg.highlighted || pkg.featured) ||
    id.includes('signature') ||
    name.includes('signature') ||
    id.includes('grand') ||
    name.includes('grand') ||
    name.includes('popular') ||
    id === 'pkg-grand'
  ) {
    return 'signature';
  }

  // 4. Essential keywords check
  if (
    id.includes('essential') ||
    name.includes('essential') ||
    id.includes('basic') ||
    name.includes('starter') ||
    id.includes('standard') ||
    id.includes('silver') ||
    id === 'pkg-essential'
  ) {
    return 'essential';
  }

  // 5. Secondary checks based on audience
  if (audience.includes('premium') || audience.includes('royal') || audience.includes('luxury')) {
    return 'premium';
  }
  if (audience.includes('signature') || audience.includes('grand')) {
    return 'signature';
  }
  if (audience.includes('essential') || audience.includes('basic')) {
    return 'essential';
  }

  // 6. Price-based fallback heuristic
  if (pkg.price >= 70000) return 'premium';
  if (pkg.price >= 35000) return 'signature';
  return 'essential';
}

const DEFAULT_INCLUDED_FEATURES: PackageIncludedFeatures = {
  traditionalPhoto: true,
  traditionalVideo: true,
  candidPhoto: false,
  candidVideo: false,
  drone: false,
  ledWall: false,
  outdoorShoot: false,
  printedAlbum: true,
};

const DEFAULT_CUSTOMIZER_ADDONS: PackageAddon[] = [
  { id: 'candid-photo', label: 'Candid Photography', priceDelta: 8000, type: 'upgrade' },
  { id: 'candid-video', label: 'Candid Cinema & 3-Min Film', priceDelta: 12000, type: 'upgrade' },
  { id: 'drone', label: 'Drone Aerial Coverage', priceDelta: 8000, type: 'upgrade' },
  { id: 'extra-frame-16x24', label: 'Extra 16×24 Wall Frame', priceDelta: 2500, type: 'upgrade' },
  { id: 'remove-album', label: 'Digital-Only (Remove Printed Album)', priceDelta: -4000, type: 'downgrade' },
];

const INCLUDED_FEATURE_CONFIG: { key: keyof PackageIncludedFeatures; label: string }[] = [
  { key: 'traditionalPhoto', label: 'Traditional Photo' },
  { key: 'traditionalVideo', label: 'Traditional Video' },
  { key: 'candidPhoto', label: 'Candid Photo' },
  { key: 'candidVideo', label: 'Candid Cinema' },
  { key: 'drone', label: 'Drone Aerial' },
  { key: 'ledWall', label: 'Live LED Wall' },
  { key: 'outdoorShoot', label: 'Outdoor Shoot' },
  { key: 'printedAlbum', label: 'Printed Album' },
];

function PackageCustomizerSection({
  included,
  onChangeIncluded,
  addons,
  onChangeAddons,
  addonLabelInput,
  setAddonLabelInput,
  addonPriceDeltaInput,
  setAddonPriceDeltaInput,
  addonTypeInput,
  setAddonTypeInput,
}: {
  included: PackageIncludedFeatures;
  onChangeIncluded: (newInc: PackageIncludedFeatures) => void;
  addons: PackageAddon[];
  onChangeAddons: (newAddons: PackageAddon[]) => void;
  addonLabelInput: string;
  setAddonLabelInput: (val: string) => void;
  addonPriceDeltaInput: number | '';
  setAddonPriceDeltaInput: (val: number | '') => void;
  addonTypeInput: 'upgrade' | 'downgrade';
  setAddonTypeInput: (val: 'upgrade' | 'downgrade') => void;
}) {
  const handleToggleIncluded = (key: keyof PackageIncludedFeatures) => {
    onChangeIncluded({
      ...included,
      [key]: !included[key],
    });
  };

  const handleRemoveAddon = (index: number) => {
    const next = [...addons];
    next.splice(index, 1);
    onChangeAddons(next);
  };

  const handleAddAddon = () => {
    if (!addonLabelInput.trim() || addonPriceDeltaInput === '') {
      toast.error('Please enter add-on title and price delta.');
      return;
    }
    const rawDelta = Number(addonPriceDeltaInput);
    const priceDelta = addonTypeInput === 'downgrade' ? -Math.abs(rawDelta) : Math.abs(rawDelta);
    const slug =
      addonLabelInput
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `addon-${Date.now()}`;

    onChangeAddons([
      ...addons,
      {
        id: slug,
        label: addonLabelInput.trim(),
        priceDelta,
        type: addonTypeInput,
      },
    ]);
    setAddonLabelInput('');
    setAddonPriceDeltaInput('');
    setAddonTypeInput('upgrade');
    toast.success(`Add-on "${addonLabelInput.trim()}" added.`);
  };

  return (
    <div className="space-y-4 border-t border-[#C5B378]/20 pt-4">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#D8C78E]" />
          Proposal Customizer & Add-ons Configuration (customizer)
        </h4>
        <p className="text-[11px] text-[#E6ECEB]/60 mt-0.5">
          Configures the interactive checklist and dynamic add-on price recalculator on the Proposal page (<code className="text-[#D8C78E]">/packages/proposal</code>).
        </p>
      </div>

      {/* 1. Base Included Features */}
      <div className="space-y-2 bg-[#051C1A] p-3.5 rounded-lg border border-[#C5B378]/20">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8C78E] block">
          Base Included Features (Checkboxes)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {INCLUDED_FEATURE_CONFIG.map(({ key, label }) => {
            const isChecked = Boolean(included[key]);
            return (
              <label
                key={key}
                className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                  isChecked
                    ? 'border-[#D8C78E]/60 bg-[#0E423E] text-white font-medium'
                    : 'border-[#C5B378]/15 bg-[#092E2B]/50 text-[#E6ECEB]/60 hover:border-[#C5B378]/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleIncluded(key)}
                  className="h-3.5 w-3.5 rounded border-[#C5B378]/40 bg-[#072421] text-[#C5B378] accent-[#C5B378]"
                />
                <span className="truncate">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Proposal Add-ons & Downgrades */}
      <div className="space-y-2.5 bg-[#051C1A] p-3.5 rounded-lg border border-[#C5B378]/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#D8C78E]">
            Proposal Add-ons & Downgrade Swaps ({addons.length})
          </span>
          <span className="text-[10px] text-[#E6ECEB]/50">Upgrades (+) & Downgrades (−)</span>
        </div>

        {/* Existing Add-ons List */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {addons.length === 0 ? (
            <p className="text-xs text-[#E6ECEB]/50 italic p-2 text-center">
              No custom add-ons configured. Add one below.
            </p>
          ) : (
            addons.map((addon, idx) => {
              const isDowngrade = addon.type === 'downgrade' || addon.priceDelta < 0;
              return (
                <div
                  key={`${addon.id}-${idx}`}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-[#092E2B] border border-[#C5B378]/15 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        isDowngrade
                          ? 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                          : 'bg-[#C5B378]/20 border border-[#C5B378]/30 text-[#D8C78E]'
                      }`}
                    >
                      {isDowngrade ? 'Downgrade' : 'Upgrade'}
                    </span>
                    <span className="text-white font-medium truncate">{addon.label}</span>
                    <span className="text-[10px] text-[#E6ECEB]/40 font-mono hidden sm:inline">
                      ({addon.id})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-semibold font-mono text-xs ${
                        isDowngrade ? 'text-rose-300' : 'text-[#D8C78E]'
                      }`}
                    >
                      {addon.priceDelta > 0 ? `+${formatINR(addon.priceDelta)}` : formatINR(addon.priceDelta)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddon(idx)}
                      className="p-1 text-[#E6ECEB]/40 hover:text-rose-400 transition-colors"
                      title="Remove add-on"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Add-on Input Row */}
        <div className="pt-2 border-t border-[#C5B378]/15 space-y-1.5">
          <span className="text-[11px] font-medium text-[#E6ECEB]/70 block">
            + Add Proposal Add-on or Downgrade Option
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={addonLabelInput}
              onChange={(e) => setAddonLabelInput(e.target.value)}
              placeholder="Add-on title (e.g. Drone Aerial Coverage)"
              className="h-8 flex-[2] rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
            />
            <select
              value={addonTypeInput}
              onChange={(e) => setAddonTypeInput(e.target.value as 'upgrade' | 'downgrade')}
              className="h-8 rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none shrink-0"
            >
              <option value="upgrade">Upgrade (+)</option>
              <option value="downgrade">Downgrade (−)</option>
            </select>
            <input
              type="number"
              value={addonPriceDeltaInput}
              onChange={(e) =>
                setAddonPriceDeltaInput(e.target.value === '' ? '' : Math.abs(Number(e.target.value)))
              }
              placeholder="Amount (e.g. 8000)"
              className="h-8 w-28 rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none shrink-0 font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAddon}
              className="h-8 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B] text-xs px-3 shrink-0"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPackagesModule() {
  const { packages, portfolio, addPackage, updatePackage, deletePackage, reorderPackages } =
    useStudio();
  const {
    events: dynamicEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useEvents({ all: true });

  // View Mode: 'grouped' by ceremony or 'grid' (flat)
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');

  // Filter States - exactly 3 tiers with 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'essential' | 'signature' | 'premium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'portfolio' | 'hidden'>('all');

  // New Event Modal State
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventTamilName, setNewEventTamilName] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<string>('wedding');
  const [newEventCustomId, setNewEventCustomId] = useState('');
  const [newEventSortOrder, setNewEventSortOrder] = useState<number | ''>(10);
  const [newEventStatus, setNewEventStatus] = useState<'active' | 'inactive'>('active');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<StudioEvent | null>(null);
  const [editEventName, setEditEventName] = useState('');
  const [editEventTamilName, setEditEventTamilName] = useState('');
  const [editEventCategory, setEditEventCategory] = useState<string>('wedding');
  const [editEventSortOrder, setEditEventSortOrder] = useState<number | ''>(10);
  const [editEventStatus, setEditEventStatus] = useState<'active' | 'inactive'>('active');
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);

  // Delete Event Confirmation State
  const [deletingEvent, setDeletingEvent] = useState<StudioEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // New package modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newId, setNewId] = useState('');
  const [newEventId, setNewEventId] = useState('wedding');
  const [newTier, setNewTier] = useState<PackageTier>('signature');
  const [newName, setNewName] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newDuration, setNewDuration] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newHighlighted, setNewHighlighted] = useState(true);
  const [newSortOrder, setNewSortOrder] = useState<number>(2);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [newDisplayOnPortfolio, setNewDisplayOnPortfolio] = useState(true);

  // Categorized Deliverables State for New Package
  const [newDeliverables, setNewDeliverables] = useState<PackageDeliverables>({
    'Event Coverage & Crew': '1 Lead Candid Photographer + 1 Traditional Photographer',
    'Albums & Photo Frames': '30-Sheet Layflat Karizma Photo Album',
    'Digital Deliverables': 'Full Event Edited Video + Complete Raw Footage Drive',
  });
  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState('');
  const [newCustomDetailInput, setNewCustomDetailInput] = useState('');

  // Customizer State for New Package
  const [newCustomizerIncluded, setNewCustomizerIncluded] = useState<PackageIncludedFeatures>(DEFAULT_INCLUDED_FEATURES);
  const [newCustomizerAddons, setNewCustomizerAddons] = useState<PackageAddon[]>(DEFAULT_CUSTOMIZER_ADDONS);
  const [newAddonLabel, setNewAddonLabel] = useState('');
  const [newAddonPriceDelta, setNewAddonPriceDelta] = useState<number | ''>('');
  const [newAddonType, setNewAddonType] = useState<'upgrade' | 'downgrade'>('upgrade');

  // Edit package modal state
  const [editingPackage, setEditingPackage] = useState<StudioPackage | null>(null);
  const [editEventId, setEditEventId] = useState('wedding');
  const [editTier, setEditTier] = useState<PackageTier>('signature');
  const [editName, setEditName] = useState('');
  const [editAudience, setEditAudience] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editDuration, setEditDuration] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editHighlighted, setEditHighlighted] = useState(false);
  const [editSortOrder, setEditSortOrder] = useState<number>(2);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editDisplayOnPortfolio, setEditDisplayOnPortfolio] = useState(true);

  // Categorized Deliverables State for Editing Package
  const [editDeliverables, setEditDeliverables] = useState<PackageDeliverables>({});
  const [editCustomCategoryInput, setEditCustomCategoryInput] = useState('');
  const [editCustomDetailInput, setEditCustomDetailInput] = useState('');

  // Customizer State for Editing Package
  const [editCustomizerIncluded, setEditCustomizerIncluded] = useState<PackageIncludedFeatures>(DEFAULT_INCLUDED_FEATURES);
  const [editCustomizerAddons, setEditCustomizerAddons] = useState<PackageAddon[]>(DEFAULT_CUSTOMIZER_ADDONS);
  const [editAddonLabel, setEditAddonLabel] = useState('');
  const [editAddonPriceDelta, setEditAddonPriceDelta] = useState<number | ''>('');
  const [editAddonType, setEditAddonType] = useState<'upgrade' | 'downgrade'>('upgrade');

  // Delete confirmation dialog
  const [deletingPackage, setDeletingPackage] = useState<StudioPackage | null>(null);

  // Gallery Picker modal state
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'new' | 'edit'>('new');

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Global package stats
  const totalCount = packages.length;
  const activeCount = packages.filter((p) => (p.status ?? 'active') === 'active').length;
  const portfolioCount = packages.filter(
    (p) => (p.status ?? 'active') === 'active' && p.displayOnPortfolio !== false
  ).length;
  const highlightedCount = packages.filter((p) => p.highlighted || p.featured).length;

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages]);

  // Dynamic events available for the ceremony filter dropdown based on categoryFilter
  const availableEventsForFilter = useMemo(() => {
    if (categoryFilter === 'all') return dynamicEvents;
    return dynamicEvents.filter((ev) => {
      const evCat = (ev.category || '').toLowerCase();
      const fCat = categoryFilter.toLowerCase();
      if (fCat.startsWith('corporate')) {
        return evCat.startsWith('corporate');
      }
      return evCat === fCat;
    });
  }, [dynamicEvents, categoryFilter]);

  // Filtered packages calculation
  const filteredPackages = useMemo(() => {
    return sortedPackages.filter((pkg) => {
      const linkedEvent = dynamicEvents.find((e) => e.id === (pkg.eventId || 'wedding'));
      const eventName = linkedEvent?.name || '';
      const eventTamil = linkedEvent?.tamilName || '';
      const pkgCategory = linkedEvent?.category || pkg.category || '';

      // 1. Search Query (searches name, id, audience, event name/tamil, and deliverable categories + values)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = pkg.name.toLowerCase().includes(q);
        const matchId = pkg.id.toLowerCase().includes(q);
        const matchAudience = (pkg.audience || '').toLowerCase().includes(q);
        const matchEvent =
          eventName.toLowerCase().includes(q) || eventTamil.toLowerCase().includes(q);
        const delivObj = normalizePackageDeliverables(pkg.deliverables);
        const matchDeliverables = Object.entries(delivObj).some(
          ([cat, detail]) => cat.toLowerCase().includes(q) || (detail || '').toLowerCase().includes(q)
        );
        if (!matchName && !matchId && !matchAudience && !matchEvent && !matchDeliverables) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter !== 'all') {
        const fCat = categoryFilter.toLowerCase();
        const pCat = pkgCategory.toLowerCase();
        const isCorp = fCat.startsWith('corporate') && pCat.startsWith('corporate');
        if (pCat !== fCat && !isCorp) {
          return false;
        }
      }

      // 3. Event / Ceremony Filter
      if (selectedEventFilter !== 'all') {
        const pkgEventId = pkg.eventId || 'wedding';
        if (pkgEventId !== selectedEventFilter) {
          return false;
        }
      }

      // 4. Tier Filter (Exact match for Essential, Signature, Premium)
      // When 'essential' is chosen, Premium packages return 'premium' and are strictly excluded!
      if (tierFilter !== 'all') {
        const pkgTier = getPackageTier(pkg);
        if (pkgTier !== tierFilter) {
          return false;
        }
      }

      // 5. Status Filter
      if (statusFilter !== 'all') {
        const isActive = (pkg.status ?? 'active') === 'active';
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }

      // 6. Visibility Filter
      if (visibilityFilter !== 'all') {
        const isVisible = pkg.displayOnPortfolio !== false;
        if (visibilityFilter === 'portfolio' && !isVisible) return false;
        if (visibilityFilter === 'hidden' && isVisible) return false;
      }

      return true;
    });
  }, [
    sortedPackages,
    dynamicEvents,
    searchQuery,
    categoryFilter,
    selectedEventFilter,
    tierFilter,
    statusFilter,
    visibilityFilter,
  ]);

  // Distinct ceremonies represented in the current filtered packages
  const filteredCeremoniesCount = useMemo(() => {
    return new Set(filteredPackages.map((p) => p.eventId || 'wedding')).size;
  }, [filteredPackages]);

  // Active filters check
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      categoryFilter !== 'all' ||
      selectedEventFilter !== 'all' ||
      tierFilter !== 'all' ||
      statusFilter !== 'all' ||
      visibilityFilter !== 'all'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSelectedEventFilter('all');
    setTierFilter('all');
    setStatusFilter('all');
    setVisibilityFilter('all');
  };

  // Ceremonies to display in "Grouped by Ceremony" view
  const ceremoniesToDisplay = useMemo(() => {
    let list = dynamicEvents;

    // If specific event is chosen
    if (selectedEventFilter !== 'all') {
      return list.filter((ev) => ev.id === selectedEventFilter);
    }

    // If category is chosen
    if (categoryFilter !== 'all') {
      const fCat = categoryFilter.toLowerCase();
      list = list.filter((ev) => {
        const evCat = (ev.category || '').toLowerCase();
        if (fCat.startsWith('corporate')) return evCat.startsWith('corporate');
        return evCat === fCat;
      });
    }

    // If search, tier, status, or visibility is active, only show ceremonies with matching packages
    if (
      searchQuery.trim() ||
      tierFilter !== 'all' ||
      statusFilter !== 'all' ||
      visibilityFilter !== 'all'
    ) {
      const matchingEventIds = new Set(filteredPackages.map((p) => p.eventId || 'wedding'));
      list = list.filter((ev) => matchingEventIds.has(ev.id));
    }

    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [
    dynamicEvents,
    selectedEventFilter,
    categoryFilter,
    searchQuery,
    tierFilter,
    statusFilter,
    visibilityFilter,
    filteredPackages,
  ]);

  // File upload helper
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'new' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please pick an image under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'new') {
          setNewImageUrl(reader.result);
        } else {
          setEditImageUrl(reader.result);
        }
        toast.success(`Loaded image: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenGalleryPicker = (target: 'new' | 'edit') => {
    setPickerTarget(target);
    setIsGalleryPickerOpen(true);
  };

  const handleSelectGalleryPhoto = (url: string) => {
    if (pickerTarget === 'new') {
      setNewImageUrl(url);
    } else {
      setEditImageUrl(url);
    }
    setIsGalleryPickerOpen(false);
    toast.success('Selected image from studio portfolio.');
  };

  // Event Handlers
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) {
      toast.error('Ceremony name is required.');
      return;
    }

    setIsCreatingEvent(true);
    try {
      const generatedSlug =
        newEventCustomId.trim() ||
        newEventName
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const created = await createEvent({
        id: generatedSlug,
        name: newEventName.trim(),
        tamilName: newEventTamilName.trim() || undefined,
        category: newEventCategory,
        status: newEventStatus,
        sortOrder: typeof newEventSortOrder === 'number' ? newEventSortOrder : 10,
      });

      toast.success(`Ceremony "${created.name}" created.`);
      setSelectedEventFilter(created.id);
      setIsAddEventModalOpen(false);

      // Reset fields
      setNewEventName('');
      setNewEventTamilName('');
      setNewEventCategory('wedding');
      setNewEventCustomId('');
      setNewEventSortOrder(10);
      setNewEventStatus('active');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ceremony.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleOpenEditEvent = (ev: StudioEvent) => {
    setEditingEvent(ev);
    setEditEventName(ev.name);
    setEditEventTamilName(ev.tamilName || '');
    setEditEventCategory(ev.category || 'wedding');
    setEditEventSortOrder(ev.sortOrder ?? 10);
    setEditEventStatus(ev.status === 'inactive' ? 'inactive' : 'active');
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editEventName.trim()) return;

    setIsUpdatingEvent(true);
    try {
      await updateEvent(editingEvent.id, {
        name: editEventName.trim(),
        tamilName: editEventTamilName.trim() || undefined,
        category: editEventCategory,
        status: editEventStatus,
        sortOrder: typeof editEventSortOrder === 'number' ? editEventSortOrder : 10,
      });

      toast.success(`Ceremony "${editEventName.trim()}" updated.`);
      setEditingEvent(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update ceremony.');
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!deletingEvent) return;
    setIsDeletingEvent(true);
    try {
      await deleteEvent(deletingEvent.id);
      toast.success(`Ceremony "${deletingEvent.name}" deleted.`);
      if (selectedEventFilter === deletingEvent.id) {
        setSelectedEventFilter('all');
      }
      setDeletingEvent(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete ceremony.');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // Submit new package
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice === '' || !newDuration.trim()) {
      toast.error('Please enter package name, price, and duration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isSig = newTier === 'signature' || newHighlighted;
      const order =
        typeof newSortOrder === 'number'
          ? newSortOrder
          : newTier === 'essential'
          ? 1
          : newTier === 'signature'
          ? 2
          : 3;

      await addPackage({
        id: newId.trim() || undefined,
        eventId: newEventId,
        tier: newTier,
        name: newName.trim(),
        audience: newAudience.trim() || 'For weddings & celebrations',
        price: Number(newPrice),
        duration: newDuration.trim(),
        category: newEventId, // Matches eventId per schema requirement
        deliverables: newDeliverables,
        customizer: {
          included: newCustomizerIncluded,
          addons: newCustomizerAddons,
        },
        imageUrl: newImageUrl.trim() || undefined,
        highlighted: isSig,
        featured: isSig,
        status: newStatus,
        displayOnPortfolio: newDisplayOnPortfolio,
        sortOrder: order,
      });

      toast.success(`Package "${newName.trim()}" created.`);
      setIsAddModalOpen(false);
      setNewId('');
      setNewName('');
      setNewAudience('');
      setNewPrice('');
      setNewDuration('');
      setNewImageUrl('');
      setNewTier('signature');
      setNewHighlighted(true);
      setNewSortOrder(2);
      setNewStatus('active');
      setNewDisplayOnPortfolio(true);
      setNewDeliverables({
        'Event Coverage & Crew': '1 Lead Candid Photographer + 1 Traditional Photographer',
        'Albums & Photo Frames': '30-Sheet Layflat Karizma Photo Album',
        'Digital Deliverables': 'Full Event Edited Video + Complete Raw Footage Drive',
      });
      setNewCustomizerIncluded(DEFAULT_INCLUDED_FEATURES);
      setNewCustomizerAddons(DEFAULT_CUSTOMIZER_ADDONS);
      setNewAddonLabel('');
      setNewAddonPriceDelta('');
      setNewAddonType('upgrade');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (pkg: StudioPackage) => {
    setEditingPackage(pkg);
    const resolvedTier = pkg.tier || getPackageTier(pkg);
    setEditEventId(pkg.eventId || 'wedding');
    setEditTier(resolvedTier);
    setEditName(pkg.name);
    setEditAudience(pkg.audience);
    setEditPrice(pkg.price);
    setEditDuration(pkg.duration);
    setEditImageUrl(pkg.imageUrl || pkg.image || '');
    setEditHighlighted(Boolean(pkg.highlighted || pkg.featured));
    setEditSortOrder(typeof pkg.sortOrder === 'number' ? pkg.sortOrder : resolvedTier === 'essential' ? 1 : resolvedTier === 'signature' ? 2 : 3);
    setEditDeliverables(normalizePackageDeliverables(pkg.deliverables));
    setEditStatus(pkg.status === 'inactive' ? 'inactive' : 'active');
    setEditDisplayOnPortfolio(pkg.displayOnPortfolio !== false);

    // Initialize customizer
    setEditCustomizerIncluded({
      ...DEFAULT_INCLUDED_FEATURES,
      ...(pkg.customizer?.included || {}),
    });
    setEditCustomizerAddons(
      pkg.customizer?.addons && pkg.customizer.addons.length > 0
        ? JSON.parse(JSON.stringify(pkg.customizer.addons))
        : JSON.parse(JSON.stringify(DEFAULT_CUSTOMIZER_ADDONS))
    );
    setEditAddonLabel('');
    setEditAddonPriceDelta('');
    setEditAddonType('upgrade');
  };

  // Submit edit package
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    if (!editName.trim() || editPrice === '' || !editDuration.trim()) {
      toast.error('Please enter package name, price, and duration.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isSig = editTier === 'signature' || editHighlighted;
      const order =
        typeof editSortOrder === 'number'
          ? editSortOrder
          : editTier === 'essential'
          ? 1
          : editTier === 'signature'
          ? 2
          : 3;

      await updatePackage(editingPackage.id, {
        name: editName.trim(),
        eventId: editEventId,
        tier: editTier,
        audience: editAudience.trim(),
        price: Number(editPrice),
        duration: editDuration.trim(),
        category: editEventId, // Matches eventId per schema requirement
        deliverables: editDeliverables,
        customizer: {
          included: editCustomizerIncluded,
          addons: editCustomizerAddons,
        },
        imageUrl: editImageUrl.trim(),
        highlighted: isSig,
        featured: isSig,
        status: editStatus,
        displayOnPortfolio: editDisplayOnPortfolio,
        sortOrder: order,
      });

      toast.success(`Updated "${editName.trim()}".`);
      setEditingPackage(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete package
  const handleConfirmDelete = async () => {
    if (!deletingPackage) return;
    setIsSubmitting(true);
    try {
      await deletePackage(deletingPackage.id);
      toast.success(`Package "${deletingPackage.name}" deleted.`);
      setDeletingPackage(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (pkg: StudioPackage) => {
    if (loadingActionId) return;
    setLoadingActionId(`status-${pkg.id}`);
    const nextStatus = (pkg.status ?? 'active') === 'active' ? 'inactive' : 'active';
    try {
      await updatePackage(pkg.id, { status: nextStatus });
      toast.success(
        `Package "${pkg.name}" is now ${nextStatus === 'active' ? 'Active' : 'Disabled'}.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle package status.');
    } finally {
      setLoadingActionId(null);
    }
  };

  // Quick toggle display on portfolio
  const handleTogglePortfolio = async (pkg: StudioPackage) => {
    if (loadingActionId) return;
    setLoadingActionId(`portfolio-${pkg.id}`);
    const nextDisplay = pkg.displayOnPortfolio === false ? true : false;
    try {
      await updatePackage(pkg.id, { displayOnPortfolio: nextDisplay });
      toast.success(
        `Package "${pkg.name}" is now ${nextDisplay ? 'Visible on' : 'Hidden from'} Portfolio.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle portfolio visibility.');
    } finally {
      setLoadingActionId(null);
    }
  };

  // Quick toggle highlighted
  const handleToggleHighlighted = async (pkg: StudioPackage) => {
    if (loadingActionId) return;
    setLoadingActionId(`highlight-${pkg.id}`);
    const nextHighlight = !Boolean(pkg.highlighted || pkg.featured);
    try {
      await updatePackage(pkg.id, {
        highlighted: nextHighlight,
        featured: nextHighlight,
        tier: nextHighlight ? 'signature' : pkg.tier === 'signature' ? 'essential' : pkg.tier,
      });
      toast.success(
        nextHighlight
          ? `Marked "${pkg.name}" as Signature / Most Popular.`
          : `Removed Signature badge from "${pkg.name}".`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle badge.');
    } finally {
      setLoadingActionId(null);
    }
  };

  // Move sort order up or down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (loadingActionId) return;
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sortedPackages.length) return;

    const newOrderList = [...sortedPackages];
    const [moved] = newOrderList.splice(index, 1);
    newOrderList.splice(newIdx, 0, moved);

    const orderedIds = newOrderList.map((p) => p.id);
    setLoadingActionId(`order-${moved.id}`);
    try {
      await reorderPackages(orderedIds);
      toast.success('Package display order updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder packages.');
    } finally {
      setLoadingActionId(null);
    }
  };

  // Helper renderer for a package card
  const renderPackageCard = (pkg: StudioPackage, idx: number) => {
    const isActive = (pkg.status ?? 'active') === 'active';
    const isDisplayed = pkg.displayOnPortfolio !== false;
    const pkgImg = pkg.imageUrl || pkg.image;
    const linkedEvent = dynamicEvents.find((e) => e.id === (pkg.eventId || 'wedding'));
    const pkgTier = getPackageTier(pkg);
    const deliverablesMap = normalizePackageDeliverables(pkg.deliverables);

    return (
      <Card
        key={pkg.id}
        className={`border transition-all overflow-hidden bg-[#092E2B] flex flex-col justify-between ${
          !isActive
            ? 'opacity-65 border-white/10'
            : pkgTier === 'signature'
            ? 'border-[#D8C78E] shadow-xl ring-1 ring-[#D8C78E]/40'
            : pkgTier === 'premium'
            ? 'border-amber-400/40 shadow-lg ring-1 ring-amber-400/20'
            : 'border-[#C5B378]/25 hover:border-[#C5B378]/50'
        }`}
      >
        <div>
          {/* Image Banner */}
          {pkgImg ? (
            <div className="relative aspect-[21/9] w-full overflow-hidden bg-[#041513] border-b border-[#C5B378]/15">
              <NextImage
                src={pkgImg}
                alt={pkg.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR_DATA_URL}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#092E2B] via-transparent to-black/30" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <Badge
                  variant="neutral"
                  className="bg-[#072421]/90 text-[#D8C78E] border-[#C5B378]/30 font-mono text-[10px]"
                >
                  #{idx + 1}
                </Badge>
                <Badge
                  variant="neutral"
                  className="bg-[#072421]/90 text-white/90 border-white/20 font-mono text-[10px]"
                >
                  {pkg.id}
                </Badge>
              </div>
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                {pkgTier === 'signature' && (
                  <Badge className="bg-[#C5B378] text-[#072421] font-semibold text-[10px]">
                    ⭐ Signature · Most Popular
                  </Badge>
                )}
                {pkgTier === 'premium' && (
                  <Badge className="bg-amber-500/25 text-amber-300 border border-amber-400/40 font-semibold text-[10px]">
                    👑 Premium
                  </Badge>
                )}
                {pkgTier === 'essential' && (
                  <Badge className="bg-[#0E423E] text-[#D8C78E] border border-[#C5B378]/30 font-semibold text-[10px]">
                    ✨ Essential
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 pt-3 pb-2 border-b border-[#C5B378]/15 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="neutral"
                  className="bg-[#072421] text-[#D8C78E] border-[#C5B378]/30 font-mono text-[10px]"
                >
                  #{idx + 1}
                </Badge>
                <span className="font-mono text-xs text-[#D8C78E]">{pkg.id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {pkgTier === 'signature' && (
                  <Badge className="bg-[#C5B378] text-[#072421] font-semibold text-[10px]">
                    ⭐ Signature · Most Popular
                  </Badge>
                )}
                {pkgTier === 'premium' && (
                  <Badge className="bg-amber-500/25 text-amber-300 border border-amber-400/40 font-semibold text-[10px]">
                    👑 Premium
                  </Badge>
                )}
                {pkgTier === 'essential' && (
                  <Badge className="bg-[#0E423E] text-[#D8C78E] border border-[#C5B378]/30 font-semibold text-[10px]">
                    ✨ Essential
                  </Badge>
                )}
              </div>
            </div>
          )}

          <CardContent className="p-4 space-y-3.5">
            {/* Title & Investment */}
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-[#C5B378]/15 pb-2.5">
              <div>
                <h3 className="text-lg font-serif font-bold text-white leading-tight">
                  {pkg.name}
                </h3>
                <p className="text-xs text-[#D8C78E]/90 mt-0.5">{pkg.audience}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded bg-[#0E423E] border border-[#C5B378]/30 px-2 py-0.5 text-[10px] font-medium text-[#D8C78E]">
                    🎉 {linkedEvent ? `${linkedEvent.name}` : pkg.category || 'Wedding'}
                  </span>
                  {pkg.duration && (
                    <span className="text-[11px] text-[#E6ECEB]/60">⏱️ {pkg.duration}</span>
                  )}
                  <span className="text-[10px] text-[#E6ECEB]/50 font-mono">
                    Order: {pkg.sortOrder ?? 1}
                  </span>
                </div>
              </div>

              <div className="text-right sm:shrink-0 pt-1 sm:pt-0">
                <span className="text-xl font-serif font-bold text-white font-mono">
                  {formatINR(pkg.price)}
                </span>
                <span className="text-[10px] text-[#E6ECEB]/50 block">Investment</span>
              </div>
            </div>

            {/* Categorized Deliverables Breakdown */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#D8C78E]">
                Deliverables & Inclusions:
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs pr-1">
                {Object.entries(deliverablesMap).map(([category, detail]) => (
                  <div
                    key={category}
                    className="rounded bg-[#072421] p-1.5 border border-[#C5B378]/20 text-[11px]"
                  >
                    <span className="font-semibold text-[#D8C78E] block leading-snug">
                      {category}:
                    </span>
                    <span className="text-[#E6ECEB]/85 leading-snug">{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </div>

        {/* Card Footer Actions */}
        <div className="p-4 pt-0 space-y-2.5 border-t border-[#C5B378]/15">
          {/* Quick Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={Boolean(loadingActionId)}
                onClick={() => handleToggleStatus(pkg)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-60 ${
                  isActive
                    ? 'bg-[#25D366]/15 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
                title="Click to toggle active status"
              >
                {loadingActionId === `status-${pkg.id}` ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#D8C78E]" />
                ) : (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isActive ? 'bg-[#25D366]' : 'bg-zinc-500'
                    }`}
                  />
                )}
                {isActive ? 'Active' : 'Disabled'}
              </button>

              <button
                type="button"
                disabled={Boolean(loadingActionId)}
                onClick={() => handleTogglePortfolio(pkg)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-60 ${
                  isDisplayed
                    ? 'bg-[#C5B378]/15 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#C5B378]/25'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
                title="Click to show/hide on website"
              >
                {loadingActionId === `portfolio-${pkg.id}` ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#D8C78E]" />
                ) : isDisplayed ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3 text-zinc-500" />
                )}
                {isDisplayed ? 'On Portfolio' : 'Hidden'}
              </button>

              <button
                type="button"
                disabled={Boolean(loadingActionId)}
                onClick={() => handleToggleHighlighted(pkg)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-60 ${
                  pkg.highlighted
                    ? 'bg-[#C5B378]/25 border-[#C5B378]/50 text-[#D8C78E] hover:bg-[#C5B378]/35'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
                title="Click to toggle Signature / Flagship badge"
              >
                {loadingActionId === `highlight-${pkg.id}` ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#D8C78E]" />
                ) : (
                  <Star
                    className={`h-3 w-3 ${
                      pkg.highlighted ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'
                    }`}
                  />
                )}
                {pkg.highlighted ? 'Signature' : 'Standard'}
              </button>
            </div>

            {/* Ordering Arrows */}
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleMoveOrder(idx, 'up')}
                disabled={idx === 0 || Boolean(loadingActionId)}
                className="h-7 w-7 p-0 text-[#E6ECEB]/70 hover:text-white hover:bg-[#072421] disabled:opacity-20"
                title="Move up"
              >
                {loadingActionId === `order-${pkg.id}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D8C78E]" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleMoveOrder(idx, 'down')}
                disabled={idx === sortedPackages.length - 1 || Boolean(loadingActionId)}
                className="h-7 w-7 p-0 text-[#E6ECEB]/70 hover:text-white hover:bg-[#072421] disabled:opacity-20"
                title="Move down"
              >
                {loadingActionId === `order-${pkg.id}` ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D8C78E]" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#C5B378]/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openEditModal(pkg)}
              className="border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#072421] h-7 px-2.5 text-xs"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit Package
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeletingPackage(pkg)}
              className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 h-7 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-[#C5B378]/25 bg-[#092E2B]/80 text-[#E6ECEB]">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs text-[#D8C78E]">TOTAL PACKAGES</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-white">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-[#E6ECEB]/70">
            Across {dynamicEvents.length} ceremonies
          </CardContent>
        </Card>

        <Card className="border-[#C5B378]/25 bg-[#092E2B]/80 text-[#E6ECEB]">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs text-[#25D366]">ACTIVE PACKAGES</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-white">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-[#E6ECEB]/70">
            Available for booking enquiries
          </CardContent>
        </Card>

        <Card className="border-[#C5B378]/25 bg-[#092E2B]/80 text-[#E6ECEB]">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs text-[#D8C78E]">ON PORTFOLIO</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-white">
              {portfolioCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-[#E6ECEB]/70">
            Live in public Packages section
          </CardContent>
        </Card>

        <Card className="border-[#C5B378]/25 bg-[#092E2B]/80 text-[#E6ECEB]">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs text-amber-400">SIGNATURE / POPULAR</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-white">
              {highlightedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-[#E6ECEB]/70">
            Flagship or Most Popular badges
          </CardContent>
        </Card>
      </div>

      {/* Main Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#092E2B]/90 border border-[#C5B378]/25 rounded-xl p-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-[#D8C78E]" />
            Photography Packages Catalog & Event Manager
          </h2>
          <p className="text-xs text-[#E6ECEB]/70 mt-0.5">
            Organize collections dynamically by ceremony, category, and investment tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Add Event Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAddEventModalOpen(true)}
            className="border-[#C5B378]/40 bg-[#0E423E] text-[#D8C78E] hover:bg-[#C5B378]/20 font-semibold shadow-sm"
          >
            <FolderPlus className="h-4 w-4 mr-1.5" />
            + Add Event / Ceremony
          </Button>

          {/* Add Package Button */}
          <Button
            type="button"
            onClick={() => {
              setNewEventId(selectedEventFilter !== 'all' ? selectedEventFilter : 'wedding');
              setIsAddModalOpen(true);
            }}
            className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E] shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            + Add New Package
          </Button>
        </div>
      </div>

      {/* Multi-Filter Toolbar */}
      <div className="rounded-xl border border-[#C5B378]/25 bg-[#072421] p-4 space-y-3.5 shadow-md">
        {/* Row 1: Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D8C78E]/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by package name, ceremony, deliverables, audience, or ID..."
              className="h-10 w-full rounded-lg border border-[#C5B378]/30 bg-[#092E2B] pl-9 pr-8 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#092E2B] p-1 rounded-lg border border-[#C5B378]/25 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grouped'
                  ? 'bg-[#C5B378] text-[#072421] font-semibold shadow-sm'
                  : 'text-[#E6ECEB]/70 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Grouped by Ceremony
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#C5B378] text-[#072421] font-semibold shadow-sm'
                  : 'text-[#E6ECEB]/70 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Flat Grid
            </button>
          </div>
        </div>

        {/* Row 2: Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 border-t border-[#C5B378]/15">
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSelectedEventFilter('all');
              }}
              className="h-8 w-full rounded border border-[#C5B378]/30 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {EVENT_CATEGORY_GROUPS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({cat.tamilLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Ceremony Filter (dynamically limited by Category) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Ceremony
            </label>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="h-8 w-full rounded border border-[#C5B378]/30 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
            >
              <option value="all">
                All Ceremonies ({availableEventsForFilter.length})
              </option>
              {availableEventsForFilter.map((ev) => {
                const count = sortedPackages.filter(
                  (p) => (p.eventId || 'wedding') === ev.id
                ).length;
                return (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} {ev.tamilName ? `(${ev.tamilName})` : ''} · {count}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Package Tier Filter: Essential, Signature, Premium, only 3 with All */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E] flex items-center gap-1">
              <Star className="h-3 w-3" />
              Tier
            </label>
            <select
              value={tierFilter}
              onChange={(e) =>
                setTierFilter(e.target.value as 'all' | 'essential' | 'signature' | 'premium')
              }
              className="h-8 w-full rounded border border-[#C5B378]/30 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="essential">Essential</option>
              <option value="signature">Signature</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E]">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="h-8 w-full rounded border border-[#C5B378]/30 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Disabled</option>
            </select>
          </div>

          {/* Visibility Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E]">
              Portfolio Visibility
            </label>
            <select
              value={visibilityFilter}
              onChange={(e) =>
                setVisibilityFilter(e.target.value as 'all' | 'portfolio' | 'hidden')
              }
              className="h-8 w-full rounded border border-[#C5B378]/30 bg-[#092E2B] px-2 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
            >
              <option value="all">All Visibility</option>
              <option value="portfolio">Visible on Portfolio</option>
              <option value="hidden">Hidden from Public</option>
            </select>
          </div>
        </div>

        {/* Row 3: Active Filter Summary & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#C5B378]/15 text-xs">
          <div className="flex items-center gap-2 text-[#E6ECEB]/80 flex-wrap">
            <span>
              Showing <strong className="text-white">{filteredPackages.length}</strong> matching
              packages across <strong className="text-white">{filteredCeremoniesCount}</strong>{' '}
              ceremonies.
            </span>
            {tierFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#D8C78E] bg-[#0E423E] px-2 py-0.5 rounded border border-[#C5B378]/30 capitalize">
                Tier: {tierFilter}
              </span>
            )}
            {hasActiveFilters && tierFilter === 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#D8C78E] bg-[#0E423E] px-2 py-0.5 rounded border border-[#C5B378]/30">
                Filters Active
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-[#D8C78E] hover:text-white hover:bg-[#0E423E] px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredPackages.length === 0 && ceremoniesToDisplay.length === 0 ? (
        <div className="rounded-xl border border-[#C5B378]/25 bg-[#092E2B] p-10 text-center space-y-3">
          <p className="font-serif text-lg text-white">No packages or ceremonies match your filter</p>
          <p className="text-xs text-[#E6ECEB]/70 max-w-md mx-auto">
            {tierFilter !== 'all'
              ? `No packages found for tier "${tierFilter}". Try switching tier or resetting filters.`
              : 'Try resetting your active search or filters, or add a new package under your selected ceremony.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <Button
              type="button"
              onClick={handleResetFilters}
              variant="outline"
              className="border-[#C5B378]/30 text-[#D8C78E] text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
            <Button
              type="button"
              onClick={() => {
                setNewEventId(selectedEventFilter !== 'all' ? selectedEventFilter : 'wedding');
                setIsAddModalOpen(true);
              }}
              className="bg-[#C5B378] text-[#072421] text-xs font-semibold hover:bg-[#D8C78E]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add New Package
            </Button>
          </div>
        </div>
      ) : viewMode === 'grouped' ? (
        /* Grouped by Ceremony View */
        <div className="space-y-6">
          {ceremoniesToDisplay.map((ceremony) => {
            const ceremonyPackages = filteredPackages.filter(
              (p) => (p.eventId || 'wedding') === ceremony.id
            );
            const isCeremonyActive = (ceremony.status ?? 'active') === 'active';
            const matchedCatGroup = EVENT_CATEGORY_GROUPS.find(
              (g) =>
                g.id === ceremony.category ||
                (g.id.startsWith('corporate') && ceremony.category?.startsWith('corporate'))
            );

            return (
              <div
                key={ceremony.id}
                className="rounded-xl border border-[#C5B378]/25 bg-[#072421]/90 overflow-hidden shadow-md"
              >
                {/* Ceremony Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#092E2B] border-b border-[#C5B378]/20 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#0E423E] border border-[#C5B378]/30 flex items-center justify-center shrink-0">
                      {matchedCatGroup?.id === 'baby-maternity' ? (
                        <Baby className="h-4 w-4 text-[#D8C78E]" />
                      ) : matchedCatGroup?.id === 'birthday-kids' ? (
                        <Cake className="h-4 w-4 text-[#D8C78E]" />
                      ) : matchedCatGroup?.id === 'family-traditional' ? (
                        <Flame className="h-4 w-4 text-[#D8C78E]" />
                      ) : matchedCatGroup?.id?.startsWith('corporate') ? (
                        <Briefcase className="h-4 w-4 text-[#D8C78E]" />
                      ) : (
                        <Heart className="h-4 w-4 text-[#D8C78E]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-serif font-bold text-white leading-tight">
                          {ceremony.name}
                        </h3>
                        {ceremony.tamilName && (
                          <span className="text-xs text-[#D8C78E]/90 font-medium">
                            ({ceremony.tamilName})
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                            isCeremonyActive
                              ? 'bg-[#25D366]/15 border-[#25D366]/30 text-[#25D366]'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isCeremonyActive ? 'bg-[#25D366]' : 'bg-zinc-500'
                            }`}
                          />
                          {isCeremonyActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#E6ECEB]/65 mt-0.5">
                        <span>Category: {matchedCatGroup?.label || ceremony.category}</span>
                        <span>•</span>
                        <span>ID: <code className="font-mono text-[#D8C78E]">{ceremony.id}</code></span>
                        <span>•</span>
                        <span>
                          <strong>{ceremonyPackages.length}</strong> package
                          {ceremonyPackages.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ceremony Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditEvent(ceremony)}
                      className="border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#072421] h-8 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit Ceremony
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setNewEventId(ceremony.id);
                        setIsAddModalOpen(true);
                      }}
                      className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E] h-8 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      + Add Package
                    </Button>
                  </div>
                </div>

                {/* Ceremony Packages Grid */}
                <div className="p-5">
                  {ceremonyPackages.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#C5B378]/25 p-6 text-center space-y-2">
                      <p className="text-xs text-[#E6ECEB]/70">
                        No packages configured under <strong>{ceremony.name}</strong>
                        {tierFilter !== 'all' ? ` for tier "${tierFilter}".` : '.'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewEventId(ceremony.id);
                          setIsAddModalOpen(true);
                        }}
                        className="border-[#C5B378]/30 text-[#D8C78E] text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Create package for this ceremony
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {ceremonyPackages.map((pkg, idx) => renderPackageCard(pkg, idx))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPackages.map((pkg, idx) => renderPackageCard(pkg, idx))}
        </div>
      )}

      {/* Add New Event Dialog */}
      <Dialog open={isAddEventModalOpen} onOpenChange={(open) => { if (!open && !isCreatingEvent) setIsAddEventModalOpen(false); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isCreatingEvent) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isCreatingEvent) e.preventDefault(); }}
          className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] p-6 space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#D8C78E]" />
              Add New Event / Ceremony
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/70">
              Create a new event ceremony. Packages can then be assigned and displayed dynamically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#D8C78E]">Ceremony Name (English) *</label>
              <input
                type="text"
                required
                value={newEventName}
                onChange={(e) => {
                  setNewEventName(e.target.value);
                  if (!newEventCustomId) {
                    const previewSlug = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    setNewEventCustomId(previewSlug);
                  }
                }}
                placeholder="e.g. Haldi & Sangeet Night"
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#D8C78E]">Tamil Name (விருப்பத்தேர்வு)</label>
              <input
                type="text"
                value={newEventTamilName}
                onChange={(e) => setNewEventTamilName(e.target.value)}
                placeholder="எ.கா. ஹல்தி & சங்கீத் விழா"
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Event Category *</label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORY_GROUPS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.tamilLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Status</label>
                <select
                  value={newEventStatus}
                  onChange={(e) => setNewEventStatus(e.target.value as 'active' | 'inactive')}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Unique Event Slug / ID</label>
                <input
                  type="text"
                  value={newEventCustomId}
                  onChange={(e) => setNewEventCustomId(e.target.value)}
                  placeholder="e.g. haldi-sangeet"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Sort Order</label>
                <input
                  type="number"
                  value={newEventSortOrder}
                  onChange={(e) =>
                    setNewEventSortOrder(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-[#C5B378]/20 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingEvent}
                onClick={() => setIsAddEventModalOpen(false)}
                className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
              >
                Cancel
              </Button>
              <SubmitButton
                isLoading={isCreatingEvent}
                loadingText="Creating Ceremony..."
                className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
              >
                Create Event
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open && !isUpdatingEvent) setEditingEvent(null); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isUpdatingEvent) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isUpdatingEvent) e.preventDefault(); }}
          className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] p-6 space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#D8C78E]" />
              Edit Ceremony: {editingEvent?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/70">
              Update ceremony title, Tamil name, category, or status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEditEvent} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#D8C78E]">Ceremony Name (English) *</label>
              <input
                type="text"
                required
                value={editEventName}
                onChange={(e) => setEditEventName(e.target.value)}
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#D8C78E]">Tamil Name</label>
              <input
                type="text"
                value={editEventTamilName}
                onChange={(e) => setEditEventTamilName(e.target.value)}
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Category</label>
                <select
                  value={editEventCategory}
                  onChange={(e) => setEditEventCategory(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORY_GROUPS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.tamilLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Status</label>
                <select
                  value={editEventStatus}
                  onChange={(e) => setEditEventStatus(e.target.value as 'active' | 'inactive')}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Event ID</label>
                <input
                  type="text"
                  disabled
                  value={editingEvent?.id || ''}
                  className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-xs text-zinc-400 font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Sort Order</label>
                <input
                  type="number"
                  value={editEventSortOrder}
                  onChange={(e) =>
                    setEditEventSortOrder(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-[#C5B378]/20 pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={isUpdatingEvent}
                onClick={() => {
                  setDeletingEvent(editingEvent);
                  setEditingEvent(null);
                }}
                className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Ceremony
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdatingEvent}
                  onClick={() => setEditingEvent(null)}
                  className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
                >
                  Cancel
                </Button>
                <SubmitButton
                  isLoading={isUpdatingEvent}
                  loadingText="Saving Ceremony..."
                  className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
                >
                  Save Changes
                </SubmitButton>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog open={!!deletingEvent} onOpenChange={(open) => { if (!open && !isDeletingEvent) setDeletingEvent(null); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isDeletingEvent) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isDeletingEvent) e.preventDefault(); }}
          className="border-rose-500/30 bg-[#072421] text-[#E6ECEB] max-w-md p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              Confirm Ceremony Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/80 pt-2">
              Are you sure you want to permanently delete ceremony{' '}
              <strong className="text-white">&quot;{deletingEvent?.name}&quot;</strong> (
              {deletingEvent?.id})? Packages currently tagged to this event will retain their
              packages, but the ceremony header will be removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingEvent}
              onClick={() => setDeletingEvent(null)}
              className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
            >
              Cancel
            </Button>
            <SubmitButton
              variant="destructive"
              isLoading={isDeletingEvent}
              loadingText="Deleting Ceremony..."
              onClick={handleConfirmDeleteEvent}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Ceremony
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Package Modal */}
      <Dialog open={!!editingPackage} onOpenChange={(open) => { if (!open && !isSubmitting) setEditingPackage(null); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isSubmitting) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isSubmitting) e.preventDefault(); }}
          className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] p-6 space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#D8C78E]" />
              Edit Package: {editingPackage?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/70">
              Update package tier, pricing, deliverables, image, or visibility.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Package Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              {/* Package Tier Selector */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Package Tier *</label>
                <select
                  value={editTier}
                  onChange={(e) => {
                    const t = e.target.value as PackageTier;
                    setEditTier(t);
                    if (t === 'essential') {
                      setEditSortOrder(1);
                      setEditHighlighted(false);
                    } else if (t === 'signature') {
                      setEditSortOrder(2);
                      setEditHighlighted(true);
                    } else if (t === 'premium') {
                      setEditSortOrder(3);
                      setEditHighlighted(false);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="essential">Essential (Order 1)</option>
                  <option value="signature">Signature (Most Popular · Order 2)</option>
                  <option value="premium">Premium (Luxury · Order 3)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Investment Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={500}
                  value={editPrice}
                  onChange={(e) =>
                    setEditPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Duration *</label>
                <input
                  type="text"
                  required
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  placeholder="e.g. 1.5 Days · Eve & Muhurtham"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Audience Description</label>
                <input
                  type="text"
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  placeholder="e.g. For Muhurtham & Reception Coverage"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <EventSelector
                  id="edit-package-event"
                  label="Linked Ceremony / Event"
                  value={editEventId}
                  onChange={(selectedId) => setEditEventId(selectedId)}
                  showTamilName={true}
                  includeInactive={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Sort Order (1 = Essential, 2 = Signature, 3 = Premium)</label>
                <input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(Number(e.target.value) || 1)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="active">Active (Available for booking)</option>
                  <option value="inactive">Inactive / Disabled</option>
                </select>
              </div>
            </div>

            {/* Image URL & Upload */}
            <div className="space-y-2 border-t border-[#C5B378]/20 pt-3">
              <label className="text-xs font-medium text-[#D8C78E] block">Package Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="https://... or /images/portfolio/..."
                  className="h-10 flex-1 rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenGalleryPicker('edit')}
                  className="h-10 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B] shrink-0"
                >
                  <ImageIcon className="h-4 w-4 mr-1.5" />
                  From Gallery
                </Button>
                <label className="h-10 inline-flex items-center justify-center px-3 rounded-md border border-[#C5B378]/30 bg-[#092E2B] text-xs font-medium text-[#E6ECEB] hover:text-white cursor-pointer shrink-0">
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'edit')}
                  />
                </label>
              </div>
              {editImageUrl && (
                <div className="relative h-28 w-44 rounded-lg overflow-hidden border border-[#C5B378]/30 bg-black mt-2">
                  <img src={editImageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            {/* Categorized Deliverables Builder */}
            <div className="space-y-3 border-t border-[#C5B378]/20 pt-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#D8C78E] block">
                  Deliverables & Inclusions (Categorized)
                </label>
                <p className="text-[11px] text-[#E6ECEB]/60 mt-0.5">
                  Specify deliverables by category to allow clients to compare tiers effortlessly.
                </p>
              </div>

              <div className="space-y-3 bg-[#051C1A] p-3.5 rounded-lg border border-[#C5B378]/20">
                {/* 1. Event Coverage & Crew */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D8C78E] flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Event Coverage & Crew
                  </label>
                  <input
                    type="text"
                    value={editDeliverables['Event Coverage & Crew'] || ''}
                    onChange={(e) =>
                      setEditDeliverables((prev) => ({
                        ...prev,
                        'Event Coverage & Crew': e.target.value,
                      }))
                    }
                    placeholder="e.g. 1 Lead Candid Photographer + 1 Traditional Photographer"
                    className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                {/* 2. Albums & Photo Frames */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D8C78E] flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Albums & Photo Frames
                  </label>
                  <input
                    type="text"
                    value={editDeliverables['Albums & Photo Frames'] || ''}
                    onChange={(e) =>
                      setEditDeliverables((prev) => ({
                        ...prev,
                        'Albums & Photo Frames': e.target.value,
                      }))
                    }
                    placeholder="e.g. 30-Sheet Layflat Karizma Photo Album"
                    className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                {/* 3. Digital Deliverables */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D8C78E] flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Digital Deliverables
                  </label>
                  <input
                    type="text"
                    value={editDeliverables['Digital Deliverables'] || ''}
                    onChange={(e) =>
                      setEditDeliverables((prev) => ({
                        ...prev,
                        'Digital Deliverables': e.target.value,
                      }))
                    }
                    placeholder="e.g. Full Event Edited Video + Complete Raw Footage Drive"
                    className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                {/* Dynamic Additional Categories */}
                {Object.entries(editDeliverables)
                  .filter(
                    ([key]) =>
                      key !== 'Event Coverage & Crew' &&
                      key !== 'Albums & Photo Frames' &&
                      key !== 'Digital Deliverables'
                  )
                  .map(([customKey, customValue]) => (
                    <div key={customKey} className="space-y-1 pt-1 border-t border-[#C5B378]/15">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#D8C78E]">{customKey}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...editDeliverables };
                            delete next[customKey];
                            setEditDeliverables(next);
                          }}
                          className="text-rose-400 hover:text-rose-300 text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={customValue || ''}
                        onChange={(e) =>
                          setEditDeliverables((prev) => ({
                            ...prev,
                            [customKey]: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                  ))}

                {/* Inline Add Dynamic Category */}
                <div className="pt-2 border-t border-[#C5B378]/15 space-y-1.5">
                  <span className="text-[11px] font-medium text-[#E6ECEB]/70 block">
                    + Add Dynamic Category
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editCustomCategoryInput}
                      onChange={(e) => setEditCustomCategoryInput(e.target.value)}
                      placeholder="Category name (e.g. Drone & Aerial)"
                      className="h-8 flex-1 rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editCustomDetailInput}
                      onChange={(e) => setEditCustomDetailInput(e.target.value)}
                      placeholder="Details / Inclusions"
                      className="h-8 flex-[2] rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!editCustomCategoryInput.trim() || !editCustomDetailInput.trim()) return;
                        setEditDeliverables((prev) => ({
                          ...prev,
                          [editCustomCategoryInput.trim()]: editCustomDetailInput.trim(),
                        }));
                        setEditCustomCategoryInput('');
                        setEditCustomDetailInput('');
                      }}
                      className="h-8 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B] text-xs px-2.5 shrink-0"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customizer: Included Features & Proposal Add-ons */}
            <PackageCustomizerSection
              included={editCustomizerIncluded}
              onChangeIncluded={setEditCustomizerIncluded}
              addons={editCustomizerAddons}
              onChangeAddons={setEditCustomizerAddons}
              addonLabelInput={editAddonLabel}
              setAddonLabelInput={setEditAddonLabel}
              addonPriceDeltaInput={editAddonPriceDelta}
              setAddonPriceDeltaInput={setEditAddonPriceDelta}
              addonTypeInput={editAddonType}
              setAddonTypeInput={setEditAddonType}
            />

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-6 border-t border-[#C5B378]/20 pt-3">
              <label className="flex items-center gap-2 text-xs text-[#E6ECEB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editDisplayOnPortfolio}
                  onChange={(e) => setEditDisplayOnPortfolio(e.target.checked)}
                  className="h-4 w-4 rounded border-[#C5B378]/30 bg-[#092E2B] text-[#C5B378] accent-[#C5B378]"
                />
                <span>Display on public Portfolio / Packages section</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#E6ECEB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editHighlighted}
                  onChange={(e) => setEditHighlighted(e.target.checked)}
                  className="h-4 w-4 rounded border-[#C5B378]/30 bg-[#092E2B] text-[#C5B378] accent-[#C5B378]"
                />
                <span>Mark as Signature / Most Popular (Flagship Badge)</span>
              </label>
            </div>

            <DialogFooter className="border-t border-[#C5B378]/20 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setEditingPackage(null)}
                className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
              >
                Cancel
              </Button>
              <SubmitButton
                isLoading={isSubmitting}
                loadingText="Saving Package..."
                className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
              >
                Save Changes
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Package Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => { if (!open && !isSubmitting) setIsAddModalOpen(false); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isSubmitting) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isSubmitting) e.preventDefault(); }}
          className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] p-6 space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#D8C78E]" />
              Add New Photography Package
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/70">
              Add a photography package under a selected ceremony and tier.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePackage} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Package Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Cinema Gold Collection"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              {/* Package Tier Selector */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Package Tier *</label>
                <select
                  value={newTier}
                  onChange={(e) => {
                    const t = e.target.value as PackageTier;
                    setNewTier(t);
                    if (t === 'essential') {
                      setNewSortOrder(1);
                      setNewHighlighted(false);
                    } else if (t === 'signature') {
                      setNewSortOrder(2);
                      setNewHighlighted(true);
                    } else if (t === 'premium') {
                      setNewSortOrder(3);
                      setNewHighlighted(false);
                    }
                  }}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="essential">Essential (Order 1)</option>
                  <option value="signature">Signature (Most Popular · Order 2)</option>
                  <option value="premium">Premium (Luxury · Order 3)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Investment Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={500}
                  value={newPrice}
                  onChange={(e) =>
                    setNewPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="35000"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Duration *</label>
                <input
                  type="text"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="e.g. 1 Full Day · Up to 10 Hours"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Audience Description</label>
                <input
                  type="text"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="e.g. For Engagement & Pre-Wedding Shoots"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <EventSelector
                  id="new-package-event"
                  label="Linked Ceremony / Event"
                  value={newEventId}
                  onChange={(selectedId) => setNewEventId(selectedId)}
                  showTamilName={true}
                  includeInactive={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Sort Order (1 = Essential, 2 = Signature, 3 = Premium)</label>
                <input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(Number(e.target.value) || 1)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'active' | 'inactive')}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="active">Active (Available)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            {/* Image URL & Upload */}
            <div className="space-y-2 border-t border-[#C5B378]/20 pt-3">
              <label className="text-xs font-medium text-[#D8C78E] block">Package Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://... or /images/portfolio/..."
                  className="h-10 flex-1 rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenGalleryPicker('new')}
                  className="h-10 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B] shrink-0"
                >
                  <ImageIcon className="h-4 w-4 mr-1.5" />
                  Gallery
                </Button>
                <label className="h-10 inline-flex items-center justify-center px-3 rounded-md border border-[#C5B378]/30 bg-[#092E2B] text-xs font-medium text-[#E6ECEB] hover:text-white cursor-pointer shrink-0">
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'new')}
                  />
                </label>
              </div>
              {newImageUrl && (
                <div className="relative h-28 w-44 rounded-lg overflow-hidden border border-[#C5B378]/30 bg-black mt-2">
                  <img src={newImageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            {/* Categorized Deliverables Builder */}
            <div className="space-y-3 border-t border-[#C5B378]/20 pt-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#D8C78E] block">
                  Deliverables & Inclusions (Categorized)
                </label>
                <p className="text-[11px] text-[#E6ECEB]/60 mt-0.5">
                  Specify deliverables by category to allow clients to compare tiers effortlessly.
                </p>
              </div>

              <div className="space-y-3 bg-[#051C1A] p-3.5 rounded-lg border border-[#C5B378]/20">
                {/* 1. Event Coverage & Crew */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D8C78E] flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Event Coverage & Crew
                  </label>
                  <input
                    type="text"
                    value={newDeliverables['Event Coverage & Crew'] || ''}
                    onChange={(e) =>
                      setNewDeliverables((prev) => ({
                        ...prev,
                        'Event Coverage & Crew': e.target.value,
                      }))
                    }
                    placeholder="e.g. 1 Lead Candid Photographer + 1 Traditional Photographer"
                    className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                {/* 2. Albums & Photo Frames */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D8C78E] flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Albums & Photo Frames
                  </label>
                  <input
                    type="text"
                    value={newDeliverables['Albums & Photo Frames'] || ''}
                    onChange={(e) =>
                      setNewDeliverables((prev) => ({
                        ...prev,
                        'Albums & Photo Frames': e.target.value,
                      }))
                    }
                    placeholder="e.g. 30-Sheet Layflat Karizma Photo Album"
                    className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                {/* 3. Digital Deliverables */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D8C78E] flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Digital Deliverables
                  </label>
                  <input
                    type="text"
                    value={newDeliverables['Digital Deliverables'] || ''}
                    onChange={(e) =>
                      setNewDeliverables((prev) => ({
                        ...prev,
                        'Digital Deliverables': e.target.value,
                      }))
                    }
                    placeholder="e.g. Full Event Edited Video + Complete Raw Footage Drive"
                    className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                {/* Dynamic Additional Categories */}
                {Object.entries(newDeliverables)
                  .filter(
                    ([key]) =>
                      key !== 'Event Coverage & Crew' &&
                      key !== 'Albums & Photo Frames' &&
                      key !== 'Digital Deliverables'
                  )
                  .map(([customKey, customValue]) => (
                    <div key={customKey} className="space-y-1 pt-1 border-t border-[#C5B378]/15">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#D8C78E]">{customKey}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...newDeliverables };
                            delete next[customKey];
                            setNewDeliverables(next);
                          }}
                          className="text-rose-400 hover:text-rose-300 text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        value={customValue || ''}
                        onChange={(e) =>
                          setNewDeliverables((prev) => ({
                            ...prev,
                            [customKey]: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-[#C5B378]/25 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                      />
                    </div>
                  ))}

                {/* Inline Add Dynamic Category */}
                <div className="pt-2 border-t border-[#C5B378]/15 space-y-1.5">
                  <span className="text-[11px] font-medium text-[#E6ECEB]/70 block">
                    + Add Dynamic Category
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCustomCategoryInput}
                      onChange={(e) => setNewCustomCategoryInput(e.target.value)}
                      placeholder="Category name (e.g. Drone & Aerial)"
                      className="h-8 flex-1 rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newCustomDetailInput}
                      onChange={(e) => setNewCustomDetailInput(e.target.value)}
                      placeholder="Details / Inclusions"
                      className="h-8 flex-[2] rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!newCustomCategoryInput.trim() || !newCustomDetailInput.trim()) return;
                        setNewDeliverables((prev) => ({
                          ...prev,
                          [newCustomCategoryInput.trim()]: newCustomDetailInput.trim(),
                        }));
                        setNewCustomCategoryInput('');
                        setNewCustomDetailInput('');
                      }}
                      className="h-8 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B] text-xs px-2.5 shrink-0"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customizer: Included Features & Proposal Add-ons */}
            <PackageCustomizerSection
              included={newCustomizerIncluded}
              onChangeIncluded={setNewCustomizerIncluded}
              addons={newCustomizerAddons}
              onChangeAddons={setNewCustomizerAddons}
              addonLabelInput={newAddonLabel}
              setAddonLabelInput={setNewAddonLabel}
              addonPriceDeltaInput={newAddonPriceDelta}
              setAddonPriceDeltaInput={setNewAddonPriceDelta}
              addonTypeInput={newAddonType}
              setAddonTypeInput={setNewAddonType}
            />

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-6 border-t border-[#C5B378]/20 pt-3">
              <label className="flex items-center gap-2 text-xs text-[#E6ECEB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDisplayOnPortfolio}
                  onChange={(e) => setNewDisplayOnPortfolio(e.target.checked)}
                  className="h-4 w-4 rounded border-[#C5B378]/30 bg-[#092E2B] text-[#C5B378] accent-[#C5B378]"
                />
                <span>Display on public Portfolio / Packages section</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#E6ECEB] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newHighlighted}
                  onChange={(e) => setNewHighlighted(e.target.checked)}
                  className="h-4 w-4 rounded border-[#C5B378]/30 bg-[#092E2B] text-[#C5B378] accent-[#C5B378]"
                />
                <span>Mark as Signature / Most Popular (Flagship Badge)</span>
              </label>
            </div>

            <DialogFooter className="border-t border-[#C5B378]/20 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsAddModalOpen(false)}
                className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
              >
                Cancel
              </Button>
              <SubmitButton
                isLoading={isSubmitting}
                loadingText="Creating Package..."
                className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
              >
                Create Package
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Package Confirmation Dialog */}
      <Dialog open={!!deletingPackage} onOpenChange={(open) => { if (!open && !isSubmitting) setDeletingPackage(null); }}>
        <DialogContent
          onPointerDownOutside={(e) => { if (isSubmitting) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isSubmitting) e.preventDefault(); }}
          className="border-rose-500/30 bg-[#072421] text-[#E6ECEB] max-w-md p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              Confirm Package Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/80 pt-2">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">&quot;{deletingPackage?.name}&quot;</strong> (
              {deletingPackage?.id})? This package will be removed from future selection. Existing
              confirmed bookings will not be affected.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setDeletingPackage(null)}
              className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
            >
              Cancel
            </Button>
            <SubmitButton
              variant="destructive"
              isLoading={isSubmitting}
              loadingText="Deleting Package..."
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Package
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Selector Lightbox */}
      <Dialog open={isGalleryPickerOpen} onOpenChange={setIsGalleryPickerOpen}>
        <DialogContent className="max-h-[85vh] w-[90vw] max-w-3xl overflow-hidden p-0 border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] flex flex-col">
          <div className="border-b border-[#C5B378]/20 bg-[#092E2B] px-6 py-4 flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Select Photo from Studio Gallery
              </DialogTitle>
              <DialogDescription className="text-xs text-[#E6ECEB]/70">
                Pick a photograph to use as this package&apos;s cover image.
              </DialogDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {portfolio.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectGalleryPhoto(item.imageUrl)}
                className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-[#D8C78E] text-left transition-all cursor-pointer"
              >
                <div className="relative aspect-[4/3] w-full bg-[#041513] overflow-hidden">
                  <NextImage
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 250px"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR_DATA_URL}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-2.5 bg-[#092E2B]/95 text-xs">
                  <p className="font-semibold text-white truncate">{item.title}</p>
                  <p className="text-[11px] text-[#D8C78E] truncate">{item.category}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-[#C5B378]/20 bg-[#092E2B] px-6 py-3 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGalleryPickerOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
