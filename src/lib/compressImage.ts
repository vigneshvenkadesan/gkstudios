import imageCompression, { type Options } from 'browser-image-compression';

export interface CompressImageResult {
  file: File;
  originalSize: number;
  finalSize: number;
  wasCompressed: boolean;
}

export interface FastAiAssetResult {
  file: File;
  dimensions: string;
}

const BYTES_PER_MB = 1024 * 1024;

function ensureNamedFile(blobOrFile: Blob, fallbackName: string, lastModified: number): File {
  if (blobOrFile instanceof File && blobOrFile.name) {
    return blobOrFile;
  }
  return new File([blobOrFile], fallbackName, {
    type: blobOrFile.type || 'image/jpeg',
    lastModified,
  });
}

function withJpgExtension(filename: string): string {
  const dotIdx = filename.lastIndexOf('.');
  return dotIdx > 0 ? `${filename.slice(0, dotIdx)}.jpg` : `${filename}.jpg`;
}

function formatDimensionsLabel(w: number, h: number): string {
  if (w <= 0 || h <= 0) return '';
  const orientation =
    w > h * 1.38 ? 'wide landscape' : h > w * 1.12 ? 'tall portrait' : 'balanced 4:3';
  return `${w}x${h} (${orientation})`;
}

async function runLibraryCompression(file: File, options: Options): Promise<File> {
  try {
    const compressed = await imageCompression(file, options);
    return ensureNamedFile(compressed, file.name, file.lastModified);
  } catch (workerError) {
    if (options.useWebWorker) {
      const fallback = await imageCompression(file, { ...options, useWebWorker: false });
      return ensureNamedFile(fallback, file.name, file.lastModified);
    }
    throw workerError;
  }
}

async function findHighestQualityUnderLimit(
  sourceFile: File,
  targetMaxBytes: number,
  maxWidthOrHeight?: number
): Promise<File | null> {
  const [, canvas] = await imageCompression.drawFileInCanvas(sourceFile, {
    maxWidthOrHeight,
  });

  const targetMime =
    sourceFile.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  const targetName =
    targetMime === 'image/jpeg' && sourceFile.type !== 'image/jpeg'
      ? withJpgExtension(sourceFile.name)
      : sourceFile.name;

  const topCandidate = ensureNamedFile(
    await imageCompression.canvasToFile(
      canvas,
      targetMime,
      targetName,
      sourceFile.lastModified,
      0.96
    ),
    targetName,
    sourceFile.lastModified
  );

  if (topCandidate.size <= targetMaxBytes) {
    return topCandidate;
  }

  let low = 0.68;
  let high = 0.96;
  let bestFile: File | null = null;

  for (let step = 0; step < 7; step++) {
    const mid = (low + high) / 2;
    const candidate = ensureNamedFile(
      await imageCompression.canvasToFile(
        canvas,
        targetMime,
        targetName,
        sourceFile.lastModified,
        mid
      ),
      targetName,
      sourceFile.lastModified
    );

    if (candidate.size <= targetMaxBytes) {
      bestFile = candidate;
      low = mid;
      if (candidate.size >= targetMaxBytes * 0.93) {
        break;
      }
    } else {
      high = mid;
    }
  }

  return bestFile;
}

/**
 * Keeps images <= maxSizeMB untouched, and compresses larger images while retaining
 * maximum quality right near the maxSizeMB budget (rather than over-compressing to <1-2 MB).
 */
export async function compressToMaxSize(
  file: File,
  maxSizeMB = 4
): Promise<CompressImageResult> {
  const originalSize = file.size;
  const maxBytes = maxSizeMB * BYTES_PER_MB;

  if (originalSize <= maxBytes) {
    return {
      file,
      originalSize,
      finalSize: originalSize,
      wasCompressed: false,
    };
  }

  const targetMaxBytes = Math.floor(maxBytes * 0.992);

  try {
    const dimensionCandidates: Array<number | undefined> =
      originalSize <= 14 * BYTES_PER_MB
        ? [undefined, 4096, 3200, 2600]
        : [4096, 3400, 2800, 2200];

    for (const maxDim of dimensionCandidates) {
      const candidate = await findHighestQualityUnderLimit(
        file,
        targetMaxBytes,
        maxDim
      );
      if (candidate && candidate.size <= maxBytes) {
        return {
          file: candidate,
          originalSize,
          finalSize: candidate.size,
          wasCompressed: true,
        };
      }
    }
  } catch (canvasError) {
    console.warn('Precision canvas compression fallback triggered:', canvasError);
  }

  const fallbackFile = await runLibraryCompression(file, {
    maxSizeMB: maxSizeMB * 0.96,
    maxWidthOrHeight: 3200,
    useWebWorker: true,
    initialQuality: 0.92,
    preserveExif: true,
  });

  return {
    file: fallbackFile,
    originalSize,
    finalSize: fallbackFile.size,
    wasCompressed: true,
  };
}

/**
 * Hardware-accelerated single-pass downscale (~512px, ~40-80 KB JPEG) + dimensions measurement
 * so AI caption analysis fires in milliseconds before heavy 4 MB compression finishes.
 */
export async function prepareFastAiAsset(file: File): Promise<FastAiAssetResult> {
  const aiTargetName = withJpgExtension(file.name);
  const maxDim = 512;

  if (typeof createImageBitmap === 'function') {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      const { width: w, height: h } = bitmap;
      const dimensions = formatDimensionsLabel(w, h);

      if (file.size <= 120 * 1024 && file.type.startsWith('image/')) {
        bitmap.close();
        return { file, dimensions };
      }

      const scale = Math.min(1, maxDim / Math.max(w, h));
      const targetW = Math.max(1, Math.round(w * scale));
      const targetH = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        bitmap.close();
        bitmap = null;

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.72)
        );
        if (blob) {
          return {
            file: ensureNamedFile(blob, aiTargetName, file.lastModified),
            dimensions,
          };
        }
      }
    } catch {
      // Fall through cleanly to library canvas fallback
    } finally {
      if (bitmap) bitmap.close();
    }
  }

  const [img, canvas] = await imageCompression.drawFileInCanvas(file, {
    maxWidthOrHeight: maxDim,
  });
  const w = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const h = 'naturalHeight' in img ? img.naturalHeight : img.height;
  const lightBlob = await imageCompression.canvasToFile(
    canvas,
    'image/jpeg',
    aiTargetName,
    file.lastModified,
    0.72
  );
  return {
    file: ensureNamedFile(lightBlob, aiTargetName, file.lastModified),
    dimensions: formatDimensionsLabel(w, h),
  };
}

export async function compressForAiAnalysis(file: File): Promise<File> {
  const { file: fastFile } = await prepareFastAiAsset(file);
  return fastFile;
}

export function formatMegabytes(bytes: number): string {
  const mb = bytes / BYTES_PER_MB;
  if (mb >= 0.01) {
    return `${mb.toFixed(2)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
