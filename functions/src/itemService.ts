import { db, GetPublicUrlForGSFile } from "./platform";
import {
  Item,
  Location,
  LocationInput,
  ItemCondition,
  ItemStatus,
  Language,
  User,
  Role,
} from "./generated/graphql";
import * as geofire from "geofire-common";
import { MapService, createMapService } from "./mapService";
import { CategoryService } from "./categoryService";
import firebase from "firebase-admin";
import { UploadBufferToGCS } from "./platform";
import { Timestamp } from "firebase-admin/firestore";
import { generateThumbnail, ThumbnailConfig } from "./utils/imageUtils";
import sharp from "sharp";
import axios from "axios";
import {
  DEFAULT_CONTENT_RATING,
  CONTENT_RATING_CENSOR_THRESHOLD,
} from "./contentRatingDefaults";
import { UserModel } from "./userService";

type ItemModel = Omit<Item, "id" | "createdAt" | "updatedAt"> & {
  geohash?: string;
  created: Timestamp;
  updated: Timestamp;
  gsImageUrls?: string[];
  gsThumbnailUrls?: string[];
  nameIndex?: string[];
  nameIndexVer?: number;
};

export class ItemService {
  private readonly ITEM_INDEX_VER = 1 as const;

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

  _itemsQuery(
    classifications: string[],
    category: string[],
    status?: string | null,
    keyword?: string | null,
    withGeoHash: boolean = true,
  ): firebase.firestore.Query {
    let query: any = db.collection("items");
    if (withGeoHash) {
      query = query.where("geohash", ">=", "");
    }
    if (keyword && keyword.length > 0) {
      query = this.applyKeywordNameFilter(query, keyword);
    } else {
      if (classifications && classifications.length > 0) {
        query = query.where("clssfctns", "array-contains-any", classifications);
      } else {
        if (category && category.length > 0) {
          query = query.where("category", "array-contains-any", category);
        }
      }
    }
    if (status) query = query.where("status", "==", status);
    return query;
  }

  // Helper method to handle pagination with keyword filtering
  private async _queryWithKeywordPagination(
    loggedInUser: User | UserModel | null,
    queryBuilder: (offset: number) => firebase.firestore.Query,
    keyword: string | null | undefined,
    requestedLimit: number,
    initialOffset: number = 0,
  ): Promise<Item[]> {
    const results: Item[] = [];
    let currentOffset = initialOffset;

    while (results.length < requestedLimit) {
      const query = queryBuilder(currentOffset);
      const snapshot = await query.limit(requestedLimit).get();

      if (snapshot.empty) break;

      const batchResults: Item[] = [];
      await Promise.all(
        snapshot.docs.map(async (doc) => {
          const item = await this._itemQueryToItem(doc, loggedInUser);
          if (item != null) {
            batchResults.push(item);
          }
        }),
      );

      // Apply keyword filtering
      const filtered = this.filterItemsByKeyword(batchResults, keyword);
      results.push(...filtered);

      // If we got fewer docs than requested, we've reached the end
      if (snapshot.size < requestedLimit) break;

      currentOffset += requestedLimit;
    }

    // Return only up to the requested limit
    return results.slice(0, requestedLimit);
  }

