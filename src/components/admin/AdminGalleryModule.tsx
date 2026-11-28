'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { useEvents } from '@/src/hooks/useEvents';
import {
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
import {
  compressToMaxSize,
  formatMegabytes,
  prepareFastAiAsset,
} from '@/src/lib/compressImage';

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
  const { events, activeEvents, isLoading: isEventsLoading } = useEvents({ all: true });

  const selectableEvents = useMemo(
    () => (activeEvents.length > 0 ? activeEvents : events),
    [activeEvents, events]
  );
  const eventById = useMemo(
    () => new Map(events.map((ev) => [ev.id, ev])),
    [events]
  );

  const [title, setTitle] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{
    secure_url: string;
    public_id: string;
    folder: string;
  } | null>(null);
  const [shootNotes, setShootNotes] = useState('');
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
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
  const stagedPreviewRef = useRef<string | null>(null);
  const [lastAiFile, setLastAiFile] = useState<File | null>(null);
  const [lastAiDimensions, setLastAiDimensions] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiRunCounterRef = useRef(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [isKeyPanelOpen, setIsKeyPanelOpen] = useState(false);
  const [aiKeyStatus, setAiKeyStatus] = useState<{
    hasOverride: boolean;
    maskedOverrideKey: string;
    hasEnvKey: boolean;
    activeSource: 'override' | 'env' | 'none';
  } | null>(null);
  const [customApiKeyInput, setCustomApiKeyInput] = useState('');
  const [showCustomApiKey, setShowCustomApiKey] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/settings', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as {
          hasOverride: boolean;
          maskedOverrideKey: string;
          hasEnvKey: boolean;
          activeSource: 'override' | 'env' | 'none';
        };
      })
      .then((data) => {
        if (!cancelled && data) {
          setAiKeyStatus(data);
        }
      })
      .catch(() => {
        // Ignore transient status fetch failure on mount
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveApiKey = async () => {
    const trimmed = customApiKeyInput.trim();
    if (trimmed.length < 10) {
      toast.error('Please paste a valid Gemini API key before saving.');
      return;
    }

    setIsSavingApiKey(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ geminiApiKey: trimmed }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Could not save Gemini API key override.');
      }

      setAiKeyStatus(payload);
      setCustomApiKeyInput('');
      setShowCustomApiKey(false);
      setAiError(null);
      toast.success('Custom Gemini API key saved. It now overrides .env.local.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save Gemini API key.');
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleClearApiKey = async () => {
    setIsSavingApiKey(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Could not clear custom Gemini API key.');
      }

      setAiKeyStatus(payload);
      setCustomApiKeyInput('');
      setAiError(null);
      toast.success(
        payload.hasEnvKey
          ? 'Custom key removed. Reverted to GEMINI_API_KEY in .env.local.'
          : 'Custom key removed.'
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not clear custom Gemini API key.');
    } finally {
      setIsSavingApiKey(false);
    }
  };

  useEffect(() => {
    if (!selectedEventId && selectableEvents.length > 0) {
      setSelectedEventId(selectableEvents[0].id);
    }
  }, [selectableEvents, selectedEventId]);

  const replaceStagedPreview = (nextUrl: string | null) => {
    if (stagedPreviewRef.current) {
      URL.revokeObjectURL(stagedPreviewRef.current);
    }
    stagedPreviewRef.current = nextUrl;
    setStagedPreviewUrl(nextUrl);
  };

  useEffect(() => {
    return () => {
      if (stagedPreviewRef.current) {
        URL.revokeObjectURL(stagedPreviewRef.current);
      }
    };
  }, []);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEventId, setEditEventId] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAspect, setEditAspect] = useState<PortfolioAspect>('standard');
  const [editDesktopCrop, setEditDesktopCrop] = useState<ImageCropConfig>({ ...DEFAULT_IMAGE_CROP });
  const [editMobileCrop, setEditMobileCrop] = useState<ImageCropConfig>({ ...DEFAULT_IMAGE_CROP });

  const applyAiCaptionPatch = (patch: Partial<GeneratedCaptionResponse>) => {
    if (patch.title) setTitle(patch.title);
    if (patch.eventId || patch.eventName) {
      const matchedEvent =
        selectableEvents.find((ev) => ev.id === patch.eventId) ||
        events.find((ev) => ev.id === patch.eventId) ||
        selectableEvents.find(
          (ev) => ev.name.toLowerCase() === String(patch.eventName || '').toLowerCase()
        );
      if (matchedEvent) {
        setSelectedEventId(matchedEvent.id);
      }
    }
    if (patch.location) setLocation(patch.location);
    if (patch.gridSize) setAspect(mapGridSizeToAspect(patch.gridSize));
    if (typeof patch.shootNotes === 'string' && patch.shootNotes) {
      setShootNotes(patch.shootNotes);
    }
    if (typeof patch.featureInHero === 'boolean') {
      setIsHeroFeatured(patch.featureInHero);
    }
  };

  const runGeminiAutoFill = async (source: {
    file?: File;
    imageUrl?: string;
    dimensions?: string;
  }) => {
    const runId = ++aiRunCounterRef.current;
    setIsGeneratingCaption(true);
    setAiError(null);

    const eventsPayload = selectableEvents.map((ev) => ({
      id: ev.id,
      name: ev.name,
      category: ev.category,
    }));

    try {
      let response: Response;
      if (source.file) {
        const aiFormData = new FormData();
        aiFormData.append('file', source.file);
        if (source.dimensions) {
          aiFormData.append('dimensions', source.dimensions);
        }
        if (eventsPayload.length > 0) {
          aiFormData.append('events', JSON.stringify(eventsPayload));
        }
        response = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: { Accept: 'application/x-ndjson' },
          credentials: 'include',
          body: aiFormData,
        });
      } else if (source.imageUrl?.trim()) {
        response = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/x-ndjson',
          },
          credentials: 'include',
          body: JSON.stringify({
            imageUrl: source.imageUrl.trim(),
            ...(source.dimensions ? { dimensions: source.dimensions } : {}),
            ...(eventsPayload.length > 0 ? { events: eventsPayload } : {}),
          }),
        });
      } else {
        throw new Error('Choose a photo or provide an image URL first.');
      }

      if (runId !== aiRunCounterRef.current) return;

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const errPayload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errPayload.error || `AI analysis failed (${response.status}).`);
      }

      if (contentType.includes('application/x-ndjson') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completed = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (runId !== aiRunCounterRef.current) {
            await reader.cancel().catch(() => undefined);
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const eventMsg = JSON.parse(trimmed) as
              | { type: 'partial'; patch: Partial<GeneratedCaptionResponse> }
              | { type: 'final'; data: GeneratedCaptionResponse }
              | { type: 'error'; error: string };

            if (eventMsg.type === 'partial') {
              applyAiCaptionPatch(eventMsg.patch);
            } else if (eventMsg.type === 'final') {
              applyAiCaptionPatch(eventMsg.data);
              completed = true;
            } else if (eventMsg.type === 'error') {
              throw new Error(eventMsg.error || 'AI analysis failed.');
            }
          }
        }

        if (buffer.trim() && runId === aiRunCounterRef.current) {
          const eventMsg = JSON.parse(buffer.trim()) as
            | { type: 'final'; data: GeneratedCaptionResponse }
            | { type: 'error'; error: string };
          if (eventMsg.type === 'final') {
            applyAiCaptionPatch(eventMsg.data);
            completed = true;
          } else if (eventMsg.type === 'error') {
            throw new Error(eventMsg.error || 'AI analysis failed.');
          }
        }

        if (completed) {
          toast.success('AI auto-filled title, event, venue, grid size & notes.');
        }
        return;
      }

      const payload = (await response.json()) as Partial<GeneratedCaptionResponse> & {
        error?: string;
      };
      if (runId !== aiRunCounterRef.current) return;
      applyAiCaptionPatch(payload);
      toast.success('AI auto-filled title, event, venue, grid size & notes.');
    } catch (error) {
      if (runId !== aiRunCounterRef.current) return;
      const msg =
        error instanceof Error
          ? error.message
          : 'Could not auto-fill with AI. You can enter fields manually.';
      setAiError(msg);
      toast.warning(msg);
    } finally {
      if (runId === aiRunCounterRef.current) {
        setIsGeneratingCaption(false);
      }
    }
  };

  const clearStagedFile = () => {
    aiRunCounterRef.current += 1;
    setIsGeneratingCaption(false);
    setStagedFile(null);
    replaceStagedPreview(null);
    setLastAiFile(null);
    setLastAiDimensions('');
    setCompressionStats(null);
    setAiError(null);
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

    // Show instant preview in crop tool while preparing fast AI frame + 4 MB master file in parallel
    replaceStagedPreview(URL.createObjectURL(rawFile));
    setImageUrl('');
    setUploadedImage(null);
    input.value = '';

    // 1) Fire lightweight ~50 KB AI vision analysis right away (~50ms prep)
    const fastAiPromise = prepareFastAiAsset(rawFile)
      .then(({ file: fastAiFile, dimensions }) => {
        setLastAiFile(fastAiFile);
        setLastAiDimensions(dimensions);
        void runGeminiAutoFill({ file: fastAiFile, dimensions });
      })
      .catch(() => {
        setLastAiFile(rawFile);
        void runGeminiAutoFill({ file: rawFile });
      });

    // 2) Concurrently compress the high-res master file cleanly near 4 MB for Save -> Cloudinary
    try {
      const result = await compressToMaxSize(rawFile, 4);

      if (result.finalSize > 4 * 1024 * 1024) {
        toast.error('Image remained larger than 4 MB after compression. Try a smaller export.');
        clearStagedFile();
        return;
      }

      replaceStagedPreview(URL.createObjectURL(result.file));
      setStagedFile(result.file);
      setCompressionStats({
        fileName: result.file.name,
        originalSize: result.originalSize,
        finalSize: result.finalSize,
        wasCompressed: result.wasCompressed,
      });
      await fastAiPromise;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to optimize image before staging.'
      );
      clearStagedFile();
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleRegenerateWithAi = async () => {
    if (isGeneratingCaption || isCompressingImage) return;
    if (lastAiFile) {
      void runGeminiAutoFill({ file: lastAiFile, dimensions: lastAiDimensions });
      return;
    }
    if (stagedFile) {
      try {
        const { file: optimizedForAi, dimensions } = await prepareFastAiAsset(stagedFile);
        setLastAiFile(optimizedForAi);
        setLastAiDimensions(dimensions || lastAiDimensions);
        void runGeminiAutoFill({
          file: optimizedForAi,
          dimensions: dimensions || lastAiDimensions,
        });
      } catch {
        void runGeminiAutoFill({ file: stagedFile, dimensions: lastAiDimensions });
      }
      return;
    }
    if (imageUrl.trim()) {
      void runGeminiAutoFill({ imageUrl: imageUrl.trim(), dimensions: lastAiDimensions });
      return;
    }
    toast.error('Select a photo or paste a Cloudinary image URL first.');
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploadingImage || isCompressingImage) return;
    if (!title.trim() || !location.trim() || (!stagedFile && !imageUrl.trim())) {
      toast.error('Please enter a title, venue/location, and choose a photo or paste an image URL.');
      return;
    }

    const activeEvent = eventById.get(selectedEventId) || selectableEvents[0];
    const resolvedCategory: EventCategory = activeEvent
      ? normalizeEventCategory(activeEvent.category)
      : 'Weddings';
    const resolvedEventId = activeEvent?.id || selectedEventId || undefined;

    setIsSubmitting(true);
    try {
      let finalImageUrl = imageUrl.trim();
      let finalUploadedMeta = uploadedImage;

      if (stagedFile && !finalImageUrl) {
        setIsUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append('file', stagedFile);
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

          finalImageUrl = result.imageUrl;
          finalUploadedMeta = {
            secure_url: result.secure_url || result.imageUrl,
            public_id: result.public_id,
            folder: result.folder || 'gkstudios',
          };
          setImageUrl(finalImageUrl);
          setUploadedImage(finalUploadedMeta);
          setStagedFile(null);
        } finally {
          setIsUploadingImage(false);
        }
      }

      await addPortfolioItem({
        ...(resolvedEventId ? { eventId: resolvedEventId } : {}),
        title: title.trim(),
        category: resolvedCategory,
        location: location.trim(),
        imageUrl: finalImageUrl,
        ...(finalUploadedMeta || {}),
        shootNotes:
          shootNotes.trim() ||
          'Captured by GK Studios documentary team with natural color grading.',
        exif: '',
        dateLabel: '',
        isHeroFeatured,
        isVisible: true,
        aspect,
        desktopCrop,
        mobileCrop,
      });

      toast.success(
        `Added "${title.trim()}" to ${activeEvent?.name || resolvedCategory}.`
      );
      setTitle('');
      setLocation('');
      setImageUrl('');
      setUploadedImage(null);
      setShootNotes('');
      setAspect('standard');
      setIsHeroFeatured(false);
      setDesktopCrop({ ...DEFAULT_IMAGE_CROP });
      setMobileCrop({ ...DEFAULT_IMAGE_CROP });
      clearStagedFile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish photograph.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    const matchedEvent =
      (item.eventId && eventById.get(item.eventId)) ||
      selectableEvents.find(
        (ev) => normalizeEventCategory(ev.category) === normalizeEventCategory(item.category)
      ) ||
      selectableEvents[0];
    setEditEventId(item.eventId || matchedEvent?.id || '');
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
    const matchedEditEvent = eventById.get(editEventId) || selectableEvents[0];
    const resolvedCategory: EventCategory = matchedEditEvent
      ? normalizeEventCategory(matchedEditEvent.category)
      : normalizeEventCategory(editingItem.category);
    const resolvedEventId = matchedEditEvent?.id || editEventId || editingItem.eventId;

    setBusyImageId(editingItem.id);
    try {
      await updatePortfolioItem(editingItem.id, {
        ...(resolvedEventId ? { eventId: resolvedEventId } : {}),
        title: editTitle.trim(),
        category: resolvedCategory,
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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-[#D8C78E]" />
              Publish New Portfolio Photograph
            </CardTitle>
            <CardDescription>
              Paste a Cloudinary image URL or upload directly to the configured Cloudinary folder.
              Saved photos appear in the public gallery and optionally in the Hero carousel.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {aiKeyStatus && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  aiKeyStatus.activeSource === 'override'
                    ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                    : aiKeyStatus.activeSource === 'env'
                      ? 'border-[#C5B378]/35 bg-[#C5B378]/15 text-[#F4E8C1]'
                      : 'border-amber-400/35 bg-amber-500/15 text-amber-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    aiKeyStatus.activeSource === 'override'
                      ? 'bg-emerald-300'
                      : aiKeyStatus.activeSource === 'env'
                        ? 'bg-[#D8C78E]'
                        : 'bg-amber-300'
                  }`}
                />
                {aiKeyStatus.activeSource === 'override'
                  ? `Custom Key (${aiKeyStatus.maskedOverrideKey})`
                  : aiKeyStatus.activeSource === 'env'
                    ? 'Using .env.local Key'
                    : 'No AI Key'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsKeyPanelOpen((prev) => !prev)}
              aria-expanded={isKeyPanelOpen}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#C5B378]/35 bg-[#092E2B] px-3 py-1.5 text-xs font-medium text-[#D8C78E] transition-colors hover:border-[#D8C78E] hover:text-white cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{isKeyPanelOpen ? 'Hide API Key' : 'Gemini API Key'}</span>
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {isKeyPanelOpen && (
            <div
              role="region"
              aria-label="Custom Gemini API Key Override"
              className="mb-5 rounded-lg border border-[#C5B378]/30 bg-[#072421]/85 p-4 space-y-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSaveApiKey();
                }
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <KeyRound className="h-3.5 w-3.5 text-[#D8C78E]" />
                    Custom Gemini API Key Override
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[#E6ECEB]/75">
                    Saves a studio override key in database settings to override{' '}
                    <code className="font-mono text-[#D8C78E]">GEMINI_API_KEY</code> in{' '}
                    <code className="font-mono text-[#D8C78E]">.env.local</code>.
                  </p>
                </div>

                {aiKeyStatus?.hasOverride && (
                  <button
                    type="button"
                    onClick={() => void handleClearApiKey()}
                    disabled={isSavingApiKey}
                    className="inline-flex items-center gap-1 rounded border border-rose-400/35 bg-rose-950/35 px-2.5 py-1 text-[11px] font-medium text-rose-200 transition-colors hover:border-rose-300 hover:text-white disabled:opacity-50 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    <span>{aiKeyStatus.hasEnvKey ? 'Use .env.local Default' : 'Remove Key'}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    type={showCustomApiKey ? 'text' : 'password'}
                    autoComplete="off"
                    value={customApiKeyInput}
                    onChange={(e) => setCustomApiKeyInput(e.target.value)}
                    disabled={isSavingApiKey}
                    placeholder={
                      aiKeyStatus?.hasOverride
                        ? `Current override: ${aiKeyStatus.maskedOverrideKey} — enter new key to replace`
                        : 'Paste your Google AI Studio Gemini API key (AIza...)'
                    }
                    className="h-9 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] pl-3 pr-9 font-mono text-xs text-white placeholder:font-sans placeholder:text-[#E6ECEB]/45 focus:border-[#D8C78E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomApiKey((prev) => !prev)}
                    aria-label={showCustomApiKey ? 'Hide API key characters' : 'Show API key characters'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#D8C78E]/80 hover:text-white cursor-pointer"
                  >
                    {showCustomApiKey ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSaveApiKey()}
                  disabled={isSavingApiKey || customApiKeyInput.trim().length < 10}
                  className="h-9 shrink-0 px-4 text-xs"
                >
                  {isSavingApiKey ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>{isSavingApiKey ? 'Saving…' : 'Save Override Key'}</span>
                </Button>
              </div>
            </div>
          )}

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
                      (!lastAiFile && !stagedFile && !imageUrl.trim())
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
                <label className="block text-xs font-medium text-[#D8C78E]">Event *</label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={isEventsLoading && selectableEvents.length === 0}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {selectableEvents.length === 0 ? (
                    <option value="">
                      {isEventsLoading ? 'Loading database events…' : 'No active events found'}
                    </option>
                  ) : (
                    selectableEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Venue / Place Name *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="AI auto-suggests venue/place or enter manually..."
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
              <div className="md:col-span-7 space-y-1.5">
                <label className="block text-xs font-medium text-[#D8C78E]">
                  Cloudinary Image URL {stagedFile ? '(Uploads on Save)' : '*'}
                </label>
                <input
                  type="text"
                  required={!stagedFile}
                  value={imageUrl}
                  disabled={isUploadingImage || isCompressingImage || isSubmitting}
                  onChange={(e) => {
                    const nextUrl = e.target.value;
                    setImageUrl(nextUrl);
                    setUploadedImage(null);
                    if (nextUrl.trim()) {
                      setStagedFile(null);
                      replaceStagedPreview(null);
                    }
                    setLastAiFile(null);
                    if (!nextUrl.trim()) {
                      setCompressionStats(null);
                    }
                  }}
                  placeholder={
                    stagedFile
                      ? `Staged "${stagedFile.name}" — uploads to Cloudinary on Save`
                      : 'https://res.cloudinary.com/...'
                  }
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#092E2B] px-3 font-mono text-xs text-white placeholder:font-sans placeholder:text-[#E6ECEB]/55 focus:border-[#D8C78E] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label
                  className={`flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#C5B378]/40 bg-[#092E2B] px-3 text-xs font-medium text-white transition-colors ${
                    isUploadingImage || isCompressingImage || isSubmitting
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
                        : stagedFile
                          ? 'Replace Photo File'
                          : 'Choose Photo File'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingImage || isCompressingImage || isSubmitting}
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

                      <div className="flex flex-wrap items-center gap-2">
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

                        {stagedFile && (
                          <span className="inline-flex items-center rounded-full border border-[#D8C78E]/30 bg-[#092E2B] px-2.5 py-0.5 text-[11px] text-[#D8C78E]">
                            Staged · Uploads on Save
                          </span>
                        )}

                        {stagedFile && !isSubmitting && !isUploadingImage && (
                          <button
                            type="button"
                            onClick={clearStagedFile}
                            title="Clear staged image"
                            className="inline-flex items-center gap-1 rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 py-0.5 text-[11px] text-[#E6ECEB]/75 hover:border-rose-400/50 hover:text-rose-200 transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
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
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsKeyPanelOpen(true)}
                        className="inline-flex items-center gap-1 rounded border border-[#C5B378]/40 bg-[#092E2B] px-2 py-0.5 text-[11px] font-medium text-[#D8C78E] hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
                      >
                        <KeyRound className="h-3 w-3" />
                        <span>Configure API Key</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiError(null)}
                        className="text-[11px] underline underline-offset-2 hover:text-white cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-medium text-[#D8C78E]">Shoot Notes</label>
                <button
                  type="button"
                  onClick={handleRegenerateWithAi}
                  disabled={
                    isGeneratingCaption ||
                    isCompressingImage ||
                    (!lastAiFile && !stagedFile && !imageUrl.trim())
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

            <DualCropSelector
              imageUrl={imageUrl.trim() || stagedPreviewUrl || ''}
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
                  {(item.eventId && eventById.get(item.eventId)?.name) || item.category} ·{' '}
                  {item.location}
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
                <label className="block text-xs font-medium text-[#D8C78E]">Event</label>
                <select
                  value={editEventId}
                  onChange={(e) => setEditEventId(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#C5B378]/30 bg-[#072421] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
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
