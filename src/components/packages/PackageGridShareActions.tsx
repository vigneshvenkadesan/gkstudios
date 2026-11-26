'use client';

import { useState } from 'react';
import { Copy, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPackageCopy } from '@/src/i18n/translations';
import {
  getDynamicPackageDisplaySections,
  sanitizePackageDeliverables,
} from '@/src/lib/pricing';
import {
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

interface RichSegment {
  text: string;
  bold: boolean;
  accent?: 'complementary';
}

interface PreparedPackageCard {
  pkg: StudioPackage;
  image: HTMLImageElement | null;
  hasConfiguredImage: boolean;
  isSignature: boolean;
  tierLabel: string;
  duration: string;
  nameLines: string[];
  audienceLines: string[];
  sections: Array<{
    title: string;
    items: Array<{
      text: string;
      isComplementary: boolean;
      lines: RichSegment[][];
    }>;
  }>;
  cardHeight: number;
}

const SERIF_FONT = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const SANS_FONT = '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, sans-serif';

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | { tl: number; tr: number; br: number; bl: number }
) {
  const maxR = Math.max(0, Math.min(w / 2, h / 2));
  const raw = typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : r;
  const radii = {
    tl: Math.min(Math.max(0, raw.tl), maxR),
    tr: Math.min(Math.max(0, raw.tr), maxR),
    br: Math.min(Math.max(0, raw.br), maxR),
    bl: Math.min(Math.max(0, raw.bl), maxR),
  };
  ctx.beginPath();
  ctx.moveTo(x + radii.tl, y);
  ctx.lineTo(x + w - radii.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radii.tr);
  ctx.lineTo(x + w, y + h - radii.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radii.br, y + h);
  ctx.lineTo(x + radii.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radii.bl);
  ctx.lineTo(x, y + radii.tl);
  ctx.quadraticCurveTo(x, y, x + radii.tl, y);
  ctx.closePath();
}

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  align: CanvasTextAlign = 'left'
) {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((sum, w) => sum + w, 0) + Math.max(0, chars.length - 1) * tracking;

  let cursorX = x;
  if (align === 'center') cursorX = x - totalWidth / 2;
  else if (align === 'right') cursorX = x - totalWidth;

  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((ch, idx) => {
    ctx.fillText(ch, cursorX, y);
    cursorX += widths[idx] + tracking;
  });
  ctx.textAlign = prevAlign;
}

function measureTrackedTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking: number
): number {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  return widths.reduce((sum, w) => sum + w, 0) + Math.max(0, chars.length - 1) * tracking;
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

/**
 * Splits a service line into regular and bolded highlight segments
 * (e.g. "2 × Candid Photo", "100 pages", "Complementary Half Day Outdoor Photoshoot").
 */
function tokenizeRichSegments(text: string): RichSegment[] {
  const highlightPattern =
    /(compl(?:e|i)mentary\b[^,;]*|\b\d+\s*(?:×|x)\s*[A-Za-z][A-Za-z\s/&+-]{1,28}|\b\d+\s*(?:pages?|sheets?|frames?|hours?|hrs?|days?|mins?)\b|\b4K\b|\bLED\s+Wall\b|\bDrone\b)/gi;

  const segments: RichSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = highlightPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        bold: false,
      });
    }
    const matchedText = match[0];
    const isComp = /^compl(?:e|i)mentary/i.test(matchedText);
    segments.push({
      text: matchedText,
      bold: true,
      accent: isComp ? 'complementary' : undefined,
    });
    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      bold: false,
    });
  }

  return segments.length > 0 ? segments : [{ text, bold: false }];
}

