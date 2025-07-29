/**
 * Image optimization utilities for performance
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  type: string;
  aspectRatio: number;
}

/**
 * Compress an image file for optimal performance
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maintainAspectRatio = true,
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate new dimensions
        if (maintainAspectRatio && (width > maxWidth || height > maxHeight)) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        } else {
          width = Math.min(width, maxWidth);
          height = Math.min(height, maxHeight);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        const mimeType =
          format === 'png'
            ? 'image/png'
            : format === 'webp'
              ? 'image/webp'
              : 'image/jpeg';

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image metadata without loading the full image
 */
export async function getImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    };

    img.onerror = () => reject(new Error('Failed to load image metadata'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a low-quality placeholder for blur effect
 */
export async function generateBlurDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Create a very small version for blur placeholder
      canvas.width = 10;
      canvas.height = 10;

      ctx?.drawImage(img, 0, 0, 10, 10);

      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.1);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () =>
      reject(new Error('Failed to generate blur placeholder'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalImageFormat(): 'webp' | 'jpeg' {
  return supportsWebP() ? 'webp' : 'jpeg';
}

/**
 * Calculate optimal image dimensions based on device and connection
 */
export function getOptimalImageSize(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = window.devicePixelRatio || 1,
  isSlowConnection: boolean = false
): { width: number; height: number } {
  // Adjust for device pixel ratio but cap at 2x for performance
  const effectivePixelRatio = Math.min(
    devicePixelRatio,
    isSlowConnection ? 1 : 2
  );

  const targetWidth = containerWidth * effectivePixelRatio;
  const targetHeight = containerHeight * effectivePixelRatio;

  // Maintain aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let width, height;

  if (aspectRatio > containerAspectRatio) {
    // Image is wider than container
    width = Math.min(targetWidth, originalWidth);
    height = width / aspectRatio;
  } else {
    // Image is taller than container
    height = Math.min(targetHeight, originalHeight);
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch preload multiple images with concurrency control
 */
export async function preloadImages(
  urls: string[],
  maxConcurrent: number = 3
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    chunks.push(urls.slice(i, i + maxConcurrent));
  }

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage));
  }
}
