import { db, GetPublicUrlForGSFile } from "./platform";
import {
  Item,
  Location,
  LocationInput,
  ItemCondition,
  ItemStatus,
  Language,
  User,
} from "./generated/graphql";
import * as geofire from "geofire-common";
import { MapService, createMapService } from "./mapService";
import { CategoryService } from "./categoryService";
import firebase from "firebase-admin";
import { UploadBufferToGCS } from "./platform";
import { Timestamp } from "firebase-admin/firestore";
import sharp from "sharp";
import axios from "axios";

type ItemModel = Omit<Item, "id" | "createdAt" | "updatedAt"> & {
  geohash?: string;
  created: Timestamp;
  updated: Timestamp;
  gsImageUrls?: string[];
  gsThumbnailUrls?: string[];
};

export class ItemService {
  private mapService: MapService;
  private categoryService: CategoryService;
  private userService?: any; // Will be set after initialization

  constructor(categoryService: CategoryService) {
    this.mapService = createMapService();
    this.categoryService = categoryService;
  }

  setUserService(userService: any) {
    this.userService = userService;
  }

  async itemsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    category: string[],
    status: string,
    keyword: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db.collection("items").where("geohash", ">=", "");
    if (category)
      query = query.where("category", "array-contains-any", category);
    if (status) query = query.where("status", "==", status);
    if (keyword)
      query = query
        .where("name", ">=", keyword)
        .where("name", "<=", keyword + "\uf8ff");
    const items = this.mapService.getLocationsByRadius(
      query,
      { latitude, longitude },
      radiusKm,
      limit,
      offset
    );
    const filteredItems: Item[] = [];
    await Promise.all(
      (
        await items
      ).map(async (item) => {
        const rv = await this._itemModelToItem(item);
        filteredItems.push(rv);
      })
    );
    return filteredItems;
  }

  async itemsOnLoanByUser(
    userId: string,
    category: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db
      .collection("items")
      .where("ownerId", "==", userId)
      .where("holderId", "!=", null)
      .orderBy("holderId")
      .orderBy("updated", "desc");
    if (category && category.length > 0)
      query = query.where("category", "array-contains-any", category);
    if (status) query = query.where("status", "==", status);
    if (keyword)
      query = query
        .where("name", ">=", keyword)
        .where("name", "<=", keyword + "\uf8ff");
    const snapshot = await query.limit(limit).offset(offset).get();
    const results: Item[] = [];
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const item = await this._itemQueryToItem(doc);
        results.push(item);
      })
    );
    return results;
  }

  async itemById(itemId: string): Promise<Item | null> {
    const itemDoc = await db.collection("items").doc(itemId).get();
    if (!itemDoc.exists) return null;
    let data = itemDoc.data();

    if (!data) return null;
    data.id = itemId;
    const item: Item = await this._itemModelToItem(data);
    return item;
  }

  // this function should be limited to internal use only
  async itemsByIds(itemIds: string[]): Promise<Item[]> {
    if (!itemIds || itemIds.length === 0) {
      return [];
    }

    // Firestore 'in' queries are limited (currently 30 clauses).
    // If you expect more IDs, you'll need to batch the requests.
    const MAX_IDS_PER_QUERY = 30;
    const results: Item[] = [];

    for (let i = 0; i < itemIds.length; i += MAX_IDS_PER_QUERY) {
      const batchIds = itemIds.slice(i, i + MAX_IDS_PER_QUERY);
      if (batchIds.length > 0) {
        const snapshot = await db
          .collection("items")
          .where(firebase.firestore.FieldPath.documentId(), "in", batchIds)
          .get();

        await Promise.all(
          snapshot.docs.map(async (doc) => {
            const item = await this._itemQueryToItem(doc);
            results.push(item);
          })
        );
      }
    }
    return results;
  }

  async itemsByUser(
    userId: string,
    category: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0,
    isExchangePointItem: boolean = false
  ): Promise<Item[]> {
    if (isExchangePointItem) {
      if (!this.userService) {
        throw new Error("UserService not available for exchange point items");
      }

      const cachedItemIds = await this.userService.getItemCaches(
        userId,
        category && category.length > 0 ? category : undefined,
        limit,
        offset
      );

      if (cachedItemIds.length === 0) {
        return [];
      }

      const items = await this.itemsByIds(cachedItemIds);

      console.debug(
        `Found ${items.length} cached items for exchange point user ${userId}`
      );

      return items;
    } else {
      let query = db
        .collection("items")
        .where("ownerId", "==", userId)
        .orderBy("updated", "desc");
      if (category && category.length > 0)
        query = query.where("category", "array-contains-any", category);
      if (status && status.length > 0)
        query = query.where("status", "==", status);
      if (keyword && keyword.length > 0)
        query = query
          .where("name", ">=", keyword)
          .where("name", "<=", keyword + "\uf8ff");
      const snapshot = await query.limit(limit).offset(offset).get();
      const results: Item[] = [];
      await Promise.all(
        snapshot.docs.map(async (doc) => {
          const item = await this._itemQueryToItem(doc);
          results.push(item);
        })
      );
      console.debug(
        `Found ${results.length} items for user ${userId} with category ${category}, status ${status}, keyword ${keyword}`
      );
      return results;
    }
  }

  async itemCategoriesByUser(userId: string) {
    // Assuming that we do not have anyone with large number of entries
    let items: Item[] = [];
    // Fetch all items by user by batch
    let batchSize = 20;
    let offset = 0;
    while (true) {
      const batchItems = await this.itemsByUser(
        userId,
        [],
        "",
        "",
        batchSize,
        offset
      );
      if (!batchItems || batchItems.length === 0) break;
      items.push(...batchItems);
      offset += batchSize;
      if (batchItems.length < batchSize) break;
      // console.log(`Fetched ${items.length} items for user ${userId} so far...`);
    }

    // Count categories
    const categoryCount: { [category: string]: number } = {};
    for (const item of items) {
      if (item.category && Array.isArray(item.category)) {
        for (const cat of item.category) {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        }
      }
    }
    return categoryCount;
  }

  async _itemQueryToItem(
    query: firebase.firestore.QueryDocumentSnapshot<
      firebase.firestore.DocumentData,
      firebase.firestore.DocumentData
    >
  ): Promise<Item> {
    const itemId = query.id;
    const data = query.data();
    data.id = itemId;
    const item: Item = await this._itemModelToItem(data);
    return item;
  }

  async _itemModelToItem(
    docData: firebase.firestore.DocumentData
  ): Promise<Item> {
    const itemId = docData.id;
    const data = docData as ItemModel;

    // validate thumbnail exist or not.
    // If there is images without thumbnails, we need to generate thumbnails.
    // upload back to same google storage and update the document
    if (data.images && data.images.length > 0 && !data.thumbnails) {
      console.log(`Generating thumbnails for item ${itemId}`);
      data.thumbnails = [];
      data.gsThumbnailUrls = [];

      let images = data.images;

      if (data.gsImageUrls && data.gsImageUrls.length > 0) {
        images = data.gsImageUrls;
      }

      const uploadPromises = images.map(async (image) => {
        const thumbnail = await this._generateThumbnail(image);
        if (thumbnail) {
          data.thumbnails!.push(thumbnail.url);
          data.gsThumbnailUrls!.push(thumbnail.gs);
        }
      });

      await Promise.all(uploadPromises);

      // Update the document in Firestore with the new thumbnail URLs
      if (data.thumbnails.length > 0) {
        try {
          const updateTime = Timestamp.now();
          await db.collection("items").doc(itemId).update({
            thumbnails: data.thumbnails,
            gsThumbnailUrls: data.gsThumbnailUrls,
            updated: updateTime,
          });
          data.updated = updateTime;
          console.log(
            `Updated item ${itemId} with ${data.thumbnails.length} thumbnails`
          );
        } catch (error) {
          console.error(
            `Failed to update item ${itemId} with thumbnails:`,
            error
          );
        }
      }
    }

    // check the description with hash tag or not. If not hash tag add all category with #
    let updateDescription = null;
    if (data.description) {
      if (!data.description.includes("#")) {
        updateDescription = `${data.description}\n\n#${data.category.join(
          " #"
        )}`;
      }
    } else {
      updateDescription = `#${data.category.join(" #")}`;
    }
    if (updateDescription !== null) {
      data.updated = Timestamp.now();
      await db.collection("items").doc(itemId).update({
        description: updateDescription,
        updated: data.updated,
      });
    }

    if (data.deposit === undefined || data.deposit === null) {
      data.deposit = 0; // default to 0 if not set
    }

    const item: Item = {
      id: itemId,
      createdAt: data.created.seconds * 1000,
      updatedAt: data.updated.seconds * 1000,
      ...data,
    };
    return item;
  }

  /* For creating a new item in resolver */
  async createItem(
    owner: User,
    name: string,
    description: string,
    condition: ItemCondition,
    category: string[],
    status: ItemStatus,
    images: string[],
    publishedYear: number,
    language: Language,
    deposit: number
  ): Promise<Item> {
    let hash = null;
    if (owner?.location) {
      hash = geofire.geohashForLocation([
        owner.location.latitude,
        owner.location.longitude,
      ]);
    }

    let gsImageUrls: string[] | null = null;
    let publicImageUrls: string[] | null = null;

    if (images && images.length > 0) {
      for (const image of images) {
        console.debug(`Processing image: ${image}`);
        if (image.startsWith("gs://")) {
          try {
            const publicUrl = await GetPublicUrlForGSFile(image);
            console.debug(`Public URL for image ${image}: ${publicUrl}`);
            if (!gsImageUrls) gsImageUrls = [];
            if (!publicImageUrls) publicImageUrls = [];
            publicImageUrls.push(publicUrl);
            gsImageUrls.push(image);
          } catch (error) {
            console.error(
              `Failed to get public URL for image ${image}:`,
              error
            );
          }
        } else {
          if (!publicImageUrls) publicImageUrls = [];
          publicImageUrls.push(image);
        }
      }
    }

    // Build itemData object, only including fields with valid values
    const itemData: ItemModel = {
      ownerId: owner.id,
      name: name,
      condition: condition,
      category: category,
      status: status,
      language: language,
      deposit: deposit,
      created: Timestamp.now(),
      updated: Timestamp.now(),
    };

    // Only add optional fields if they have valid values
    if (description) {
      itemData.description = description;
    }

    if (publicImageUrls && publicImageUrls.length > 0) {
      itemData.images = publicImageUrls;
    }

    if (gsImageUrls && gsImageUrls.length > 0) {
      itemData.gsImageUrls = gsImageUrls;
    }

    if (publishedYear) {
      itemData.publishedYear = publishedYear;
    }

    if (owner?.location) {
      itemData.location = owner.location;
    }

    if (hash) {
      itemData.geohash = hash;
    }

    const docRef = await db.collection("items").add(itemData);
    const itemId = docRef.id;
    const rv = {
      id: itemId,
      createdAt: itemData.created.seconds * 1000,
      updatedAt: itemData.updated.seconds * 1000,
      ...itemData,
    } as Item;

    // Update category counts
    if (category && category.length > 0) {
      // If user category is empty, then initialize it
      const itemCategory = await this.categoryService.getUserItemCategory(
        owner.id
      );
      if (!itemCategory || itemCategory.length === 0) {
        const categoryCount = await this.itemCategoriesByUser(owner.id);
        await this.categoryService.initializeUserCategories(
          owner.id,
          categoryCount
        );
      }
      await this.categoryService.upsertCategories(owner, category);
    }

    return rv;
  }

  async updateItem(
    itemId: string,
    user: User,
    name?: string,
    condition?: ItemCondition,
    category?: string[],
    status?: ItemStatus,
    publishedYear?: number,
    language?: Language,
    description?: string,
    images?: string[],
    deposit?: number
  ): Promise<Item> {
    // First, get the existing item to verify ownership
    const itemDoc = await db.collection("items").doc(itemId).get();
    if (!itemDoc.exists)
      throw new Error(`Item with ID ${itemId} does not exist`);

    let existingData = itemDoc.data() as ItemModel;

    // Verify the user owns this item
    if (existingData.ownerId !== user.id) {
      throw new Error(
        `User ${user.id} does not have permission to update item ${itemId}`
      );
    }

    // Process new images if provided
    let gsImageUrls: string[] = [];
    let publicImageUrls: string[] = [];

    if (images && images.length > 0) {
      for (const image of images) {
        console.debug(`Processing image: ${image}`);
        if (
          image.startsWith("gs://") &&
          !existingData.gsImageUrls?.includes(image)
        ) {
          try {
            let publicUrl = await GetPublicUrlForGSFile(image);
            console.debug(`Public URL for image ${image}: ${publicUrl}`);
            publicImageUrls.push(publicUrl);
            gsImageUrls.push(image);
          } catch (error) {
            console.error(
              `Failed to get public URL for image ${image}:`,
              error
            );
          }
        } else {
          publicImageUrls.push(image);
        }
      }
    }

    // Build update data object with only provided fields
    let updateData: Partial<ItemModel> = {
      updated: Timestamp.now(),
    };

    // Track category changes for later processing
    let categoryChanged = false;
    let oldCategories: string[] = [];
    let newCategories: string[] = [];

    // Only update fields that were provided
    if (name && existingData.name !== name) {
      updateData.name = name;
      existingData.name = name;
    }
    if (condition && existingData.condition !== condition) {
      updateData.condition = condition;
      existingData.condition = condition;
    }
    if (status && existingData.status !== status) {
      updateData.status = status;
      existingData.status = status;
    }
    if (description && existingData.description !== description) {
      updateData.description = description;
      existingData.description = description;
    }

    if (deposit !== undefined && existingData.deposit !== deposit) {
      updateData.deposit = deposit;
      existingData.deposit = deposit;
    }

    // Handle category changes with comparison
    if (category !== undefined) {
      const existingCategories = existingData.category || [];

      // Check if categories actually changed
      const categoriesEqual =
        existingCategories.length === category.length &&
        existingCategories.every((cat) => category.includes(cat)) &&
        category.every((cat) => existingCategories.includes(cat));

      if (!categoriesEqual) {
        categoryChanged = true;
        oldCategories = [...existingCategories];
        newCategories = [...category];

        updateData.category = category;
        existingData.category = category;

        console.debug(`Category change detected for item ${itemId}:`);
        console.debug(`  Old categories: [${oldCategories.join(", ")}]`);
        console.debug(`  New categories: [${newCategories.join(", ")}]`);
      }
    }

    if (publishedYear && existingData.publishedYear !== publishedYear) {
      updateData.publishedYear = publishedYear;
      existingData.publishedYear = publishedYear;
    }

    if (language && existingData.language !== language) {
      updateData.language = language;
      existingData.language = language;
    }

    // Handle images - either replace entirely or append to existing
    if (images !== undefined) {
      if (images.length === 0) {
        // Clear all images if empty array is provided
        updateData.images = [];
        updateData.gsImageUrls = [];
        existingData.images = [];
        existingData.gsImageUrls = [];
      } else {
        // Append to existing images
        let existingPublicImages = existingData.images || [];
        let existingGsImages = existingData.gsImageUrls || [];
        updateData.images = publicImageUrls;
        updateData.gsImageUrls = gsImageUrls;
        existingData.images = [...existingPublicImages, ...publicImageUrls];
        existingData.gsImageUrls = [...existingGsImages, ...gsImageUrls];
      }

      // Clear thumbnails when images change - they'll be regenerated on next read
      // updateData.thumbnails = [];
      // updateData.gsThumbnailUrls = [];
      // existingData.thumbnails = [];
      // existingData.gsThumbnailUrls = [];
    }

    // Update the document
    await db.collection("items").doc(itemId).update(updateData);

    // Handle category updates if categories were changed
    if (categoryChanged) {
      try {
        // Calculate categories to add and remove
        const categoriesToAdd = newCategories.filter(
          (cat) => !oldCategories.includes(cat)
        );
        const categoriesToRemove = oldCategories.filter(
          (cat) => !newCategories.includes(cat)
        );

        console.debug(`Categories to add: [${categoriesToAdd.join(", ")}]`);
        console.debug(
          `Categories to remove: [${categoriesToRemove.join(", ")}]`
        );

        // Process removals first to avoid potential conflicts
        if (categoriesToRemove.length > 0) {
          await this.categoryService.reduceCategories(user, categoriesToRemove);
          console.debug(
            `Removed categories: [${categoriesToRemove.join(", ")}]`
          );
        }

        // Then process additions
        if (categoriesToAdd.length > 0) {
          await this.categoryService.upsertCategories(user, categoriesToAdd);
          console.debug(`Added categories: [${categoriesToAdd.join(", ")}]`);
        }

        console.log(`Successfully updated categories for item ${itemId}`);
      } catch (error) {
        console.error(
          `Failed to update category counts for item ${itemId}:`,
          error
        );
        // Consider whether to throw here or just log the error
        // For now, we'll log and continue since the item update succeeded
      }
    }

    // Fetch and return the updated item
    const updatedItem = await this.itemById(itemId);
    if (!updatedItem) {
      throw new Error(`Failed to fetch updated item with ID ${itemId}`);
    }
    return updatedItem;
  }

  async updateUserItemsLocation(
    userId: string,
    location: Location | null
  ): Promise<void> {
    if (!userId) {
      console.warn("Cannot update items: Missing user ID");
      return;
    }

    if (!location) {
      console.debug(
        `Skipping location update for user ${userId}: No location provided`
      );
      return;
    }
    const MAX_UPDATE_ITERATIONS = 2;
    let updateTime = 0;
    while (updateTime !== MAX_UPDATE_ITERATIONS) {
      let query = db
        .collection("items")
        .where("ownerId", "==", userId)
        .where("holderId", "==", null);
      if (updateTime === 1) {
        query = db.collection("items").where("holderId", "==", userId);
      }
      let itemsSnapshot = await query.get();

      if (itemsSnapshot.empty) {
        console.debug(`No items found for user ${userId}`);
        return;
      }

      const updateData: any = {
        updated: Timestamp.now(),
        location: location,
        geohash: geofire.geohashForLocation([
          location.latitude,
          location.longitude,
        ]),
      };

      const batch = db.batch();
      itemsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, updateData);
      });
      await batch.commit();
      console.log(
        `Updated location for ${itemsSnapshot.size} items belonging to user ${userId}`
      );
      updateTime++;
    }
  }

  async updateItemHolder(itemId: string, holder: User): Promise<boolean> {
    if (!holder.location) {
      console.warn("Cannot update item holder: Missing location");
      return false;
    }
    const itemRef = db.collection("items").doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new Error(`Item with ID ${itemId} does not exist`);
    }
    const updateData = itemDoc.data() as ItemModel;

    if (holder && holder.id !== updateData?.ownerId) {
      updateData.holderId = holder.id;
    } else {
      updateData.holderId = null;
    }
    updateData.updated = Timestamp.now();
    if (holder.location) {
      updateData.location = holder.location;
      updateData.geohash = geofire.geohashForLocation([
        holder.location.latitude,
        holder.location.longitude,
      ]);
    }

    await itemRef.update(updateData);
    return true;
  }

  async recentAddedItems(
    limit: number = 20,
    offset: number = 0,
    category?: string[]
  ): Promise<Item[]> {
    let query = db.collection("items").orderBy("created", "desc");
    if (category && category.length > 0) {
      query = query.where("category", "array-contains-any", category);
    }
    const snapshot = await query.limit(limit).offset(offset).get();
    const items: Item[] = [];
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const rv = await this._itemQueryToItem(doc);
        items.push(rv);
      })
    );
    return items;
  }

  /**
   * Generate thumbnail for an image by downloading, resizing to 1/4 dimensions,
   * and uploading back to Google Cloud Storage
   * @param imageUrl - The original image URL (can be HTTP or GS URL)
   * @returns Promise with thumbnail URLs (gs and http) or null if failed
   */
  private async _generateThumbnail(
    imageUrl: string
  ): Promise<{ gs: string; url: string } | null> {
    try {
      console.log(`Generating thumbnail for image: ${imageUrl}`);

      // Download the original image
      let imageBuffer: Buffer;

      if (imageUrl.startsWith("gs://")) {
        // Handle Google Storage URL
        const gsPath = imageUrl.replace("gs://", "");
        const pathParts = gsPath.split("/");
        const bucketName = pathParts[0];
        const filePath = pathParts.slice(1).join("/");

        const bucket = firebase.storage().bucket(bucketName);
        const file = bucket.file(filePath);

        const [fileBuffer] = await file.download();
        imageBuffer = fileBuffer;
      } else {
        // Handle HTTP URL
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 30000, // 30 second timeout
        });
        imageBuffer = Buffer.from(response.data);
      }

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

      // Calculate new dimensions (1/4 of original)
      const newWidth = Math.floor(metadata.width / 4);
      const newHeight = Math.floor(metadata.height / 4);

      console.log(`Thumbnail dimensions: ${newWidth}x${newHeight}`);

      // Generate thumbnail
      const thumbnailBuffer = await image
        .resize(newWidth, newHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 40 }) // Convert to JPEG with 40% quality for smaller file size
        .toBuffer();

      // Generate thumbnail filename
      const originalFileName = this._extractFileNameFromUrl(imageUrl);
      const thumbnailFileName =
        this._generateThumbnailFileName(originalFileName);

      // Determine upload path
      let uploadPath: string;

      if (imageUrl.startsWith("gs://")) {
        // Use same bucket and path structure as original
        const gsPath = imageUrl.replace("gs://", "");
        const pathParts = gsPath.split("/");
        const originalPath = pathParts.slice(1).join("/");
        const pathDir = originalPath.substring(
          0,
          originalPath.lastIndexOf("/")
        );
        uploadPath = `${pathDir}/${thumbnailFileName}`;

        const gsUrl = await UploadBufferToGCS(
          uploadPath,
          thumbnailBuffer,
          "image/jpeg"
        );
        const publicUrl = await GetPublicUrlForGSFile(gsUrl);

        return { gs: gsUrl, url: publicUrl };
      } else {
        // Create upload path: thumbnails/{generated_filename}
        uploadPath = `thumbnails/${thumbnailFileName}`;
        const gsUrl = await UploadBufferToGCS(
          uploadPath,
          thumbnailBuffer,
          "image/jpeg"
        );
        const publicUrl = await GetPublicUrlForGSFile(gsUrl);

        console.log(`Thumbnail generated successfully: ${gsUrl}`);
        return { gs: gsUrl, url: publicUrl };
      }
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Extract filename from URL
   */
  private _extractFileNameFromUrl(url: string): string {
    try {
      if (url.startsWith("gs://")) {
        const pathParts = url.split("/");
        return pathParts[pathParts.length - 1];
      } else {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/");
        return pathParts[pathParts.length - 1] || "image.jpg";
      }
    } catch (error) {
      console.error(`Error extracting filename from URL: ${url}`, error);
      return `image_${Date.now()}.jpg`;
    }
  }

  /**
   * Generate thumbnail filename by adding 'thumbnail' before file extension
   */
  private _generateThumbnailFileName(originalFileName: string): string {
    const lastDotIndex = originalFileName.lastIndexOf(".");

    if (lastDotIndex === -1) {
      // No extension found, append thumbnail suffix
      return `${originalFileName}_thumbnail.jpg`;
    }

    const nameWithoutExt = originalFileName.substring(0, lastDotIndex);
    const extension = originalFileName.substring(lastDotIndex);

    // Convert to .jpg for thumbnails regardless of original format
    return `${nameWithoutExt}_thumbnail.jpg`;
  }
}
