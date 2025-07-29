// services/gcsUploadService.ts
import { ApolloClient, gql } from "@apollo/client";

export interface SignedUrlResponse {
  signedUrl: string;
  gsUrl: string;
  expires: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const GENERATE_SIGNED_URL_MUTATION = gql`
  mutation GenerateSignedUrl(
    $fileName: String!
    $contentType: String!
    $folder: String
  ) {
    generateSignedUrl(
      fileName: $fileName
      contentType: $contentType
      folder: $folder
    ) {
      signedUrl
      gsUrl
      expires
    }
  }
`;

export class GCSUploadService {
  private apolloClient: ApolloClient<any>;

  constructor(apolloClient: ApolloClient<any>) {
    this.apolloClient = apolloClient;
  }

  async getSignedUrl(
    fileName: string,
    contentType: string,
    folder: string
  ): Promise<SignedUrlResponse> {
    try {
      const result = await this.apolloClient.mutate({
        mutation: GENERATE_SIGNED_URL_MUTATION,
        variables: {
          fileName,
          contentType,
          folder,
        },
      });

      if (result.errors) {
        throw new Error(
          `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`
        );
      }

      if (!result.data?.generateSignedUrl) {
        throw new Error("No signed URL data returned");
      }

      return result.data.generateSignedUrl;
    } catch (error) {
      console.error("GraphQL signed URL generation error:", error);
      throw new Error(`Failed to get signed URL: ${error}`);
    }
  }

  async uploadFile(
    file: File,
    signedUrl: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(
            new Error(
              `Upload failed with status ${xhr.status}: ${xhr.statusText}`
            )
          );
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed due to network error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timed out"));
      });

      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      //xhr.setRequestHeader("Content-Type", "application/octet-stream");
      // Set timeout (5 minutes)
      xhr.timeout = 5 * 60 * 1000;

      xhr.send(file);
    });
  }

  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const baseName = originalName.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_");
    return `${timestamp}_${randomString}_${baseName}.jpg`;
  }

  async uploadToGCS(
    file: File,
    folder: string = "news",
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const fileName = this.generateFileName(file.name);

    try {
      // Get signed URL via GraphQL
      const signedUrlData = await this.getSignedUrl(
        fileName,
        file.type,
        folder
      );

      // Upload file directly to GCS
      await this.uploadFile(file, signedUrlData.signedUrl, onProgress);

      return signedUrlData.gsUrl;
    } catch (error) {
      console.error("GCS upload error:", error);
      throw error;
    }
  }

  async batchUploadToGCS(
    files: File[],
    folder: string = "news",
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, gsUrl: string) => void
  ): Promise<string[]> {
    const uploadedGsUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const gsUrl = await this.uploadToGCS(files[i], folder, (progress) => {
          if (onProgress) {
            onProgress(i, progress);
          }
        });

        uploadedGsUrls.push(gsUrl);

        if (onFileComplete) {
          onFileComplete(i, gsUrl);
        }

        console.log(`File ${i + 1}/${files.length} uploaded: ${gsUrl}`);
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}:`, error);
        throw new Error(`Failed to upload file ${files[i].name}: ${error}`);
      }
    }

    return uploadedGsUrls;
  }
}
