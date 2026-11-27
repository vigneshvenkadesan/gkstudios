import imageCompression, { type Options } from 'browser-image-compression';

export interface CompressImageResult {
  file: File;
  originalSize: number;
  finalSize: number;
  wasCompressed: boolean;
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

async function runCompressionPass(file: File, options: Options): Promise<File> {
  try {
    const compressed = await imageCompression(file, options);
    return ensureNamedFile(compressed, file.name, file.lastModified);
  } catch (workerError) {
    if (options.useWebWorker) {
      // Fall back to main-thread compression if worker script is blocked by network/CSP
      const fallback = await imageCompression(file, { ...options, useWebWorker: false });
      return ensureNamedFile(fallback, file.name, file.lastModified);
    }
    throw workerError;
  }
}

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

  let compressedFile = await runCompressionPass(file, {
    maxSizeMB,
    maxWidthOrHeight: 3200,
    useWebWorker: true,
    initialQuality: 0.94,
    preserveExif: true,
  });

  // Safety pass if an ultra-dense lossless asset still sits slightly above maxBytes
  if (compressedFile.size > maxBytes) {
    const targetName =
      compressedFile.type === 'image/png' ? withJpgExtension(file.name) : compressedFile.name;
    const secondPass = await runCompressionPass(compressedFile, {
      maxSizeMB: Math.max(0.5, maxSizeMB * 0.94),
      maxWidthOrHeight: 2800,
      useWebWorker: true,
      initialQuality: 0.89,
      preserveExif: true,
      fileType: compressedFile.type === 'image/png' ? 'image/jpeg' : undefined,
    });
    compressedFile = ensureNamedFile(secondPass, targetName, file.lastModified);
  }

  return {
    file: compressedFile,
    originalSize,
    finalSize: compressedFile.size,
    wasCompressed: true,
  };
}

export function formatMegabytes(bytes: number): string {
  const mb = bytes / BYTES_PER_MB;
  if (mb >= 0.01) {
    return `${mb.toFixed(2)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
