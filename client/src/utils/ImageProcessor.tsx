// utils/imageProcessor.ts
export interface ProcessedImage {
  file: File;
  originalFile: File;
  url: string;
  width: number;
  height: number;
  size: number;
}

export const processImage = (
  file: File,
  maxSize: number = 2000,
  quality: number = 0.9,
  format: string = "image/png"
): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.width,
        img.height,
        maxSize
      );

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and scale the image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to process image"));
            return;
          }

          // Create new file with processed image
          const processedFile = new File(
            [blob],
            `${file.name.split(".")[0]}.png`,
            { type: "image/png" }
          );

          const processedUrl = URL.createObjectURL(blob);

          resolve({
            file: processedFile,
            originalFile: file,
            url: processedUrl,
            width: newWidth,
            height: newHeight,
            size: blob.size,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxSize: number
): { width: number; height: number } => {
  if (originalWidth <= maxSize && originalHeight <= maxSize) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    return {
      width: maxSize,
      height: Math.round(maxSize / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxSize * aspectRatio),
      height: maxSize,
    };
  }
};

export const batchProcessImages = async (
  files: File[],
  maxSize: number = 2000,
  quality: number = 0.9,
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessedImage[]> => {
  const processedImages: ProcessedImage[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const processed = await processImage(files[i], maxSize, quality);
      processedImages.push(processed);

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to process image ${files[i].name}:`, error);
      throw error;
    }
  }

  return processedImages;
};
