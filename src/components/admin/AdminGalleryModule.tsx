'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import {
  EVENT_CATEGORIES,
  EventCategory,
  GeneratedCaptionResponse,
  ImageCropConfig,
  normalizeEventCategory,
  PortfolioItem,
} from '@/src/types/studio';
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
import { SHIMMER_BLUR_DATA_URL } from '@/src/lib/imageBlur';
import {
  DEFAULT_IMAGE_CROP,
  getResponsiveCropStyle,
  isCustomImageCrop,
  resolveImageCrop,
} from '@/src/lib/imageCrop';
import { DualCropSelector } from '@/src/components/admin/DualCropSelector';
import { compressToMaxSize, formatMegabytes } from '@/src/lib/compressImage';

type PortfolioAspect = 'standard' | 'wide' | 'tall';

function mapGridSizeToAspect(gridSize?: string): PortfolioAspect {
  if (gridSize === 'Wide (3:2)') return 'wide';
  if (gridSize === 'Tall (3:4)') return 'tall';
  return 'standard';
}

export function AdminGalleryModule() {
  const {
    portfolio,
    isLoading,
    studioLoadError,
    refreshStudio,
    addPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
    reorderPortfolioItems,
  } = useStudio();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Weddings');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{
    secure_url: string;
    public_id: string;
    folder: string;
  } | null>(null);
  const [shootNotes, setShootNotes] = useState('');
  const [exif, setExif] = useState('50mm · f/1.8 · 1/320s · ISO 400');
  const [dateLabel, setDateLabel] = useState('November 2026');
  const [isHeroFeatured, setIsHeroFeatured] = useState(false);
  const [aspect, setAspect] = useState<PortfolioAspect>('standard');
  const [desktopCrop, setDesktopCrop] = useState<ImageCropConfig>({ ...DEFAULT_IMAGE_CROP });
  const [mobileCrop, setMobileCrop] = useState<ImageCropConfig>({ ...DEFAULT_IMAGE_CROP });
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    fileName: string;
    originalSize: number;
    finalSize: number;
    wasCompressed: boolean;
  } | null>(null);
  const [lastProcessedFile, setLastProcessedFile] = useState<File | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiRunCounterRef = useRef(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<EventCategory>('Weddings');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAspect, setEditAspect] = useState<PortfolioAspect>('standard');
  const [editDesktopCrop, setEditDesktopCrop] = useState<ImageCropConfig>({ ...DEFAULT_IMAGE_CROP });
  const [editMobileCrop, setEditMobileCrop] = useState<ImageCropConfig>({ ...DEFAULT_IMAGE_CROP });

  const runGeminiAutoFill = async (source: { file?: File; imageUrl?: string }) => {
    const runId = ++aiRunCounterRef.current;
    setIsGeneratingCaption(true);
    setAiError(null);

    try {
      let response: Response;
      if (source.file) {
        const aiFormData = new FormData();
        aiFormData.append('file', source.file);
        response = await fetch('/api/generate-caption', {
          method: 'POST',
          credentials: 'include',
          body: aiFormData,
        });
      } else if (source.imageUrl?.trim()) {
        response = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ imageUrl: source.imageUrl.trim() }),
        });
      } else {
        throw new Error('Upload a photo or provide an image URL first.');
      }

      const payload = (await response.json()) as Partial<GeneratedCaptionResponse> & {
        error?: string;
      };
      if (runId !== aiRunCounterRef.current) return;

      if (!response.ok) {
        throw new Error(payload.error || `Gemini analysis failed (${response.status}).`);
      }

      if (payload.title) setTitle(payload.title);
      if (payload.category) setCategory(normalizeEventCategory(payload.category));
      if (payload.gridSize) setAspect(mapGridSizeToAspect(payload.gridSize));
      if (payload.shootNotes) setShootNotes(payload.shootNotes);
      if (typeof payload.featureInHero === 'boolean') {
        setIsHeroFeatured(payload.featureInHero);
      }

      toast.success('Gemini AI filled caption & layout suggestions.');
    } catch (error) {
      if (runId !== aiRunCounterRef.current) return;
      const msg =
        error instanceof Error
          ? error.message
          : 'Could not auto-fill with Gemini. You can enter fields manually.';
      setAiError(msg);
      toast.warning(msg);
    } finally {
      if (runId === aiRunCounterRef.current) {
        setIsGeneratingCaption(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!rawFile.type.startsWith('image/')) {
      toast.error('Choose an image file to upload.');
      input.value = '';
      return;
    }

    setAiError(null);
    setCompressionStats(null);
    setIsCompressingImage(true);

    let fileToUpload: File;
    try {
      const result = await compressToMaxSize(rawFile, 4);
      fileToUpload = result.file;
      setCompressionStats({
        fileName: result.file.name,
        originalSize: result.originalSize,
        finalSize: result.finalSize,
        wasCompressed: result.wasCompressed,
      });
      setLastProcessedFile(result.file);

      if (result.finalSize > 4 * 1024 * 1024) {
        toast.error('Image remained larger than 4 MB after compression. Try a smaller export.');
        input.value = '';
        return;
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to optimize image before upload.'
      );
      input.value = '';
      return;
    } finally {
      setIsCompressingImage(false);
    }

    // Start Gemini vision analysis cleanly right after compression completes
    void runGeminiAutoFill({ file: fileToUpload });

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const result = (await response.json()) as {
        imageUrl?: string;
        secure_url?: string;
        public_id?: string;
        folder?: string;
        error?: string;
      };
      if (!response.ok || !result.imageUrl || !result.public_id) {
        throw new Error(result.error || `Upload failed (${response.status}).`);
      }

      setImageUrl(result.imageUrl);
      setUploadedImage({
        secure_url: result.secure_url || result.imageUrl,
        public_id: result.public_id,
        folder: result.folder || 'gkstudios',
      });
      toast.success(`Uploaded ${fileToUpload.name} to Cloudinary.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image.');
    } finally {
      setIsUploadingImage(false);
      input.value = '';
    }
  };

  const handleRegenerateWithAi = () => {
    if (isGeneratingCaption || isCompressingImage) return;
    if (lastProcessedFile) {
      void runGeminiAutoFill({ file: lastProcessedFile });
      return;
    }
    if (imageUrl.trim()) {
      void runGeminiAutoFill({ imageUrl: imageUrl.trim() });
      return;
    }
    toast.error('Upload a photo or paste a Cloudinary image URL first.');
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploadingImage || isCompressingImage) return;
    if (!title.trim() || !location.trim() || !imageUrl.trim()) {
      toast.error('Please enter a title, location, and image URL or file upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPortfolioItem({
        title: title.trim(),
        category,
        location: location.trim(),
        imageUrl: imageUrl.trim(),
        ...(uploadedImage || {}),
        shootNotes:
          shootNotes.trim() ||
          'Captured by GK Studios documentary team with natural color grading.',
        exif: exif.trim() || '35mm · f/1.8 · 1/250s',
        dateLabel: dateLabel.trim() || 'November 2026',
        isHeroFeatured,
        isVisible: true,
        aspect,
        desktopCrop,
        mobileCrop,
      });

      toast.success(`Added "${title.trim()}" to the live ${category} gallery.`);
      setTitle('');
      setLocation('');
      setImageUrl('');
      setUploadedImage(null);
      setShootNotes('');
      setAspect('standard');
      setIsHeroFeatured(false);
      setDesktopCrop({ ...DEFAULT_IMAGE_CROP });
      setMobileCrop({ ...DEFAULT_IMAGE_CROP });
      setCompressionStats(null);
      setLastProcessedFile(null);
      setAiError(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish photograph.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(normalizeEventCategory(item.category));
    setEditLocation(item.location);
    setEditNotes(item.shootNotes);
    setEditAspect(
      item.aspect === 'wide' ? 'wide' : item.aspect === 'tall' ? 'tall' : 'standard'
    );
    setEditDesktopCrop(resolveImageCrop(item.desktopCrop));
    setEditMobileCrop(resolveImageCrop(item.mobileCrop));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || busyImageId) return;
    if (!editTitle.trim() || !editLocation.trim()) {
      toast.error('Please enter a title and location.');
      return;
    }
    setBusyImageId(editingItem.id);
    try {
      await updatePortfolioItem(editingItem.id, {
        title: editTitle.trim(),
        category: editCategory,
        location: editLocation.trim(),
        shootNotes: editNotes.trim(),
        aspect: editAspect,
        desktopCrop: editDesktopCrop,
        mobileCrop: editMobileCrop,
      });
      toast.success('Portfolio caption and metadata updated.');
      setEditingItem(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update photograph.');
    } finally {
      setBusyImageId(null);
    }
  };

  const handleToggleImage = async (
    item: PortfolioItem,
    field: 'isHeroFeatured' | 'isVisible'
  ) => {
    if (busyImageId) return;
    setBusyImageId(item.id);
    try {
      await updatePortfolioItem(
        item.id,
        field === 'isHeroFeatured'
          ? { isHeroFeatured: !item.isHeroFeatured }
          : { isVisible: !item.isVisible }
      );
      if (field === 'isHeroFeatured') {
        toast.success(item.isHeroFeatured ? 'Removed from Hero carousel.' : 'Featured in Hero carousel.');
      } else {
        toast.info(item.isVisible ? 'Hidden from public gallery.' : 'Visible in public gallery.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update gallery image.');
    } finally {
      setBusyImageId(null);
    }
  };

  const handleDeleteImage = async (item: PortfolioItem) => {
    if (busyImageId) return;
    if (!window.confirm(`Delete "${item.title}" from the gallery?`)) return;
    setBusyImageId(item.id);
    try {
      await deletePortfolioItem(item.id);
      toast.success(`Deleted "${item.title}" from the gallery.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete gallery image.');
    } finally {
      setBusyImageId(null);
    }
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= portfolio.length || busyImageId) return;

    const orderedIds = portfolio.map((item) => item.id);
    [orderedIds[index], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[index]];

    setBusyImageId(portfolio[index].id);
    try {
      await reorderPortfolioItems(orderedIds);
      toast.success('Gallery order updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reorder gallery images.');
    } finally {
      setBusyImageId(null);
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
            Paste a Cloudinary image URL or upload directly to the configured Cloudinary folder.
            Saved photos appear in the public gallery and optionally in the Hero carousel.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAddPhoto} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-[#D8C78E]">Photo Title *</label>
                  <button
                    type="button"
                    onClick={handleRegenerateWithAi}
                    disabled={
                      isGeneratingCaption ||
                      isCompressingImage ||
                      (!lastProcessedFile && !imageUrl.trim())
                    }
                    className="inline-flex items-center gap-1 rounded border border-[#C5B378]/35 bg-[#092E2B] px-2 py-0.5 text-[11px] font-medium text-[#D8C78E] transition-colors hover:border-[#D8C78E] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                  >
                    {isGeneratingCaption ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Analyzing…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Regenerate with AI</span>
                      </>
                    )}
                  </button>
                </div>
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
                  Cloudinary Image URL *
                </label>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  disabled={isUploadingImage || isCompressingImage || isSubmitting}
                  onChange={(e) => {
                    const nextUrl = e.target.value;
                    setImageUrl(nextUrl);
                    setUploadedImage(null);
                    setLastProcessedFile(null);
                    if (!nextUrl.trim()) {
                      setCompressionStats(null);
                    }
                  }}
                  placeholder="https://res.cloudinary.com/..."
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-xs text-white placeholder:font-sans placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label
                  className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#C5B378]/40 bg-[#092E2B] px-3 text-xs font-medium text-white transition-colors ${
                    isUploadingImage || isCompressingImage
                      ? 'cursor-wait opacity-70'
                      : 'cursor-pointer hover:border-[#D8C78E]'
                  }`}
                >
                  {isCompressingImage || isUploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#D8C78E]" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 text-[#D8C78E]" />
                  )}
                  <span className="truncate">
                    {isCompressingImage
                      ? 'Optimizing high-res image...'
                      : isUploadingImage
                        ? 'Uploading to Cloudinary…'
                        : 'Upload to Cloudinary'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingImage || isCompressingImage}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">Grid Size</label>
                <select
                  value={aspect}
                  onChange={(e) => setAspect(e.target.value as PortfolioAspect)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-xs text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="standard">Standard (4:3)</option>
                  <option value="wide">Wide (3:2)</option>
                  <option value="tall">Tall (3:4)</option>
                </select>
              </div>
            </div>

            {/* Live Compression Size Comparison + Gemini AI Status */}
            {(isCompressingImage || compressionStats || isGeneratingCaption || aiError) && (
              <div className="space-y-2">
                {isCompressingImage && (
                  <div className="flex items-center gap-2.5 rounded-md border border-[#C5B378]/30 bg-[#072421]/85 px-3.5 py-2.5 text-xs text-[#E6ECEB]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#D8C78E]" />
                    <span>Optimizing high-res image for crisp color &amp; ≤ 4 MB Cloudinary upload…</span>
                  </div>
                )}

                {compressionStats && !isCompressingImage && (() => {
                  const pctSaved =
                    compressionStats.originalSize > 0
                      ? Math.round(
                          ((compressionStats.originalSize - compressionStats.finalSize) /
                            compressionStats.originalSize) *
                            100
                        )
                      : 0;
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#C5B378]/25 bg-[#072421]/85 px-3.5 py-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="text-[#E6ECEB]/75">
                          Original Size:{' '}
                          <strong className="font-mono text-white">
                            {formatMegabytes(compressionStats.originalSize)}
                          </strong>
                        </span>
                        <span className="text-[#E6ECEB]/75">
                          Ready Size:{' '}
                          <strong className="font-mono text-[#D8C78E]">
                            {formatMegabytes(compressionStats.finalSize)}
                          </strong>
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          compressionStats.wasCompressed
                            ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                            : 'border-[#C5B378]/35 bg-[#C5B378]/15 text-[#F4E8C1]'
                        }`}
                      >
                        {compressionStats.wasCompressed
                          ? pctSaved > 0
                            ? `-${pctSaved}% saved`
                            : 'Compressed ≤ 4 MB'
                          : 'Original kept ≤ 4 MB'}
                      </span>
                    </div>
                  );
                })()}

                {isGeneratingCaption && (
                  <div className="flex items-center gap-2.5 rounded-md border border-[#D8C78E]/35 bg-[#092E2B]/90 px-3.5 py-2 text-xs text-[#D8C78E]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing photo with Gemini...</span>
                  </div>
                )}

                {aiError && !isGeneratingCaption && (
                  <div
                    role="status"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-400/35 bg-amber-950/35 px-3.5 py-2 text-xs text-amber-200"
                  >
                    <span>{aiError}</span>
                    <button
                      type="button"
                      onClick={() => setAiError(null)}
                      className="text-[11px] underline underline-offset-2 hover:text-white cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-medium text-[#D8C78E]">Shoot Notes</label>
                  <button
                    type="button"
                    onClick={handleRegenerateWithAi}
                    disabled={
                      isGeneratingCaption ||
                      isCompressingImage ||
                      (!lastProcessedFile && !imageUrl.trim())
                    }
                    className="inline-flex items-center gap-1 rounded border border-[#C5B378]/35 bg-[#092E2B] px-2 py-0.5 text-[11px] font-medium text-[#D8C78E] transition-colors hover:border-[#D8C78E] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Regenerate with AI</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={shootNotes}
                  onChange={(e) => setShootNotes(e.target.value)}
                  placeholder="Lighting, rituals captured, album notes..."
                  className="w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 py-2 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
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

            <DualCropSelector
              imageUrl={imageUrl}
              desktopCrop={desktopCrop}
              mobileCrop={mobileCrop}
              onChangeDesktopCrop={setDesktopCrop}
              onChangeMobileCrop={setMobileCrop}
              aspect={aspect}
            />

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

              <Button
                type="submit"
                disabled={isSubmitting || isUploadingImage || isCompressingImage}
              >
                <ImagePlus className="h-4 w-4" />
                {isCompressingImage
                  ? 'Optimizing Image…'
                  : isUploadingImage
                    ? 'Uploading…'
                    : isSubmitting
                      ? 'Saving…'
                      : 'Add to Live Gallery'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Portfolio Manager Grid */}
      {isLoading ? (
        <Card className="bg-[#0E423E] p-8 text-center text-sm text-[#E6ECEB]/75">
          Loading gallery images…
        </Card>
      ) : studioLoadError ? (
        <Card className="bg-[#0E423E] p-8 text-center">
          <p role="alert" className="text-sm text-rose-200">{studioLoadError}</p>
          <Button type="button" className="mt-4" onClick={() => void refreshStudio()}>
            Retry loading gallery
          </Button>
        </Card>
      ) : portfolio.length === 0 ? (
        <Card className="bg-[#0E423E] p-8 text-center text-sm text-[#E6ECEB]/75">
          No gallery images have been added yet.
        </Card>
      ) : (
      <>
      <p className="text-sm text-[#E6ECEB]/75">
        Use the arrows to set the display order in the public gallery.
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {portfolio.map((item, index) => (
          <Card
            key={item.id}
            className={`overflow-hidden flex flex-col justify-between ${
              item.isVisible ? 'bg-[#0E423E]' : 'bg-[#072421] opacity-75'
            }`}
          >
            <div>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#041715]">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={100}
                  placeholder="blur"
                  blurDataURL={SHIMMER_BLUR_DATA_URL}
                  style={getResponsiveCropStyle(item)}
                  className="h-full w-full object-cover gk-responsive-crop"
                />
                {(isCustomImageCrop(item.desktopCrop) || isCustomImageCrop(item.mobileCrop)) && (
                  <span className="absolute right-2.5 top-2.5 z-20 rounded-full border border-[#D8C78E]/50 bg-[#061E1C]/85 px-2.5 py-0.5 text-[10px] font-semibold text-[#D8C78E]">
                    Custom D/M Crop
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#041715]/85 via-transparent to-transparent z-10" />
                <div className="absolute bottom-2.5 left-3 right-3 text-xs text-[#D8C78E] truncate z-20">
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
                  onClick={() => void handleToggleImage(item, 'isHeroFeatured')}
                  disabled={Boolean(busyImageId)}
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
                  onClick={() => void handleToggleImage(item, 'isVisible')}
                  disabled={Boolean(busyImageId)}
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
                <span
                  aria-label={`Gallery position ${index + 1}`}
                  className="mr-1 font-mono text-xs text-[#D8C78E]"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  aria-label={`Move ${item.title} earlier`}
                  title="Move earlier"
                  onClick={() => void moveImage(index, -1)}
                  disabled={Boolean(busyImageId) || index === 0}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#C5B378]/25 text-[#E6ECEB] hover:border-[#D8C78E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${item.title} later`}
                  title="Move later"
                  onClick={() => void moveImage(index, 1)}
                  disabled={Boolean(busyImageId) || index === portfolio.length - 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#C5B378]/25 text-[#E6ECEB] hover:border-[#D8C78E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Edit photo caption"
                  onClick={() => openEditModal(item)}
                  disabled={Boolean(busyImageId)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#C5B378]/25 text-[#E6ECEB] hover:border-[#D8C78E] hover:text-white cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Delete photo"
                  onClick={() => void handleDeleteImage(item)}
                  disabled={Boolean(busyImageId)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-400/25 text-red-300 hover:bg-red-900/40 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </>
      )}

      {/* Edit Caption & Responsive Crop Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[92dvh]">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Details &amp; Screen Crop</DialogTitle>
            <DialogDescription>
              Adjust caption, Desktop &amp; Mobile framing, and grid size. Updates appear live immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <label className="block text-xs font-medium text-[#D8C78E]">Location</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <label className="block text-xs font-medium text-[#D8C78E]">Grid Size</label>
                <select
                  value={editAspect}
                  onChange={(e) => setEditAspect(e.target.value as PortfolioAspect)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  <option value="standard">Standard (4:3)</option>
                  <option value="wide">Wide (3:2)</option>
                  <option value="tall">Tall (3:4)</option>
                </select>
              </div>
            </div>

            {editingItem && (
              <DualCropSelector
                imageUrl={editingItem.imageUrl}
                desktopCrop={editDesktopCrop}
                mobileCrop={editMobileCrop}
                onChangeDesktopCrop={setEditDesktopCrop}
                onChangeMobileCrop={setEditMobileCrop}
                aspect={editAspect}
              />
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#D8C78E]">Shoot Notes</label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full rounded-md border border-[#C5B378]/30 bg-[#072421] p-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
                disabled={Boolean(busyImageId)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={Boolean(busyImageId)}>
                {busyImageId === editingItem?.id ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
