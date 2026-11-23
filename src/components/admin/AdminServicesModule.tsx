'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  DollarSign,
  Edit2,
  Layers,
  Plus,
  Power,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { PricingType, StudioService } from '@/src/types/studio';
import { formatINR } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { SubmitButton } from '@/src/components/ui/SubmitButton';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';

const SERVICE_CATEGORIES = [
  'All',
  'Photography',
  'Videography',
  'Aerial & Gear',
  'Deliverables',
];

export function AdminServicesModule() {
  const { services, saveService, updateService, deleteService, refreshStudio } = useStudio();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Service Modal state (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<StudioService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Photography');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPricingType, setFormPricingType] = useState<PricingType>('tiered');
  const [formUnitLabel, setFormUnitLabel] = useState('camera');
  const [formUnitPrice, setFormUnitPrice] = useState<number | ''>('');
  const [formMinQuantity, setFormMinQuantity] = useState<number>(1);
  const [formPrice3h, setFormPrice3h] = useState<number | ''>('');
  const [formPriceHalfDay, setFormPriceHalfDay] = useState<number | ''>('');
  const [formPriceFullDay, setFormPriceFullDay] = useState<number | ''>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete Confirmation State
  const [deletingService, setDeletingService] = useState<StudioService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling status state
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  // Slug auto-generation on typing name when creating
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingService) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generated);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextOrder = services.reduce((max, s) => Math.max(max, s.displayOrder ?? 0), 0) + 1;
    setEditingService(null);
    setFormName('');
    setFormSlug('');
    setFormCategory('Photography');
    setFormCustomCategory('');
    setFormDescription('');
    setFormPricingType('tiered');
    setFormUnitLabel('camera');
    setFormUnitPrice('');
    setFormMinQuantity(1);
    setFormPrice3h(6000);
    setFormPriceHalfDay(10000);
    setFormPriceFullDay(16000);
    setFormDisplayOrder(nextOrder);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (svc: StudioService) => {
    setEditingService(svc);
    setFormName(svc.name);
    setFormSlug(svc.slug);
    if (['Photography', 'Videography', 'Aerial & Gear', 'Deliverables'].includes(svc.category)) {
      setFormCategory(svc.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Custom');
      setFormCustomCategory(svc.category);
    }
    setFormDescription(svc.description || '');
    setFormPricingType(svc.pricingType || 'tiered');
    setFormUnitLabel(svc.unitLabel || 'unit');
    setFormUnitPrice(typeof svc.unitPrice === 'number' ? svc.unitPrice : '');
    setFormMinQuantity(svc.minQuantity ?? 1);
    setFormPrice3h(typeof svc.pricing?.threeHours === 'number' ? svc.pricing.threeHours : '');
    setFormPriceHalfDay(typeof svc.pricing?.halfDay === 'number' ? svc.pricing.halfDay : '');
    setFormPriceFullDay(typeof svc.pricing?.fullDay === 'number' ? svc.pricing.fullDay : '');
    setFormDisplayOrder(svc.displayOrder ?? 1);
    setFormIsActive(svc.isActive !== false);
    setIsModalOpen(true);
  };

  // Quick Toggle Active State
  const handleToggleActive = async (svc: StudioService) => {
    setTogglingSlug(svc.slug);
    try {
      await updateService(svc.slug, { isActive: !svc.isActive });
      toast.success(
        `Service "${svc.name}" is now ${!svc.isActive ? 'Active (available for packages)' : 'Inactive'}.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update service status.');
    } finally {
      setTogglingSlug(null);
    }
  };

  // Save Service Submit Handler
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Service name is required.');
      return;
    }
    if (!formSlug.trim()) {
      toast.error('Service slug is required.');
      return;
    }

    const resolvedCategory =
      formCategory === 'Custom'
        ? formCustomCategory.trim() || 'Custom'
        : formCategory;

    const payload: Partial<StudioService> = {
      name: formName.trim(),
      slug: formSlug.trim(),
      category: resolvedCategory,
      description: formDescription.trim(),
      pricingType: formPricingType,
      unitLabel: formUnitLabel.trim() || 'unit',
      displayOrder: Number(formDisplayOrder) || 1,
      isActive: formIsActive,
    };

    if (formPricingType === 'tiered') {
      const threeH = Number(formPrice3h) || 0;
      const halfD = Number(formPriceHalfDay) || 0;
      const fullD = Number(formPriceFullDay) || 0;
      if (threeH <= 0 || halfD <= 0 || fullD <= 0) {
        toast.error('Please enter valid positive prices for 3 Hours, Half Day, and Full Day.');
        return;
      }
      payload.pricing = {
        threeHours: threeH,
        halfDay: halfD,
        fullDay: fullD,
      };
      payload.unitPrice = null;
      payload.minQuantity = 1;
    } else {
      const uPrice = Number(formUnitPrice) || 0;
      if (uPrice <= 0) {
        toast.error('Please enter a valid positive unit price.');
        return;
      }
      payload.unitPrice = uPrice;
      payload.minQuantity = Math.max(1, Number(formMinQuantity) || 1);
      payload.pricing = null;
    }

    setIsSubmitting(true);
    try {
      if (editingService) {
        await updateService(editingService.slug, payload);
        toast.success(`Service "${formName}" updated successfully.`);
      } else {
        await saveService(payload);
        toast.success(`Service "${formName}" created and added to catalog.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Service Submit Handler
  const handleDeleteService = async () => {
    if (!deletingService) return;
    setIsDeleting(true);
    try {
      await deleteService(deletingService.slug);
      toast.success(`Service "${deletingService.name}" removed from catalog.`);
      setDeletingService(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete service.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search Services
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => {
        if (selectedCategory === 'All') return true;
        if (selectedCategory === 'Aerial & Gear') {
          return (
            s.category.toLowerCase().includes('aerial') ||
            s.category.toLowerCase().includes('gear') ||
            s.category.toLowerCase().includes('drone')
          );
        }
        return s.category.toLowerCase() === selectedCategory.toLowerCase();
      })
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SlidersHorizontal className="h-6 w-6 text-[#D8C78E]" />
            Master Service & Pricing Manager
          </h2>
          <p className="text-xs text-[#E6ECEB]/70 mt-1 max-w-2xl">
            Configure canonical deliverables, duration tiers (3 Hours, Half Day, Full Day), and per-unit rates.
            All package quotes and proposal calculations update automatically from these rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refreshStudio()}
            className="border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B]"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Sync Rates
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreate}
            className="bg-[#C5B378] text-[#072421] font-bold hover:bg-[#D8C78E] shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Add Master Service
          </Button>
        </div>
      </div>

      {/* ─── Search & Category Filters Bar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[#061E1C]/80 border border-[#C5B378]/25 p-3.5 rounded-lg backdrop-blur-sm">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#C5B378] text-[#072421] shadow-sm'
                  : 'bg-[#092E2B]/80 text-[#E6ECEB]/80 hover:bg-[#0E423E] hover:text-white border border-[#C5B378]/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#D8C78E]/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service, slug, or Tamil name..."
            className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] pl-8 pr-3 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#E6ECEB]/50 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Services Catalog Table / Cards ─── */}
      <Card className="border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] overflow-hidden">
        <CardHeader className="border-b border-[#C5B378]/15 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif text-lg text-white">
                Active Catalog ({filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'})
              </CardTitle>
              <CardDescription className="text-xs text-[#E6ECEB]/60">
                Single source of truth for all camera styles, crew rates, and deliverable units.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#051C1A]/80 border-b border-[#C5B378]/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-[#D8C78E] text-[11px] font-bold uppercase">#</TableHead>
                  <TableHead className="text-[#D8C78E] text-[11px] font-bold uppercase min-w-[200px]">
                    Service & Details
                  </TableHead>
                  <TableHead className="text-[#D8C78E] text-[11px] font-bold uppercase">Category</TableHead>
                  <TableHead className="text-[#D8C78E] text-[11px] font-bold uppercase">Pricing Mode</TableHead>
                  <TableHead className="text-[#D8C78E] text-[11px] font-bold uppercase min-w-[220px]">
                    Rates / Duration Tiers
                  </TableHead>
                  <TableHead className="text-[#D8C78E] text-[11px] font-bold uppercase text-center">Status</TableHead>
                  <TableHead className="text-[#D8C78E] text-[11px] font-bold uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-[#C5B378]/10 text-xs">
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-[#E6ECEB]/60">
                      No services found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((svc) => (
                    <TableRow
                      key={svc.slug}
                      className="hover:bg-[#092E2B]/50 transition-colors border-b border-[#C5B378]/10"
                    >
                      {/* Order */}
                      <TableCell className="font-mono text-[#D8C78E] font-bold">
                        {svc.displayOrder ?? '—'}
                      </TableCell>

                      {/* Service name */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{svc.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#E6ECEB]/50 font-mono">
                            <span>slug: {svc.slug}</span>
                            <span>•</span>
                            <span>unit: {svc.unitLabel}</span>
                          </div>
                          {svc.description && (
                            <p className="text-[11px] text-[#E6ECEB]/60 max-w-sm line-clamp-1">
                              {svc.description}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge
                          variant="neutral"
                          className="border-[#C5B378]/30 bg-[#092E2B] text-[#D8C78E] text-[10px] uppercase font-bold"
                        >
                          {svc.category}
                        </Badge>
                      </TableCell>

                      {/* Pricing Type */}
                      <TableCell>
                        {svc.pricingType === 'per_unit' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                            <Tag className="h-3 w-3" />
                            Per-Unit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#D8C78E] font-semibold bg-[#114A45] border border-[#D8C78E]/30 px-2 py-0.5 rounded">
                            <Layers className="h-3 w-3" />
                            3 Duration Tiers
                          </span>
                        )}
                      </TableCell>

                      {/* Rates */}
                      <TableCell>
                        {svc.pricingType === 'per_unit' ? (
                          <div className="space-y-0.5">
                            <span className="font-serif font-bold text-white text-sm">
                              {formatINR(svc.unitPrice ?? 0)}
                            </span>
                            <span className="text-[10px] text-[#E6ECEB]/60 font-mono ml-1">
                              / {svc.unitLabel} (Min: {svc.minQuantity ?? 1} {svc.unitLabel}s)
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                            <div className="bg-[#051C1A] border border-[#C5B378]/15 rounded px-2 py-1">
                              <span className="text-[9px] text-[#D8C78E]/70 uppercase block">3 Hours</span>
                              <span className="font-bold text-white">
                                {formatINR(svc.pricing?.threeHours ?? 0)}
                              </span>
                            </div>
                            <div className="bg-[#051C1A] border border-[#C5B378]/15 rounded px-2 py-1">
                              <span className="text-[9px] text-[#D8C78E]/70 uppercase block">Half Day</span>
                              <span className="font-bold text-white">
                                {formatINR(svc.pricing?.halfDay ?? 0)}
                              </span>
                            </div>
                            <div className="bg-[#051C1A] border border-[#C5B378]/15 rounded px-2 py-1">
                              <span className="text-[9px] text-[#D8C78E]/70 uppercase block">Full Day</span>
                              <span className="font-bold text-white">
                                {formatINR(svc.pricing?.fullDay ?? 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Status Toggle */}
                      <TableCell className="text-center">
                        <button
                          type="button"
                          disabled={togglingSlug === svc.slug}
                          onClick={() => handleToggleActive(svc)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            svc.isActive
                              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                              : 'bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                          }`}
                        >
                          <Power className="h-2.5 w-2.5" />
                          <span>{svc.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(svc)}
                            className="h-8 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B]"
                            title="Edit Service Pricing"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingService(svc)}
                            className="h-8 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                            title="Delete Service"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create / Edit Service Modal ─── */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && !isSubmitting && setIsModalOpen(false)}>
        <DialogContent
          onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
          onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
          className="max-h-[92dvh] w-[95vw] max-w-2xl overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] p-6 space-y-4"
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#D8C78E]" />
              {editingService ? `Edit Service: ${editingService.name}` : 'Add Master Service'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/70">
              Define service categorization, duration tier rates, or per-unit pricing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#D8C78E]">Service Name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Traditional Camera"
                className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            {/* Slug & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#D8C78E] flex items-center justify-between">
                  <span>Unique Slug *</span>
                  {editingService && <span className="text-[10px] text-amber-400 font-normal">Locked (in-use)</span>}
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingService)}
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. traditional-camera"
                  className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#061E1C] px-3 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#D8C78E]">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="Photography">Photography</option>
                  <option value="Videography">Videography</option>
                  <option value="Aerial & Gear">Aerial & Gear</option>
                  <option value="Deliverables">Deliverables</option>
                  <option value="Custom">Custom Category...</option>
                </select>
                {formCategory === 'Custom' && (
                  <input
                    type="text"
                    required
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    placeholder="Enter custom category..."
                    className="h-8 mt-1.5 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#D8C78E]">Description / Inclusions</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief summary of service scope, crew deliverables, or specifications..."
                className="w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] p-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>

            {/* Pricing Mode Selector */}
            <div className="space-y-2 border-t border-[#C5B378]/20 pt-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#D8C78E] block">
                Pricing Mode Configuration
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    formPricingType === 'tiered'
                      ? 'border-[#D8C78E] bg-[#114A45] text-white shadow-sm'
                      : 'border-[#C5B378]/20 bg-[#061E1C]/60 text-[#E6ECEB]/70 hover:border-[#C5B378]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pricingType"
                    value="tiered"
                    checked={formPricingType === 'tiered'}
                    onChange={() => {
                      setFormPricingType('tiered');
                      if (formUnitLabel === 'sheet') setFormUnitLabel('camera');
                    }}
                    className="mt-0.5 accent-[#C5B378]"
                  />
                  <div>
                    <span className="text-xs font-bold block">Duration Tiered</span>
                    <span className="text-[10px] leading-tight text-[#E6ECEB]/60">
                      Standard pricing for 3h, Half Day, and Full Day slots.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    formPricingType === 'per_unit'
                      ? 'border-[#D8C78E] bg-[#114A45] text-white shadow-sm'
                      : 'border-[#C5B378]/20 bg-[#061E1C]/60 text-[#E6ECEB]/70 hover:border-[#C5B378]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pricingType"
                    value="per_unit"
                    checked={formPricingType === 'per_unit'}
                    onChange={() => {
                      setFormPricingType('per_unit');
                      if (formUnitLabel === 'camera') setFormUnitLabel('sheet');
                    }}
                    className="mt-0.5 accent-[#C5B378]"
                  />
                  <div>
                    <span className="text-xs font-bold block">Per-Unit / Per-Sheet</span>
                    <span className="text-[10px] leading-tight text-[#E6ECEB]/60">
                      Linear pricing per item (e.g., ₹350 per album sheet).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditional Pricing Inputs */}
            {formPricingType === 'tiered' ? (
              <div className="space-y-3 bg-[#051C1A] p-3.5 rounded-lg border border-[#C5B378]/20">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#D8C78E]">Unit Label</label>
                  <input
                    type="text"
                    required
                    value={formUnitLabel}
                    onChange={(e) => setFormUnitLabel(e.target.value)}
                    placeholder="e.g. camera, videographer, wall, screen, operator"
                    className="h-8 w-full rounded border border-[#C5B378]/25 bg-[#092E2B] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#D8C78E]">3 Hours Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={formPrice3h}
                      onChange={(e) => setFormPrice3h(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="6000"
                      className="h-9 w-full rounded border border-[#C5B378]/25 bg-[#092E2B] px-2.5 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#D8C78E]">Half Day Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={formPriceHalfDay}
                      onChange={(e) => setFormPriceHalfDay(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="10000"
                      className="h-9 w-full rounded border border-[#C5B378]/25 bg-[#092E2B] px-2.5 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#D8C78E]">Full Day Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={formPriceFullDay}
                      onChange={(e) => setFormPriceFullDay(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="16000"
                      className="h-9 w-full rounded border border-[#C5B378]/25 bg-[#092E2B] px-2.5 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-[#051C1A] p-3.5 rounded-lg border border-[#C5B378]/20">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#D8C78E]">Unit Label *</label>
                    <input
                      type="text"
                      required
                      value={formUnitLabel}
                      onChange={(e) => setFormUnitLabel(e.target.value)}
                      placeholder="e.g. sheet, frame, book"
                      className="h-9 w-full rounded border border-[#C5B378]/25 bg-[#092E2B] px-2.5 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#D8C78E]">Rate / Unit (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      step={10}
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="350"
                      className="h-9 w-full rounded border border-[#C5B378]/25 bg-[#092E2B] px-2.5 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#D8C78E]">Min Quantity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formMinQuantity}
                      onChange={(e) => setFormMinQuantity(Math.max(1, Number(e.target.value) || 1))}
                      placeholder="20"
                      className="h-9 w-full rounded border border-[#C5B378]/25 bg-[#092E2B] px-2.5 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Display Order & Active Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-[#C5B378]/20 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#D8C78E]">Display Order</label>
                <input
                  type="number"
                  min={1}
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(Number(e.target.value) || 1)}
                  className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-[#C5B378]/30 bg-[#092E2B] text-[#C5B378] accent-[#C5B378]"
                  />
                  <span>Active in packages and customizer</span>
                </label>
              </div>
            </div>

            <DialogFooter className="border-t border-[#C5B378]/20 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
              >
                Cancel
              </Button>
              <SubmitButton
                isLoading={isSubmitting}
                loadingText="Saving Service..."
                className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
              >
                {editingService ? 'Save Changes' : 'Create Service'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Service Confirmation Dialog ─── */}
      <Dialog open={!!deletingService} onOpenChange={(open) => !open && !isDeleting && setDeletingService(null)}>
        <DialogContent className="w-[95vw] max-h-[92dvh] border-rose-500/30 bg-[#072421] text-[#E6ECEB] max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              Delete Service
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/80 pt-2">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">&quot;{deletingService?.name}&quot;</strong> ({deletingService?.slug})?
              Existing bills and confirmed bookings will retain their historical snapshots, but future package calculations will not include this service.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-t border-[#C5B378]/15 pt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingService(null)}
              className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
            >
              Cancel
            </Button>
            <SubmitButton
              isLoading={isDeleting}
              loadingText="Deleting Service..."
              onClick={handleDeleteService}
              className="bg-rose-600 text-white hover:bg-rose-500 font-semibold"
            >
              Confirm Delete
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
