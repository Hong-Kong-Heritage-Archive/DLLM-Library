import sharp from "sharp";
import axios from "axios";
import firebase from "firebase-admin";
import { UploadBufferToGCS, GetPublicUrlForGSFile } from "../platform";

export interface ThumbnailConfig {
  /**
   * Scale factor for thumbnail generation (e.g., 0.25 for 1/4 size, 0.5 for 1/2 size)
   * @default 0.25
   */
  scaleFactor?: number;

  /**
   * JPEG quality (1-100)
   * @default 40
   */
  quality?: number;

  /**
   * Maximum width in pixels (overrides scaleFactor if specified)
   */
  maxWidth?: number;

  /**
   * Maximum height in pixels (overrides scaleFactor if specified)
   */
  maxHeight?: number;

  /**
   * Custom upload path prefix (e.g., 'thumbnails', 'previews')
   * @default 'thumbnails'
   */
  uploadPrefix?: string;

  /**
   * Filename suffix to add before extension
   * @default '_thumbnail'
   */
  filenameSuffix?: string;

  /**
   * Whether to preserve same directory structure as original
   * @default true
   */
  preserveDirectory?: boolean;

  /**
   * Output format
   * @default 'jpeg'
   */
  format?: "jpeg" | "png" | "webp";
}

export interface ThumbnailResult {
  /**
   * Google Storage URL (gs://)
   */
  gs: string;

  /**
   * Public HTTP URL
   */
  url: string;

  /**
   * Generated thumbnail dimensions
   */
  width: number;
  height: number;

  /**
   * File size in bytes
   */
  size: number;
}

/**
 * Downloads an image from URL or Google Storage
 * @param imageUrl - HTTP URL or gs:// URL
 * @returns Buffer containing the image data
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith("gs://")) {
    // Handle Google Storage URL
    const gsPath = imageUrl.replace("gs://", "");
    const pathParts = gsPath.split("/");
    const bucketName = pathParts[0];
    const filePath = pathParts.slice(1).join("/");

    const bucket = firebase.storage().bucket(bucketName);
    const file = bucket.file(filePath);

    const [fileBuffer] = await file.download();
    return fileBuffer;
  } else {
    // Handle HTTP URL
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 second timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    });
    return Buffer.from(response.data);
  }
}

/**
 * Extract filename from URL (HTTP or gs://)
 * @param url - The URL to extract filename from
 * @returns The filename with extension
 */
export function extractFileNameFromUrl(url: string): string {
  try {
    if (url.startsWith("gs://")) {
      const pathParts = url.split("/");
      return pathParts[pathParts.length - 1];
    } else {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      return pathParts[pathParts.length - 1] || `image_${Date.now()}.jpg`;
    }
  } catch (error) {
    console.error(`Error extracting filename from URL: ${url}`, error);
    return `image_${Date.now()}.jpg`;
  }
}

/**
 * Generate a new filename with suffix before extension
 * @param originalFileName - Original filename
 * @param suffix - Suffix to add (default: '_thumbnail')
 * @param newExtension - Optional new extension (without dot)
 * @returns New filename with suffix
 */
export function generateThumbnailFileName(
  originalFileName: string,
  suffix: string = "_thumbnail",
  newExtension?: string
): string {
  const lastDotIndex = originalFileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    // No extension found, append suffix and optional extension
    const ext = newExtension ? `.${newExtension}` : ".jpg";
    return `${originalFileName}${suffix}${ext}`;
  }

  const nameWithoutExt = originalFileName.substring(0, lastDotIndex);
  const originalExt = originalFileName.substring(lastDotIndex + 1);
  const ext = newExtension || originalExt;

  return `${nameWithoutExt}${suffix}.${ext}`;
}

/**
 * Get upload path for thumbnail based on original image URL
 * @param originalUrl - Original image URL
 * @param thumbnailFileName - Generated thumbnail filename
 * @param config - Thumbnail configuration
 * @returns Upload path for the thumbnail
 */
export function getThumbnailUploadPath(
  originalUrl: string,
  thumbnailFileName: string,
  config: ThumbnailConfig = {}
): string {
  const { uploadPrefix = "thumbnails", preserveDirectory = true } = config;

  if (originalUrl.startsWith("gs://") && preserveDirectory) {
    // Use same directory structure as original
    const gsPath = originalUrl.replace("gs://", "");
    const pathParts = gsPath.split("/");
    const originalPath = pathParts.slice(1).join("/");
    const pathDir = originalPath.substring(0, originalPath.lastIndexOf("/"));
    return `${pathDir}/${thumbnailFileName}`;
  } else {
    // Use specified upload prefix
    return `${uploadPrefix}/${thumbnailFileName}`;
  }
}

/**
 * Generate thumbnail for an image
 * @param imageUrl - Original image URL (HTTP or gs://)
 * @param config - Thumbnail configuration options
 * @returns Promise with thumbnail result or null if failed
 */