  async items(
    loggedInUser: User | UserModel | null,
    classifications: string[],
    category: string[],
    status: string,
    keyword: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Item[]> {
    return this._queryWithKeywordPagination(
      loggedInUser,
      (currentOffset) =>
        this._itemsQuery(
          classifications,
          category,
          status,
          keyword,
          false,
        ).offset(currentOffset),
      keyword,
      limit,
      offset,
    );
  }
  async totalItemsCount(
    classifications: string[],
    category: string[],
    status: string,
    keyword: string,
  ): Promise<number> {
    let query = this._itemsQuery(
      classifications,
      category,
      status,
      keyword,
      false,
    );
    const snapshot = await query.get();
    return snapshot.size;
  }
  async itemsByLocation(
    loggedInUser: User | UserModel | null,
    latitude: number,
    longitude: number,
    radiusKm: number,
    classifications: string[],
    category: string[],
    status: string,
    keyword: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Item[]> {
    let query = this._itemsQuery(classifications, category, status, keyword);
    const items = this.mapService.getLocationsByRadius(
      query,
      { latitude, longitude },
      radiusKm,
      limit,
      offset,
    );
    const filteredItems: Item[] = [];
    await Promise.all(
      (await items).map(async (item) => {
        const rv = await this._itemModelToItem(item, loggedInUser);
        if (rv != null) {
          filteredItems.push(rv);
        }
      }),
    );

    // Ensure results satisfy full keyword token match on nameIndex
    return this.filterItemsByKeyword(filteredItems, keyword);
  }

  async totalItemsCountByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    classifications: string[],
    category: string[],
    status: string,
    keyword: string,
  ): Promise<number> {
    let query = this._itemsQuery(classifications, category, status, keyword);
    const count = await this.mapService.getLocationsByRadiusCount(
      query,
      { latitude, longitude },
      radiusKm,
    );
    return count;
  }

  async itemsOnLoanByUser(
    loggedInUser: User | UserModel | null,
    userId: string,
    category: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Item[]> {
    return this._queryWithKeywordPagination(
      loggedInUser,
      (currentOffset) => {
        let query = this._itemsQuery([], category, status, keyword, false);
        return query
          .where("ownerId", "==", userId)
          .where("holderId", "!=", null)
          .orderBy("holderId")
          .orderBy("updated", "desc")
          .offset(currentOffset);
      },
      keyword,
      limit,
      offset,
    );
  }

  async itemsOnLoanByOwner(
    loggedInUser: User | UserModel, // Using loggedInUser to ensure censor function works
    category: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Item[]> {
    return this._queryWithKeywordPagination(
      loggedInUser,
      (currentOffset) => {
        let query = this._itemsQuery([], category, status, keyword, false);
        return query
          .where("ownerId", "==", loggedInUser.id)
          .where("holderId", "!=", null)
          .orderBy("holderId")
          .orderBy("updated", "desc")
          .offset(currentOffset);
      },
      keyword,
      limit,
      offset,
    );
  }

  async itemsOnLoanByHolder(
    loggedInUser: User | UserModel, // Using loggedInUser to ensure censor function works
    category: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Item[]> {
    return this._queryWithKeywordPagination(
      loggedInUser,
      (currentOffset) => {
        let query = this._itemsQuery([], category, status, keyword, false);
        return query
          .where("holderId", "==", loggedInUser.id)
          .orderBy("updated", "desc")
          .offset(currentOffset);
      },
      keyword,
      limit,
      offset,
    );
  }

  async itemModelById(
    itemId: string,
  ): Promise<firebase.firestore.DocumentData | null> {
    const itemDoc = await db.collection("items").doc(itemId).get();
    if (!itemDoc.exists) return null;
    let data = itemDoc.data();
    if (!data) return null;
    data.id = itemId;
    return data;
  }

  async itemById(
    loggedInUser: User | UserModel | null,
    itemId: string,
    bypassContentRatingCheck: boolean = false // use with care
  ): Promise<Item | null> {
    const data = await this.itemModelById(itemId);
    if (!data) return null;
    let item = await this._itemModelToItem(data, loggedInUser, bypassContentRatingCheck);
    return item;
  }

  // this function should be limited to internal use only
  async itemsByIds(
    loggedInUser: User | UserModel | null,
    itemIds: string[],
  ): Promise<Item[]> {
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
            const item = await this._itemQueryToItem(doc, loggedInUser);
            if (item != null) {
              results.push(item);
            }
          }),
        );
      }
    }
    return results;
  }

  async itemsByUser(
    loggedInUser: User | UserModel | null,
    userId: string,
    category: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0,
    isExchangePointItem: boolean = false,
  ): Promise<Item[]> {
    if (isExchangePointItem) {
      if (!this.userService) {
        throw new Error("UserService not available for exchange point items");
      }

      const cachedItemIds = await this.userService.getItemCaches(
        userId,
        category && category.length > 0 ? category : undefined,
        limit,
        offset,
      );

      if (cachedItemIds.length === 0) {
        return [];
      }

      const items = await this.itemsByIds(loggedInUser, cachedItemIds);
      return this.filterItemsByKeyword(items, keyword);
    } else {
      return this._queryWithKeywordPagination(
        loggedInUser,
        (currentOffset) => {
          let query = this._itemsQuery([], category, status, keyword, false);
          return query
            .where("ownerId", "==", userId)
            .orderBy("updated", "desc")
            .offset(currentOffset);
        },
        keyword,
        limit,
        offset,
      );
    }
  }

  async totalItemsCountByUser(
    loggedInUser: User | UserModel | null,
    userId: string,
    category: string[],
    status?: string,
    keyword?: string,
    isExchangePointItem: boolean = false,
  ): Promise<number> {
    if (isExchangePointItem) {
      if (!this.userService) {
        throw new Error("UserService not available for exchange point items");
      }

      const cachedItemIds = await this.userService.getItemCaches(
        userId,
        category && category.length > 0 ? category : undefined,
        1000000, // Large limit to get all cached items
        0,
      );

      if (cachedItemIds.length === 0) {
        return 0;
      }

      let items = await this.itemsByIds(loggedInUser, cachedItemIds);

      // Apply status and keyword filtering
      if (status) {
        items = items.filter((item) => item.status === status);
      }
      if (keyword) {
        items = items.filter((item) =>
          item.name.toLowerCase().includes(keyword.toLowerCase()),
        );
      }

      console.debug(
        `Total ${items.length} cached items for exchange point user ${userId} after filtering`,
      );

      return items.length;
    } else {
      let query = this._itemsQuery([], category, status, keyword, false);
      query = query.where("ownerId", "==", userId);
      const snapshot = await query.get();
      console.debug(
        `Total ${snapshot.size} items for user ${userId} with category ${category}, status ${status}, keyword ${keyword}`,
      );
      return snapshot.size;
    }
  }

  async latestItems(
    loggedInUser: User | UserModel | null,
    offset: number = 0,
    limit: number = 12,
    update: boolean = true,
  ): Promise<Item[]> {
    const fieldToOrder = update ? "updated" : "created";
    const snapshot = await db
      .collection("items")
      .orderBy(fieldToOrder, "desc")
      .offset(offset)
      .limit(limit)
      .get();
    const filteredItems: Item[] = [];
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const item = await this._itemQueryToItem(doc, loggedInUser);
        if ( item != null ){
          filteredItems.push(item);
        }
      }),
    );

    return filteredItems;
  }

  async duplicateTitlesByUser(
    userId: string,
    names: string[],
  ): Promise<string[]> {
    if (!names || names.length === 0) {
      return [];
    }
    let query = db.collection("items").where("ownerId", "==", userId);
    // Note: Firestore does not support 'array-contains-any' with more than 10 values, so we need to batch if names is large
    const MAX_NAMES_PER_QUERY = 10;
    const duplicateTitles: string[] = [];
    for (let i = 0; i < names.length; i += MAX_NAMES_PER_QUERY) {
      const batchNames = names.slice(i, i + MAX_NAMES_PER_QUERY);
      const snapshot = await query.where("name", "in", batchNames).get();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name) {
          duplicateTitles.push(data.name);
        }
      });
    }
    return duplicateTitles;
  }

  async itemCategoriesByUser(
    loggedInUser: User | UserModel | null,
    userId: string,
  ) {
    // Assuming that we do not have anyone with large number of entries
    let items: Item[] = [];
    // Fetch all items by user by batch
    let batchSize = 20;
    let offset = 0;
    while (true) {
      const batchItems = await this.itemsByUser(
        loggedInUser,
        userId,
        [],
        "",
        "",
        batchSize,
        offset,
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
    >,
    loggedInUser: User | UserModel | null,
  ): Promise<Item | null> {
    const itemId = query.id;
    const data = query.data();
    data.id = itemId;
    const item: Item | null = await this._itemModelToItem(data, loggedInUser);
    return item;
  }

  /*
   * This function assumes censor info is already present in the item data.
   *
   * Visibility of items in order of precedence.
   * - Allow visibility if bypassContentRatingCheck = true. Useful for API such as cancel transaction.
   * - Allow users to always view their own books.
   * - Allow users to always view books that they hold.
   * - Allow admin to view all books so that they can change/verify content rating.
   * - Hide items above or at censor threshold if content rating is not checked by admin.
   * - Always hide items with content rating above user threshold.
   * - Support shadow banning items.
   * 
   * Note: Owners and holders should have visibility. This is useful for actions such as transfer items.
   */
  shouldCensorItem(
    item: Item | ItemModel,
    loggedInUser: User | UserModel | null,
    bypassContentRatingCheck: boolean = false, // Use with care!
  ): boolean {
    if ( bypassContentRatingCheck ) {
      return false;
    }

    if (
      loggedInUser != null &&
      ( item.holderId === loggedInUser.id || item.ownerId === loggedInUser.id || loggedInUser.role === Role.Admin)
    ) {
      return false;
    }
    if (
      item.contentRating >= CONTENT_RATING_CENSOR_THRESHOLD &&
      !item.contentRatingChecked
    ) {
      return true;
    }

    let userContentRatingThreshold = loggedInUser
      ? loggedInUser.visibleContentRating
      : DEFAULT_CONTENT_RATING;

    if (item.contentRating > userContentRatingThreshold) {
      return true;
    }

    if (item.shadowBanned) {
      return true;
    }

    return false;
  }

  async _itemModelToItem(
    docData: firebase.firestore.DocumentData,
    loggedInUser: User | UserModel | null,
    bypassContentRatingCheck: boolean = false, // use with care
  ): Promise<Item | null> {
    const itemId = docData.id;
    const data = docData as ItemModel;

    /*
     * Implement censor function here as failsafe since all DB data need to go through here
     * before returning to GUI. Make sure we don't omit filtering for any API call.
     */
    if (data.contentRating === undefined || data.contentRating === null) {
      data.contentRating = DEFAULT_CONTENT_RATING; // default content rating if not set
      data.contentRatingChecked = false;
    }

    if (this.shouldCensorItem(data, loggedInUser, bypassContentRatingCheck)) {
      return null;
    }

    // Filter out all admin only fields. Evaluted after the censor function.
    if ( loggedInUser?.role != Role.Admin ) {
      data.contentRatingChecked = undefined;
      data.shadowBanned = undefined;
    }

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

      const uploadPromises = images.map(async (image, index) => {
        const thumbnail = await this._generateThumbnail(image, itemId, index);
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
            `Updated item ${itemId} with ${data.thumbnails.length} thumbnails`,
          );
        } catch (error) {
          console.error(
            `Failed to update item ${itemId} with thumbnails:`,
            error,
          );
        }
      }
    }

    // arrange thumbnails in order of images
    if (
      data.images &&
      data.thumbnails &&
      data.images.length === data.thumbnails.length
    ) {
      const arrangedThumbnails: string[] = [];
      for (const imgUrl of data.images) {
        // match last 10 characters of imgUrl with thumbnails
        for (const thumbnailUrl of data.thumbnails) {
          if (thumbnailUrl.includes(imgUrl.slice(-10))) {
            arrangedThumbnails.push(thumbnailUrl);
            break;
          }
        }
      }
      data.thumbnails = arrangedThumbnails;
    }

    // check the description with hash tag or not. If not hash tag add all category with #
    let updateDescription = null;
    if (data.description) {
      if (!data.description.includes("#")) {
        updateDescription = `${data.description}\n\n#${data.category.join(
          " #",
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
    deposit: number,
    ISBN: string | null | undefined,
    contentRating: number | null | undefined,
  ): Promise<Item> {
    let hash = null;
    if (owner?.location) {
      hash = geofire.geohashForLocation([
        owner.location.latitude,
        owner.location.longitude,
      ]);
    }
    if (ISBN) {
      try {
        const bookInfo = await this._getBookInfoByISBN(ISBN);
        if (bookInfo) {
          publishedYear = bookInfo.publishedYear;
          if (bookInfo.authors) {
            for (const author of bookInfo.authors) {
              if (!category.includes(author)) {
                category.push(author);
                description += `\n\n#${author}`;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch book info for ISBN ${ISBN}:`, error);
      }
    }
    const newItem = await this._createItem(
      owner,
      hash,
      name,
      description,
      condition,
      category,
      status,
      images,
      publishedYear,
      language,
      deposit,
      ISBN,
      contentRating ? contentRating : DEFAULT_CONTENT_RATING,
    );
    return newItem;
  }

  async createItemsFromJSON(
    owner: User,
    bookJson: string[],
    deposit: number = 0,
  ): Promise<Item[]> {
    let hash = null;
    if (owner?.location) {
      hash = geofire.geohashForLocation([
        owner.location.latitude,
        owner.location.longitude,
      ]);
    }
    const createdItems: Item[] = [];
    for (const bookData of bookJson) {
      // bookData is a JSON string, we need to parse it first
      let book;
      try {
        book = JSON.parse(bookData);
      } catch (error) {
        console.error(`Failed to parse book data: ${bookData}`, error);
        continue; // Skip this entry and move to the next one
      }

      const name = book.title || "Untitled";
      let description = `Imported from JSON\n\n#${book.author}`;
      const condition = ItemCondition.Good; // Default condition, can be updated by user later
      const category = [book.author]; // Use author as category, can be updated by user later
      const status = ItemStatus.Available;
      let publishedYear = parseInt(book.publishedYear) || 0;
      const language = Language.ZhHk; // Default language, can be updated by user later
      const isbn = book.isbn13 || book.isbn || null;
      const contentRating = book.contentRating || DEFAULT_CONTENT_RATING;

      console.debug(
        `Creating item for book: ${name}, author: ${book.author}, publishedYear: ${publishedYear}, ISBN: ${isbn}`,
      );
      if (isbn) {
        try {
          const bookInfo = await this._getBookInfoByISBN(isbn);
          console.debug(`Fetched book info for ISBN ${isbn}:`, bookInfo);
          if (bookInfo) {
            publishedYear =
              publishedYear !== 0 ? publishedYear : bookInfo.publishedYear;
            if (bookInfo.authors) {
              for (const author of bookInfo.authors) {
                if (!category.includes(author)) {
                  category.push(author);
                  description += `\n\n#${author}`;
                }
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch book info for ISBN ${isbn}:`, error);
        }
      }

      const newItem = await this._createItem(
        owner,
        hash,
        name,
        description,
        condition,
        category,
        status,
        [],
        publishedYear,
        language,
        deposit,
        isbn,
        contentRating,
      );
      createdItems.push(newItem);
    }
    return createdItems;
  }

  async _createItem(
    owner: User,
    ownerGeoHash: string | null = null,
    name: string,
    description: string,
    condition: ItemCondition,
    category: string[],
    status: ItemStatus,
    images: string[],
    publishedYear: number,
    language: Language,
    deposit: number,
    isbn: string | null | undefined,
    contentRating: number,
  ): Promise<Item> {
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
              error,
            );
          }
        } else {
          if (!publicImageUrls) publicImageUrls = [];
          publicImageUrls.push(image);
        }
      }
    }

    const nameIndex = this.tokenizeName(name);

    // Build itemData object, only including fields with valid values
    const itemData: ItemModel = {
      ownerId: owner.id,
      name: name,
      condition: condition,
      category: category,
      status: status,
      language: language,
      deposit: deposit,
      clssfctns: null,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      // Item indexing
      nameIndex: nameIndex,
      nameIndexVer: this.ITEM_INDEX_VER,
      isbn: isbn || null,
      contentRating: contentRating,
      contentRatingChecked: false, // Always set to false when creating a new item.
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

    if (ownerGeoHash) {
      itemData.geohash = ownerGeoHash;
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
        owner.id,
      );
      if (!itemCategory || itemCategory.length === 0) {
        const categoryCount = await this.itemCategoriesByUser(owner, owner.id);
        await this.categoryService.initializeUserCategories(
          owner.id,
          categoryCount,
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
    deposit?: number,
    clssfctns?: string[],
    isbn?: string | null | undefined,
    contentRating?: number,
    contentRatingChecked?: boolean,
    shadowBanned?: boolean,
  ): Promise<Item> {
    // First, get the existing item to verify ownership
    const itemDoc = await this.itemModelById(itemId);
    if (!itemDoc) throw new Error(`Item with ID ${itemId} does not exist`);

    let existingData = itemDoc as ItemModel;

    // Verify the user owns this item
    if (existingData.ownerId !== user.id && user.role !== Role.Admin) {
      throw new Error(
        `User ${user.id} does not have permission to update item ${itemId}`,
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
              error,
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

      // Update name index.
      updateData.nameIndex = this.tokenizeName(name);
      updateData.nameIndexVer = this.ITEM_INDEX_VER;
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

    if (clssfctns !== undefined) {
      updateData.clssfctns = clssfctns;
      existingData.clssfctns = clssfctns;
    }

    if (isbn !== undefined) {
      updateData.isbn = isbn;
      existingData.isbn = isbn;
    }

    if (contentRating !== undefined) {
      updateData.contentRating = contentRating;
      existingData.contentRating = contentRating;

      // Reset admin checks.
      updateData.contentRatingChecked = false;
      existingData.contentRatingChecked = false;
    }

    // Only Admin is allowed to change the following.
    if (contentRatingChecked !== undefined || shadowBanned !== undefined) {
      if (user.role !== Role.Admin) {
        throw new Error(
          `User ${user.id} does not have permission to update admin-only fields (contentRatingChecked, shadowBanned) of itemId: ${itemId}`,
        );
      }

      if ( contentRatingChecked !== undefined ) {
        updateData.contentRatingChecked = contentRatingChecked;
        existingData.contentRatingChecked = contentRatingChecked;
      }

      if ( shadowBanned !== undefined ) {
        updateData.shadowBanned = shadowBanned;
        existingData.shadowBanned = shadowBanned;
      }
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
          (cat) => !oldCategories.includes(cat),
        );
        const categoriesToRemove = oldCategories.filter(
          (cat) => !newCategories.includes(cat),
        );

        console.debug(`Categories to add: [${categoriesToAdd.join(", ")}]`);
        console.debug(
          `Categories to remove: [${categoriesToRemove.join(", ")}]`,
        );

        // Process removals first to avoid potential conflicts
        if (categoriesToRemove.length > 0) {
          await this.categoryService.reduceCategories(user, categoriesToRemove);
          console.debug(
            `Removed categories: [${categoriesToRemove.join(", ")}]`,
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
          error,
        );
        // Consider whether to throw here or just log the error
        // For now, we'll log and continue since the item update succeeded
      }
    }

    // Fetch and return the updated item
    const updatedItem = await this.itemById(user, itemId);
    if (!updatedItem) {
      throw new Error(`Failed to fetch updated item with ID ${itemId}`);
    }
    return updatedItem;
  }

  async updateUserItemsLocation(
    userId: string,
    location: Location | null,
  ): Promise<void> {
    if (!userId) {
      console.warn("Cannot update items: Missing user ID");
      return;
    }

    if (!location) {
      console.debug(
        `Skipping location update for user ${userId}: No location provided`,
      );
      return;
    }
    const MAX_UPDATE_ITERATIONS = 2;
    let updateTime = 0;
    while (updateTime !== MAX_UPDATE_ITERATIONS) {
      let query = db.collection("items").where("ownerId", "==", userId);
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
        if (updateTime === 1 || (doc.exists && !doc.data().holderId)) {
          batch.update(doc.ref, updateData);
        }
      });
      await batch.commit();
      console.log(
        `Updated location for ${itemsSnapshot.size} items belonging to user ${userId}`,
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
    loggedInUser: User | UserModel | null,
    limit: number = 20,
    offset: number = 0,
    category?: string[],
  ): Promise<Item[]> {
    let query = db.collection("items").orderBy("created", "desc");
    if (category && category.length > 0) {
      query = query.where("category", "array-contains-any", category);
    }
    const snapshot = await query.limit(limit).offset(offset).get();
    const items: Item[] = [];
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const rv = await this._itemQueryToItem(doc, loggedInUser);
        if (rv != null) {
          items.push(rv);
        }
      }),
    );
    return items;
  }

  async recentItemsContentRatingNotChecked(
    limit: number = 20,
    offset: number = 0,
    loggedInUser: User | UserModel | null = null,
  ): Promise<Item[]> {

    if ( loggedInUser?.role != Role.Admin ) {  
      console.log("recentItemsContentRatingNotChecked requires admin privileges")
      return [];
    }

    // for the eariest items that are not checked.
    let query = db
      .collection("items")
      .where("contentRating", ">=", CONTENT_RATING_CENSOR_THRESHOLD )
      .where("contentRatingChecked", "==", false)
      .orderBy("updated", "asc");

    const itemsSnapshot = await query.limit(limit).offset(offset).get();

    console.log("Found " + itemsSnapshot.size + " items with content rating above or at censor threshold and not checked by admin");

    const items: Item[] = [];

    await Promise.all(
      itemsSnapshot.docs.map(async (doc) => {
        const rv = await this._itemQueryToItem(doc, loggedInUser);
        if (rv != null) {
          items.push(rv);
        }
      }),
    );
    return items;
  }

  async recentItemsWithoutClassifications(
    limit: number = 20,
    offset: number = 0,
    user: User | UserModel | null = null,
  ): Promise<Item[]> {
    // for the eariest items with classifications
    let query = db
      .collection("items")
      .orderBy("clssfctns")
      .orderBy("updated", "asc");
    const snapshot = await query.limit(1).offset(offset).get();
    const items: Item[] = [];

    let earliestClassificationsUpdatedAt: Timestamp | null = null;
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data() as ItemModel;
        if (data.updated) {
          earliestClassificationsUpdatedAt = data.updated;
        }
      }),
    );
    let itemsQuery = db.collection("items").orderBy("updated", "desc");

    if (earliestClassificationsUpdatedAt) {
      // now get items which are older than earliest classifications updated at
      itemsQuery = itemsQuery.where(
        "updated",
        "<",
        earliestClassificationsUpdatedAt,
      );
    }
    const itemsSnapshot = await itemsQuery.limit(limit).get();
    await Promise.all(
      itemsSnapshot.docs.map(async (doc) => {
        const data = doc.data() as ItemModel;
        if (data.clssfctns === undefined || data.clssfctns === null) {
          const rv = await this._itemQueryToItem(doc, user);
          if (rv != null) {
            items.push(rv);
          }
        }
      }),
    );
    return items;
  }

  async itemsWithUncheckedContentRating(
    limit: number = 100,
    user: User | UserModel | null = null,
  ): Promise<Item[]> {
    const snapshot = await db
      .collection("items")
      .where("contentRatingChecked", "==", false)
      .orderBy("updated", "desc")
      .limit(limit)
      .get();

    const items: Item[] = [];
    await Promise.all(
      snapshot.docs.map(async (doc) => {
        const rv = await this._itemQueryToItem(doc, user);
        if (rv != null) {
          items.push(rv);
        }
      }),
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
    imageUrl: string,
    itemId: string = "unknown",
    index: number = 0,
  ): Promise<{ gs: string; url: string } | null> {
    try {
      console.log(`Generating thumbnail for image: ${imageUrl}`);

      // Download the original image
      let imageBuffer: Buffer;
      const isFromGS = imageUrl.startsWith("gs://");

      if (isFromGS) {
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
        `Original image dimensions: ${metadata.width}x${metadata.height}`,
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
      const thumbnailFileName = this._generateThumbnailFileName(
        originalFileName,
        itemId,
        index,
        isFromGS,
      );

      // Determine upload path
      let uploadPath: string;

      if (isFromGS) {
        // Use same bucket and path structure as original
        const gsPath = imageUrl.replace("gs://", "");
        const pathParts = gsPath.split("/");
        const originalPath = pathParts.slice(1).join("/");
        const pathDir = originalPath.substring(
          0,
          originalPath.lastIndexOf("/"),
        );
        uploadPath = `${pathDir}/${thumbnailFileName}`;

        const gsUrl = await UploadBufferToGCS(
          uploadPath,
          thumbnailBuffer,
          "image/jpeg",
        );
        const publicUrl = await GetPublicUrlForGSFile(gsUrl);

        return { gs: gsUrl, url: publicUrl };
      } else {
        // Create upload path: thumbnails/{generated_filename}
        uploadPath = `thumbnails/${thumbnailFileName}`;
        const gsUrl = await UploadBufferToGCS(
          uploadPath,
          thumbnailBuffer,
          "image/jpeg",
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
  private _generateThumbnailFileName(
    originalFileName: string,
    itemId: string,
    index: number,
    isFromGS: boolean,
  ): string {
    const lastDotIndex = originalFileName.lastIndexOf(".");

    if (lastDotIndex === -1 || !isFromGS) {
      // No extension found, append thumbnail suffix
      return `${itemId}_${index}_thumbnail.jpg`;
    }

    const nameWithoutExt = originalFileName.substring(0, lastDotIndex);
    const extension = originalFileName.substring(lastDotIndex);

    // Convert to .jpg for thumbnails regardless of original format
    return `${itemId}_${index}_thumbnail.jpg`;
  }

  // New helper: apply keyword name range filter to a Firestore query
  private applyKeywordNameFilter(
    query: firebase.firestore.Query<firebase.firestore.DocumentData>,
    keyword: string,
  ): firebase.firestore.Query<firebase.firestore.DocumentData> {
    /* Keep the classical implementation for reference
    if (keyword && String(keyword).trim().length > 0) {
      const k = String(keyword);
      return query.where("name", ">=", k).where("name", "<=", k + "\uf8ff");
    }
    */

    // Tokenize and normalize to lowercase for matching
    const tokens = this.tokenizeName(keyword)
      .map((t) => t.toLowerCase())
      .filter(Boolean);
    if (tokens.length === 0) return query;
    return query.where("nameIndex", "array-contains", tokens[0]);
  }

  // Used for generating name index for search optimization.
  // And also for when we try to search using the created index.
  //
  // tokenizes a name: split by spaces, group ASCII letters/digits together,
  // and make every non-ASCII-or-digit character a separate token.
  private readonly SKIP_INDEX = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "of",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "is",
    "are",
    "by",
    "as",
    "it",
    "this",
    "that",
  ]);

  private tokenizeName(name: string): string[] {
    if (!name) return [];

    const tokens: Set<string> = new Set();
    const parts = name
      .toLowerCase()
      .split(/[\s\p{P}\p{S}]+/u)
      .filter(Boolean);
    const latinOrNumbers = /\p{Script=Latin}|\p{Nd}/u;

    // Parts is separated by spaces and punctuations.
    for (const part of parts) {
      let cur = "";
      for (const ch of part) {
        if (latinOrNumbers.test(ch)) {
          cur += ch;
        } else {
          if (cur && !this.SKIP_INDEX.has(cur)) {
            tokens.add(cur);
            cur = "";
          }
          tokens.add(ch);
        }
      }
      if (cur && !this.SKIP_INDEX.has(cur)) tokens.add(cur);
    }
    return Array.from(tokens).filter(Boolean);
  }

  // Filter items so that item's nameIndex contains all tokens from keyword
  private filterItemsByKeyword(items: Item[], keyword?: string | null): Item[] {
    if (!keyword || String(keyword).trim().length === 0) return items;
    const tokens = this.tokenizeName(keyword)
      .map((t) => t.toLowerCase())
      .filter(Boolean);
    if (tokens.length === 0) return items;

    // console.log("filterItemsByKeyword: filtering for tokens:", tokens);

    return items.filter((item) => {
      const idx = Array.isArray((item as any).nameIndex)
        ? (item as any).nameIndex.map((v: any) => String(v).toLowerCase())
        : [];
      return tokens.every((t) => idx.includes(t));
    });
  }

  public generateItemIndexIncremental(): Promise<boolean> {
    return (async () => {
      try {
        const BATCH_READ_SIZE = 500;
        let lastDoc: firebase.firestore.QueryDocumentSnapshot | null = null;
        let processed = 0;

        console.log(
          "generateItemIndexIncremental: Generating index for version ",
          this.ITEM_INDEX_VER,
        );

        const totalCount = (
          await db
            .collection("items")
            .where("nameIndexVer", "!=", this.ITEM_INDEX_VER)
            .count()
            .get()
        ).data().count;

        console.log(
          `generateItemIndexIncremental: total ${totalCount} items to process`,
        );

        while (true) {
          let q = db
            .collection("items")
            .where("nameIndexVer", "!=", this.ITEM_INDEX_VER)
            // .orderBy(firebase.firestore.FieldPath.documentId())
            .limit(BATCH_READ_SIZE);

          if (lastDoc) q = q.startAfter(lastDoc);

          const snap = await q.get();
          if (snap.empty) break;

          // Create a write batch for this page (<= 500)
          const batch = db.batch();
          snap.docs.forEach((doc) => {
            const data = doc.data();
            const name = data && data.name ? String(data.name) : "";
            const nameIndex = this.tokenizeName(name);
            batch.update(doc.ref, {
              nameIndex: nameIndex,
              nameIndexVer: this.ITEM_INDEX_VER,
            });
          });

          await batch.commit();
          processed += snap.size;
          console.log(
            `generateItemIndexIncremental: processed total ${processed} of ${totalCount} previously remaining items`,
          );

          lastDoc = snap.docs[snap.docs.length - 1];
          if (snap.size < BATCH_READ_SIZE) break;
        }

        return true;
      } catch (error) {
        console.error("generateItemIndex failed:", error);
        return false;
      }
    })();
  }

  /**
   * Stub for experimental keyword search used by resolver.itemsByKeywordExperimental.
   * Returns empty array for now. Will later use nameIndex / tokenizeName for search.
   */
  async itemsByKeywordExperimental(
    keyword: string = "",
    user: User | UserModel | null,
  ): Promise<Item[]> {
    if (!keyword || keyword.trim() === "") return [];

    // Tokenize and normalize to lowercase for matching
    const tokens = this.tokenizeName(keyword)
      .map((t) => t.toLowerCase())
      .filter(Boolean);
    if (tokens.length === 0) return [];

    console.log("itemsByKeywordExperimental: searching for tokens:", tokens);

    // Firestore limits array-contains-any to 10 values. Query in chunks and
    // collect candidate documents, then filter client-side to ensure all
    // tokens are present in the document's nameIndex.
    const MAX_CHUNK = 10;
    const docMap = new Map<string, firebase.firestore.QueryDocumentSnapshot>();

    for (let i = 0; i < tokens.length; i += MAX_CHUNK) {
      const chunk = tokens.slice(i, i + MAX_CHUNK);
      const snap = await db
        .collection("items")
        .where("nameIndex", "array-contains-any", chunk)
        .get();
      snap.docs.forEach((doc) => {
        if (!docMap.has(doc.id)) docMap.set(doc.id, doc);
      });
    }

    const results: Item[] = [];
    for (const doc of Array.from(docMap.values())) {
      const data = doc.data();
      const idx = Array.isArray(data.nameIndex)
        ? data.nameIndex.map((v: any) => String(v).toLowerCase())
        : [];
      const hasAll = tokens.every((t) => idx.includes(t));
      if (hasAll) {
        const item = await this._itemQueryToItem(doc, user);
        if (item != null) {
          results.push(item);
        }
      }
    }

    return results;
  }

  async _getBookInfoByISBN(isbn: string): Promise<{
    title: string;
    authors: string[];
    publishedYear: number;
  } | null> {
    try {
      const queryUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
      console.debug(
        `Fetching book info for ISBN ${isbn} from Google Books API:`,
        {
          queryUrl,
        },
      );
      const response = await axios.get(queryUrl, { timeout: 10000 });
      console.debug(
        `Google Books API response for ISBN ${isbn}:`,
        response.data,
      );
      if (
        response.data.totalItems > 0 &&
        response.data.items &&
        response.data.items.length > 0
      ) {
        const volumeInfo = response.data.items[0].volumeInfo;
        return {
          title: volumeInfo.title || "",
          authors: volumeInfo.authors || [],
          publishedYear: volumeInfo.publishedDate
            ? parseInt(volumeInfo.publishedDate.substring(0, 4))
            : 0,
        };
      }
    } catch (error) {
      console.error(`Failed to fetch book info for ISBN ${isbn}:`, error);
    }
    return null;
  }
}
