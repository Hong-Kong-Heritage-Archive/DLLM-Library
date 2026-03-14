# Client Utilities

## imageUpload.ts

Centralized image upload utility for handling batch image uploads to Google Cloud Storage (GCS).

### Key Features

- **Batch Processing**: Handles multiple image uploads simultaneously
- **Progress Tracking**: Provides individual file and overall upload progress callbacks
- **Error Handling**: Tracks and reports upload errors per file
- **Type Safety**: Full TypeScript support with comprehensive interfaces

### Interfaces

```typescript
interface ImagePreview extends ProcessedImage {
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  gsUrl?: string;
  isExisting?: boolean;
}

interface UploadCallbacks {
  folder: string;
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
  onFileComplete?: (fileIndex: number, gsUrl: string) => void;
  onOverallProgress?: (percentage: number) => void;
  onError?: (fileIndex: number, error: string) => void;
}
```

### Main Functions

#### `uploadImages()`

Uploads multiple images to GCS with progress tracking.

**Parameters:**

- `apolloClient`: Apollo Client instance for GraphQL operations
- `imageFiles`: Array of ImagePreview objects to upload
- `callbacks`: Configuration object with folder path and optional callbacks

**Returns:** `Promise<string[]>` - Array of GCS URLs for uploaded images

**Example:**

```typescript
const gsUrls = await uploadImages(apolloClient, newImages, {
  folder: "items",
  onFileProgress: (fileIndex, progress) => {
    console.log(`File ${fileIndex}: ${progress.percentage}%`);
  },
  onFileComplete: (fileIndex, gsUrl) => {
    console.log(`File ${fileIndex} uploaded to: ${gsUrl}`);
  },
  onOverallProgress: (percentage) => {
    console.log(`Overall progress: ${percentage}%`);
  },
  onError: (fileIndex, error) => {
    console.error(`File ${fileIndex} failed: ${error}`);
  },
});
```

#### `separateExistingAndNewImages()`

Separates existing images (already uploaded) from new images that need uploading.

**Parameters:**

- `imageFiles`: Array of ImagePreview objects

**Returns:** `{ existing: ImagePreview[], new: ImagePreview[] }`

#### `combineImageUrls()`

Combines existing image URLs with newly uploaded URLs in the correct order.

**Parameters:**

- `existingImages`: Array of existing ImagePreview objects
- `newImageUrls`: Array of newly uploaded GCS URLs

**Returns:** `string[]` - Combined array of all image URLs

### Usage in Components

This utility is used across multiple components:

- **ItemForm**: Upload item images to `items/` folder
- **NewsForm**: Upload news images to `news/` folder
- **BinderForm**: Upload binder images to `binders/{binderId}/` folder
- **ReceiptImageUploadDialog**: Upload receipt images to `receipts/` folder

### Migration Notes

This utility was created to eliminate code duplication across components. Previously, each component had its own `uploadImages` function with similar logic. Now all components use this centralized implementation for consistency and maintainability.
