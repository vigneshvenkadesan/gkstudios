'use client';

import React, { useRef, useState } from 'react';
import { Copy, Maximize2, Monitor, RotateCcw, Smartphone } from 'lucide-react';
import { ImageCropConfig } from '@/src/types/studio';
import { DEFAULT_IMAGE_CROP, resolveImageCrop } from '@/src/lib/imageCrop';

interface DualCropSelectorProps {
  imageUrl: string;
  desktopCrop: ImageCropConfig;
  mobileCrop: ImageCropConfig;
  onChangeDesktopCrop: (next: ImageCropConfig) => void;
  onChangeMobileCrop: (next: ImageCropConfig) => void;
  aspect?: 'standard' | 'wide' | 'tall';
}

type CropTarget = 'desktop' | 'mobile';

const FOCUS_PRESETS: Array<{ label: string; x: number; y: number }> = [
  { label: 'Top (Faces)', x: 50, y: 18 },
  { label: 'Center', x: 50, y: 50 },
  { label: 'Bottom', x: 50, y: 82 },
  { label: 'Left', x: 22, y: 45 },
  { label: 'Right', x: 78, y: 45 },
];

export function DualCropSelector({
  imageUrl,
  desktopCrop,
  mobileCrop,
  onChangeDesktopCrop,
  onChangeMobileCrop,
  aspect = 'standard',
}: DualCropSelectorProps) {
  const [activeTarget, setActiveTarget] = useState<CropTarget>('desktop');
  const [isDragging, setIsDragging] = useState(false);
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const resolvedDesktop = resolveImageCrop(desktopCrop);
  const resolvedMobile = resolveImageCrop(mobileCrop);
  const activeCrop = activeTarget === 'desktop' ? resolvedDesktop : resolvedMobile;

  const setActiveCrop = (next: ImageCropConfig) => {
    if (activeTarget === 'desktop') {
      onChangeDesktopCrop(next);
    } else {
      onChangeMobileCrop(next);
    }
  };

  const updatePointFromPointer = (clientX: number, clientY: number) => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.round(Math.min(100, Math.max(0, rawX)) * 10) / 10;
    const clampedY = Math.round(Math.min(100, Math.max(0, rawY)) * 10) / 10;

    setActiveCrop({
      ...activeCrop,
      x: clampedX,
      y: clampedY,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePointFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updatePointFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    }
  };

  // Compute approximate visible crop box rectangle inside full image
  const cropBoxStyle = (() => {
    const imgAspect =
      naturalDims && naturalDims.h > 0 ? naturalDims.w / naturalDims.h : 1.5;
    const targetAspect =
      activeTarget === 'desktop'
        ? aspect === 'wide'
          ? 3 / 2
          : aspect === 'tall'
            ? 3 / 4
            : 4 / 3
        : 9 / 16;

    let baseWidth = 1;
    let baseHeight = 1;
    if (imgAspect > targetAspect) {
      baseWidth = targetAspect / imgAspect;
    } else {
      baseHeight = imgAspect / targetAspect;
    }

    const zoom = Math.max(1, activeCrop.zoom);
    const widthFrac = Math.min(1, baseWidth / zoom);
    const heightFrac = Math.min(1, baseHeight / zoom);
    const leftPct = (activeCrop.x / 100) * (100 - widthFrac * 100);
    const topPct = (activeCrop.y / 100) * (100 - heightFrac * 100);

    return {
      left: `${leftPct}%`,
      top: `${topPct}%`,
      width: `${widthFrac * 100}%`,
      height: `${heightFrac * 100}%`,
    };
  })();

  if (!imageUrl.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-[#C5B378]/30 bg-[#072421]/60 p-4 text-xs text-[#E6ECEB]/70">
        Upload an image or paste a Cloudinary URL above to customize separate <strong className="text-[#D8C78E]">Desktop</strong> and <strong className="text-[#D8C78E]">Mobile</strong> crop framing.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#C5B378]/30 bg-[#072421]/90 p-3.5 sm:p-4 space-y-4">
      {/* Header & Desktop / Mobile Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D8C78E]">
            Screen Crop &amp; Focal Area
          </p>
          <p className="text-[11px] text-[#E6ECEB]/70 mt-0.5">
            Click or drag on the photo to choose which part stays centered on Desktop vs Mobile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTarget('desktop')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
              activeTarget === 'desktop'
                ? 'border-[#D8C78E] bg-[#C5B378] text-[#061E1C]'
                : 'border-[#C5B378]/25 bg-[#092E2B] text-[#E6ECEB]/80 hover:border-[#D8C78E]/60 hover:text-white'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget('mobile')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
              activeTarget === 'mobile'
                ? 'border-[#D8C78E] bg-[#C5B378] text-[#061E1C]'
                : 'border-[#C5B378]/25 bg-[#092E2B] text-[#E6ECEB]/80 hover:border-[#D8C78E]/60 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
        {/* Left: Interactive Image Focal Canvas */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-center rounded-lg border border-[#C5B378]/20 bg-[#041513] p-2.5 overflow-hidden">
            <div
              ref={canvasRef}
              role="slider"
              tabIndex={0}
              aria-label={`${activeTarget === 'desktop' ? 'Desktop' : 'Mobile'} crop position`}
              aria-valuetext={`${activeCrop.x}% horizontal, ${activeCrop.y}% vertical, ${activeCrop.zoom}x zoom`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative inline-block max-w-full cursor-crosshair select-none touch-none overflow-hidden rounded"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Crop focal point preview"
                draggable={false}
                onLoad={(e) => {
                  setNaturalDims({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  });
                }}
                className="block max-h-[260px] sm:max-h-[300px] w-auto max-w-full opacity-55"
              />

              {/* Highlighted visible region box */}
              <div
                aria-hidden="true"
                style={cropBoxStyle}
                className="pointer-events-none absolute border-2 border-[#D8C78E] bg-white/10 shadow-[0_0_0_9999px_rgba(4,20,18,0.45)] transition-[left,top,width,height] duration-75"
              />

              {/* Reference dot for the OTHER viewport */}
              {(() => {
                const otherCrop = activeTarget === 'desktop' ? resolvedMobile : resolvedDesktop;
                const otherLabel = activeTarget === 'desktop' ? 'M' : 'D';
                return (
                  <div
                    aria-hidden="true"
                    style={{ left: `${otherCrop.x}%`, top: `${otherCrop.y}%` }}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border border-white/70 bg-[#061E1C]/80 text-[9px] font-bold text-white/85"
                  >
                    {otherLabel}
                  </div>
                );
              })()}

              {/* Active Crosshair Pin */}
              <div
                aria-hidden="true"
                style={{ left: `${activeCrop.x}%`, top: `${activeCrop.y}%` }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#C5B378] text-[10px] font-bold text-[#061E1C] shadow-lg"
              >
                {activeTarget === 'desktop' ? 'D' : 'M'}
              </div>
            </div>
          </div>

          {/* Presets + Zoom Controls */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {FOCUS_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setActiveCrop({ ...activeCrop, x: preset.x, y: preset.y })
                    }
                    className="rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 py-1 text-[11px] text-[#E6ECEB]/85 hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    activeTarget === 'mobile'
                      ? onChangeMobileCrop({ ...resolvedDesktop })
                      : onChangeDesktopCrop({ ...resolvedMobile })
                  }
                  className="inline-flex items-center gap-1 rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 py-1 text-[11px] text-[#D8C78E] hover:border-[#D8C78E] transition-colors cursor-pointer"
                  title={
                    activeTarget === 'mobile'
                      ? 'Copy framing from Desktop'
                      : 'Copy framing from Mobile'
                  }
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy {activeTarget === 'mobile' ? 'Desktop' : 'Mobile'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCrop({ ...DEFAULT_IMAGE_CROP })}
                  className="inline-flex items-center gap-1 rounded border border-[#C5B378]/25 bg-[#092E2B] px-2 py-1 text-[11px] text-[#E6ECEB]/75 hover:border-[#D8C78E] hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-md border border-[#C5B378]/20 bg-[#092E2B]/80 px-3 py-2">
              <Maximize2 className="h-3.5 w-3.5 shrink-0 text-[#D8C78E]" />
              <label
                htmlFor={`crop-zoom-${activeTarget}`}
                className="text-[11px] font-medium text-[#D8C78E] shrink-0"
              >
                {activeTarget === 'desktop' ? 'Desktop' : 'Mobile'} Zoom
              </label>
              <input
                id={`crop-zoom-${activeTarget}`}
                type="range"
                min={1}
                max={2}
                step={0.05}
                value={activeCrop.zoom}
                onChange={(e) =>
                  setActiveCrop({ ...activeCrop, zoom: parseFloat(e.target.value) })
                }
                className="flex-1 accent-[#C5B378] cursor-pointer"
              />
              <span className="font-mono text-[11px] text-white tabular-nums w-10 text-right">
                {activeCrop.zoom.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>

        {/* Right: Side-by-Side Live Desktop & Mobile Output Previews */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {/* Desktop Widescreen Live Preview */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTarget('desktop')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTarget('desktop');
              }
            }}
            className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
              activeTarget === 'desktop'
                ? 'border-[#D8C78E] bg-[#0E423E]/70 ring-1 ring-[#D8C78E]/50'
                : 'border-[#C5B378]/20 bg-[#092E2B]/60 hover:border-[#C5B378]/50'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#D8C78E]">
                <Monitor className="h-3.5 w-3.5" />
                Desktop Preview
              </span>
              <span className="font-mono text-[10px] text-[#E6ECEB]/70 tabular-nums">
                {Math.round(resolvedDesktop.x)}% · {Math.round(resolvedDesktop.y)}% ({resolvedDesktop.zoom.toFixed(1)}x)
              </span>
            </div>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded border border-[#C5B378]/25 bg-[#041513]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Desktop crop preview"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${resolvedDesktop.x}% ${resolvedDesktop.y}%`,
                  transformOrigin: `${resolvedDesktop.x}% ${resolvedDesktop.y}%`,
                  transform: `scale(${resolvedDesktop.zoom})`,
                }}
              />
            </div>
          </div>

          {/* Mobile Portrait Live Preview */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTarget('mobile')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTarget('mobile');
              }
            }}
            className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
              activeTarget === 'mobile'
                ? 'border-[#D8C78E] bg-[#0E423E]/70 ring-1 ring-[#D8C78E]/50'
                : 'border-[#C5B378]/20 bg-[#092E2B]/60 hover:border-[#C5B378]/50'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#D8C78E]">
                <Smartphone className="h-3.5 w-3.5" />
                Mobile Preview
              </span>
              <span className="font-mono text-[10px] text-[#E6ECEB]/70 tabular-nums">
                {Math.round(resolvedMobile.x)}% · {Math.round(resolvedMobile.y)}% ({resolvedMobile.zoom.toFixed(1)}x)
              </span>
            </div>
            <div className="mx-auto relative aspect-[9/14] h-40 overflow-hidden rounded-lg border-2 border-[#C5B378]/35 bg-[#041513]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Mobile crop preview"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${resolvedMobile.x}% ${resolvedMobile.y}%`,
                  transformOrigin: `${resolvedMobile.x}% ${resolvedMobile.y}%`,
                  transform: `scale(${resolvedMobile.zoom})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