function wrapRichText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): RichSegment[][] {
  const rawSegments = tokenizeRichSegments(text);
  const wordTokens: Array<{ word: string; bold: boolean; accent?: 'complementary' }> = [];

  rawSegments.forEach((seg) => {
    const parts = seg.text.split(/(\s+)/);
    parts.forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        if (wordTokens.length > 0) {
          wordTokens[wordTokens.length - 1].word += ' ';
        }
      } else {
        wordTokens.push({
          word: part,
          bold: seg.bold,
          accent: seg.accent,
        });
      }
    });
  });

  const lines: RichSegment[][] = [];
  let currentLine: RichSegment[] = [];
  let currentWidth = 0;

  const measureToken = (tokenText: string, bold: boolean) => {
    ctx.font = `${bold ? '700' : '400'} ${fontSize}px ${SANS_FONT}`;
    return ctx.measureText(tokenText).width;
  };

  wordTokens.forEach((token) => {
    const trimmedWidth = measureToken(token.word.trimEnd(), token.bold);
    const fullWidth = measureToken(token.word, token.bold);

    if (currentLine.length > 0 && currentWidth + trimmedWidth > maxWidth) {
      const last = currentLine[currentLine.length - 1];
      last.text = last.text.trimEnd();
      lines.push(currentLine);
      currentLine = [{ text: token.word, bold: token.bold, accent: token.accent }];
      currentWidth = fullWidth;
    } else {
      const prev = currentLine[currentLine.length - 1];
      if (prev && prev.bold === token.bold && prev.accent === token.accent) {
        prev.text += token.word;
      } else {
        currentLine.push({ text: token.word, bold: token.bold, accent: token.accent });
      }
      currentWidth += fullWidth;
    }
  });

  if (currentLine.length > 0) {
    currentLine[currentLine.length - 1].text = currentLine[currentLine.length - 1].text.trimEnd();
    lines.push(currentLine);
  }

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
      ? [
          {
            title: 'Event Coverage & Crew',
            items: dynamic.coverage.split(/\s*(?:\+|,|&)\s*/).filter(Boolean),
          },
        ]
      : []),
    ...(dynamic.albums ? [{ title: 'Albums', items: [dynamic.albums] }] : []),
    ...(allDeliverables
      ? [
          {
            title: 'Deliverables',
            items: allDeliverables
              .replace(/\s*\+\s*/g, ', ')
              .split(/\s*,\s*/)
              .map((item) => removeAlbumPhotoSelectionNote(item))
              .filter(Boolean),
          },
        ]
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

function isSignaturePackage(pkg: StudioPackage): boolean {
  const nameLower = (pkg.name || '').toLowerCase();
  const idLower = (pkg.id || '').toLowerCase();
  return Boolean(
    pkg.highlighted ||
      pkg.featured ||
      pkg.tier === 'signature' ||
      pkg.sortOrder === 2 ||
      nameLower.includes('signature') ||
      idLower.includes('signature') ||
      pkg.id === 'pkg-grand'
  );
}

function getTierBadgeLabel(pkg: StudioPackage, isSignature: boolean): string {
  if (isSignature) return '★ MOST POPULAR';
  const nameLower = (pkg.name || '').toLowerCase();
  if (pkg.tier === 'premium' || pkg.sortOrder === 3 || nameLower.includes('premium') || nameLower.includes('royal')) {
    return 'PREMIUM LUXURY';
  }
  return 'ESSENTIAL';
}

function drawGoldCheckmark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  isComplementary: boolean
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = isComplementary
    ? 'rgba(110, 231, 183, 0.18)'
    : 'rgba(212, 175, 55, 0.18)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = isComplementary
    ? 'rgba(110, 231, 183, 0.5)'
    : 'rgba(212, 175, 55, 0.5)';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 3.8, cy + 0.2);
  ctx.lineTo(cx - 1, cy + 3.2);
  ctx.lineTo(cx + 4.2, cy - 2.8);
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = isComplementary ? '#A7F3D0' : '#F3D999';
  ctx.stroke();
  ctx.restore();
}

