'use client';

import { useState } from 'react';
import { Copy, LoaderCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPackageCopy } from '@/src/i18n/translations';
import {
  getDynamicPackageDisplaySections,
  sanitizePackageDeliverables,
} from '@/src/lib/pricing';
import {
  buildWhatsAppUrl,
  formatINR,
  removeAlbumPhotoSelectionNote,
} from '@/src/lib/utils';
import { STUDIO_INFO } from '@/src/data/initialStudioData';
import { StudioPackage, StudioService } from '@/src/types/studio';

interface PackageGridShareActionsProps {
  packages: StudioPackage[];
  eventName: string;
  services: StudioService[];
}

interface PackageShareSection {
  title: string;
  items: string[];
}

interface PreparedPackageCard {
  pkg: StudioPackage;
  image: HTMLImageElement | null;
  duration: string;
  nameLines: string[];
  audienceLines: string[];
  sections: Array<{
    title: string;
    items: Array<{ text: string; lines: string[] }>;
  }>;
  bodyHeight: number;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function getPackageSections(
  pkg: StudioPackage,
  services: StudioService[]
): PackageShareSection[] {
  const copy = getPackageCopy(pkg);
  const dynamic = getDynamicPackageDisplaySections(
    pkg.includedServices,
    services,
    pkg.durationTier,
    copy.deliverables
  );
  const textDeliverables = Object.entries(sanitizePackageDeliverables(copy.deliverables))
    .map(([category, text]) => {
      const cleaned = removeAlbumPhotoSelectionNote(text);
      if (!cleaned) return '';
      return category.toLowerCase() === 'deliverables' ? cleaned : `${category}: ${cleaned}`;
    })
    .filter(Boolean);
  const allDeliverables = [dynamic.deliverables, ...textDeliverables].filter(Boolean).join(', ');

  return [
    ...(dynamic.coverage
      ? [{
          title: 'Event Coverage & Crew',
          items: dynamic.coverage.split(/\s*(?:\+|,|&)\s*/).filter(Boolean),
        }]
      : []),
    ...(dynamic.albums
      ? [{ title: 'Albums', items: [dynamic.albums] }]
      : []),
    ...(allDeliverables
      ? [{
          title: 'Deliverables',
          items: allDeliverables
            .replace(/\s*\+\s*/g, ', ')
            .split(/\s*,\s*/)
            .map((item) => removeAlbumPhotoSelectionNote(item))
            .filter(Boolean),
        }]
      : []),
  ];
}

function loadPackageImage(source: string): Promise<HTMLImageElement | null> {
  if (!source) return Promise.resolve(null);

  return new Promise((resolve) => {
    const image = new window.Image();
    let resolvedSource = source;
    try {
      const sourceUrl = new URL(source, window.location.href);
      resolvedSource =
        sourceUrl.origin !== window.location.origin &&
        (sourceUrl.protocol === 'https:' || sourceUrl.protocol === 'http:')
          ? `/_next/image?url=${encodeURIComponent(source)}&w=828&q=90`
          : source;
    } catch {
      resolve(null);
      return;
    }
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = resolvedSource;
  });
}

function createPackageGridImage(
  packages: StudioPackage[],
  eventName: string,
  services: StudioService[]
): Promise<{ blob: Blob; missingImages: number }> {
  return new Promise((resolve, reject) => {
    void (async () => {
      const canvas = document.createElement('canvas');
      const width = 2400;
      const padding = 72;
      const gap = 28;
      const columns = Math.min(4, packages.length);
      const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
      const imageHeight = Math.round(cardWidth * 0.56);
      canvas.width = width;
      canvas.height = 1200;

      let context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is not supported in this browser.');

      const preparedCards: PreparedPackageCard[] = await Promise.all(
        packages.map(async (pkg) => {
          const copy = getPackageCopy(pkg);
          const sections = getPackageSections(pkg, services);
          const image = await loadPackageImage(pkg.imageUrl || pkg.image || '');

          context!.font = '600 34px Georgia, serif';
          const nameLines = wrapText(context!, copy.name, cardWidth - 48);
          context!.font = '400 20px Arial, sans-serif';
          const audienceLines = copy.audience
            ? wrapText(context!, copy.audience, cardWidth - 48)
            : [];
          context!.font = '400 20px Arial, sans-serif';
          const preparedSections = sections.map((section) => ({
            title: section.title,
            items: section.items.map((text) => ({
              text,
              lines: wrapText(context!, text, cardWidth - 86),
            })),
          }));

          let bodyHeight = 28;
          if (pkg.highlighted || pkg.featured) bodyHeight += 40;
          bodyHeight += nameLines.length * 40 + 10;
          bodyHeight += audienceLines.length * 26 + 8;
          bodyHeight += 48 + 55;
          preparedSections.forEach((section) => {
            bodyHeight += 34;
            section.items.forEach((item) => {
              bodyHeight += Math.max(24, item.lines.length * 25) + 7;
            });
            bodyHeight += 8;
          });
          bodyHeight += 24;

          return {
            pkg,
            image,
            duration: copy.duration,
            nameLines,
            audienceLines,
            sections: preparedSections,
            bodyHeight,
          };
        })
      );

      const rowCount = Math.ceil(preparedCards.length / columns);
      const headerHeight = 170;
      const rowGap = 30;
      const cardHeight =
        imageHeight + Math.max(...preparedCards.map((card) => card.bodyHeight));
      const footerHeight = 110;
      canvas.height =
        padding +
        headerHeight +
        rowCount * cardHeight +
        Math.max(0, rowCount - 1) * rowGap +
        footerHeight;
      context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is not supported in this browser.');

      const background = context.createLinearGradient(0, 0, width, canvas.height);
      background.addColorStop(0, '#061E1C');
      background.addColorStop(1, '#0E423E');
      context.fillStyle = background;
      context.fillRect(0, 0, width, canvas.height);
      context.strokeStyle = '#C5B378';
      context.lineWidth = 3;
      context.strokeRect(28, 28, width - 56, canvas.height - 56);

      context.fillStyle = '#D8C78E';
      context.font = '700 24px Arial, sans-serif';
      context.fillText('GK STUDIOS', padding, 76);
      context.textAlign = 'right';
      context.font = '600 20px Arial, sans-serif';
      context.fillText(eventName.toUpperCase(), width - padding, 76);
      context.textAlign = 'left';
      context.fillStyle = '#FFFFFF';
      context.font = '600 46px Georgia, serif';
      context.fillText('Event Packages', padding, 132);

      let missingImages = 0;
      preparedCards.forEach((card, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const x = padding + column * (cardWidth + gap);
        const y = padding + headerHeight + row * (cardHeight + rowGap);
        const imageY = y;

        context.fillStyle = '#092E2B';
        context.fillRect(x, y, cardWidth, cardHeight);
        context.strokeStyle = 'rgba(197, 179, 120, 0.65)';
        context.lineWidth = 2;
        context.strokeRect(x, y, cardWidth, cardHeight);
        if (card.image) {
          const scale = Math.max(cardWidth / card.image.naturalWidth, imageHeight / card.image.naturalHeight);
          const sourceWidth = cardWidth / scale;
          const sourceHeight = imageHeight / scale;
          const sourceX = (card.image.naturalWidth - sourceWidth) / 2;
          const sourceY = (card.image.naturalHeight - sourceHeight) / 2;
          context.drawImage(
            card.image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            x,
            imageY,
            cardWidth,
            imageHeight
          );
        } else {
          missingImages += 1;
          context.fillStyle = '#0E423E';
          context.fillRect(x, imageY, cardWidth, imageHeight);
          context.fillStyle = '#D8C78E';
          context.font = '600 22px Arial, sans-serif';
          context.fillText('GK STUDIOS', x + 24, imageY + imageHeight / 2);
        }

        let textY = y + imageHeight + 34;
        const textX = x + 24;
        const innerWidth = cardWidth - 48;
        if (card.pkg.highlighted || card.pkg.featured) {
          context.fillStyle = '#D8C78E';
          context.font = '700 15px Arial, sans-serif';
          context.fillText('RECOMMENDED', textX, textY);
          textY += 34;
        }

        context.fillStyle = '#FFFFFF';
        context.font = '600 34px Georgia, serif';
        card.nameLines.forEach((line) => {
          context.fillText(line, textX, textY);
          textY += 40;
        });
        textY += 4;
        context.fillStyle = '#D8C78E';
        context.font = '400 20px Arial, sans-serif';
        card.audienceLines.forEach((line) => {
          context.fillText(line, textX, textY);
          textY += 26;
        });
        context.fillStyle = '#E6ECEB';
        context.font = '400 19px Arial, sans-serif';
        context.fillText(card.duration || 'Event coverage', textX, textY + 2);
        textY += 48;
        context.fillStyle = '#D8C78E';
        context.font = '700 34px Arial, sans-serif';
        context.fillText(formatINR(Number(card.pkg.price) || 0), textX, textY);
        textY += 55;

        card.sections.forEach((section) => {
          context.fillStyle = '#D8C78E';
          context.font = '700 15px Arial, sans-serif';
          context.fillText(section.title.toUpperCase(), textX, textY);
          textY += 25;

          section.items.forEach((item) => {
            const isComplementary = /\bcomplimentary\b|\bcomplementary\b/i.test(item.text);
            context.fillStyle = isComplementary ? '#A7F3D0' : '#E6ECEB';
            context.font = `${isComplementary ? '600' : '400'} 19px Arial, sans-serif`;
            item.lines.forEach((line, lineIndex) => {
              context.fillText(`${lineIndex === 0 ? '• ' : '  '}${line}`, textX, textY);
              textY += 25;
            });
            textY += 7;
          });
          textY += 8;
        });
      });

      context.fillStyle = '#D8C78E';
      context.font = '600 20px Arial, sans-serif';
      context.fillText(`WhatsApp: ${STUDIO_INFO.phone}`, padding, canvas.height - 54);

      canvas.toBlob((blob) => {
        if (blob) resolve({ blob, missingImages });
        else reject(new Error('Could not generate the package grid image.'));
      }, 'image/png');
    })().catch(reject);
  });
}

async function copyImage(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ]);
  return true;
}

function downloadImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PackageGridShareActions({
  packages,
  eventName,
  services,
}: PackageGridShareActionsProps) {
  const [activeAction, setActiveAction] = useState<'copy' | 'share' | null>(null);
  const fileName = `${eventName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'GK-Event'}-Packages.png`;
  const message = [
    `Vanakkam! Here are the ${eventName} package options from GK STUDIOS.`,
    'Please see the attached package image for details.',
    `GK STUDIOS · ${STUDIO_INFO.phone}`,
  ].join('\n');

  const handleCopyImage = async () => {
    if (packages.length === 0) return;
    setActiveAction('copy');

    try {
      const { blob, missingImages } = await createPackageGridImage(
        packages,
        eventName,
        services
      );
      const copied = await copyImage(blob).catch(() => false);
      if (copied) {
        toast.success('Package image copied. Paste it into your message or document.');
      } else {
        downloadImage(blob, fileName);
        toast.info('Image clipboard is unavailable. The package image was downloaded.');
      }

      if (missingImages > 0) {
        toast.info(`${missingImages} package image(s) could not be loaded into the share image.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not copy the package image.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleShare = async () => {
    if (packages.length === 0) return;
    const whatsappWindow = window.open('about:blank', '_blank');
    setActiveAction('share');

    try {
      const { blob, missingImages } = await createPackageGridImage(
        packages,
        eventName,
        services
      );
      const file = new File([blob], fileName, { type: 'image/png' });
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: `${eventName} Packages · GK STUDIOS`,
            text: message,
            files: [file],
          });
          whatsappWindow?.close();
          toast.success('Choose WhatsApp from the share sheet to send all packages.');
          if (missingImages > 0) {
            toast.info(`${missingImages} package image(s) could not be loaded into the share image.`);
          }
          return;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            whatsappWindow?.close();
            return;
          }
        }
      }

      const copied = await copyImage(blob).catch(() => false);
      if (!copied) downloadImage(blob, fileName);
      if (whatsappWindow) {
        whatsappWindow.location.href = buildWhatsAppUrl('', message);
        toast.info(
          copied
            ? 'WhatsApp opened. Paste the package grid image into the chat.'
            : 'WhatsApp opened. Attach the downloaded package grid image.'
        );
      } else {
        toast.error('Allow pop-ups to open WhatsApp. The package grid image is ready.');
      }

      if (missingImages > 0) {
        toast.info(`${missingImages} package image(s) could not be loaded into the share image.`);
      }
    } catch (error) {
      whatsappWindow?.close();
      if (error instanceof Error && error.name === 'AbortError') return;
      toast.error(error instanceof Error ? error.message : 'Could not share the package grid.');
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void handleCopyImage()}
        disabled={activeAction !== null || packages.length === 0}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#C5B378]/40 bg-[#C5B378]/10 px-3 text-xs font-semibold text-[#E8D79F] transition-colors hover:bg-[#C5B378]/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Copy image of all ${eventName} packages`}
      >
        {activeAction === 'copy' ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Copy image
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={activeAction !== null || packages.length === 0}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#25D366]/40 bg-[#25D366]/10 px-3 text-xs font-semibold text-[#8BE7A8] transition-colors hover:bg-[#25D366]/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Share all ${eventName} packages`}
      >
        {activeAction === 'share' ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        Share all packages
      </button>
    </div>
  );
}
