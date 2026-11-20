'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Package as PackageIcon,
  Pencil,
  Plus,
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
  EventCategory,
  StudioPackage,
} from '@/src/types/studio';
import { formatINR } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
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

export function AdminPackagesModule() {
  const { packages, portfolio, addPackage, updatePackage, deletePackage, reorderPackages } =
    useStudio();

  // New package modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newDuration, setNewDuration] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('Weddings');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newHighlighted, setNewHighlighted] = useState(false);
  const [newDeliverables, setNewDeliverables] = useState<string[]>([
    '1 Lead Candid Photographer + 1 Traditional Photographer',
    '1 Full-HD Traditional Videographer',
    'Full Event Edited Video + Raw Footage Drive',
  ]);
  const [newDeliverableInput, setNewDeliverableInput] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [newDisplayOnPortfolio, setNewDisplayOnPortfolio] = useState(true);

  // Edit package modal state
  const [editingPackage, setEditingPackage] = useState<StudioPackage | null>(null);
  const [editName, setEditName] = useState('');
  const [editAudience, setEditAudience] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editDuration, setEditDuration] = useState('');
  const [editCategory, setEditCategory] = useState<EventCategory>('Weddings');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editHighlighted, setEditHighlighted] = useState(false);
  const [editDeliverables, setEditDeliverables] = useState<string[]>([]);
  const [editDeliverableInput, setEditDeliverableInput] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editDisplayOnPortfolio, setEditDisplayOnPortfolio] = useState(true);

  // Delete confirmation dialog
  const [deletingPackage, setDeletingPackage] = useState<StudioPackage | null>(null);

  // Gallery Picker modal state
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'new' | 'edit'>('new');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats calculation
  const totalCount = packages.length;
  const activeCount = packages.filter((p) => (p.status ?? 'active') === 'active').length;
  const portfolioCount = packages.filter(
    (p) => (p.status ?? 'active') === 'active' && p.displayOnPortfolio !== false
  ).length;
  const highlightedCount = packages.filter((p) => p.highlighted || p.featured).length;

  const sortedPackages = [...packages].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

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

  // Add deliverable item to new package
  const handleAddNewDeliverable = () => {
    if (!newDeliverableInput.trim()) return;
    setNewDeliverables((prev) => [...prev, newDeliverableInput.trim()]);
    setNewDeliverableInput('');
  };

  // Remove deliverable item from new package
  const handleRemoveNewDeliverable = (idx: number) => {
    setNewDeliverables((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add deliverable item to editing package
  const handleAddEditDeliverable = () => {
    if (!editDeliverableInput.trim()) return;
    setEditDeliverables((prev) => [...prev, editDeliverableInput.trim()]);
    setEditDeliverableInput('');
  };

  // Remove deliverable item from editing package
  const handleRemoveEditDeliverable = (idx: number) => {
    setEditDeliverables((prev) => prev.filter((_, i) => i !== idx));
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
      await addPackage({
        id: newId.trim() || undefined,
        name: newName.trim(),
        audience: newAudience.trim() || 'For weddings & milestones',
        price: Number(newPrice),
        duration: newDuration.trim(),
        category: newCategory,
        deliverables: newDeliverables.length > 0 ? newDeliverables : ['Full Event Coverage'],
        imageUrl: newImageUrl.trim() || undefined,
        highlighted: newHighlighted,
        status: newStatus,
        displayOnPortfolio: newDisplayOnPortfolio,
      });

      toast.success(`Package "${newName.trim()}" created and saved to MongoDB.`);
      setIsAddModalOpen(false);
      // Reset form
      setNewId('');
      setNewName('');
      setNewAudience('');
      setNewPrice('');
      setNewDuration('');
      setNewImageUrl('');
      setNewHighlighted(false);
      setNewStatus('active');
      setNewDisplayOnPortfolio(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (pkg: StudioPackage) => {
    setEditingPackage(pkg);
    setEditName(pkg.name);
    setEditAudience(pkg.audience);
    setEditPrice(pkg.price);
    setEditDuration(pkg.duration);
    setEditCategory((pkg.category as EventCategory) || 'Weddings');
    setEditImageUrl(pkg.imageUrl || pkg.image || '');
    setEditHighlighted(Boolean(pkg.highlighted || pkg.featured));
    setEditDeliverables(Array.isArray(pkg.deliverables) ? [...pkg.deliverables] : []);
    setEditStatus(pkg.status === 'inactive' ? 'inactive' : 'active');
    setEditDisplayOnPortfolio(pkg.displayOnPortfolio !== false);
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
      await updatePackage(editingPackage.id, {
        name: editName.trim(),
        audience: editAudience.trim(),
        price: Number(editPrice),
        duration: editDuration.trim(),
        category: editCategory,
        deliverables: editDeliverables,
        imageUrl: editImageUrl.trim(),
        highlighted: editHighlighted,
        featured: editHighlighted,
        status: editStatus,
        displayOnPortfolio: editDisplayOnPortfolio,
      });

      toast.success(`Updated "${editName.trim()}" in MongoDB.`);
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
      toast.success(`Package "${deletingPackage.name}" deleted from MongoDB.`);
      setDeletingPackage(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (pkg: StudioPackage) => {
    const nextStatus = (pkg.status ?? 'active') === 'active' ? 'inactive' : 'active';
    try {
      await updatePackage(pkg.id, { status: nextStatus });
      toast.success(
        `Package "${pkg.name}" is now ${nextStatus === 'active' ? 'Active' : 'Disabled'}.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle package status.');
    }
  };

  // Quick toggle display on portfolio
  const handleTogglePortfolio = async (pkg: StudioPackage) => {
    const nextDisplay = pkg.displayOnPortfolio === false ? true : false;
    try {
      await updatePackage(pkg.id, { displayOnPortfolio: nextDisplay });
      toast.success(
        `Package "${pkg.name}" is now ${nextDisplay ? 'Visible on' : 'Hidden from'} Portfolio.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle portfolio visibility.');
    }
  };

  // Quick toggle highlighted
  const handleToggleHighlighted = async (pkg: StudioPackage) => {
    const nextHighlight = !Boolean(pkg.highlighted || pkg.featured);
    try {
      await updatePackage(pkg.id, {
        highlighted: nextHighlight,
        featured: nextHighlight,
      });
      toast.success(
        nextHighlight
          ? `Marked "${pkg.name}" as Flagship / Most Popular.`
          : `Removed Flagship badge from "${pkg.name}".`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle badge.');
    }
  };

  // Move sort order up or down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sortedPackages.length) return;

    const newOrderList = [...sortedPackages];
    const [moved] = newOrderList.splice(index, 1);
    newOrderList.splice(newIdx, 0, moved);

    const orderedIds = newOrderList.map((p) => p.id);
    try {
      await reorderPackages(orderedIds);
      toast.success('Package display order updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reorder packages.');
    }
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
            Stored in MongoDB packages collection
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
            <CardTitle className="text-2xl font-bold font-mono text-white">{portfolioCount}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-[#E6ECEB]/70">
            Live in public Packages section
          </CardContent>
        </Card>

        <Card className="border-[#C5B378]/25 bg-[#092E2B]/80 text-[#E6ECEB]">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs text-amber-400">FEATURED / POPULAR</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-white">{highlightedCount}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 text-[11px] text-[#E6ECEB]/70">
            Flagship or Most Popular badges
          </CardContent>
        </Card>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#092E2B]/90 border border-[#C5B378]/25 rounded-xl p-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-[#D8C78E]" />
            Photography Packages Catalog
          </h2>
          <p className="text-xs text-[#E6ECEB]/70 mt-0.5">
            Single source of truth connected to MongoDB. Changes immediately reflect on the public website and WhatsApp communications.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E] shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add New Package
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {sortedPackages.map((pkg, idx) => {
          const isActive = (pkg.status ?? 'active') === 'active';
          const isDisplayed = pkg.displayOnPortfolio !== false;
          const isHighlighted = Boolean(pkg.highlighted || pkg.featured);
          const pkgImg = pkg.imageUrl || pkg.image;

          return (
            <Card
              key={pkg.id}
              className={`border transition-all overflow-hidden bg-[#092E2B] ${
                !isActive
                  ? 'opacity-65 border-white/10'
                  : isHighlighted
                  ? 'border-[#D8C78E] shadow-lg ring-1 ring-[#D8C78E]/40'
                  : 'border-[#C5B378]/25 hover:border-[#C5B378]/45'
              }`}
            >
              {/* Image banner or fallback header */}
              {pkgImg ? (
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-[#041513] border-b border-[#C5B378]/15">
                  <img
                    src={pkgImg}
                    alt={pkg.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#092E2B] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge variant="neutral" className="bg-[#072421]/90 text-[#D8C78E] border-[#C5B378]/30 font-mono text-[10px]">
                      #{idx + 1}
                    </Badge>
                    <Badge variant="neutral" className="bg-[#072421]/90 text-white/90 border-white/20 font-mono text-[10px]">
                      {pkg.id}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {isHighlighted && (
                      <Badge className="bg-[#C5B378] text-[#072421] font-semibold text-[10px]">
                        ⭐ Popular / Flagship
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-5 pt-4 pb-1 border-b border-[#C5B378]/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="bg-[#072421] text-[#D8C78E] border-[#C5B378]/30 font-mono text-[10px]">
                      #{idx + 1}
                    </Badge>
                    <span className="font-mono text-xs text-[#D8C78E]">{pkg.id}</span>
                  </div>
                  {isHighlighted && (
                    <Badge className="bg-[#C5B378] text-[#072421] font-semibold text-[10px]">
                      ⭐ Flagship
                    </Badge>
                  )}
                </div>
              )}

              <CardContent className="p-5 space-y-4">
                {/* Title & Investment */}
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-[#C5B378]/15 pb-3">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white leading-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-[#D8C78E]/90 mt-0.5">{pkg.audience}</p>
                    {pkg.duration && (
                      <p className="text-xs text-[#E6ECEB]/60 mt-0.5">⏱️ {pkg.duration}</p>
                    )}
                  </div>

                  <div className="text-right sm:shrink-0 pt-1 sm:pt-0">
                    <span className="text-2xl font-serif font-bold text-white font-mono">
                      {formatINR(pkg.price)}
                    </span>
                    <span className="text-[11px] text-[#E6ECEB]/50 block">Investment</span>
                  </div>
                </div>

                {/* Deliverables snippet */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D8C78E]">
                    Deliverables ({pkg.deliverables?.length || 0}):
                  </p>
                  <ul className="space-y-1 max-h-36 overflow-y-auto text-xs text-[#E6ECEB]/85 pr-1">
                    {pkg.deliverables?.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-[#D8C78E] shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status Badges & Quick Toggles */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#C5B378]/15 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Status Pill */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(pkg)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#25D366]/15 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                      }`}
                      title="Click to enable or disable package"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#25D366]' : 'bg-zinc-500'}`} />
                      {isActive ? 'Active' : 'Disabled'}
                    </button>

                    {/* Display on Portfolio Pill */}
                    <button
                      type="button"
                      onClick={() => handleTogglePortfolio(pkg)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                        isDisplayed
                          ? 'bg-[#C5B378]/15 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#C5B378]/25'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                      }`}
                      title="Click to show or hide on public Portfolio"
                    >
                      {isDisplayed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {isDisplayed ? 'On Portfolio' : 'Hidden'}
                    </button>

                    {/* Highlighted Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleHighlighted(pkg)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 hover:bg-amber-400/30'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                      }`}
                      title="Click to toggle Flagship badge"
                    >
                      <Star className={`h-3 w-3 ${isHighlighted ? 'fill-amber-400 text-amber-400' : ''}`} />
                      {isHighlighted ? 'Featured' : 'Standard'}
                    </button>
                  </div>

                  {/* Ordering Arrows */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="h-7 w-7 p-0 text-[#E6ECEB]/70 hover:text-white hover:bg-[#072421] disabled:opacity-30"
                      title="Move package up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === sortedPackages.length - 1}
                      className="h-7 w-7 p-0 text-[#E6ECEB]/70 hover:text-white hover:bg-[#072421] disabled:opacity-30"
                      title="Move package down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Primary Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#C5B378]/15">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(pkg)}
                    className="border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#072421] h-8 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit Package
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingPackage(pkg)}
                    className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 h-8 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Package Modal */}
      <Dialog open={!!editingPackage} onOpenChange={(open) => !open && setEditingPackage(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Pencil className="h-4 w-4 text-[#D8C78E]" />
              Edit Package: {editingPackage?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/70">
              Update package pricing, deliverables, image, or visibility in MongoDB.
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

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Investment Price (₹) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={500}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white font-mono focus:border-[#D8C78E] focus:outline-none"
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
                <label className="text-xs font-medium text-[#D8C78E]">Event Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as EventCategory)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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

            {/* Deliverables Builder */}
            <div className="space-y-2 border-t border-[#C5B378]/20 pt-3">
              <label className="text-xs font-medium text-[#D8C78E] block">Deliverables List</label>
              <div className="space-y-2">
                {editDeliverables.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-[#D8C78E] font-mono w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...editDeliverables];
                        next[idx] = e.target.value;
                        setEditDeliverables(next);
                      }}
                      className="h-9 flex-1 rounded-md border border-[#C5B378]/20 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEditDeliverable(idx)}
                      className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={editDeliverableInput}
                    onChange={(e) => setEditDeliverableInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditDeliverable();
                      }
                    }}
                    placeholder="Type new deliverable and click Add (or Enter)..."
                    className="h-9 flex-1 rounded-md border border-[#C5B378]/25 bg-[#061E1C] px-3 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEditDeliverable}
                    className="h-9 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

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
                <span>Mark as Flagship / Most Popular (Featured Badge)</span>
              </label>
            </div>

            <DialogFooter className="border-t border-[#C5B378]/20 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPackage(null)}
                className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
              >
                {isSubmitting ? 'Saving to MongoDB...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Package Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#D8C78E]" />
              Add New Photography Package
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/70">
              Define a new photography collection. All fields will be saved directly into MongoDB.
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

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#D8C78E]">Custom Package ID (Optional)</label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. pkg-cinema-gold (auto-generated if empty)"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white font-mono focus:border-[#D8C78E] focus:outline-none"
                />
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
                  onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
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
                <label className="text-xs font-medium text-[#D8C78E]">Event Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
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

            {/* Deliverables Builder */}
            <div className="space-y-2 border-t border-[#C5B378]/20 pt-3">
              <label className="text-xs font-medium text-[#D8C78E] block">Deliverables List</label>
              <div className="space-y-2">
                {newDeliverables.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-[#D8C78E] font-mono w-5 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...newDeliverables];
                        next[idx] = e.target.value;
                        setNewDeliverables(next);
                      }}
                      className="h-9 flex-1 rounded-md border border-[#C5B378]/20 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNewDeliverable(idx)}
                      className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newDeliverableInput}
                    onChange={(e) => setNewDeliverableInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewDeliverable();
                      }
                    }}
                    placeholder="Type deliverable and click Add (or Enter)..."
                    className="h-9 flex-1 rounded-md border border-[#C5B378]/25 bg-[#061E1C] px-3 text-xs text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddNewDeliverable}
                    className="h-9 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#092E2B]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

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
                <span>Mark as Flagship / Most Popular</span>
              </label>
            </div>

            <DialogFooter className="border-t border-[#C5B378]/20 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C5B378] text-[#072421] font-semibold hover:bg-[#D8C78E]"
              >
                {isSubmitting ? 'Creating in MongoDB...' : 'Create Package'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPackage} onOpenChange={(open) => !open && setDeletingPackage(null)}>
        <DialogContent className="border-rose-500/30 bg-[#072421] text-[#E6ECEB] max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              Confirm Package Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-[#E6ECEB]/80 pt-2">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">&quot;{deletingPackage?.name}&quot;</strong> ({deletingPackage?.id})?
              This package document will be removed from MongoDB. Existing confirmed bookings will not be affected.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingPackage(null)}
              className="border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#092E2B]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Package'}
            </Button>
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
                <div className="aspect-[4/3] w-full bg-[#041513] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
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
