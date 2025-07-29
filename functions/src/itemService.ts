import { db, GetPublicUrlForGSFile } from "./platform";
import {
  Item,
  Location,
  LocationInput,
  ItemCondition,
  ItemStatus,
  Language,
  User,
  Category,
} from "./generated/graphql";
import * as geofire from "geofire-common";
import { MapService, createMapService } from "./mapService";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

type ItemModel = Omit<Item, "id" | "createdAt" | "updatedAt"> & {
  geohash?: string;
  created: Timestamp;
  updated: Timestamp;
  gsImageUrls?: string[];
};

type CategoryModel = Omit<Category, "id" | "createdAt" | "updatedAt"> & {
  created: Timestamp;
  updated: Timestamp;
};

export class ItemService {
  private mapService: MapService;

  constructor() {
    this.mapService = createMapService();
  }

  async itemsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    category?: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db.collection("items").where("geohash", ">=", "");
    if (category && category.length > 0)
      query = query.where("category", "array-contains-any", category);
    if (status) query = query.where("status", "==", status);
    if (keyword)
      query = query
        .where("name", ">=", keyword)
        .where("name", "<=", keyword + "\uf8ff");
    const items = this.mapService.getLocationsByRadius(
      query,
      { latitude, longitude },
      radiusKm
    );
    const filteredItems = (await items).map((item) => {
      item = {
        ...item,
        id: item.id,
        createdAt: item.created.seconds * 1000,
        updatedAt: item.updated.seconds * 1000,
      };
      return item as Item;
    });
    return filteredItems;
  }

  async itemById(itemId: string): Promise<Item | null> {
    const itemDoc = await db.collection("items").doc(itemId).get();
    if (!itemDoc.exists) return null;
    const data = itemDoc.data() as ItemModel;
    return {
      id: itemId,
      createdAt: data.created.seconds * 1000,
      updatedAt: data.updated.seconds * 1000,
      ...data,
    } as Item;
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

        const items = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              createdAt: doc.data().created.seconds * 1000,
              updatedAt: doc.data().updated.seconds * 1000,
              ...doc.data(),
            } as Item)
        );
        results.push(...items);
      }
    }
    return results;
  }

  async itemsByUser(
    userId: string,
    category?: string[],
    status?: string,
    keyword?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db
      .collection("items")
      .where("ownerId", "==", userId)
      .orderBy("id");
    if (category && category.length > 0)
      query = query.where("category", "array-contains-any", category);
    if (status) query = query.where("status", "==", status);
    if (keyword)
      query = query
        .where("name", ">=", keyword)
        .where("name", "<=", keyword + "\uf8ff");
    const snapshot = await query.limit(limit).offset(offset).get();
    const items = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          createdAt: doc.data().created.seconds * 1000,
          updatedAt: doc.data().updated.seconds * 1000,
          ...doc.data(),
        } as Item)
    );
    return items;
  }

  async itemsByCategory(
    category: string[],
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    if (!category || category.length === 0) {
      return [];
    }

    try {
      let query = db
        .collection("items")
        .where("category", "array-contains-any", category)
        .orderBy("created", "desc");

      if (status) {
        query = query.where("status", "==", status);
      }

      const snapshot = await query.limit(limit).offset(offset).get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        createdAt: doc.data().created.seconds * 1000,
        updatedAt: doc.data().updated.seconds * 1000,
        ...doc.data(),
      })) as Item[];

      return items;
    } catch (error) {
      console.error(`Error fetching items by category:`, error);
      throw error;
    }
  }

  async category(categoryId: string): Promise<Category | null> {
    if (!categoryId || categoryId.length === 0) {
      return null;
    }

    try {
      const categoryDoc = await db.collection("categories").doc(categoryId).get();

      if (!categoryDoc.exists) return null;

      const data = categoryDoc.data() as CategoryModel;

      return {
        id: categoryId,
        label: data.label,
        type: data.type,
        createdAt: data.created.seconds * 1000,
        updatedAt: data.updated.seconds * 1000,
      } as Category;
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
      throw error;
    }
  }

  async categories(limit: number = 20, offset: number = 0): Promise<Category[]> {
    try {
      let query = db
        .collection("categories")
        .orderBy("created", "desc");

      const snapshot = await query.limit(limit).offset(offset).get();

      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        createdAt: doc.data().created.seconds * 1000,
        updatedAt: doc.data().updated.seconds * 1000,
        ...doc.data(),
      })) as Category[];

      return categories;
    } catch (error) {
      console.error(`Error fetching all categories:`, error);
      throw error;
    }
  }

  async createItem(
    owner: User,
    name: string,
    description: string,
    condition: ItemCondition,
    category: string[],
    status: ItemStatus,
    images: string[],
    publishedYear: number,
    language: Language
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
    const rv = {
      id: docRef.id,
      createdAt: itemData.created.seconds * 1000,
      updatedAt: itemData.updated.seconds * 1000,
      ...itemData,
    } as Item;

    return rv;
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
    const items = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          createdAt: doc.data().created.seconds * 1000,
          updatedAt: doc.data().updated.seconds * 1000,
          ...doc.data(),
        } as Item)
    );
    return items;
  }
  async createCategory(label: string, type: string): Promise<Category> {
    if (!label || !type) {
      throw new Error("Label and type are required for creating a category");
    }

    try {
      const categoryData: CategoryModel = {
        label: label,
        type: type,
        created: Timestamp.now(),
        updated: Timestamp.now(),
      };

      const docRef = await db.collection("categories").add(categoryData);

      return {
        id: docRef.id,
        label: categoryData.label,
        type: categoryData.type,
        createdAt: categoryData.created.seconds * 1000,
        updatedAt: categoryData.updated.seconds * 1000,
      } as Category;
    } catch (error) {
      console.error(`Error creating category:`, error);
      throw error;
    }
  }

  async updateCategory(
    categoryId: string,
    label?: string | null,
    type?: string | null
  ): Promise<Category | null> {
    if (!categoryId) {
      throw new Error("Category ID is required for updating a category");
    }

    try {
      const categoryRef = db.collection("categories").doc(categoryId);
      const categoryDoc = await categoryRef.get();

      if (!categoryDoc.exists) {
        throw new Error(`Category with ID ${categoryId} does not exist`);
      }

      const updateData: any = {
        updated: Timestamp.now(),
      };

      if (label !== null && label !== undefined) {
        updateData.label = label;
      }

      if (type !== null && type !== undefined) {
        updateData.type = type;
      }

      if (Object.keys(updateData).length === 1) {
        console.warn(`No update fields provided for category ${categoryId}`);
        return null;
      }

      await categoryRef.update(updateData);

      const updatedDoc = await categoryRef.get();
      const data = updatedDoc.data() as CategoryModel;

      return {
        id: categoryId,
        label: data.label,
        type: data.type,
        createdAt: data.created.seconds * 1000,
        updatedAt: data.updated.seconds * 1000,
      } as Category;
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error);
      throw error;
    }
  }
}
