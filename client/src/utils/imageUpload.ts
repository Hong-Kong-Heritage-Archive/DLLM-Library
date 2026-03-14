import { ApolloClient } from "@apollo/client";
import { GCSUploadService, UploadProgress } from "../services/UploadService";
import { ProcessedImage } from "./ImageProcessor";

export interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
  isExisting?: boolean;
}

export interface UploadImagesOptions {
  /**
   * Folder path in GCS where images will be uploaded
   */
  folder: string;

  /**
   * Callback function to update upload progress for individual files
   */
  onFileProgress?: (
    fileIndex: number,
    progress: UploadProgress,
    totalFiles: number
  ) => void;

  /**
   * Callback function when a file upload completes
   */
  onFileComplete?: (
    fileIndex: number,
    gsUrl: string,
    totalFiles: number
  ) => void;

  /**
   * Callback function to update overall upload progress
   */
  onOverallProgress?: (percentage: number) => void;

  /**
   * Callback function when upload fails
   */
  onError?: (fileIndex: number, error: string) => void;
}

/**
 * Upload multiple images to Google Cloud Storage
 * @param apolloClient - Apollo Client instance for making API calls
 * @param imagesToUpload - Array of ImagePreview objects to upload
 * @param options - Upload configuration options
 * @returns Promise with array of GCS URLs
 */
export async function uploadImages(
  apolloClient: ApolloClient<any>,
  imagesToUpload: ImagePreview[],
  options: UploadImagesOptions
): Promise<string[]> {
  const { folder, onFileProgress, onFileComplete, onOverallProgress, onError } =
    options;

  const gcsService = new GCSUploadService(apolloClient);
  const totalFiles = imagesToUpload.length;
  const uploadedGsUrls: string[] = [];

  try {
    const filesToUpload = imagesToUpload.map((img) => img.file);

    const gsUrls = await gcsService.batchUploadToGCS(
      filesToUpload,
      folder,
      (fileIndex: number, progress: UploadProgress) => {
        // Call file progress callback
        if (onFileProgress) {
          onFileProgress(fileIndex, progress, totalFiles);
        }

        // Calculate and call overall progress callback
        if (onOverallProgress) {
          const overallProgress = Math.round(
            ((fileIndex + progress.percentage / 100) / totalFiles) * 100
          );
          onOverallProgress(overallProgress);
        }
      },
      (fileIndex: number, gsUrl: string) => {
        uploadedGsUrls[fileIndex] = gsUrl;
        console.log(`File ${fileIndex + 1}/${totalFiles} uploaded: ${gsUrl}`);

        // Call file complete callback
        if (onFileComplete) {
          onFileComplete(fileIndex, gsUrl, totalFiles);
        }
      }
    );

    return gsUrls;
  } catch (error) {
    console.error("Batch upload error:", error);

    // Call error callback for all files that failed
    if (onError) {
      imagesToUpload.forEach((_, index) => {
        if (!uploadedGsUrls[index]) {
          onError(index, `Upload failed: ${error}`);
        }
      });
    }

    throw error;
  }
}

/**
 * Helper function to separate existing and new images from an array
 * @param images - Array of ImagePreview objects
 * @returns Object containing existing and new images separately
 */
export function separateExistingAndNewImages(images: ImagePreview[]): {
  existing: ImagePreview[];
  new: ImagePreview[];
} {
  return {
    existing: images.filter((img) => img.isExisting),
    new: images.filter((img) => !img.isExisting),
  };
}

/**
 * Get all image URLs (both existing GS URLs and newly uploaded URLs)
 * @param existingImages - Array of existing images
 * @param newImageUrls - Array of newly uploaded GS URLs
 * @returns Combined array of all image URLs
 */
export function combineImageUrls(
  existingImages: ImagePreview[],
  newImageUrls: string[]
): string[] {
  return [
    ...existingImages.map((img) => img.gsUrl || img.url),
    ...newImageUrls,
  ];
}
