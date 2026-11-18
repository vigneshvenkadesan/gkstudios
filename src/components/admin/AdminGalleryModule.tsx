'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ImagePlus, Pencil, Star, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { EVENT_CATEGORIES, EventCategory, PortfolioItem } from '@/src/types/studio';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';

export function AdminGalleryModule() {
  const { portfolio, addPortfolioItem, updatePortfolioItem, deletePortfolioItem } = useStudio();

  // New photo upload state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Iyer Weddings');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [shootNotes, setShootNotes] = useState('');
  const [exif, setExif] = useState('50mm · f/1.8 · 1/320s · ISO 400');
  const [dateLabel, setDateLabel] = useState('November 2026');
  const [isHeroFeatured, setIsHeroFeatured] = useState(false);
  const [aspect, setAspect] = useState<'standard' | 'wide'>('standard');

  // Edit modal state
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<EventCategory>('Iyer Weddings');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Please pick an image under 4 MB for browser LocalStorage preview.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        toast.success(`Loaded preview for ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !imageUrl.trim()) {
      toast.error('Please enter a title, location, and image URL or file upload.');
      return;
    }

    try {
      await addPortfolioItem({
        title: title.trim(),
        category,
        location: location.trim(),
        imageUrl: imageUrl.trim(),
        shootNotes:
          shootNotes.trim() ||
          'Captured by GK Studios documentary team with natural color grading.',
        exif: exif.trim() || '35mm · f/1.8 · 1/250s',
        dateLabel: dateLabel.trim() || 'November 2026',
        isHeroFeatured,
        isVisible: true,
        aspect,
      });

      toast.success(`Added "${title.trim()}" to the live ${category} gallery.`);
      setTitle('');
      setLocation('');
      setImageUrl('');
      setShootNotes('');
      setIsHeroFeatured(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish photograph.');
    }
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditLocation(item.location);
    setEditNotes(item.shootNotes);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updatePortfolioItem(editingItem.id, {
        title: editTitle.trim(),
        category: editCategory,
        location: editLocation.trim(),
        shootNotes: editNotes.trim(),
      });
      toast.success('Portfolio caption and metadata updated.');
      setEditingItem(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update photograph.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Portfolio Photo Card */}
      <Card className="bg-[#0E423E]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-[#D8C78E]" />
            Publish New Portfolio Photograph
          </CardTitle>
          <CardDescription>
            Paste an image URL or upload a photo file preview. New photos immediately appear in the
            public gallery and optionally in the Hero carousel.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAddPhoto} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Arjun & Shruti — Kashi Yatra"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Event Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Venue / Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Mylapore Kapaleeshwarar Temple"
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
              <div className="md:col-span-7 space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Image URL or Uploaded File Data *
                </label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/portfolio/... or https://..."
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-xs text-white placeholder:font-sans placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#C5B378]/40 bg-[#092E2B] px-3 text-xs font-medium text-white hover:border-[#D8C78E] transition-colors">
                  <Upload className="h-3.5 w-3.5 text-[#D8C78E]" />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Grid Size</label>
                <select
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value as 'standard' | 'wide')}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="standard">Standard (4:3)</option>
                  <option value="wide">Wide Bento (16:10)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Shoot Notes</label>
                <input
                  type="text"
                  value={shootNotes}
                  onChange={(e) => setShootNotes(e.target.value)}
                  placeholder="Lighting, rituals captured, album notes..."
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">EXIF Specs</label>
                  <input
                    type="text"
                    value={exif}
                    onChange={(e) => setExif(e.target.value)}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#D8C78E]">Month / Year</label>
                  <input
                    type="text"
                    value={dateLabel}
                    onChange={(e) => setDateLabel(e.target.value)}
                    className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[#C5B378]/15 pt-4">
              <label className="inline-flex items-center gap-2.5 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHeroFeatured}
                  onChange={(e) => setIsHeroFeatured(e.target.checked)}
                  className="h-4 w-4 accent-[#C5B378] rounded"
                />
                <span>Feature this photo in the live Hero Carousel</span>
              </label>

              <Button type="submit">
                <ImagePlus className="h-4 w-4" />
                Add to Live Gallery
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Portfolio Manager Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {portfolio.map((item) => (
          <Card
            key={item.id}
            className={`overflow-hidden flex flex-col justify-between ${
              item.isVisible ? 'bg-[#0E423E]' : 'bg-[#072421] opacity-75'
            }`}
          >
            <div>
              <div className="relative aspect-[16/10] w-full bg-[#041715]">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041715]/85 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 text-xs text-[#D8C78E] truncate">
                  {item.category} · {item.location}
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <h3 className="font-semibold text-white text-base leading-snug">{item.title}</h3>
                <p className="text-xs text-[#E6ECEB]/75 line-clamp-2">{item.shootNotes}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#C5B378]/15 px-4 py-3 bg-[#092E2B]/50">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    updatePortfolioItem(item.id, { isHeroFeatured: !item.isHeroFeatured });
                    toast.success(
                      item.isHeroFeatured ? 'Removed from Hero carousel.' : 'Featured in Hero carousel.'
                    );
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    item.isHeroFeatured
                      ? 'border-[#D8C78E] bg-[#C5B378] text-[#072421] font-semibold'
                      : 'border-[#C5B378]/25 text-[#E6ECEB]/80 hover:text-white'
                  }`}
                >
                  <Star className="h-3.5 w-3.5" />
                  {item.isHeroFeatured ? 'Hero Featured' : 'Feature'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updatePortfolioItem(item.id, { isVisible: !item.isVisible });
                    toast.info(item.isVisible ? 'Hidden from public gallery.' : 'Visible in public gallery.');
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-[#C5B378]/25 px-2.5 py-1.5 text-xs text-[#E6ECEB]/80 hover:text-white cursor-pointer"
                >
                  {item.isVisible ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-emerald-300" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                      Hidden
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Edit photo caption"
                  onClick={() => openEditModal(item)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#C5B378]/25 text-[#E6ECEB] hover:border-[#D8C78E] hover:text-white cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Delete photo"
                  onClick={() => {
                    deletePortfolioItem(item.id);
                    toast.info(`Deleted "${item.title}" from portfolio.`);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-400/25 text-red-300 hover:bg-red-900/40 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Caption Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Details</DialogTitle>
            <DialogDescription>
              Updates appear immediately on the public website and lightbox.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">Event Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as EventCategory)}
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">Location</label>
              <input
                type="text"
                required
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">Shoot Notes</label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full rounded-md border border-[#C5B378]/30 bg-[#072421] p-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