function createPackageGridImage(
  packages: StudioPackage[],
  eventName: string,
  services: StudioService[]
): Promise<{ blob: Blob; missingImages: number }> {
  return new Promise((resolve, reject) => {
    void (async () => {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready.catch(() => undefined);
      }

      const pixelRatio = 2;
      // Use 2 columns for 2 or 4 packages so cards stay wide and text is large & legible on phones
      const columns =
        packages.length === 1
          ? 1
          : packages.length === 2 || packages.length === 4
          ? 2
          : 3;
      const logicalWidth = columns === 1 ? 620 : columns === 2 ? 1080 : 1440;
      const outerPadding = 44;
      const cardGap = 26;
      const rowGap = 34;
      const cardWidth =
        (logicalWidth - outerPadding * 2 - cardGap * (columns - 1)) / columns;
      const cardPaddingX = 30;
      const cardPaddingTop = 30;
      const cardPaddingBottom = 30;
      const innerWidth = cardWidth - cardPaddingX * 2;

      // Large, readable typography sizes
      const titleFontSize = 31;
      const titleLineHeight = 36;
      const audienceFontSize = 15;
      const audienceLineHeight = 21;
      const durationFontSize = 14.5;
      const priceFontSize = 40;
      const sectionLabelFontSize = 12.5;
      const itemFontSize = 16.5;
      const itemLineHeight = 24.5; // ~1.5x line height

      const canvas = document.createElement('canvas');
      canvas.width = logicalWidth * pixelRatio;
      canvas.height = 1200 * pixelRatio;

      let context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is not supported in this browser.');
      context.scale(pixelRatio, pixelRatio);

      const preparedCards: PreparedPackageCard[] = await Promise.all(
        packages.map(async (pkg) => {
          const copy = getPackageCopy(pkg);
          const sections = getPackageSections(pkg, services);
          const rawImageUrl = (pkg.imageUrl || pkg.image || '').trim();
          const hasConfiguredImage = Boolean(rawImageUrl);
          const image = hasConfiguredImage ? await loadPackageImage(rawImageUrl) : null;
          const isSignature = isSignaturePackage(pkg);
          const tierLabel = getTierBadgeLabel(pkg, isSignature);

          context!.font = `600 ${titleFontSize}px ${SERIF_FONT}`;
          const nameLines = wrapText(context!, copy.name, innerWidth);

          context!.font = `400 ${audienceFontSize}px ${SANS_FONT}`;
          const audienceLines = copy.audience
            ? wrapText(context!, copy.audience, innerWidth)
            : [];

          const preparedSections = sections.map((section) => ({
            title: section.title,
            items: section.items.map((text) => ({
              text,
              isComplementary: /\bcompl(?:e|i)mentary\b/i.test(text),
              lines: wrapRichText(context!, text, innerWidth - 28, itemFontSize),
            })),
          }));

          const coverHeight = image ? Math.round(cardWidth * 0.42) : 0;

          let bodyHeight = cardPaddingTop;
          // Tier pill badge
          bodyHeight += 28 + 16;
          // Package Title
          bodyHeight += nameLines.length * titleLineHeight + 8;
          // Audience + Duration
          if (audienceLines.length > 0) {
            bodyHeight += audienceLines.length * audienceLineHeight + 6;
          }
          bodyHeight += 20 + 20; // Duration line + spacing
          // Price + Divider
          bodyHeight += 46 + 22;
          // Sections
          preparedSections.forEach((section, sIdx) => {
            if (sIdx > 0) bodyHeight += 12;
            bodyHeight += 26; // Uppercase tracked label
            section.items.forEach((item) => {
              bodyHeight += Math.max(24, item.lines.length * itemLineHeight) + 8;
            });
          });
          bodyHeight += cardPaddingBottom;

          return {
            pkg,
            image,
            hasConfiguredImage,
            isSignature,
            tierLabel,
            duration: copy.duration,
            nameLines,
            audienceLines,
            sections: preparedSections,
            cardHeight: coverHeight + bodyHeight,
          };
        })
      );

      const rowCount = Math.ceil(preparedCards.length / columns);
      const headerHeight = 128;
      const elevationSpace = 16;
      const footerBarHeight = 76;
      const footerTopMargin = 38;

      // Uniform height per row so 2x2 grids stay tight and balanced
      const rowHeights: number[] = [];
      for (let r = 0; r < rowCount; r++) {
        const rowCards = preparedCards.slice(r * columns, (r + 1) * columns);
        rowHeights.push(Math.max(...rowCards.map((c) => c.cardHeight)));
      }
      const totalRowsHeight = rowHeights.reduce((sum, rh) => sum + rh, 0);

      const logicalHeight =
        outerPadding +
        headerHeight +
        elevationSpace +
        totalRowsHeight +
        Math.max(0, rowCount - 1) * rowGap +
        footerTopMargin +
        footerBarHeight +
        outerPadding;

      canvas.width = logicalWidth * pixelRatio;
      canvas.height = logicalHeight * pixelRatio;
      context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas rendering is not supported in this browser.');
      context.scale(pixelRatio, pixelRatio);

      // ─── 1. Deep Rich Emerald Background + Subtle Ambient Gold Glow ───
      context.fillStyle = '#0B2520';
      context.fillRect(0, 0, logicalWidth, logicalHeight);

      const glowCenterX = logicalWidth / 2;
      const glowCenterY = outerPadding + headerHeight + totalRowsHeight * 0.45;
      const glowRadius = Math.max(logicalWidth * 0.7, 600);
      const ambientGlow = context.createRadialGradient(
        glowCenterX,
        glowCenterY,
        30,
        glowCenterX,
        glowCenterY,
        glowRadius
      );
      ambientGlow.addColorStop(0, 'rgba(212, 175, 55, 0.14)');
      ambientGlow.addColorStop(0.5, 'rgba(197, 160, 89, 0.05)');
      ambientGlow.addColorStop(1, 'rgba(11, 37, 32, 0)');
      context.fillStyle = ambientGlow;
      context.fillRect(0, 0, logicalWidth, logicalHeight);

      // Subtle outer hairline border
      context.strokeStyle = 'rgba(212, 175, 55, 0.2)';
      context.lineWidth = 1;
      drawRoundedRectPath(context, 16, 16, logicalWidth - 32, logicalHeight - 32, 22);
      context.stroke();

      // ─── 2. Polished Editorial Top Header ───
      const headerY = outerPadding + 10;
      context.fillStyle = '#C5A059';
      context.font = `700 13.5px ${SANS_FONT}`;
      drawTrackedText(context, 'GK STUDIOS', outerPadding, headerY + 12, 4, 'left');

      const cleanEventName = (eventName || 'Wedding').trim();
      const titleText = /wedding/i.test(cleanEventName)
        ? 'Wedding Packages'
        : `${cleanEventName} Packages`;
      const collectionPillText = `${cleanEventName.toUpperCase()} COLLECTION`;

      context.fillStyle = '#FFFFFF';
      context.font = `600 48px ${SERIF_FONT}`;
      context.fillText(titleText, outerPadding, headerY + 64);

      // Right Pill Badge ("WEDDING COLLECTION")
      context.font = `700 12px ${SANS_FONT}`;
      const pillTracking = 2.2;
      const pillTextWidth = measureTrackedTextWidth(context, collectionPillText, pillTracking);
      const pillWidth = pillTextWidth + 36;
      const pillHeight = 36;
      const pillX = logicalWidth - outerPadding - pillWidth;
      const pillY = headerY + 24;

      context.fillStyle = 'rgba(212, 175, 55, 0.1)';
      drawRoundedRectPath(context, pillX, pillY, pillWidth, pillHeight, 18);
      context.fill();
      context.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      context.lineWidth = 1.2;
      context.stroke();

      context.fillStyle = '#F3D999';
      drawTrackedText(
        context,
        collectionPillText,
        pillX + pillWidth / 2,
        pillY + 22.5,
        pillTracking,
        'center'
      );

      // Subtle header divider line
      const headerDividerY = outerPadding + headerHeight - 16;
      const headerLineGrad = context.createLinearGradient(
        outerPadding,
        headerDividerY,
        logicalWidth - outerPadding,
        headerDividerY
      );
      headerLineGrad.addColorStop(0, 'rgba(212, 175, 55, 0.38)');
      headerLineGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.16)');
      headerLineGrad.addColorStop(1, 'rgba(212, 175, 55, 0.04)');
      context.strokeStyle = headerLineGrad;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(outerPadding, headerDividerY);
      context.lineTo(logicalWidth - outerPadding, headerDividerY);
      context.stroke();

      // ─── 3. Render Elevated Glassmorphic Luxury Package Cards ───
      let missingImages = 0;
      const gridStartY = outerPadding + headerHeight + elevationSpace;
      const rowStartY: number[] = [gridStartY];
      for (let r = 1; r < rowCount; r++) {
        rowStartY.push(rowStartY[r - 1] + rowHeights[r - 1] + rowGap);
      }

      preparedCards.forEach((card, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const x = outerPadding + column * (cardWidth + cardGap);
        const baseY = rowStartY[row];
        const y = card.isSignature ? baseY - 10 : baseY;
        const h = rowHeights[row];
        const radius = 20;

        // Card drop shadow / Signature golden glow
        context.save();
        if (card.isSignature) {
          context.shadowColor = 'rgba(212, 175, 55, 0.25)';
          context.shadowBlur = 28;
          context.shadowOffsetY = 8;
        } else {
          context.shadowColor = 'rgba(4, 15, 13, 0.45)';
          context.shadowBlur = 20;
          context.shadowOffsetY = 6;
        }

        if (card.isSignature) {
          const sigGrad = context.createLinearGradient(x, y, x, y + h);
          sigGrad.addColorStop(0, '#164239');
          sigGrad.addColorStop(0.35, '#113830');
          sigGrad.addColorStop(1, '#0E2E27');
          context.fillStyle = sigGrad;
        } else {
          context.fillStyle = '#10332C';
        }
        drawRoundedRectPath(context, x, y, cardWidth, h, radius);
        context.fill();
        context.restore();

        if (card.isSignature) {
          const goldTint = context.createLinearGradient(x, y, x, y + h * 0.45);
          goldTint.addColorStop(0, 'rgba(212, 175, 55, 0.11)');
          goldTint.addColorStop(1, 'rgba(212, 175, 55, 0)');
          context.fillStyle = goldTint;
          drawRoundedRectPath(context, x, y, cardWidth, h, radius);
          context.fill();
        }

        // Card border
        context.strokeStyle = card.isSignature
          ? '#D4AF37'
          : 'rgba(212, 175, 55, 0.22)';
        context.lineWidth = card.isSignature ? 1.5 : 1;
        drawRoundedRectPath(context, x, y, cardWidth, h, radius);
        context.stroke();

        // Top accent bar or cover image clipped inside rounded card top
        context.save();
        drawRoundedRectPath(context, x, y, cardWidth, h, radius);
        context.clip();

        if (card.image) {
          const coverHeight = Math.round(cardWidth * 0.42);
          const scale = Math.max(
            cardWidth / card.image.naturalWidth,
            coverHeight / card.image.naturalHeight
          );
          const sourceWidth = cardWidth / scale;
          const sourceHeight = coverHeight / scale;
          const sourceX = (card.image.naturalWidth - sourceWidth) / 2;
          const sourceY = (card.image.naturalHeight - sourceHeight) / 2;

          context.drawImage(
            card.image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            x,
            y,
            cardWidth,
            coverHeight
          );

          const imgFade = context.createLinearGradient(
            x,
            y + coverHeight * 0.4,
            x,
            y + coverHeight
          );
          imgFade.addColorStop(0, 'rgba(16, 51, 44, 0)');
          imgFade.addColorStop(1, card.isSignature ? '#143D35' : '#10332C');
          context.fillStyle = imgFade;
          context.fillRect(x, y, cardWidth, coverHeight + 1);
        } else {
          if (card.hasConfiguredImage) {
            missingImages += 1;
          }
          const accentGrad = context.createLinearGradient(x, y, x + cardWidth, y);
          if (card.isSignature) {
            accentGrad.addColorStop(0, '#C5A059');
            accentGrad.addColorStop(0.5, '#F3D999');
            accentGrad.addColorStop(1, '#C5A059');
            context.fillStyle = accentGrad;
            context.fillRect(x, y, cardWidth, 5);
          } else {
            accentGrad.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
            accentGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.45)');
            accentGrad.addColorStop(1, 'rgba(212, 175, 55, 0.15)');
            context.fillStyle = accentGrad;
            context.fillRect(x, y, cardWidth, 3);
          }
        }
        context.restore();

        // Card internal content
        const coverOffset = card.image ? Math.round(cardWidth * 0.42) : 0;
        let cursorY = y + coverOffset + cardPaddingTop;
        const textX = x + cardPaddingX;

        // Tier Pill Badge
        context.font = `700 11.5px ${SANS_FONT}`;
        const badgeTracking = 1.6;
        const badgeTextW = measureTrackedTextWidth(context, card.tierLabel, badgeTracking);
        const badgeW = badgeTextW + 28;
        const badgeH = 28;

        if (card.isSignature) {
          const pillGrad = context.createLinearGradient(textX, cursorY, textX + badgeW, cursorY);
          pillGrad.addColorStop(0, '#D4AF37');
          pillGrad.addColorStop(1, '#F3D999');
          context.fillStyle = pillGrad;
          drawRoundedRectPath(context, textX, cursorY, badgeW, badgeH, 14);
          context.fill();
          context.fillStyle = '#071A16';
        } else {
          context.fillStyle = 'rgba(212, 175, 55, 0.12)';
          drawRoundedRectPath(context, textX, cursorY, badgeW, badgeH, 14);
          context.fill();
          context.strokeStyle = 'rgba(212, 175, 55, 0.35)';
          context.lineWidth = 1;
          context.stroke();
          context.fillStyle = '#E8D79F';
        }

        drawTrackedText(
          context,
          card.tierLabel,
          textX + badgeW / 2,
          cursorY + 18,
          badgeTracking,
          'center'
        );
        cursorY += badgeH + 16;

        // Package Title (Editorial Serif)
        context.fillStyle = '#FFFFFF';
        context.font = `600 ${titleFontSize}px ${SERIF_FONT}`;
        card.nameLines.forEach((line) => {
          context.fillText(line, textX, cursorY + 26);
          cursorY += titleLineHeight;
        });
        cursorY += 6;

        // Audience Description
        if (card.audienceLines.length > 0) {
          context.fillStyle = '#C5D8D3';
          context.font = `400 ${audienceFontSize}px ${SANS_FONT}`;
          card.audienceLines.forEach((line) => {
            context.fillText(line, textX, cursorY + 14);
            cursorY += audienceLineHeight;
          });
          cursorY += 4;
        }

        // Duration
        context.fillStyle = '#D4AF37';
        context.font = `500 ${durationFontSize}px ${SANS_FONT}`;
        context.fillText(card.duration || 'Full event coverage', textX, cursorY + 14);
        cursorY += 32;

        // Prominent Editorial Serif Price
        context.fillStyle = '#F3D999';
        context.font = `700 ${priceFontSize}px ${SERIF_FONT}`;
        const priceText = formatINR(Number(card.pkg.price) || 0);
        context.fillText(priceText, textX, cursorY + 32);
        cursorY += 48;

        // Clean 1px divider below price
        context.strokeStyle = card.isSignature
          ? 'rgba(212, 175, 55, 0.38)'
          : 'rgba(212, 175, 55, 0.2)';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(textX, cursorY);
        context.lineTo(textX + innerWidth, cursorY);
        context.stroke();
        cursorY += 24;

        // Service Sections
        card.sections.forEach((section, sIdx) => {
          if (sIdx > 0) cursorY += 12;

          // Uppercase Tracked Section Label in Muted Gold (#C5A059)
          context.fillStyle = '#C5A059';
          context.font = `700 ${sectionLabelFontSize}px ${SANS_FONT}`;
          drawTrackedText(context, section.title.toUpperCase(), textX, cursorY + 10, 2, 'left');
          cursorY += 26;

          // Service Items with Custom Gold Checkmark & Highlighted Key Numbers
          section.items.forEach((item) => {
            drawGoldCheckmark(context, textX + 8, cursorY + 10.5, item.isComplementary);

            let lineY = cursorY + 16;
            item.lines.forEach((lineSegments) => {
              let segX = textX + 26;
              lineSegments.forEach((seg) => {
                context.font = `${seg.bold ? '700' : '400'} ${itemFontSize}px ${SANS_FONT}`;
                if (seg.accent === 'complementary' || (item.isComplementary && seg.bold)) {
                  context.fillStyle = '#A7F3D0';
                } else if (seg.bold) {
                  context.fillStyle = '#FFFFFF';
                } else {
                  context.fillStyle = item.isComplementary ? '#A7F3D0' : '#E2ECEA';
                }
                context.fillText(seg.text, segX, lineY);
                segX += context.measureText(seg.text).width;
              });
              lineY += itemLineHeight;
            });

            cursorY += Math.max(24, item.lines.length * itemLineHeight) + 8;
          });
        });
      });

      // ─── 4. Sleek Full-Width Dark Glass Footer Bar ───
      const footerY = logicalHeight - outerPadding - footerBarHeight;
      const footerW = logicalWidth - outerPadding * 2;

      context.fillStyle = 'rgba(7, 26, 22, 0.9)';
      drawRoundedRectPath(context, outerPadding, footerY, footerW, footerBarHeight, 16);
      context.fill();

      context.strokeStyle = 'rgba(212, 175, 55, 0.28)';
      context.lineWidth = 1;
      drawRoundedRectPath(context, outerPadding, footerY, footerW, footerBarHeight, 16);
      context.stroke();

      const footerCenterY = footerY + footerBarHeight / 2;

      // Left: GK Studios Branding
      context.fillStyle = '#FFFFFF';
      context.font = `700 20px ${SERIF_FONT}`;
      drawTrackedText(context, 'GK STUDIOS', outerPadding + 26, footerCenterY + 6.5, 2.4, 'left');
      const brandWidth = measureTrackedTextWidth(context, 'GK STUDIOS', 2.4);

      if (logicalWidth >= 820) {
        context.fillStyle = 'rgba(212, 175, 55, 0.5)';
        context.font = `400 16px ${SANS_FONT}`;
        context.fillText('·', outerPadding + 26 + brandWidth + 10, footerCenterY + 5.5);

        context.fillStyle = '#C5A059';
        context.font = `600 11.5px ${SANS_FONT}`;
        drawTrackedText(
          context,
          'CREATING MEMORIES',
          outerPadding + 26 + brandWidth + 24,
          footerCenterY + 4.5,
          2,
          'left'
        );
      }

      // Center: Subtle Tagline
      if (logicalWidth >= 960) {
        context.fillStyle = '#C5D8D3';
        context.font = `400 14px ${SANS_FONT}`;
        context.textAlign = 'center';
        context.fillText(
          'Custom packages available on request',
          logicalWidth / 2 + 20,
          footerCenterY + 5
        );
        context.textAlign = 'left';
      }

      // Right: Prominent Gold-Accented WhatsApp Pill
      const waText = `WhatsApp: ${STUDIO_INFO.phoneFormatted}`;
      context.font = `700 14.5px ${SANS_FONT}`;
      const waTextW = context.measureText(waText).width;
      const waPillW = waTextW + 44;
      const waPillH = 42;
      const waPillX = logicalWidth - outerPadding - 20 - waPillW;
      const waPillY = footerCenterY - waPillH / 2;

      const waGrad = context.createLinearGradient(waPillX, waPillY, waPillX + waPillW, waPillY);
      waGrad.addColorStop(0, '#C5A059');
      waGrad.addColorStop(1, '#F3D999');
      context.fillStyle = waGrad;
      drawRoundedRectPath(context, waPillX, waPillY, waPillW, waPillH, 21);
      context.fill();

      context.beginPath();
      context.arc(waPillX + 18, footerCenterY, 4, 0, Math.PI * 2);
      context.fillStyle = '#071A16';
      context.fill();

      context.fillStyle = '#071A16';
      context.font = `700 14.5px ${SANS_FONT}`;
      context.fillText(waText, waPillX + 29, footerCenterY + 5);

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
  const [isCopying, setIsCopying] = useState(false);
  const fileName = `${eventName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'GK-Event'}-Packages.png`;

  const handleCopyImage = async () => {
    if (packages.length === 0) return;
    setIsCopying(true);

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
      setIsCopying(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void handleCopyImage()}
        disabled={isCopying || packages.length === 0}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-[#C5B378]/40 bg-[#C5B378]/10 px-3 text-xs font-semibold text-[#E8D79F] transition-colors hover:bg-[#C5B378]/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Copy image of all ${eventName} packages`}
      >
        {isCopying ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Copy image
      </button>
    </div>
  );
}