export async function generateThumbnail(
  imageUrl: string,
  config: ThumbnailConfig = {}
): Promise<ThumbnailResult | null> {
  const {
    scaleFactor = 0.25,
    quality = 40,
    maxWidth,
    maxHeight,
    uploadPrefix = "thumbnails",
    filenameSuffix = "_thumbnail",
    preserveDirectory = true,
    format = "jpeg",
  } = config;

  try {
    console.log(`Generating thumbnail for image: ${imageUrl}`);

    // Download the original image
    const imageBuffer = await downloadImage(imageUrl);

    // Get original image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      console.error(`Could not get image dimensions for: ${imageUrl}`);
      return null;
    }

    console.log(
      `Original image dimensions: ${metadata.width}x${metadata.height}`
    );

    // Calculate new dimensions
    let newWidth: number;
    let newHeight: number;

    if (maxWidth || maxHeight) {
      // Use explicit max dimensions
      newWidth = maxWidth || Math.floor(metadata.width * scaleFactor);
      newHeight = maxHeight || Math.floor(metadata.height * scaleFactor);
    } else {
      // Use scale factor
      newWidth = Math.floor(metadata.width * scaleFactor);
      newHeight = Math.floor(metadata.height * scaleFactor);
    }

    console.log(`Thumbnail dimensions: ${newWidth}x${newHeight}`);

    // Generate thumbnail with specified format
    let thumbnailPipeline = image.resize(newWidth, newHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Apply format-specific options
    let mimeType: string;
    switch (format) {
      case "png":
        thumbnailPipeline = thumbnailPipeline.png({
          quality: quality,
          compressionLevel: 9,
        });
        mimeType = "image/png";
        break;
      case "webp":
        thumbnailPipeline = thumbnailPipeline.webp({ quality: quality });
        mimeType = "image/webp";
        break;
      case "jpeg":
      default:
        thumbnailPipeline = thumbnailPipeline.jpeg({ quality: quality });
        mimeType = "image/jpeg";
        break;
    }

    const thumbnailBuffer = await thumbnailPipeline.toBuffer();

    // Get actual dimensions after resize
    const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();
    const actualWidth = thumbnailMetadata.width || newWidth;
    const actualHeight = thumbnailMetadata.height || newHeight;
    const fileSize = thumbnailBuffer.length;

    // Generate thumbnail filename
    const originalFileName = extractFileNameFromUrl(imageUrl);
    const thumbnailFileName = generateThumbnailFileName(
      originalFileName,
      filenameSuffix,
      format === "jpeg" ? "jpg" : format
    );

    // Determine upload path
    const uploadPath = getThumbnailUploadPath(imageUrl, thumbnailFileName, {
      uploadPrefix,
      preserveDirectory,
    });

    // Upload to GCS
    const gsUrl = await UploadBufferToGCS(
      uploadPath,
      thumbnailBuffer,
      mimeType
    );
    const publicUrl = await GetPublicUrlForGSFile(gsUrl);

    console.log(
      `Thumbnail generated successfully: ${gsUrl} (${actualWidth}x${actualHeight}, ${fileSize} bytes)`
    );

    return {
      gs: gsUrl,
      url: publicUrl,
      width: actualWidth,
      height: actualHeight,
      size: fileSize,
    };
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Generate thumbnails for multiple images in parallel
 * @param imageUrls - Array of image URLs
 * @param config - Thumbnail configuration options
 * @param progressCallback - Optional callback for progress updates
 * @returns Promise with array of thumbnail results (null for failed items)
 */
export async function generateThumbnails(
  imageUrls: string[],
  config: ThumbnailConfig = {},
  progressCallback?: (completed: number, total: number) => void
): Promise<(ThumbnailResult | null)[]> {
  const total = imageUrls.length;
  let completed = 0;

  const results = await Promise.all(
    imageUrls.map(async (url) => {
      const result = await generateThumbnail(url, config);
      completed++;
      if (progressCallback) {
        progressCallback(completed, total);
      }
      return result;
    })
  );

  return results;
}

/**
 * Get image metadata without downloading the entire file
 * @param imageUrl - Image URL (HTTP or gs://)
 * @returns Image metadata
 */
export async function getImageMetadata(imageUrl: string): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
} | null> {
  try {
    const buffer = await downloadImage(imageUrl);
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return null;
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || "unknown",
      size: buffer.length,
    };
  } catch (error) {
    console.error(`Failed to get image metadata for ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Resize image to specific dimensions
 * @param imageUrl - Original image URL
 * @param width - Target width
 * @param height - Target height
 * @param config - Additional configuration
 * @returns Resized image result
 */
export async function resizeImage(
  imageUrl: string,
  width: number,
  height: number,
  config: Partial<ThumbnailConfig> = {}
): Promise<ThumbnailResult | null> {
  return generateThumbnail(imageUrl, {
    ...config,
    maxWidth: width,
    maxHeight: height,
  });
}
