'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudio } from '@/src/context/StudioContext';
import { CUSTOM_PACKAGE_ID, PackageDeliverables, PortfolioItem, StudioPackage } from '@/src/types/studio';
import { buildWhatsAppUrl, formatDateDisplay, formatINR } from '@/src/lib/utils';
import { englishOnlyName } from '@/src/lib/englishOnlyName';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

export interface WhatsAppRecipientDetails {
  clientName: string;
  phone: string;
  eventType?: string;
  preferredDate?: string;
  venue?: string;
  referenceCode?: string;
  packageId?: string;
  packageName?: string;
  quotedAmount?: number;
  requestedServices?: string[];
  notes?: string;
  acknowledgementNote?: string;
  eventTime?: string;
}

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: WhatsAppRecipientDetails | null;
  currentQuote?: number;
  currentNote?: string;
  currentPackageId?: string;
}

type TemplateType = 'package_details' | 'terms_conditions' | 'existing_inquiry' | 'custom_message';

const TERMS_CONDITIONS_IMAGE_URL = '/images/gk-studios-terms-conditions.svg';

export function WhatsAppTemplateModal({
  isOpen,
  onClose,
  booking,
  currentQuote,
  currentNote,
  currentPackageId,
}: WhatsAppTemplateModalProps) {
  const { packages: studioPackages, portfolio } = useStudio();

  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('package_details');
  const [selectedPackageChoice, setSelectedPackageChoice] = useState<string>('all');
  const [templatePackages, setTemplatePackages] = useState<StudioPackage[]>([]);
  const [isPackageDataReady, setIsPackageDataReady] = useState(false);
  const [packageLoadError, setPackageLoadError] = useState('');
  const [packageRefreshAttempt, setPackageRefreshAttempt] = useState(0);
  const [customText, setCustomText] = useState<string>('');
  const [includeCustomImage, setIncludeCustomImage] = useState<boolean>(false);
  const [customSelectedImage, setCustomSelectedImage] = useState<string>('');
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState<boolean>(false);
  const [isPreviewImageModalOpen, setIsPreviewImageModalOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    setIsPackageDataReady(false);
    setPackageLoadError('');

    const loadLatestPackages = async () => {
      try {
        const response = await fetch('/api/packages', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = (await response.json()) as StudioPackage[] | { error?: string };
        if (!response.ok) {
          throw new Error(
            !Array.isArray(data) && data.error
              ? data.error
              : `Failed to fetch packages (${response.status})`
          );
        }
        if (!Array.isArray(data)) {
          throw new Error('The package response was invalid.');
        }

        setTemplatePackages(data);
        setIsPackageDataReady(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : 'Failed to load the latest packages.';
        setPackageLoadError(message);
        toast.error(`Could not load the latest package details: ${message}`);
      }
    };

    void loadLatestPackages();
    return () => controller.abort();
  }, [isOpen, packageRefreshAttempt]);

  const packages = isPackageDataReady ? templatePackages : studioPackages;
  const requiresFreshPackageData =
    activeTemplate === 'package_details' || activeTemplate === 'existing_inquiry';
  const packageDataUnavailable = requiresFreshPackageData && !isPackageDataReady;

  // Resolved booking package
  const activePackageId = currentPackageId || booking?.packageId;
  const matchedPackage: StudioPackage | undefined = useMemo(() => {
    if (!activePackageId) return undefined;
    return packages.find((p) => p.id === activePackageId);
  }, [packages, activePackageId]);

  // Chosen package when individual package is selected in Template 1
  const chosenPackage: StudioPackage | undefined = useMemo(() => {
    if (selectedPackageChoice === 'all') return undefined;
    return packages.find((p) => p.id === selectedPackageChoice);
  }, [packages, selectedPackageChoice]);

  // Find best default portfolio image matching the booking's event type or package
  const bestDefaultImage = useMemo(() => {
    if (matchedPackage?.imageUrl || matchedPackage?.image) {
      return (matchedPackage.imageUrl || matchedPackage.image)!;
    }
    if (!booking) return portfolio[0]?.imageUrl || '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg';
    
    // Match by eventType keywords
    const lowerType = (booking.eventType || '').toLowerCase();
    const matchedItem = portfolio.find((item) => {
      const lowerCat = item.category.toLowerCase();
      const lowerTitle = item.title.toLowerCase();
      if (lowerType.includes('wedding') && (lowerCat.includes('wedding') || lowerTitle.includes('wedding'))) return true;
      if (lowerType.includes('kaathu') && (lowerCat.includes('kaathu') || lowerTitle.includes('kaathu'))) return true;
      if (lowerType.includes('birthday') && (lowerCat.includes('birthday') || lowerTitle.includes('birthday'))) return true;
      if (lowerType.includes('outdoor') && (lowerCat.includes('outdoor') || lowerTitle.includes('outdoor'))) return true;
      return lowerCat.includes(lowerType) || lowerType.includes(lowerCat);
    });

    return matchedItem?.imageUrl || portfolio[0]?.imageUrl || '/images/portfolio/iyer_wedding_muhurtham_1794972484653.jpg';
  }, [booking, portfolio]);

  // Initialize defaults on opening
  useEffect(() => {
    if (isOpen && booking) {
      const defaultChoice =
        (currentPackageId || booking.packageId) &&
        packages.some((p) => p.id === (currentPackageId || booking.packageId))
          ? (currentPackageId || booking.packageId)!
          : 'all';
      setSelectedPackageChoice(defaultChoice);
      setCustomSelectedImage(bestDefaultImage);
      setCustomText(`Hi ${booking.clientName}! 👋\n\nThank you for reaching out to GK Studios.`);
      setIncludeCustomImage(false);
    }
  }, [isOpen, booking, currentPackageId, packages, bestDefaultImage]);

  const resolvedClientName = booking?.clientName || 'Valued Client';
  const resolvedPhone = booking?.phone || '';
  const resolvedQuotedAmount = currentQuote ?? booking?.quotedAmount ?? matchedPackage?.price ?? 0;
  const resolvedNote = currentNote ?? booking?.acknowledgementNote ?? booking?.notes ?? '';

  const formatDeliverablesForWhatsApp = (
    deliverables: PackageDeliverables | string[] | undefined | null,
    indent = '  • '
  ) => {
    if (!deliverables) return '';
    if (Array.isArray(deliverables)) {
      return deliverables.map((d) => `${indent}${d}`).join('\n');
    }
    if (typeof deliverables === 'object') {
      return Object.entries(deliverables)
        .filter(([_, val]) => Boolean(val && typeof val === 'string' && val.trim()))
        .map(([cat, val]) => `${indent}${cat}: ${val}`)
        .join('\n');
    }
    return '';
  };

  // 1. Template 1 Text: Package Details (Single Chosen Package OR All Packages)
  const template1Text = useMemo(() => {
    if (selectedPackageChoice === 'all') {
      const allPackagesFormatted = packages
        .map((pkg, idx) => {
          const deliverables = formatDeliverablesForWhatsApp(pkg.deliverables, '  • ');
          const popularTag = pkg.highlighted ? ' ⭐ (Most Popular)' : '';
          return [
            `----------------------------------------`,
            `📸 ${idx + 1}. ${pkg.name.toUpperCase()}${popularTag}`,
            `💰 Investment: ${formatINR(pkg.price)}`,
            pkg.duration ? `⏱️ Duration: ${pkg.duration}` : '',
            pkg.audience ? `🎯 Ideal For: ${pkg.audience}` : '',
            deliverables ? `Deliverables:\n${deliverables}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        })
        .join('\n\n');

      return [
        `Hi ${resolvedClientName}! 👋`,
        ``,
        `GK Studios packages:`,
        allPackagesFormatted,
        ``,
        `Which package would you like to know more about?`,
        `GK Studios · 7418543123`,
      ].join('\n');
    }

    // Single selected package
    const pkg = chosenPackage || (selectedPackageChoice === 'all' ? undefined : matchedPackage);
    const pkgName = pkg?.name || booking?.packageName || 'Photography Collection';
    const pkgPrice = pkg?.price ? formatINR(pkg.price) : 'Custom Quote';

    const deliverablesList = formatDeliverablesForWhatsApp(pkg?.deliverables, '• ');

    return [
      `Hi ${resolvedClientName}! 👋`,
      ``,
      `Package details:`,
      `📸 ${pkgName}`,
      `💰 ${pkgPrice}`,
      pkg?.duration ? `⏱️ Duration: ${pkg.duration}` : '',
      pkg?.audience ? `🎯 Ideal For: ${pkg.audience}` : '',
      deliverablesList ? `\nDeliverables:\n${deliverablesList}` : '',
      ``,
      `Questions? Reply here.`,
      `GK Studios · 7418543123`,
    ]
      .filter((line) => line !== undefined)
      .join('\n');
  }, [
    selectedPackageChoice,
    packages,
    resolvedClientName,
    chosenPackage,
    matchedPackage,
    booking?.packageName,
    booking?.packageId,
    currentPackageId,
    resolvedQuotedAmount,
  ]);

  // 2. Template 2 Text: Terms & Conditions with Image
  const template2Text = useMemo(() => {
    return [
      `Hi ${resolvedClientName}! 👋`,
      ``,
      `Please review our Terms & Conditions before confirming.`,
      `Questions? Contact GK Studios.`,
    ].join('\n');
  }, [resolvedClientName]);

  // 3. Template 3 Text: Existing Enquiry / Booking Message
  const template3Text = useMemo(() => {
    const pkgName = matchedPackage?.name || booking?.packageName || 'Custom Package';
    const quoteText =
      booking?.packageId === CUSTOM_PACKAGE_ID || resolvedQuotedAmount === 0
        ? 'Custom quote under discussion'
        : formatINR(resolvedQuotedAmount);

    return [
      `Vanakkam ${resolvedClientName}!`,
      `${englishOnlyName(booking?.eventType) || 'Event'} (Ref: ${booking?.referenceCode || 'Inquiry'}) · ${
        booking?.preferredDate ? formatDateDisplay(booking.preferredDate) : 'upcoming date'
      } · ${booking?.venue || 'Venue'}`,
      booking?.eventTime ? `Time: ${booking.eventTime}` : '',
      booking?.requestedServices?.length ? `Services: ${booking.requestedServices.join(', ')}` : '',
      `Package: ${pkgName} | Quote: ${quoteText}`,
      resolvedNote ? `Note: ${resolvedNote}` : '',
      `Reply to confirm or ask a question · 7418543123`,
    ]
      .filter(Boolean)
      .join('\n');
  }, [resolvedClientName, matchedPackage, booking, resolvedQuotedAmount, resolvedNote]);

  // 4. Template 4 Text: Custom Message
  const template4Text = customText;

  // Active message & image according to selection
  const currentMessageText =
    activeTemplate === 'package_details'
      ? template1Text
      : activeTemplate === 'terms_conditions'
      ? template2Text
      : activeTemplate === 'existing_inquiry'
      ? template3Text
      : template4Text;

  const currentAssociatedImage =
    activeTemplate === 'terms_conditions'
      ? TERMS_CONDITIONS_IMAGE_URL
      : activeTemplate === 'custom_message' && includeCustomImage
      ? customSelectedImage
      : null;

  // Image actions: download image helper
  const handleDownloadImage = async (url: string, filename = 'GK-Studios-Image') => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Image download started: ${filename}`);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Image actions: copy image to clipboard
  const handleCopyImageToClipboard = async (url: string) => {
    setIsActionInProgress(true);
    try {
      // If SVG or external, rasterize to PNG canvas first for ClipboardItem compatibility
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for copying'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1080;
      canvas.height = img.naturalHeight || 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );

      if (!blob) throw new Error('Blob generation failed');

      if (navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        toast.success('📸 Image copied to clipboard! You can paste (Ctrl+V) directly into WhatsApp.');
      } else {
        throw new Error('ClipboardItem write not supported in this browser');
      }
    } catch (err) {
      console.warn('Direct clipboard copy failed, falling back to download:', err);
      handleDownloadImage(url, 'GK-Studios-Attachment');
      toast.info('Image downloaded to your device so you can attach it to WhatsApp.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Copy text action
  const handleCopyText = async () => {
    if (packageDataUnavailable) return;

    try {
      await navigator.clipboard.writeText(currentMessageText);
      toast.success('Message text copied to clipboard.');
    } catch {
      toast.info('Select and copy the message text manually.');
    }
  };

  // Native Web Share with file helper (e.g. Mobile WhatsApp sharing)
  const handleWebShareWithImage = async () => {
    if (packageDataUnavailable) return;

    if (!currentAssociatedImage) {
      handleOpenWhatsApp();
      return;
    }

    try {
      setIsActionInProgress(true);
      const res = await fetch(currentAssociatedImage);
      const blob = await res.blob();
      const file = new File([blob], 'GK-Studios-Share.png', { type: blob.type || 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'GK Studios',
          text: currentMessageText,
          files: [file],
        });
        toast.success('Shared successfully via WhatsApp!');
        return;
      }
    } catch (err) {
      console.warn('Native share failed or dismissed, proceeding with web WhatsApp:', err);
    } finally {
      setIsActionInProgress(false);
    }

    // Fallback to standard WhatsApp url with automated clipboard prep
    handleOpenWhatsApp();
  };

  // Primary "Send via WhatsApp" button
  const handleOpenWhatsApp = async () => {
    if (packageDataUnavailable) return;

    if (!resolvedPhone) {
      toast.error('Customer phone number is missing from this enquiry.');
      return;
    }

    // If there is an image, copy it to clipboard or trigger download so admin can paste right away
    if (currentAssociatedImage) {
      try {
        handleCopyImageToClipboard(currentAssociatedImage);
      } catch {
        handleDownloadImage(currentAssociatedImage);
      }
      toast.info(
        'WhatsApp opening! Press Ctrl+V (or tap attach) to attach the copied image.',
        { duration: 5000 }
      );
    } else {
      toast.success('Opening WhatsApp with your message...');
    }

    const whatsappUrl = buildWhatsAppUrl(resolvedPhone, currentMessageText);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenGalleryPicker = () => {
    setIsGalleryPickerOpen(true);
  };

  const handleSelectGalleryImage = (imgUrl: string) => {
    setCustomSelectedImage(imgUrl);
    setIsGalleryPickerOpen(false);
    toast.success('Image updated for custom message.');
  };

  if (!isOpen || !booking) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-5xl overflow-hidden p-0 border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="border-b border-[#C5B378]/20 bg-[#092E2B]/90 px-4 pt-3 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
            <DialogHeader className="pr-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366]">
                  <MessageCircle className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-semibold tracking-[0.16em] text-[#D8C78E] uppercase">
                  WhatsApp
                </span>
              </div>
              <DialogTitle className="font-serif text-lg sm:text-2xl font-semibold text-white">
                Message {resolvedClientName}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#E6ECEB]/75">
                Choose, review, send.
              </DialogDescription>
            </DialogHeader>

            {/* Quick Recipient Info Pill */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-[#C5B378]/20 bg-[#061E1C]/80 px-3 py-2 text-xs text-[#E6ECEB]/85">
              <div>
                <span className="font-semibold text-white">{resolvedPhone}</span>
              </div>
              <div>
                <span>{englishOnlyName(booking.eventType) || 'Event'}</span>
                {booking.preferredDate && (
                  <span className="ml-1 text-[#E6ECEB]/70">· {formatDateDisplay(booking.preferredDate)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-5 space-y-3">
              <label htmlFor="whatsapp-template" className="block text-xs font-medium text-[#D8C78E]">
                Message type
              </label>
              <select
                id="whatsapp-template"
                value={activeTemplate}
                onChange={(event) => setActiveTemplate(event.target.value as TemplateType)}
                className="h-11 w-full rounded-lg border border-[#C5B378]/30 bg-[#061E1C] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none"
              >
                <option value="package_details">Package details</option>
                <option value="terms_conditions">Terms &amp; conditions</option>
                <option value="existing_inquiry">Enquiry details</option>
                <option value="custom_message">Custom message</option>
              </select>

              {activeTemplate === 'package_details' && (
                <div className="space-y-2">
                  <label htmlFor="whatsapp-package" className="block text-xs font-medium text-[#D8C78E]">
                    Package
                  </label>
                  <select
                    id="whatsapp-package"
                    value={selectedPackageChoice}
                    onChange={(event) => setSelectedPackageChoice(event.target.value)}
                    disabled={!isPackageDataReady}
                    className="h-11 w-full rounded-lg border border-[#C5B378]/30 bg-[#061E1C] px-3 text-sm text-white focus:border-[#D8C78E] focus:outline-none disabled:opacity-60"
                  >
                    <option value="all">All packages</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} · {formatINR(pkg.price)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wider text-[#D8C78E] uppercase">
                  Preview
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyText}
                    disabled={packageDataUnavailable}
                    className="h-7 text-xs text-[#E6ECEB] hover:text-white hover:bg-[#092E2B]"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              {requiresFreshPackageData && !isPackageDataReady && (
                <div
                  role={packageLoadError ? 'alert' : 'status'}
                  className="rounded-lg border border-[#C5B378]/30 bg-[#092E2B]/80 px-3 py-2 text-xs text-[#E6ECEB]/85"
                >
                  {packageLoadError ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>Package data unavailable: {packageLoadError}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPackageRefreshAttempt((attempt) => attempt + 1)}
                        className="h-7 border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#072421]"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    'Loading packages…'
                  )}
                </div>
              )}

              {/* Message Preview Box */}
              <div className="rounded-xl border border-[#C5B378]/25 bg-[#061E1C] p-3 sm:p-4 text-xs font-sans space-y-3">
                {activeTemplate === 'custom_message' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-[#D8C78E]">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Write a message..."
                      className="w-full rounded-md border border-[#C5B378]/30 bg-[#072421] p-3 text-sm text-white placeholder:text-[#E6ECEB]/40 focus:border-[#D8C78E] focus:outline-none"
                    />
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#E6ECEB]/90 pt-1">
                      <input
                        type="checkbox"
                        checked={includeCustomImage}
                        onChange={(e) => setIncludeCustomImage(e.target.checked)}
                        className="h-4 w-4 rounded border-[#C5B378]/40 bg-[#092E2B] text-[#C5B378] accent-[#C5B378]"
                      />
                      <span>Attach a photo</span>
                    </label>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#E6ECEB]/90 max-h-[38dvh] sm:max-h-80 overflow-y-auto">
                    {currentMessageText}
                  </pre>
                )}
              </div>

              {/* Image Preview Card (if applicable) */}
              {currentAssociatedImage && (
                <div className="rounded-xl border border-[#C5B378]/30 bg-[#092E2B]/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-[#D8C78E]" />
                      <span className="text-xs font-semibold text-white">
                        {activeTemplate === 'terms_conditions' ? 'Terms card' : 'Photo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTemplate !== 'terms_conditions' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleOpenGalleryPicker}
                          className="h-7 text-xs border-[#C5B378]/30 text-[#D8C78E] hover:bg-[#072421]"
                        >
                          Change
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setPreviewImageUrl(currentAssociatedImage);
                          setIsPreviewImageModalOpen(true);
                        }}
                        className="h-7 text-xs bg-[#072421] text-[#E6ECEB] hover:text-white"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div
                      className="relative h-28 w-44 shrink-0 rounded-lg overflow-hidden border border-[#C5B378]/30 bg-[#041513] cursor-pointer group"
                      onClick={() => {
                        setPreviewImageUrl(currentAssociatedImage);
                        setIsPreviewImageModalOpen(true);
                      }}
                    >
                      <img
                        src={currentAssociatedImage}
                        alt="WhatsApp Attachment Preview"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1">
                        <Eye className="h-3.5 w-3.5" /> View
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 text-xs text-[#E6ECEB]/80">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyImageToClipboard(currentAssociatedImage)}
                          disabled={isActionInProgress}
                          className="h-7 text-[11px] border-[#C5B378]/25 text-[#E6ECEB] hover:text-[#D8C78E]"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy image
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownloadImage(
                              currentAssociatedImage,
                              activeTemplate === 'terms_conditions'
                                ? 'GK-Studios-Terms-Conditions'
                                : 'GK-Studios-Portfolio-Image'
                            )
                          }
                          className="h-7 text-[11px] border-[#C5B378]/25 text-[#E6ECEB] hover:text-[#D8C78E]"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Toolbar */}
          <div className="border-t border-[#C5B378]/20 bg-[#092E2B]/95 px-3 py-3 sm:px-6 sm:py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-11 w-full sm:w-auto border-[#C5B378]/30 text-[#E6ECEB] hover:bg-[#072421]"
            >
              Close
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {/* Optional Native Share button if file attachment is supported */}
              {currentAssociatedImage && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleWebShareWithImage}
                  disabled={isActionInProgress || packageDataUnavailable}
                  className="w-full sm:w-auto bg-[#072421] text-[#E6ECEB] border border-[#C5B378]/30 hover:text-white"
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
              )}

              <Button
                type="button"
                onClick={handleOpenWhatsApp}
                disabled={isActionInProgress || packageDataUnavailable}
                className="min-h-11 w-full sm:w-auto bg-[#25D366] text-[#072421] font-semibold hover:bg-[#20ba59] shadow-md"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Image Picker Modal */}
      <Dialog open={isGalleryPickerOpen} onOpenChange={setIsGalleryPickerOpen}>
        <DialogContent className="max-h-[92dvh] w-[95vw] max-w-4xl overflow-hidden p-0 border-[#C5B378]/30 bg-[#072421] text-[#E6ECEB] flex flex-col">
          <div className="border-b border-[#C5B378]/20 bg-[#092E2B] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Choose photo
              </DialogTitle>
              <DialogDescription className="text-xs text-[#E6ECEB]/70">
                Select a photo to share.
              </DialogDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {portfolio.map((item) => {
              const isSelected = customSelectedImage === item.imageUrl;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectGalleryImage(item.imageUrl)}
                  className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D8C78E] ring-2 ring-[#D8C78E]'
                      : 'border-white/10 hover:border-[#C5B378]/50'
                  }`}
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
                  {isSelected && (
                    <div className="absolute top-2 right-2 rounded-full bg-[#D8C78E] text-[#072421] p-1 shadow">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#C5B378]/20 bg-[#092E2B] px-6 py-3 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsGalleryPickerOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Full-Size Lightbox Modal */}
      <Dialog open={isPreviewImageModalOpen} onOpenChange={setIsPreviewImageModalOpen}>
        <DialogContent className="max-h-[92dvh] w-[95vw] max-w-3xl overflow-hidden p-0 border-[#C5B378]/40 bg-[#041513] flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-white/10 bg-[#072421]">
            <DialogTitle className="text-sm font-semibold text-white">Attachment Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleDownloadImage(previewImageUrl, 'GK-Studios-Image')}
                className="h-8 text-xs border-[#C5B378]/30 text-[#D8C78E]"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
            <img
              src={previewImageUrl}
              alt="Attachment Full View"
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
